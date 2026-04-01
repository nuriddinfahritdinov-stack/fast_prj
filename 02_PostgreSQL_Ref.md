

Markdown

\# 02*\_PostgreSQL\_*Ref.md: Справочник для DBA и Инженеров Автоматизации

\#\# 1\. Status & Requirements  
\* **\*\*Статус:\*\*** Модуль расширения (Database Layer).  
\* **\*\*Зависимость:\*\*** Требует понимания механизмов \[01*\_Bash\_*Core.md\].  
\* **\*\*Версии:\*\*** Актуально для PostgreSQL 14, 15, 16\.  
\* **\*\*Инструмент:\*\*** Основное взаимодействие происходит через бинарный файл \`psql\`.

\---

\#\# 2\. Deployment & Environment  
Для автоматизации критически важно исключить интерактивный ввод (запросы паролей). Настройка окружения позволяет скрипту "бесшовно" подключаться к инстансу.

\#\#\# Переменные окружения (The Big Four):  
Используй \`export\` в Bash, чтобы \`psql\` подхватил их автоматически:  
\* \`export PGHOST="127.0.0.1"\` — адрес сервера.  
\* \`export PGPORT="5432"\` — порт.  
\* \`export PGUSER="dba\_admin"\` — имя пользователя.  
\* \`export PGPASSWORD="your\_secure\_password"\` — **\*\*Важно:\*\*** В продакшене используй файл \`\~/.pgpass\` с правами \`0600\`, чтобы пароль не светился в списке процессов (\`ps aux\`).

\#\#\# Файловая структура (Пути к конфигам):  
\* **\*\*Путь к данным:\*\*** \`$PGDATA\` (обычно \`/var/lib/postgresql/data\`).  
\* **\*\*Основной конфиг:\*\*** \`$PGDATA/postgresql.conf\` — здесь живут лимиты памяти (\`shared\_buffers\`) и настройки логов.  
\* **\*\*HBA (Доступ):\*\*** \`$PGDATA/pg\_hba.conf\` — список IP-адресов и методов аутентификации (md5, trust, scram-sha-256).

\---

\#\# 3\. CLI Reference (Bash-to-DB Bridge)  
Главная задача CLI — быстро выполнить SQL и вернуть результат в Bash для дальнейшей обработки.

\#\#\# Выполнение команд (Основные флаги):  
| Флаг | Описание | Анализ применения |  
| :--- | :--- | :--- |  
| \`-c "SQL"\` | Execute command | Выполняет строку кода и сразу завершает работу. |  
| \`-f file.sql\` | Execute file | Накатывает объемные скрипты или миграции. |  
| \`-t\` | Tuples only | **\*\*Критично для Bash:\*\*** Убирает заголовки колонок и итоговое количество строк. Только данные. |  
| \`-A\` | Unaligned | Убирает лишние пробелы-отступы. Удобно для \`grep\` и \`awk\`. |  
| \`-q\` | Quiet | Не выводит "NOTICE" и приветствие. |  
| \`-d dbname\` | Database | Указывает целевую базу данных. |

\#\#\# Практические примеры с разбором:

**\*\*1. Получение значения в переменную Bash:\*\***  
\`\`\`bash  
\# Задача: узнать количество активных сессий и сохранить в переменную.  
\# Мы используем \-t \-A, чтобы получить "чистое" число без рамок.  
ACTIVE\_SESSIONS=$(psql \-t \-A \-c "SELECT count(\*) FROM pg\_stat\_activity WHERE state \= 'active';")

echo "Текущая нагрузка: $ACTIVE\_SESSIONS сессий."

**2\. Выполнение скрипта с передачей параметров:**

Bash

\# Задача: передать имя схемы из Bash прямо внутрь SQL-скрипта.  
TARGET\_SCHEMA="prod\_v1"

psql \-v schema\_name="$TARGET\_SCHEMA" \-f cleanup\_script.sql  
\# Внутри cleanup\_script.sql используй :schema\_name для обращения к переменной.

## ---

**4\. Admin Ops: Однострочники (One-liners)**

Готовые конструкции для повседневных задач администратора.

### **Управление доступом и пользователями:**

Bash

\# Создание пользователя и базы в одну строку (через bash-pipe)  
psql \-c "CREATE USER dev\_user WITH PASSWORD 'pass123';"  
psql \-c "CREATE DATABASE dev\_db OWNER dev\_user;"

### **Мониторинг и Healthcheck:**

Bash

\# Проверка размера всех баз данных (сортировка по размеру)  
psql \-c "SELECT datname, pg\_size\_pretty(pg\_database\_size(datname)) FROM pg\_database ORDER BY pg\_database\_size(datname) DESC;"

\# Поиск "тяжелых" запросов, которые выполняются дольше 5 минут  
psql \-x \-c "SELECT pid, now() \- query\_start AS duration, query FROM pg\_stat\_activity WHERE state \!= 'idle' AND (now() \- query\_start) \> interval '5 minutes';"  
\# Флаг \-x (expanded) разворачивает таблицу вертикально, что удобнее для длинных SQL-текстов.

### **Принудительное завершение соединений:**

Bash

\# Отключить всех пользователей от конкретной базы (например, перед дропом базы)  
psql \-c "SELECT pg\_terminate\_backend(pid) FROM pg\_stat\_activity WHERE datname \= 'target\_db' AND pid \<\> pg\_backend\_pid();"

## ---

**5\. Official Sources (Критически важно)**

Официальная документация PostgreSQL обновляется с каждым минорным релизом. Всегда сверяйтесь с ней при использовании специфичных флагов.

* [**psql (The Terminal Front-End)**](https://www.postgresql.org/docs/current/app-psql.html) — полная спецификация всех \-флагов.  
* [**Client Authentication (pg\_hba.conf)**](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html) — правила доступа.  
* [**Server Configuration Parameters**](https://www.postgresql.org/docs/current/runtime-config.html) — описание всех опций в postgresql.conf.  
* [**The Statistics Collector**](https://www.postgresql.org/docs/current/monitoring-stats.html) — описание вьюх pg\_stat\_activity, pg\_stat\_database и других.
