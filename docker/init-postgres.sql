-- ═══════════════════════════════════════════════════════════════════════════
--  DRE Lab — PostgreSQL Init Script
--  Создаёт учебные таблицы и данные для песочницы
-- ═══════════════════════════════════════════════════════════════════════════

-- Учебная схема
CREATE SCHEMA IF NOT EXISTS lab;

-- Таблица серверов
CREATE TABLE lab.servers (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(100) NOT NULL,
    ip_address INET NOT NULL,
    role VARCHAR(50) DEFAULT 'replica',
    status VARCHAR(20) DEFAULT 'running',
    cpu_cores INTEGER DEFAULT 4,
    ram_gb INTEGER DEFAULT 16,
    disk_gb INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица инцидентов
CREATE TABLE lab.incidents (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES lab.servers(id),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Таблица метрик
CREATE TABLE lab.metrics (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES lab.servers(id),
    metric_name VARCHAR(50) NOT NULL,
    metric_value NUMERIC(10,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Учебные данные
INSERT INTO lab.servers (hostname, ip_address, role, status, cpu_cores, ram_gb, disk_gb) VALUES
    ('pg-primary-01', '10.0.1.10', 'primary',  'running', 8,  32, 1000),
    ('pg-replica-01', '10.0.1.11', 'replica',   'running', 4,  16, 500),
    ('pg-replica-02', '10.0.1.12', 'replica',   'running', 4,  16, 500),
    ('mongo-rs0-01',  '10.0.2.10', 'primary',   'running', 8,  64, 2000),
    ('mongo-rs0-02',  '10.0.2.11', 'secondary', 'running', 4,  32, 1000),
    ('app-server-01', '10.0.3.10', 'app',       'running', 16, 64, 200);

INSERT INTO lab.incidents (server_id, severity, title, description, status) VALUES
    (1, 'critical', 'Disk space exhausted on primary', 'pg_wal directory grew to 95% disk usage', 'resolved'),
    (2, 'high',     'Replication lag > 30 sec',        'Replica fell behind by 45 seconds', 'resolved'),
    (4, 'medium',   'High CPU on MongoDB primary',     'Unoptimized aggregation pipeline', 'open'),
    (6, 'low',      'SSL certificate expiring',        'Certificate expires in 14 days', 'open');

INSERT INTO lab.metrics (server_id, metric_name, metric_value) VALUES
    (1, 'cpu_usage',        72.5),
    (1, 'disk_usage',       89.2),
    (1, 'connections',      156),
    (1, 'tps',              3420),
    (2, 'replication_lag',  2.1),
    (2, 'cpu_usage',        45.3),
    (4, 'cpu_usage',        91.7),
    (4, 'disk_usage',       67.3),
    (4, 'connections',      89);

-- Полезные views
CREATE VIEW lab.server_dashboard AS
SELECT
    s.hostname,
    s.role,
    s.status,
    COALESCE(m_cpu.metric_value, 0) as cpu_pct,
    COALESCE(m_disk.metric_value, 0) as disk_pct,
    COALESCE(m_conn.metric_value, 0) as connections,
    (SELECT COUNT(*) FROM lab.incidents i WHERE i.server_id = s.id AND i.status = 'open') as open_incidents
FROM lab.servers s
LEFT JOIN lab.metrics m_cpu  ON s.id = m_cpu.server_id  AND m_cpu.metric_name = 'cpu_usage'
LEFT JOIN lab.metrics m_disk ON s.id = m_disk.server_id AND m_disk.metric_name = 'disk_usage'
LEFT JOIN lab.metrics m_conn ON s.id = m_conn.server_id AND m_conn.metric_name = 'connections';

-- Информация
DO $$
BEGIN
    RAISE NOTICE '✅ DRE Lab database initialized successfully!';
    RAISE NOTICE '   Schema: lab';
    RAISE NOTICE '   Tables: servers, incidents, metrics';
    RAISE NOTICE '   Views:  server_dashboard';
END $$;
