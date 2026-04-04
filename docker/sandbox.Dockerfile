# ═══════════════════════════════════════════════════════════════════════════
#  DRE Lab — Full Admin Sandbox
#  Ubuntu 22.04 + PostgreSQL 15 SERVER + MongoDB 7 SERVER + ttyd + tools
#  Студент получает полный root-доступ (sudo) как на настоящем сервере
# ═══════════════════════════════════════════════════════════════════════════
FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive
ARG TTYD_VERSION=1.7.7

# ── Locale (PostgreSQL requires proper locale) ──────────────────────────
RUN apt-get update && \
    apt-get install -y --no-install-recommends locales && \
    locale-gen en_US.UTF-8 ru_RU.UTF-8 && \
    update-locale LANG=en_US.UTF-8

ENV LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    LANGUAGE=en_US:en

# ── Base packages + sudo + supervisor ────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    sudo \
    supervisor \
    bash \
    bash-completion \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    apt-transport-https \
    software-properties-common \
    vim-tiny \
    nano \
    less \
    man-db \
    procps \
    psmisc \
    htop \
    net-tools \
    iproute2 \
    dnsutils \
    iputils-ping \
    lsof \
    strace \
    sysstat \
    tree \
    jq \
    bc \
    file \
    gawk \
    sed \
    grep \
    findutils \
    coreutils \
    util-linux \
    tmux \
    tar \
    gzip \
    unzip \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# ── PostgreSQL 15 SERVER (полноценный сервер, не только клиент!) ──────────
RUN curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
      gpg --dearmor -o /usr/share/keyrings/pgdg.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      postgresql-15 \
      postgresql-client-15 \
      postgresql-contrib-15 \
    && rm -rf /var/lib/apt/lists/*

# ── MongoDB 7 SERVER (mongod + mongosh + tools) ─────────────────────────
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
      gpg --dearmor -o /usr/share/keyrings/mongodb.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/mongodb.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      mongodb-org-server \
      mongodb-mongosh \
      mongodb-database-tools \
    && rm -rf /var/lib/apt/lists/*

# ── ttyd (web terminal) ─────────────────────────────────────────────────
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then TTYD_ARCH="x86_64"; \
    elif [ "$ARCH" = "arm64" ]; then TTYD_ARCH="aarch64"; \
    else TTYD_ARCH="$ARCH"; fi && \
    curl -fsSL "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${TTYD_ARCH}" \
      -o /usr/local/bin/ttyd && \
    chmod +x /usr/local/bin/ttyd

# ── Create student user with FULL sudo (passwordless) ────────────────────
RUN useradd -m -s /bin/bash -G sudo,adm student && \
    echo 'student ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/student && \
    chmod 440 /etc/sudoers.d/student

# ── PostgreSQL config (realistic production-like setup) ──────────────────
RUN mkdir -p /var/log/postgresql && \
    chown postgres:postgres /var/log/postgresql

# We modify pg_hba.conf for easy local access
RUN PG_HBA="/etc/postgresql/15/main/pg_hba.conf" && \
    echo '# DRE Lab — Authentication Configuration'        >  "$PG_HBA" && \
    echo '# ─────────────────────────────────────────────' >> "$PG_HBA" && \
    echo 'local   all   postgres                 peer'     >> "$PG_HBA" && \
    echo 'local   all   student                  peer'     >> "$PG_HBA" && \
    echo 'local   all   dre                      md5'      >> "$PG_HBA" && \
    echo 'host    all   all   127.0.0.1/32       md5'      >> "$PG_HBA" && \
    echo 'host    all   all   ::1/128            md5'      >> "$PG_HBA" && \
    chown postgres:postgres "$PG_HBA"

# Tweak postgresql.conf for logging
RUN PG_CONF="/etc/postgresql/15/main/postgresql.conf" && \
    sed -i "s/#log_destination = 'stderr'/log_destination = 'stderr'/" "$PG_CONF" && \
    sed -i "s/#logging_collector = off/logging_collector = on/" "$PG_CONF" && \
    sed -i "s|#log_directory = 'log'|log_directory = '/var/log/postgresql'|" "$PG_CONF" && \
    sed -i "s/#log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'/log_filename = 'postgresql-15-main.log'/" "$PG_CONF" && \
    sed -i "s/#log_file_mode = 0600/log_file_mode = 0640/" "$PG_CONF" && \
    sed -i "s/#log_line_prefix = '%m \[%p\] %q%u@%d '/log_line_prefix = '[%t] [%p] %q%u@%d '/" "$PG_CONF" && \
    sed -i "s/#log_min_messages = warning/log_min_messages = warning/" "$PG_CONF" && \
    sed -i "s/#log_min_error_statement = error/log_min_error_statement = error/" "$PG_CONF" && \
    sed -i "s/#shared_buffers = 128MB/shared_buffers = 128MB/" "$PG_CONF" && \
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_CONF"

# ── MongoDB directories & config ─────────────────────────────────────────
RUN mkdir -p /var/lib/mongodb /var/log/mongodb && \
    chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb

COPY docker/mongod.conf /etc/mongod.conf

# ── Supervisord configuration ────────────────────────────────────────────
COPY docker/supervisord.conf /etc/supervisor/conf.d/dre-services.conf

# ── systemctl / journalctl / service wrappers ────────────────────────────
# Docker doesn't have systemd — these wrappers simulate realistic behavior
COPY docker/systemctl-wrapper.sh /usr/local/bin/systemctl
COPY docker/journalctl-wrapper.sh /usr/local/bin/journalctl
RUN chmod +x /usr/local/bin/systemctl /usr/local/bin/journalctl

# ── APT proxy config for runtime (use apt-cacher-ng when available) ──────
RUN echo '// apt-cache proxy (DRE Lab)\n\
Acquire::http::Proxy::apt-cache "DIRECT";\n' > /etc/apt/apt.conf.d/02-dre-cache

# ── MOTD (Message of the Day) ────────────────────────────────────────────
COPY docker/motd /etc/motd
RUN chmod 644 /etc/motd

# ── Bashrc ───────────────────────────────────────────────────────────────
COPY docker/bashrc.sandbox /home/student/.bashrc
RUN chown student:student /home/student/.bashrc

# ── PostgreSQL init script (will be run on first boot) ───────────────────
COPY docker/init-postgres.sql /opt/dre-lab/init-postgres.sql
COPY docker/init-mongo.js /opt/dre-lab/init-mongo.js
RUN mkdir -p /opt/dre-lab && chmod -R 755 /opt/dre-lab

# ── Entrypoint ───────────────────────────────────────────────────────────
COPY docker/entrypoint-sandbox.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7681

ENTRYPOINT ["/entrypoint.sh"]
