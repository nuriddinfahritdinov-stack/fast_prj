# **Справочник ORACLE DBA**

## **1\. Status & Requirements**

* **Предварительное условие:** Глубокое понимание \[01\_Bash\_Core.md\], особенно работы с переменными окружения и Here-Documents.  
* **Версия:** Актуально для Oracle 19c / 21c (Enterprise Edition).

## ---

**2\. Deployment & Installation**

Установка Oracle Database — это сложный многоступенчатый процесс (особенно на Linux), который требует настройки ядра ОС и зависимостей.

**Важно:** Мы не описываем процесс установки здесь, так как лучшим ресурсом для этого является [**Oracle-Base**](https://oracle-base.com/). Там представлены пошаговые инструкции для всех версий и дистрибутивов (Oracle Linux, RHEL, Ubuntu).

### **Основные переменные окружения (Environment)**

Без этих переменных в Bash утилиты sqlplus и rman не будут работать:

* export ORACLE\_SID=orcl — идентификатор конкретного инстанса.  
* export ORACLE\_HOME=/u01/app/oracle/product/19.0.0/dbhome\_1 — путь к бинарным файлам.  
* export PATH=$ORACLE\_HOME/bin:$PATH — добавление утилит в системный путь.

## ---

**3\. Instance Management: Включение и проверка**

В Oracle инстанс и база данных — это разные сущности. Сначала запускаются процессы (Instance), затем монтируется и открывается база.

### **Запуск инстанса из Bash (One-liner):**

Bash

sqlplus / as sysdba \<\<EOF  
STARTUP;  
EXIT;  
EOF

### **Проверка статуса базы (Healthcheck):**

Используем флаг \-s (silent), чтобы убрать баннеры Oracle и получить чистый ответ.

Bash

\# Проверка: открыта ли база на чтение/запись?  
STATUS=$(sqlplus \-s / as sysdba \<\<EOF  
SET HEAD OFF FEEDBACK OFF;  
SELECT status FROM v\\$instance;  
EXIT;  
EOF  
)  
echo "Текущий статус инстанса: $STATUS"

*(Примечание: символ \\$ экранируется в Bash-скрипте, чтобы он не воспринимался как переменная оболочки).*

## ---

**4\. Проверка актуальности бэкапов (RMAN)**

Для DBA критически важно знать, когда прошел последний успешный бэкап.

### **Запрос через SQL (мониторинг через Bash):**

Bash

sqlplus \-s / as sysdba \<\<EOF  
SET LINESIZE 150 PAGESIZE 20;  
COL status FORMAT a10;  
COL input\_type FORMAT a15;  
SELECT input\_type, status,   
       to\_char(start\_time, 'YYYY-MM-DD HH24:MI') as start\_time,  
       time\_taken\_display as duration  
FROM v\\$rman\_backup\_job\_details  
WHERE start\_time \> sysdate \- 2  
ORDER BY start\_time DESC;  
EXIT;  
EOF

*Этот запрос покажет все задачи RMAN за последние 48 часов.*

## ---

**5\. Мониторинг репликации (Data Guard)**

В архитектуре с Data Guard необходимо проверять «отставание» (lag) Standby-сервера от Primary.

### **Проверка задержки (Apply Lag):**

Выполняется на Standby-сервере:

Bash

sqlplus \-s / as sysdba \<\<EOF  
SET HEAD OFF;  
SELECT value FROM v\\$dataguard\_stats WHERE name \= 'apply lag';  
EXIT;  
EOF

### **Проверка статуса процессов синхронизации:**

Bash

sqlplus \-s / as sysdba \<\<EOF  
COL process FORMAT a10;  
COL status FORMAT a12;  
SELECT process, status, sequence\# FROM v\\$managed\_standby WHERE process LIKE 'MRP%';  
EXIT;  
EOF

*Если процесс MRP (Managed Recovery Process) имеет статус APPLYING\_LOG, значит, репликация идет в штатном режиме.*

## ---

## **6\. Анализ активных сессий (Monitoring)**

В высоконагруженных проектах (ABS) база данных часто становится узким местом из\-за блокировок или неоптимальных планов запросов. Вместо того чтобы «убивать» всё подряд, важно понять **причину** замедления.

### **Ключевое представление: V$SESSION**

Это главный хаб информации о том, кто и что делает в базе в данный момент.

**Пример: Поиск ТОП-10 сессий по потреблению ресурсов и ожиданию:**

SQL

\-- Выполняется в sqlplus или любом GUI  
SELECT s.sid, s.serial\#, s.username, s.status, s.last\_call\_et AS duration\_sec,  
       s.event, s.wait\_class, q.sql\_text  
FROM v$session s  
LEFT JOIN v$sql q ON s.sql\_id \= q.sql\_id  
WHERE s.status \= 'ACTIVE'   
  AND s.type \!= 'BACKGROUND'  
ORDER BY s.last\_call\_et DESC;

**Разбор:** \> \* last\_call\_et — сколько секунд длится текущая операция.

* event — чего именно ждет сессия (чтение с диска, блокировка строки, запись в лог).  
* wait\_class — категория ожидания (User I/O, Concurrency, Network).

### **Поиск «виновника» блокировок (Blocking Sessions):**

В ABS часто возникают очереди из\-за того, что одна сессия держит таблицу, а другие ждут.

SQL

SELECT sid, serial\#, username, blocking\_session,   
       final\_blocking\_session, wait\_class, event  
FROM v$session  
WHERE blocking\_session IS NOT NULL;

## ---

**7\. Чтение Trace-логов (Диагностика)**

Если SQL-запрос выполняется медленно «внутри», стандартных таблиц мониторинга может быть недостаточно. Здесь вступают в дело **Trace-файлы**.

### **Где лежат логи? (ADR — Automatic Diagnostic Repository)**

В современных версиях Oracle всё хранится в структуре ADR. Чтобы найти путь к логам из Bash:

Bash

\# Узнать путь к диагностическим файлам  
sqlplus \-s / as sysdba \<\<EOF  
SHOW PARAMETER diagnostic\_dest;  
EXIT;  
EOF

Обычно трейсы текущих сессий находятся в подпапке:

$DIAG\_DEST/diag/rdbms/\<db\_name\>/\<instance\_name\>/trace/

### **Основные типы файлов:**

* **Alert Log (alert\_\<SID\>.log):** Главный журнал событий. Здесь фиксируются ошибки уровня ORA-, перезапуски инстанса, проблемы с архивацией логов.  
* **User Trace Files (.trc):** Детальные отчеты о работе конкретной сессии. Полезны для профилирования тяжелых расчетов.

### **Включение трейсирования для анализа (SQL):**

Если нужно «препарировать» конкретный процесс в ABS:

SQL

\-- Включаем сбор детальной статистики для текущей сессии  
EXEC DBMS\_MONITOR.SESSION\_TRACE\_ENABLE(waits\=\>TRUE, binds\=\>TRUE);  
\-- После выполнения тяжелого кода выключаем  
EXEC DBMS\_MONITOR.SESSION\_TRACE\_DISABLE();

Полученный .trc файл обычно читают утилитой tkprof, которая превращает сырой лог в читаемый отчет.

## ---

**8\. Полезность для высоконагруженных проектов (ABS)**

В системах типа ABS, где логика часто зашита в тяжелые пакеты PL/SQL, трейсирование помогает:

* **Найти скрытые ожидания:** Например, задержки при записи в redo log, что тормозит все транзакции банка.  
* **Профилировать PL/SQL:** Увидеть, какая именно функция внутри пакета занимает 90% времени.  
* **Диагностика ORA-00060 (Deadlock):** В трейс-файлах Oracle автоматически рисует граф взаимных блокировок, что позволяет программистам исправить порядок обновления таблиц.

## ---

**9\. Official Sources: Анализ и Тюнинг**

Oracle предоставляет исчерпывающие руководства по анализу производительности.

* [**Oracle Database Performance Tuning Guide**](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/index.html) — Библия тюнинга.  
* [**Monitoring Real-Time Database Operations**](https://www.google.com/search?q=https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/monitoring-real-time-database-operations.html) — Раздел о живом мониторинге сессий.  
* [**DBMS\_MONITOR Package**](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_MONITOR.html) — Документация по управлению трейсами.

