# 02_PostgreSQL_Ref.md: Справочник по работе с консолью

## 1. Status & Requirements
* **Предварительное условие:** Освоение [01_Bash_Core.md].
* **Версия:** PostgreSQL 14, 15, 16 (Stable).
* **Инструментарий:** `psql`, `pg_dump`, `pg_restore`.

---

## 2. Deployment & Environment
Настройка Bash-окружения для беспарольного и быстрого доступа к инстансу.

### Ключевые переменные окружения:
* `export PGHOST="localhost"`
* `export PGPORT="5432"`
* `export PGUSER="postgres"`
* `export PGPASSWORD="your_password"` (Для безопасности используйте файл `~/.pgpass`).
* `export PGDATA="/var/lib/postgresql/data"` — путь к файлам данных.

### Основные конфигурационные файлы:
| Файл | Назначение |
| :--- | :--- |
| `postgresql.conf` | Основные параметры (memory, logging, connections). |
| `pg_hba.conf` | Host-Based Authentication (правила доступа по IP/Role). |
| `postgresql.auto.conf` | Параметры, измененные через `ALTER SYSTEM`. |

---

## 3. CLI Reference (Bash-to-DB Focus)
Использование `psql` как части конвейера обработки данных.

### Выполнение команд (Inline & Files):
```bash
# Одиночный запрос через флаг -c
psql -d mydb -c "SELECT count(*) FROM users;"

# Выполнение скрипта из файла через флаг -f
psql -d mydb -f /scripts/maintenance/reindex_all.sql
