#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  DRE Lab — Sandbox Entrypoint
#  Initializes databases on first boot, then starts supervisord
# ═══════════════════════════════════════════════════════════════════════════

set -e

INIT_MARKER="/opt/dre-lab/.initialized"

echo "🧪 DRE Lab Sandbox starting..."

# ── Create required directories ──────────────────────────────────────────
mkdir -p /var/log/supervisor /var/log/postgresql /var/log/mongodb /var/run/postgresql
chown -R postgres:postgres /var/log/postgresql /var/run/postgresql
chown -R mongodb:mongodb /var/log/mongodb /var/lib/mongodb

# ── Configure apt proxy (if apt-cache container is reachable) ────────────
if curl -s --connect-timeout 2 http://apt-cache:3142 >/dev/null 2>&1; then
    echo 'Acquire::http::Proxy "http://apt-cache:3142";' > /etc/apt/apt.conf.d/01proxy
    echo "   📦 APT cache: connected (http://apt-cache:3142)"
else
    rm -f /etc/apt/apt.conf.d/01proxy
    echo "   📦 APT cache: not available (direct download)"
fi

# ── First-boot initialization ────────────────────────────────────────────
if [ ! -f "$INIT_MARKER" ]; then
    echo "   🔧 First boot — initializing databases..."

    # ── PostgreSQL: ensure cluster & create users/databases ──────────────
    # The cluster should already exist from package install
    if [ ! -f /var/lib/postgresql/15/main/PG_VERSION ]; then
        echo "   🐘 Creating PostgreSQL cluster..."
        su - postgres -c "pg_createcluster 15 main" 2>/dev/null || true
    fi

    echo "   🐘 Starting PostgreSQL for initialization..."
    pg_ctlcluster 15 main start 2>/dev/null || true
    sleep 2

    # Wait for PG to be ready
    for i in $(seq 1 15); do
        if su - postgres -c "pg_isready -q" 2>/dev/null; then break; fi
        sleep 1
    done

    # Create student role (same name as OS user = peer auth works)
    su - postgres -c "psql -c \"CREATE ROLE student WITH LOGIN SUPERUSER;\"" 2>/dev/null || true
    # Create dre role with password
    su - postgres -c "psql -c \"CREATE ROLE dre WITH LOGIN PASSWORD 'dre_password';\"" 2>/dev/null || true
    # Create drelab database
    su - postgres -c "psql -c \"CREATE DATABASE drelab OWNER dre;\"" 2>/dev/null || true
    # Grant access to student
    su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE drelab TO student;\"" 2>/dev/null || true

    # Run init SQL
    if [ -f /opt/dre-lab/init-postgres.sql ]; then
        su - postgres -c "psql -d drelab -f /opt/dre-lab/init-postgres.sql" 2>/dev/null || true
        echo "   🐘 PostgreSQL: database 'drelab' initialized with sample data"
    fi

    # Stop PostgreSQL (supervisord will start it properly)
    pg_ctlcluster 15 main stop 2>/dev/null || true
    sleep 1

    # ── MongoDB: initialize with sample data ─────────────────────────────
    echo "   🍃 Starting MongoDB for initialization..."
    chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb
    su -s /bin/bash mongodb -c "mongod --config /etc/mongod.conf --fork --logpath /var/log/mongodb/mongod.log" 2>/dev/null || true

    # Wait for Mongo
    for i in $(seq 1 15); do
        if mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null | grep -q "ok"; then break; fi
        sleep 1
    done

    # Run init script
    if [ -f /opt/dre-lab/init-mongo.js ]; then
        mongosh < /opt/dre-lab/init-mongo.js 2>/dev/null || true
        echo "   🍃 MongoDB: database 'drelab' initialized with sample data"
    fi

    # Stop MongoDB (supervisord will start it)
    mongod --shutdown --dbpath /var/lib/mongodb 2>/dev/null || \
        pkill mongod 2>/dev/null || true
    sleep 2

    # Mark as initialized
    touch "$INIT_MARKER"
    echo "   ✅ Initialization complete!"
else
    echo "   ✅ Databases already initialized"
fi

echo "   🖥️  Starting services (PostgreSQL, MongoDB, ttyd)..."
echo "   🌐 Terminal available on port 7681"
echo ""

# ── Start supervisord (manages all services) ─────────────────────────────
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
