// data.js — Curriculum for DRE Labs
// ──────────────────────────────────────────────────────────────────────────────

const CURRICULUM = {
    modules: [
        // 0: Bash
        {
            id: "bash-dre",
            name: "01. Bash для DRE",
            tasks: [
                {
                    id: "grep-patterns",
                    title: "grep: паттерны поиска",
                    hint: "grep -n 'shared_buffers' /etc/postgresql/15/main/postgresql.conf",
                    theoryHTML: `
<div class="prose">
  <h1>grep — поиск по содержимому файлов</h1>
  <p><code>grep</code> — основной инструмент для поиска в конфигах и логах.</p>
  <p><strong>Задание:</strong> Найдите значение параметра <code>shared_buffers</code> в файле <code>/etc/postgresql/15/main/postgresql.conf</code>.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        return c.startsWith('grep') && c.includes('shared_buffers');
                    }
                },
                {
                    id: "disk-check",
                    title: "df: свободное место",
                    hint: "df -h",
                    theoryHTML: `
<div class="prose">
  <h1>Мониторинг диска</h1>
  <p>Команда <code>df -h</code> показывает загрузку разделов.</p>
  <p><strong>Задание:</strong> Проверьте свободное место на дисках.</p>
</div>`,
                    check(cmd, state) { return cmd.trim() === 'df -h'; }
                },
                {
                    id: "grep-v-comments",
                    title: "Grep: без комментариев",
                    hint: "grep -v '^#' /etc/postgresql/15/main/postgresql.conf",
                    theoryHTML: `
<div class="prose">
  <h1>Чистый вывод (без мусора)</h1>
  <p>Конфигурационные файлы часто перегружены комментариями. Для быстрой проверки настроек используйте <code>grep -v '^#'</code>, чтобы исключить строки, начинающиеся на #.</p>
  <p><strong>Задание:</strong> Выведите содержимое <code>postgresql.conf</code>, исключив все комментарии.</p>
</div>`,
                    check(cmd, state) { 
                        const c = cmd.replace(/\s+/g, ' ');
                        return (c.includes("grep -v '^#'") || c.includes('grep -v "^#"')) && c.includes('postgresql.conf');
                    }
                },
                {
                    id: "grep-v-clean",
                    title: "Grep: только настройки",
                    hint: "grep -E -v '^#|^$' /etc/postgresql/15/main/postgresql.conf",
                    theoryHTML: `
<div class="prose">
  <h1>Удаление пустых строк и комментариев</h1>
  <p>Чтобы оставить только значимые строки, нужно отфильтровать и комментарии, и пустые строки. Поможет расширенный grep (флаг <code>-E</code>) и паттерн <code>'^#|^$'</code>.</p>
  <p><strong>Задание:</strong> Выведите только активные настройки из <code>postgresql.conf</code> (без комментариев и пустых строк).</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.replace(/\s+/g, ' ');
                        return (c.includes("-E") || c.includes("egrep")) && c.includes("-v") && (c.includes('^#|^$') || (c.includes('^#') && c.includes('^$'))) && c.includes('postgresql.conf');
                    }
                },
                {
                    id: "grep-logs-error",
                    title: "Логи: поиск ошибок",
                    hint: "grep -E 'ERROR|FATAL' /var/log/postgresql/postgresql.log",
                    theoryHTML: `
<div class="prose">
  <h1>Диагностика по логам</h1>
  <p>DRE должен мгновенно находить критические события. <code>ERROR</code> и <code>FATAL</code> — ваши главные цели.</p>
  <p><strong>Задание:</strong> Найдите все строки с ошибками (ERROR или FATAL) в логе PostgreSQL.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase();
                        return c.startsWith('grep') && (c.includes('error') || c.includes('fatal')) && c.includes('postgresql.log');
                    }
                },
                {
                    id: "ps-grep-postgres",
                    title: "Процессы: Postgres",
                    hint: "ps aux | grep postgres",
                    theoryHTML: `
<div class="prose">
  <h1>Мониторинг процессов</h1>
  <p>Проверка запущенных процессов — база. Важно видеть не только сам сервер, но и вспомогательные процессы (checkpointer, walwriter).</p>
  <p><strong>Задание:</strong> Выведите список всех процессов, связанных с <code>postgres</code>.</p>
</div>`,
                    check(cmd, state) {
                        return cmd.includes('ps') && cmd.includes('|') && cmd.includes('grep') && cmd.includes('postgres');
                    }
                },
                {
                    id: "df-inodes-check",
                    title: "Мониторинг: Inodes",
                    hint: "df -i",
                    theoryHTML: `
<div class="prose">
  <h1>Коварные Inodes</h1>
  <p>Иногда место на диске есть (<code>df -h</code>), но создать файл нельзя. Это значит закончились Inodes (индексные дескрипторы). Такое бывает при завалах в <code>pg_wal</code> или миллионах мелких временных файлов.</p>
  <p><strong>Задание:</strong> Проверьте состояние Inodes в системе.</p>
</div>`,
                    check(cmd, state) { return cmd.trim() === 'df -i'; }
                },
                {
                    id: "lsof-port-check",
                    title: "Сеть: кто занял порт?",
                    hint: "lsof -i :5432",
                    theoryHTML: `
<div class="prose">
  <h1>Конфликты портов</h1>
  <p>Если база не стартует с ошибкой 'Address already in use', нужно узнать, кто занял порт 5432.</p>
  <p><strong>Задание:</strong> Найдите процесс, слушающий порт 5432.</p>
</div>`,
                    check(cmd, state) { return cmd.includes('lsof') && cmd.includes('5432'); }
                },
                {
                    id: "du-pg-wal",
                    title: "Размер данных: pg_wal",
                    hint: "du -sh /var/lib/postgresql/15/main/pg_wal",
                    theoryHTML: `
<div class="prose">
  <h1>Поиск виновников (Disk Usage)</h1>
  <p>Когда место на диске тает, нужно проверять конкретные папки. Папка <code>pg_wal</code> (Write Ahead Log) — первое место, которое стоит проверить у Postgres.</p>
  <p><strong>Задание:</strong> Узнайте размер директории <code>pg_wal</code>.</p>
</div>`,
                    check(cmd, state) { return cmd.includes('du') && cmd.includes('pg_wal'); }
                },
                {
                    id: "sed-fix-config",
                    title: "Sed: исправление конфига",
                    hint: "sed -i 's/port = 5432/port = 5433/' /etc/postgresql/15/main/postgresql.conf",
                    theoryHTML: `
<div class="prose">
  <h1>Быстрые правки через sed</h1>
  <p>DRE часто правит конфиги через скрипты. <code>sed -i</code> позволяет заменить текст прямо в файле без открытия редактора.</p>
  <p><strong>Задание:</strong> Измените порт в конфигурации с 5432 на 5433 с помощью <code>sed</code>.</p>
</div>`,
                    check(cmd, state) { return cmd.includes('sed') && cmd.includes('5432') && cmd.includes('5433') && cmd.includes('postgresql.conf'); }
                },
                {
                    id: "journalctl-db",
                    title: "Journalctl: сбои сервиса",
                    hint: "journalctl -u postgresql",
                    theoryHTML: `
<div class="prose">
  <h1>Системные логи (Systemd)</h1>
  <p>Многие ошибки запуска попадают не в лог БД, а в системный журнал. <code>journalctl -u</code> — ваш лучший друг для отладки сервисов.</p>
  <p><strong>Задание:</strong> Посмотрите последние записи в журнале для юнита <code>postgresql</code>.</p>
</div>`,
                    check(cmd, state) { return cmd.includes('journalctl') && cmd.includes('postgresql'); }
                },
                {
                    id: "head-tail-peek",
                    title: "Head/Tail: Анализ файла",
                    hint: "head -n 5 /etc/postgresql/15/main/postgresql.conf",
                    theoryHTML: `
<div class="prose">
  <h1>Быстрый просмотр: Head и Tail</h1>
  <p>Чтобы не выводить огромные файлы целиком, используйте <code>head</code> (начало) или <code>tail</code> (конец).</p>
  <p><strong>Задание:</strong> Выведите первые 5 строк конфигурационного файла.</p>
</div>`,
                    check(cmd, state) { return cmd.includes('head') && cmd.includes('-n') && cmd.includes('5'); }
                },
                {
                    id: "ps-wc-count",
                    title: "Pipe & WC: Подсчет",
                    hint: "ps aux | wc -l",
                    theoryHTML: `
<div class="prose">
  <h1>Конвейер и статистика</h1>
  <p>Команда <code>wc -l</code> считает количество строк. В сочетании с конвейером она позволяет быстро оценить количество процессов или ошибок.</p>
  <p><strong>Задание:</strong> Посчитайте общее количество запущенных процессов в системе через конвейер.</p>
</div>`,
                    check(cmd, state) { return cmd.includes('|') && cmd.includes('wc') && cmd.includes('-l'); }
                },
                {
                    id: "bash-top",
                    title: "Top: Мониторинг ресурсов",
                    hint: "top",
                    theoryHTML: `
<div class="prose">
  <h1>Real-time мониторинг</h1>
  <p>Команда <code>top</code> показывает загрузку процессора, памяти и самые активные процессы в реальном времени. В симуляторе это снимок текущего состояния.</p>
  <p><strong>Задание:</strong> Запустите команду <code>top</code> для мониторинга системы.</p>
</div>`,
                    check(cmd, state) { return cmd.trim() === "top"; }
                }

            ]
        },
        // 1: PostgreSQL
        {
            id: "postgresql-core",
            name: "02. PostgreSQL Core",
            tasks: [
                {
                    id: "pg-version",
                    title: "Версия сервера",
                    hint: "psql --version",
                    validPaths: ["psql --version", "psql -V", "postgres -V"],
                    theoryHTML: `<div class="prose"><h1>PostgreSQL Version</h1><p>Первый шаг любого DRE — проверка версии ПО. Это критично для понимания доступных фич.</p><p><strong>Задание:</strong> Узнайте версию psql или самого сервера postgres.</p></div>`,
                    check(cmd, state) { 
                        const c = cmd.toLowerCase();
                        return (c.includes('psql') || c.includes('postgres')) && (c.includes('version') || c.includes('-v')); 
                    }
                },
                {
                    id: "pg-config",
                    title: "Поиск конфигурации",
                    hint: "SHOW config_file;",
                    validPaths: ["psql -c 'SHOW config_file;'", "psql -c 'SELECT sourcefile FROM pg_settings WHERE name = \"config_file\";'"],
                    theoryHTML: `<div class="prose"><h1>Конфигурационные файлы</h1><p>В Linux конфиги обычно лежат в <code>/etc/postgresql/</code>, но надежнее спросить у самой БД.</p><p><strong>Задание:</strong> Выведите путь к основному файлу конфигурации через SQL запрос.</p></div>`,
                    check(cmd, state) { return cmd.toLowerCase().includes('show config_file') || cmd.toLowerCase().includes('pg_settings'); }
                },
                {
                    id: "pg-env-port",
                    title: "Переменные окружения",
                    hint: "export PGPORT=5432",
                    validPaths: ["export PGPORT=5432", "PGPORT=5432 psql"],
                    theoryHTML: `<div class="prose"><h1>Environment Variables</h1><p>Утилиты PostgreSQL (psql, pg_dump) используют переменные <code>PGHOST</code>, <code>PGPORT</code>, <code>PGUSER</code>.</p><p><strong>Задание:</strong> Установите переменную окружения <code>PGPORT</code> в значение 5432.</p></div>`,
                    check(cmd, state) { return cmd.includes('PGPORT') && cmd.includes('5432'); }
                },
                {
                    id: "pg-clean-output",
                    title: "Чистый вывод (Scripts)",
                    hint: "psql -At -c 'SELECT 1'",
                    validPaths: ["psql -At -c 'SELECT ...'", "psql --no-align --tuples-only -c '...'"],
                    theoryHTML: `<div class="prose"><h1>Автоматизация и парсинг</h1><p>Для Bash-скриптов нужны «голые» данные без рамок и заголовков. Используйте флаги <code>-A</code> (unaligned) и <code>-t</code> (tuples only).</p><p><strong>Задание:</strong> Выполните любой SELECT запрос в «чистом» режиме (флаги -A и -t).</p></div>`,
                    check(cmd, state) { 
                        const c = cmd.toLowerCase().trim();
                        const isPsql = c.includes('psql');
                        const hasA = c.includes('--no-align') || / -[a-z]*a/.test(c);
                        const hasT = c.includes('--tuples-only') || / -[a-z]*t/.test(c);
                        const hasC = c.includes('-c') || c.includes('--command');
                        return isPsql && hasA && hasT && hasC;
                    }
                },
                {
                    id: "pg-terminate",
                    title: "Управление сессиями",
                    hint: "SELECT pg_terminate_backend(pid);",
                    validPaths: ["psql -c 'SELECT pg_terminate_backend(1234);'", "psql -c 'SELECT pg_cancel_backend(pid);'"],
                    theoryHTML: `<div class="prose"><h1>Emergency: Kill Process</h1><p>Когда запрос «вешает» базу, DRE должен уметь его прибить по PID процесса.</p><p><strong>Задание:</strong> Выполните SQL команду для завершения процесса (terminate) с фиктивным PID 1234.</p></div>`,
                    check(cmd, state) { return cmd.toLowerCase().includes('pg_terminate_backend') || cmd.toLowerCase().includes('pg_cancel_backend'); }
                },
                {
                    id: "pg-size",
                    title: "Мониторинг объема",
                    hint: "SELECT pg_size_pretty(pg_database_size('postgres'));",
                    validPaths: ["psql -c 'SELECT pg_database_size(...)'", "psql -c 'SELECT pg_size_pretty(...)'"],
                    theoryHTML: `<div class="prose"><h1>Size Matters</h1><p>Админу важно знать, сколько места занимает БД на диске.</p><p><strong>Задание:</strong> Выведите размер любой базы данных с помощью встроенных функций.</p></div>`,
                    check(cmd, state) { return cmd.toLowerCase().includes('pg_database_size'); }
                },
                {
                    id: "pg-recovery",
                    title: "Статус репликации",
                    hint: "SELECT pg_is_in_recovery();",
                    validPaths: ["psql -c 'SELECT pg_is_in_recovery();'"],
                    theoryHTML: `<div class="prose"><h1>HA & Replication</h1><p>Чтобы понять, является ли узел мастером (false) или репликой (true), используется спецфункция.</p><p><strong>Задание:</strong> Проверьте, находится ли сервер в режиме восстановления (recovery).</p></div>`,
                    check(cmd, state) { return cmd.toLowerCase().includes('pg_is_in_recovery'); }
                }
            ]
        },
        // 2: Oracle
        {
            id: "oracle-dba",
            name: "03. Oracle DBA",
            tasks: [
                {
                    id: "ora-env",
                    title: "Oracle SID",
                    hint: "echo $ORACLE_SID",
                    theoryHTML: `<div class="prose"><h1>Oracle SID</h1><p>Задание: Проверьте переменную ORACLE_SID.</p></div>`,
                    check(cmd, state) { return cmd.includes('ORACLE_SID'); }
                },
                {
                    id: "ora-status",
                    title: "V$INSTANCE",
                    hint: "SELECT status FROM v$instance;",
                    theoryHTML: `<div class="prose"><h1>Oracle Status</h1><p>Задание: Проверьте статус инстанса через SQL.</p></div>`,
                    check(cmd, state) { return cmd.toLowerCase().includes('v$instance'); }
                }
            ]
        },
        // 3: MongoDB
        {
            id: "mongodb-admin",
            name: "04. MongoDB Admin",
            tasks: [
                {
                    id: "mg-uri",
                    title: "MONGO_URI",
                    hint: "echo $MONGO_URI",
                    theoryHTML: `<div class="prose"><h1>MongoDB URI</h1><p>В MongoDB подключение обычно настраивается через строку подключения (Connection String).</p><p><strong>Задание:</strong> Проверьте переменную <code>MONGO_URI</code>.</p></div>`,
                    check(cmd, state) { return cmd.includes('MONGO_URI'); }
                },
                {
                    id: "mg-ping",
                    title: "DB Ping (Healthcheck)",
                    hint: "mongosh --eval \"db.adminCommand('ping')\"",
                    theoryHTML: `<div class="prose"><h1>MongoDB Ping</h1><p>Для выполнения команд вне интерактивной оболочки используйте <code>mongosh --eval "команда"</code>.</p><p><strong>Задание:</strong> Проверьте связь с базой через <code>db.adminCommand('ping')</code>.</p></div>`,
                    check(cmd, state) { return cmd.includes('mongosh') && cmd.includes('ping'); }
                },
                {
                    id: "mg-rs-status",
                    title: "Replica Set Status",
                    hint: "mongosh --eval \"rs.status()\"",
                    theoryHTML: `<div class="prose"><h1>Replica Set</h1><p>Задание: Проверьте статус репликации командой <code>rs.status()</code> из консоли Bash.</p></div>`,
                    check(cmd, state) { return cmd.includes('mongosh') && cmd.includes('rs.status()'); }
                },
                {
                    id: "mg-primary",
                    title: "Поиск Primary",
                    hint: "mongosh --eval \"db.isMaster()\"",
                    theoryHTML: `<div class="prose"><h1>Поиск Primary</h1><p>Задание: Убедитесь, что текущий узел является Primary (Master) через <code>db.isMaster()</code>.</p></div>`,
                    check(cmd, state) { return cmd.includes('mongosh') && cmd.includes('isMaster'); }
                },
                {
                    id: "mg-conf",
                    title: "Конфиг mongod.conf",
                    hint: "cat /etc/mongod.conf",
                    theoryHTML: `<div class="prose"><h1>Конфигурация</h1><p>Задание: Прочитайте основной файл конфигурации <code>/etc/mongod.conf</code>.</p></div>`,
                    check(cmd, state) { return cmd.includes('/etc/mongod.conf'); }
                }
            ]
        }
    ]
};
