// ═══════════════════════════════════════════════════════════════════════════
//  DRE Lab — MongoDB Init Script
//  Создаёт учебные коллекции и документы для песочницы
// ═══════════════════════════════════════════════════════════════════════════

// Переключаемся на базу drelab
db = db.getSiblingDB('drelab');

// ── Коллекция серверов ───────────────────────────────────────────────────
db.servers.insertMany([
    {
        hostname: "mongo-rs0-01",
        ip: "10.0.2.10",
        role: "primary",
        status: "running",
        resources: { cpu: 8, ram_gb: 64, disk_gb: 2000 },
        tags: ["production", "mongodb", "rs0"],
        created_at: new Date()
    },
    {
        hostname: "mongo-rs0-02",
        ip: "10.0.2.11",
        role: "secondary",
        status: "running",
        resources: { cpu: 4, ram_gb: 32, disk_gb: 1000 },
        tags: ["production", "mongodb", "rs0"],
        created_at: new Date()
    },
    {
        hostname: "mongo-rs0-03",
        ip: "10.0.2.12",
        role: "arbiter",
        status: "running",
        resources: { cpu: 2, ram_gb: 4, disk_gb: 50 },
        tags: ["production", "mongodb", "rs0"],
        created_at: new Date()
    }
]);

// ── Коллекция инцидентов ─────────────────────────────────────────────────
db.incidents.insertMany([
    {
        server: "mongo-rs0-01",
        severity: "critical",
        title: "Oplog window shrinking",
        description: "Oplog window fell below 24h due to high write volume",
        status: "resolved",
        created_at: new Date("2024-03-28"),
        resolved_at: new Date("2024-03-28")
    },
    {
        server: "mongo-rs0-02",
        severity: "high",
        title: "Replication lag > 60 sec",
        description: "Secondary cannot keep up with primary writes",
        status: "open",
        created_at: new Date("2024-03-30")
    },
    {
        server: "mongo-rs0-01",
        severity: "medium",
        title: "Slow query detected",
        description: "Collection scan on orders collection (500ms+)",
        status: "open",
        created_at: new Date("2024-03-30")
    }
]);

// ── Коллекция метрик ─────────────────────────────────────────────────────
db.metrics.insertMany([
    { server: "mongo-rs0-01", metric: "connections",  value: 89,  ts: new Date() },
    { server: "mongo-rs0-01", metric: "cpu_pct",      value: 91.7, ts: new Date() },
    { server: "mongo-rs0-01", metric: "disk_pct",     value: 67.3, ts: new Date() },
    { server: "mongo-rs0-01", metric: "ops_per_sec",  value: 12500, ts: new Date() },
    { server: "mongo-rs0-02", metric: "repl_lag_sec", value: 2.3, ts: new Date() },
    { server: "mongo-rs0-02", metric: "cpu_pct",      value: 48.1, ts: new Date() }
]);

// ── Учебная коллекция orders (для тренировки запросов) ────────────────────
db.orders.insertMany([
    { customer: "Alice",   product: "PostgreSQL Pro", amount: 299.99, status: "completed", date: new Date("2024-03-01") },
    { customer: "Bob",     product: "MongoDB Atlas",  amount: 499.00, status: "completed", date: new Date("2024-03-05") },
    { customer: "Charlie", product: "Redis Cache",    amount: 149.50, status: "pending",   date: new Date("2024-03-10") },
    { customer: "Diana",   product: "PostgreSQL Pro", amount: 299.99, status: "completed", date: new Date("2024-03-15") },
    { customer: "Eve",     product: "MongoDB Atlas",  amount: 499.00, status: "cancelled", date: new Date("2024-03-20") }
]);

// ── Создаём индексы ──────────────────────────────────────────────────────
db.servers.createIndex({ hostname: 1 }, { unique: true });
db.incidents.createIndex({ severity: 1, status: 1 });
db.metrics.createIndex({ server: 1, metric: 1, ts: -1 });
db.orders.createIndex({ customer: 1 });
db.orders.createIndex({ status: 1 });

print("✅ DRE Lab MongoDB initialized!");
print("   Database: drelab");
print("   Collections: servers, incidents, metrics, orders");
