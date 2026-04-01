[02_PostgreSQL_Ref.md](https://github.com/user-attachments/files/26420555/02_PostgreSQL_Ref.md)
# **02\_PostgreSQL\_Ref.md: Справочник по работе с консолью**


**1\. Deployment & Environment**

Прежде чем выполнять запросы, нужно настроить окружение, чтобы psql знал, куда «стучаться».

### **Переменные окружения (The "Big Three"):**

Вместо того чтобы каждый раз вводить пароль и хост, экспортируй их в Bash-сессии:

* export PGHOST="localhost" — адрес сервера.  
* export PGPORT="5432" — порт (стандартный 5432).  
* export PGPASSWORD="your\_secret\_password" — **Внимание:** используй .pgpass файл для лучшей безопасности.  
* export PGDATA="/var/lib/postgresql/data" — путь к файлам БД на диске.

### **Основные конфиги (Где искать?):**

1. postgresql.conf — главные настройки (память, логи, порты).  
2. pg\_hba.conf — контроль доступа (кто и с каких IP может зайти).  
3. postgresql.auto.conf — настройки, измененные через ALTER SYSTEM.

## ---

**2\. CLI Reference (Bash-to-DB Focus)**

Самая важная часть для автоматизатора — запуск команд без входа в интерактивный режим.

### **Inline-запросы (Выполнение одной строки):**

Используй флаг \-c (command). Это идеально для мониторинга из Bash.

Bash

\# Проверка версии и аптайма  
psql \-c "SELECT version(), now() \- pg\_postmaster\_start\_time() AS uptime;"

### **Выполнение скриптов из файлов:**

Используй флаг \-f (file).

Bash

\# Накатываем миграцию или скрипт обслуживания  
psql \-f /path/to/update\_schema.sql \-d production\_db

### **Флаги «чистого» вывода (Для конвейеров Bash):**

Если ты хочешь передать результат запроса в другую команду Bash (например, в grep или awk), тебе не нужны рамки таблиц:

* \-t (tuples only) — убирает заголовки и футер.  
* \-A (unaligned) — убирает лишние пробелы для выравнивания.  
* \-q (quiet) — не выводить приветствие и лишние сообщения.

**Пример «Чистого» извлечения:**

Bash

\# Получаем только список имен баз данных, разделенных переходом строки  
DB\_LIST=$(psql \-t \-A \-c "SELECT datname FROM pg\_database WHERE datistemplate \= false;")

## ---

**3\. Admin Ops: Однострочники для DBA**

Эти команды — твои «быстрые клавиши» в критических ситуациях.

### **Управление процессами:**

Bash

\# Показать топ-5 самых долгих запросов  
psql \-c "SELECT now() \- query\_start AS duration, query FROM pg\_stat\_activity WHERE state \!= 'idle' ORDER BY 1 DESC LIMIT 5;"

\# Убить «зависшее» соединение по PID  
psql \-c "SELECT pg\_terminate\_backend(12345);"

### **Здоровье и размер (Healthcheck):**

Bash

\# Узнать размер конкретной базы данных  
psql \-t \-c "SELECT pg\_size\_pretty(pg\_database\_size('my\_db'));"

\# Проверка, находится ли база в режиме репликации (Recovery)  
psql \-c "SELECT pg\_is\_in\_recovery();"

## ---

**4\. Official Sources (Must Read)**

Для глубокого погружения используй только первоисточники. PostgreSQL имеет одну из лучших документаций в мире IT.

* [**psql Documentation**](https://www.postgresql.org/docs/current/app-psql.html) — полный список флагов (включая \-v для переменных).  
* [**Server Configuration**](https://www.postgresql.org/docs/current/runtime-config.html) — всё о postgresql.conf.  
* [**Backup and Restore (pg\_dump)**](https://www.postgresql.org/docs/current/backup.html) — логические бэкапы.

