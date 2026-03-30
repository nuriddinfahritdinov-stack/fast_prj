// data.js — Curriculum, themes, and simulated filesystem for DRE PostgreSQL Lab
// ──────────────────────────────────────────────────────────────────────────────
// check(cmd, state) → boolean
//   cmd   : trimmed string the user typed
//   state : { cwd, output, history }   (history = array of all previous cmds)
//
// Multiple valid paths are OR-combined inside each check function.

// ── Helper: normalize flags / arguments ─────────────────────────────────────
function cmdBase(cmd) { return cmd.split(/\s+/)[0].toLowerCase(); }
function cmdArgs(cmd) { return cmd.split(/\s+/).slice(1).join(' '); }
function hasFlag(cmd, flag) { return cmd.includes(flag); }
function cmdHasArg(cmd, arg) {
    return cmd.split(/\s+/).some(p => p === arg || p.endsWith('/' + arg.replace(/^\//, '')));
}
function pathMatch(a, b) {
    // treat trailing slash as equivalent
    return a.replace(/\/$/, '') === b.replace(/\/$/, '');
}

// =============================================================================
//  CURRICULUM
// =============================================================================
const CURRICULUM = {
    modules: [

        // ─────────────────────────────────────────────────────────────────────
        // MODULE 1: PostgreSQL Intro — navigation & version
        // ─────────────────────────────────────────────────────────────────────
        {
            id: "intro",
            name: "PostgreSQL Intro",
            tasks: [

                // ── Task 1: check version ────────────────────────────────────
                {
                    id: "arch",
                    title: "Версия сервера",
                    hint: "psql --version   или   psql -V",
                    validPaths: [
                        "psql --version",
                        "psql -V",
                        "postgres --version",
                        "postgres -V",
                        "pg_config --version",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>Клиент-серверная архитектура PostgreSQL</h1>
  <p>PostgreSQL работает по модели клиент-сервер. Когда вы открываете <code>psql</code>,
  вы — клиент, а фоновый процесс <code>postgres</code> (ранее <code>postmaster</code>) —
  сервер. Они общаются по Unix-сокету или TCP.</p>

  <h2>Разделяемая память</h2>
  <p>Сервер использует несколько разделяемых областей памяти:</p>
  <ul>
    <li><code>shared_buffers</code> — кэш страниц таблиц и индексов</li>
    <li><code>WAL buffers</code> — буфер журнала транзакций перед записью на диск</li>
    <li><code>work_mem</code> — память для одной операции сортировки / хэш-соединения</li>
  </ul>

  <h2>Полезные bash-команды для начала</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Что делает</th></tr>
    <tr><td class="pr-4 py-1 font-mono">psql --version</td><td>версия клиента psql</td></tr>
    <tr><td class="pr-4 py-1 font-mono">psql -V</td><td>сокращённый вариант</td></tr>
    <tr><td class="pr-4 py-1 font-mono">pg_config --version</td><td>версия скомпилированного сервера</td></tr>
    <tr><td class="pr-4 py-1 font-mono">postgres --version</td><td>версия бинарника сервера</td></tr>
  </table>

  <p><strong>Задание:</strong> Узнайте установленную версию — любым способом из таблицы выше.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        return (
                            c === "psql --version" ||
                            c === "psql -v" ||
                            c === "postgres --version" ||
                            c === "postgres -v" ||
                            c === "pg_config --version" ||
                            // also accept if user piped or used full path
                            (c.includes("psql") && c.includes("version"))
                        );
                    }
                },

                // ── Task 2: navigate to configs ──────────────────────────────
                {
                    id: "fs-linux",
                    title: "Файловая структура",
                    hint: "cd /etc/postgresql   затем   ls",
                    validPaths: [
                        "cd /etc/postgresql → ls",
                        "find /etc -name postgresql.conf",
                        "ls /etc/postgresql",
                        "locate postgresql.conf",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>Где лежат данные и конфиги?</h1>
  <p>Стандартный layout в Debian/Ubuntu:</p>
  <ul>
    <li><code>/var/lib/postgresql/&lt;ver&gt;/main/</code> — PGDATA (данные)</li>
    <li><code>/etc/postgresql/&lt;ver&gt;/main/</code> — конфигурация</li>
    <li><code>/var/log/postgresql/</code> — серверные логи</li>
    <li><code>/run/postgresql/</code> — PID-файл и Unix-сокет</li>
  </ul>

  <h2>Способы найти конфиг — выбери любой</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Метод</th></tr>
    <tr><td class="pr-4 py-1 font-mono">cd /etc/postgresql</td><td>перейти напрямую</td></tr>
    <tr><td class="pr-4 py-1 font-mono">ls /etc/postgresql</td><td>посмотреть содержимое без cd</td></tr>
    <tr><td class="pr-4 py-1 font-mono">find /etc -name postgresql.conf</td><td>рекурсивный поиск по имени</td></tr>
    <tr><td class="pr-4 py-1 font-mono">locate postgresql.conf</td><td>индексный поиск (если установлен)</td></tr>
  </table>

  <h2>Полезные флаги ls</h2>
  <table class="text-xs w-full mb-2 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-3">Флаг</th><th class="text-left py-1">Эффект</th></tr>
    <tr><td class="pr-3 py-1 font-mono">-l</td><td>длинный формат (права, владелец, размер)</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-a</td><td>показать скрытые файлы</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-h</td><td>человекочитаемые размеры (вместе с -l)</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-R</td><td>рекурсивный вывод</td></tr>
  </table>

  <p><strong>Задание:</strong> Найдите директорию с конфигами PostgreSQL любым удобным способом.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        // path 1: cd into the dir
                        if (state.cwd && state.cwd.startsWith('/etc/postgresql')) return true;
                        // path 2: ls the dir directly
                        if ((c.startsWith('ls') && c.includes('/etc/postgresql'))) return true;
                        // path 3: find
                        if (c.startsWith('find') && c.includes('/etc') && c.includes('postgresql')) return true;
                        // path 4: locate
                        if (c.startsWith('locate') && c.includes('postgresql')) return true;
                        return false;
                    }
                },

                // ── Task 3: SQL — find config path ──────────────────────────
                {
                    id: "config-sql",
                    title: "SQL: найти конфиг",
                    hint: "SHOW config_file;   или   SELECT setting FROM pg_settings WHERE name='config_file';",
                    validPaths: [
                        "SHOW config_file;",
                        "SELECT setting FROM pg_settings WHERE name='config_file';",
                        "SHOW data_directory;",
                        "\\! find /etc -name postgresql.conf",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>Поиск конфигов изнутри PostgreSQL</h1>
  <p>Если вы уже подключены к базе через <code>psql</code>, пути к конфигам можно узнать не
  выходя из сессии — двумя разными SQL-методами:</p>

  <h2>Метод 1: SHOW</h2>
  <p><code>SHOW config_file;</code></p>
  <p>Возвращает абсолютный путь к <code>postgresql.conf</code>.</p>
  <p><code>SHOW data_directory;</code></p>
  <p>Возвращает путь к PGDATA.</p>

  <h2>Метод 2: pg_settings</h2>
  <p><code>SELECT name, setting FROM pg_settings WHERE name LIKE '%file%';</code></p>
  <p>Системное представление <code>pg_settings</code> содержит все параметры конфигурации.
  Фильтруя по <code>name</code>, можно найти любой путь.</p>

  <h2>Метод 3: мета-команда \\!</h2>
  <p>Внутри psql любую shell-команду можно выполнить через <code>\\!</code>:</p>
  <p><code>\\! find /etc -name postgresql.conf</code></p>

  <p><strong>Задание:</strong> Найдите расположение конфигурационного файла — выберите любой из трёх методов.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        if (c.includes('show config_file')) return true;
                        if (c.includes('show data_directory')) return true;
                        if (c.includes('pg_settings') && (c.includes('config_file') || c.includes("'%file%'") || c.includes('"%file%"'))) return true;
                        if (c.includes('\\!') && c.includes('find') && c.includes('postgresql')) return true;
                        // Also accept plain SELECT ... pg_settings
                        if (c.includes('select') && c.includes('pg_settings')) return true;
                        return false;
                    }
                },

                // ── Task 4: read a specific section of a log file ────────────
                {
                    id: "logs-dre",
                    title: "DRE: Чтение логов",
                    hint: "tail -n 50 /var/log/postgresql/postgresql.log   или   grep ERROR ...",
                    validPaths: [
                        "tail /var/log/postgresql/postgresql.log",
                        "tail -n 50 /var/log/postgresql/postgresql.log",
                        "tail -f /var/log/postgresql/postgresql.log",
                        "grep ERROR /var/log/postgresql/postgresql.log",
                        "grep 'No space' /var/log/postgresql/postgresql.log",
                        "cat /var/log/postgresql/postgresql.log | grep ERROR",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>Анализ сбоев: работа с логами</h1>
  <p>Лог-файл PostgreSQL — первое место, куда смотрит DRE при инциденте.
  Он содержит события уровней <code>LOG</code>, <code>WARNING</code>, <code>ERROR</code>,
  <code>FATAL</code>, <code>PANIC</code>.</p>

  <h2>Просмотр конца файла (tail)</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Что делает</th></tr>
    <tr><td class="pr-4 py-1 font-mono">tail postgresql.log</td><td>последние 10 строк</td></tr>
    <tr><td class="pr-4 py-1 font-mono">tail -n 50 postgresql.log</td><td>последние 50 строк</td></tr>
    <tr><td class="pr-4 py-1 font-mono">tail -f postgresql.log</td><td>следить в реальном времени (follow)</td></tr>
    <tr><td class="pr-4 py-1 font-mono">tail -f -n 100 postgresql.log</td><td>100 строк + слежение</td></tr>
  </table>

  <h2>Фильтрация ошибок (grep)</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Результат</th></tr>
    <tr><td class="pr-4 py-1 font-mono">grep ERROR postgresql.log</td><td>все строки с ERROR</td></tr>
    <tr><td class="pr-4 py-1 font-mono">grep -i 'no space' postgresql.log</td><td>без учёта регистра</td></tr>
    <tr><td class="pr-4 py-1 font-mono">grep -c ERROR postgresql.log</td><td>посчитать количество ошибок</td></tr>
    <tr><td class="pr-4 py-1 font-mono">grep -A 3 FATAL postgresql.log</td><td>строка + 3 следующих (контекст)</td></tr>
  </table>

  <h2>Комбинирование (pipe)</h2>
  <p>Вывод одной команды можно передать в другую через <code>|</code>:</p>
  <p><code>cat postgresql.log | grep ERROR | tail -n 20</code></p>
  <p>Это прочитает файл, оставит только строки с ERROR, покажет последние 20.</p>

  <p><strong>Задание:</strong> Просмотрите конец лог-файла PostgreSQL или отфильтруйте ошибки — выберите удобный способ.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        const hasLog = c.includes('postgresql.log') || (state.cwd === '/var/log/postgresql' && (c.includes('tail') || c.includes('cat') || c.includes('grep') || c.includes('less') || c.includes('more')));
                        if (!hasLog) return false;
                        return (
                            c.startsWith('tail') ||
                            c.startsWith('grep') ||
                            c.includes('| grep') ||
                            c.startsWith('cat') ||
                            c.startsWith('less') ||
                            c.startsWith('more')
                        );
                    }
                },

            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // MODULE 2: Bash для DRE — работа с файлами и потоками
        // ─────────────────────────────────────────────────────────────────────
        {
            id: "bash-dre",
            name: "Bash для DRE",
            tasks: [

                // ── Task 5: grep patterns ────────────────────────────────────
                {
                    id: "grep-patterns",
                    title: "grep: паттерны поиска",
                    hint: "grep -n 'shared_buffers' /etc/postgresql/postgresql.conf",
                    validPaths: [
                        "grep shared_buffers /etc/postgresql/postgresql.conf",
                        "grep -n shared_buffers /etc/postgresql/postgresql.conf",
                        "grep -i 'max_connections' /etc/postgresql/postgresql.conf",
                        "grep '^[^#]' /etc/postgresql/postgresql.conf",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>grep — поиск по содержимому файлов</h1>
  <p><code>grep</code> — незаменимый инструмент для работы с конфигами и логами.
  Он выводит только строки, совпадающие с шаблоном.</p>

  <h2>Основной синтаксис</h2>
  <p><code>grep [флаги] 'паттерн' файл</code></p>

  <h2>Самые полезные флаги</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-3">Флаг</th><th class="text-left py-1">Назначение</th></tr>
    <tr><td class="pr-3 py-1 font-mono">-n</td><td>показывать номера строк</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-i</td><td>игнорировать регистр</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-v</td><td>инвертировать: строки БЕЗ совпадений</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-c</td><td>только количество совпадений</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-r</td><td>рекурсивно по директории</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-A N</td><td>показать N строк ПОСЛЕ совпадения</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-B N</td><td>показать N строк ДО совпадения</td></tr>
    <tr><td class="pr-3 py-1 font-mono">-E</td><td>расширенные регулярные выражения (ERE)</td></tr>
  </table>

  <h2>Практические сценарии</h2>
  <p>Найти все активные (раскомментированные) параметры конфига:</p>
  <p><code>grep '^[^#]' /etc/postgresql/postgresql.conf</code></p>
  <p>Показать значение конкретного параметра с номером строки:</p>
  <p><code>grep -n 'shared_buffers' /etc/postgresql/postgresql.conf</code></p>
  <p>Найти ошибки за последний час в логах (по временной метке):</p>
  <p><code>grep '2024-03-30 21:' /var/log/postgresql/postgresql.log | grep ERROR</code></p>

  <p><strong>Задание:</strong> Найдите значение параметра <code>shared_buffers</code> или <code>max_connections</code> в конфигурационном файле.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        if (!c.startsWith('grep')) return false;
                        const targetsConfig = c.includes('postgresql.conf') || state.cwd === '/etc/postgresql';
                        const targetsParam  = c.includes('shared_buffers') || c.includes('max_connections') || c.includes('work_mem') || c.includes('wal') || c.includes('[^#]') || c.includes('^[^');
                        return targetsConfig || targetsParam;
                    }
                },

                // ── Task 6: sed / awk — extract specific lines ───────────────
                {
                    id: "sed-awk",
                    title: "sed и awk: фрагменты",
                    hint: "awk '/shared_buffers/{print NR, $0}' postgresql.conf   или   sed -n '10,20p' файл",
                    validPaths: [
                        "awk '/shared_buffers/' postgresql.conf",
                        "sed -n '10,20p' /etc/postgresql/postgresql.conf",
                        "awk 'NR>=10 && NR<=20' /etc/postgresql/postgresql.conf",
                        "awk -F= '/shared_buffers/{print $2}' postgresql.conf",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>sed и awk — точечная работа с текстом</h1>
  <p>Для DRE важно уметь извлекать конкретные диапазоны строк или поля из файлов,
  не открывая их целиком.</p>

  <h2>sed — потоковый редактор</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Что делает</th></tr>
    <tr><td class="pr-4 py-1 font-mono">sed -n '10,20p' file</td><td>вывести строки 10–20</td></tr>
    <tr><td class="pr-4 py-1 font-mono">sed -n '/ERROR/p' file</td><td>вывести строки с ERROR</td></tr>
    <tr><td class="pr-4 py-1 font-mono">sed 's/old/new/g' file</td><td>заменить all old→new (не сохраняет!)</td></tr>
    <tr><td class="pr-4 py-1 font-mono">sed -i 's/old/new/g' file</td><td>заменить в самом файле (in-place)</td></tr>
    <tr><td class="pr-4 py-1 font-mono">sed '/^#/d' file</td><td>удалить все строки-комментарии</td></tr>
  </table>

  <h2>awk — обработка полей</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Что делает</th></tr>
    <tr><td class="pr-4 py-1 font-mono">awk '{print $1}' file</td><td>первое поле каждой строки</td></tr>
    <tr><td class="pr-4 py-1 font-mono">awk 'NR>=10 &amp;&amp; NR&lt;=20' file</td><td>строки 10–20 по номеру</td></tr>
    <tr><td class="pr-4 py-1 font-mono">awk -F= '/param/{print $2}' f</td><td>значение параметра после =</td></tr>
    <tr><td class="pr-4 py-1 font-mono">awk '/START/,/END/' file</td><td>диапазон между двумя паттернами</td></tr>
    <tr><td class="pr-4 py-1 font-mono">awk '{sum+=$3} END{print sum}' f</td><td>сумма третьего поля</td></tr>
  </table>

  <h2>Сценарий: извлечь значение параметра</h2>
  <p><code>awk -F= '/shared_buffers/{print $2}' /etc/postgresql/postgresql.conf</code></p>
  <p>Результат: <code> 128MB</code></p>

  <p><strong>Задание:</strong> Используйте <code>sed</code> или <code>awk</code> для просмотра конкретных строк конфига.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        return c.startsWith('sed') || c.startsWith('awk');
                    }
                },

                // ── Task 7: disk space — df / du ─────────────────────────────
                {
                    id: "disk-space",
                    title: "Диск: df и du",
                    hint: "df -h   или   du -sh /var/lib/postgresql",
                    validPaths: [
                        "df -h",
                        "df -h /var/lib/postgresql",
                        "du -sh /var/lib/postgresql",
                        "du -sh /var/lib/postgresql/*",
                        "du -h --max-depth=1 /var/lib/postgresql",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>Диагностика нехватки места</h1>
  <p>Ошибка <code>No space left on device</code> в логах PostgreSQL означает, что файловая
  система, на которой lежит PGDATA, заполнена. DRE должен мгновенно определить, кто
  «съел» место.</p>

  <h2>df — свободное место на разделах</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Назначение</th></tr>
    <tr><td class="pr-4 py-1 font-mono">df -h</td><td>все разделы, человекочитаемые</td></tr>
    <tr><td class="pr-4 py-1 font-mono">df -h /var/lib</td><td>только раздел, которому принадлежит путь</td></tr>
    <tr><td class="pr-4 py-1 font-mono">df -i</td><td>показать inode (часто тоже кончаются!)</td></tr>
  </table>

  <h2>du — размер директорий</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Назначение</th></tr>
    <tr><td class="pr-4 py-1 font-mono">du -sh /path</td><td>суммарный размер</td></tr>
    <tr><td class="pr-4 py-1 font-mono">du -h --max-depth=1 /path</td><td>размер каждой поддиректории</td></tr>
    <tr><td class="pr-4 py-1 font-mono">du -sh /* 2>/dev/null | sort -rh | head -10</td><td>топ-10 самых больших директорий</td></tr>
  </table>

  <h2>Типичный инцидент</h2>
  <p>Лог показывает: <code>ERROR: No space left on device</code></p>
  <p>1. <code>df -h</code> → видим 100% на <code>/var</code></p>
  <p>2. <code>du -h --max-depth=1 /var</code> → виновник: <code>/var/lib/postgresql</code></p>
  <p>3. <code>du -sh /var/lib/postgresql/15/main/base/*</code> → находим разросшуюся таблицу</p>

  <p><strong>Задание:</strong> Проверьте свободное место на диске или размер директории PostgreSQL.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        if (c.startsWith('df')) return true;
                        if (c.startsWith('du') && (c.includes('postgresql') || c.includes('/var'))) return true;
                        return false;
                    }
                },

                // ── Task 8: process inspection ps / lsof ────────────────────
                {
                    id: "process-check",
                    title: "Процессы: ps и lsof",
                    hint: "ps aux | grep postgres   или   lsof -i :5432",
                    validPaths: [
                        "ps aux | grep postgres",
                        "ps -ef | grep postgres",
                        "lsof -i :5432",
                        "lsof -u postgres",
                        "pgrep -a postgres",
                        "systemctl status postgresql",
                    ],
                    theoryHTML: `
<div class="prose">
  <h1>Инспекция процессов PostgreSQL</h1>
  <p>Прежде чем диагностировать проблему, нужно убедиться, что сервер вообще запущен
  и понять, сколько клиентских процессов работает прямо сейчас.</p>

  <h2>ps — список процессов</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Результат</th></tr>
    <tr><td class="pr-4 py-1 font-mono">ps aux | grep postgres</td><td>все postgres-процессы (постмастер + backeds)</td></tr>
    <tr><td class="pr-4 py-1 font-mono">ps -ef | grep postgres</td><td>то же, другой формат с PPID</td></tr>
    <tr><td class="pr-4 py-1 font-mono">pgrep -a postgres</td><td>только PID + имя бинарника</td></tr>
  </table>

  <h2>lsof — открытые файлы / сокеты</h2>
  <table class="text-xs w-full mb-3 border-collapse">
    <tr class="border-b border-current opacity-50"><th class="text-left py-1 pr-4">Команда</th><th class="text-left py-1">Результат</th></tr>
    <tr><td class="pr-4 py-1 font-mono">lsof -i :5432</td><td>кто слушает порт PostgreSQL</td></tr>
    <tr><td class="pr-4 py-1 font-mono">lsof -u postgres</td><td>все файлы, открытые пользователем postgres</td></tr>
    <tr><td class="pr-4 py-1 font-mono">lsof +D /var/lib/postgresql</td><td>файлы в директории PGDATA</td></tr>
  </table>

  <h2>systemctl (systemd)</h2>
  <p><code>systemctl status postgresql</code> — статус юнита (active/inactive/failed).</p>
  <p><code>journalctl -u postgresql --since "1 hour ago"</code> — последний час из journald.</p>

  <p><strong>Задание:</strong> Убедитесь, что PostgreSQL запущен — проверьте процессы или порт.</p>
</div>`,
                    check(cmd, state) {
                        const c = cmd.toLowerCase().trim();
                        if (c.includes('ps') && (c.includes('postgres') || c.includes('aux') || c.includes('-ef'))) return true;
                        if (c.includes('lsof') && (c.includes('5432') || c.includes('postgres'))) return true;
                        if (c.startsWith('pgrep') && c.includes('postgres')) return true;
                        if (c.includes('systemctl') && c.includes('postgresql')) return true;
                        if (c.includes('journalctl') && c.includes('postgresql')) return true;
                        return false;
                    }
                },

            ]
        }

    ]
};

// =============================================================================
//  THEMES
// =============================================================================
const THEMES = [
    { id: 'default',   name: 'Classic Light',  cls: '' },
    { id: 'dracula',   name: 'Dracula',         cls: 'theme-dracula' },
    { id: 'cyberpunk', name: 'Cyberpunk',       cls: 'theme-cyberpunk' },
    { id: 'academic',  name: 'Light Academic',  cls: 'theme-academic' },
    { id: 'contrast',  name: 'High Contrast',   cls: 'theme-contrast' }
];
