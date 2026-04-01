# **04\_MongoDB\_Ref.md: Справочник по работе с NoSQL (mongosh)**

## **1\. Status & Requirements**

* **Предварительное условие:** Освоение \[01\_Bash\_Core.md\].  
* **Инструментарий:** Современная оболочка mongosh (заменила старый mongo shell).  
* **Особенность:** Полная поддержка синтаксиса Node.js внутри CLI.

## ---

**2\. Deployment & Environment**

В отличие от реляционных баз, здесь всё завязано на **Connection String (URI)**.

### **Переменные окружения:**

* export MONGO\_URI="mongodb://admin:password@localhost:27017/admin?authSource=admin"  
* export MONGODB\_CONFIG="/etc/mongod.conf" — основной конфиг (YAML-формат).

### **Ключевые пути:**

* По умолчанию данные лежат в /var/lib/mongodb.  
* Логи: /var/log/mongodb/mongod.log.

## ---

**3\. CLI Reference: Bash \+ JavaScript**

mongosh — это фактически REPL для JavaScript. Ты можешь писать полноценные JS-скрипты и вызывать их из Bash.

### **Выполнение кода (Inline):**

Используй флаг \--eval.

Bash

\# Простая проверка состояния из Bash  
mongosh "$MONGO\_URI" \--quiet \--eval "db.serverStatus().uptime"

### **Выполнение JS-файлов:**

Это самый мощный способ. Ты создаешь файл .js с логикой и «скармливаешь» его оболочке.

Bash

\# Запуск готового JS-сценария  
mongosh "$MONGO\_URI" /scripts/maintenance/cleanup\_logs.js

### **Скрипты внутри скрипта (The "Inception" Pattern):**

Ты можешь генерировать JS-код «на лету» прямо внутри Bash-скрипта через Here-Documents.

Bash

\#\!/bin/bash  
COLLECTION\_NAME="users\_2024"

\# Генерируем JS внутри Bash-контейнера  
mongosh "$MONGO\_URI" \<\<EOF  
const count \= db.${COLLECTION\_NAME}.countDocuments({ active: true });  
console.log("Active users in ${COLLECTION\_NAME}: " \+ count);  
EOF

## ---

**4\. Коварство JavaScript в автоматизации**

Хотя JS дает гибкость (циклы, условия, обработка JSON), у него есть и обратная сторона:

* **Ад кавычек:** Когда ты пытаешься передать переменную Bash внутрь JS-строки внутри \--eval, легко запутаться в ', " и \`.  
* **Типизация:** В Bash всё — строка. В MongoDB NumberInt(10) и 10.0 (Double) — разные вещи. Ошибка в типе данных в Bash-скрипте может привести к тому, что индекс не будет использоваться.  
* **Производительность:** Выполнять тяжелую логику обработки данных на стороне клиента (в JS-скрипте) медленнее, чем использовать встроенный Aggregation Framework. **Правило:** Максимум логики — в запросе, минимум — в обработке JS-циклом.

## ---

**5\. Admin Ops: Однострочники**

Быстрые команды для проверки «здоровья» кластера.

### **Проверка Replica Set:**

Bash

\# Узнать, кто сейчас Primary  
mongosh \--eval "rs.status().members.find(m \=\> m.stateStr \=== 'PRIMARY').name" \--quiet

### **Управление индексами:**

Bash

\# Показать все индексы в коллекции в читаемом виде  
mongosh \--eval "db.my\_collection.getIndexes()" \--json

### **Healthcheck для мониторинга:**

Bash

\# Проверка связи и авторизации (вернет 1, если ОК)  
mongosh \--eval "db.adminCommand('ping').ok" \--quiet

## ---

**6\. Official Sources**

* [**mongosh CLI Options**](https://www.mongodb.com/docs/mongodb-shell/reference/options/) — все флаги запуска.  
* [**Configuration File Options**](https://www.mongodb.com/docs/manual/reference/configuration-options/) — справочник по mongod.conf.  
* [**Database Commands**](https://www.mongodb.com/docs/manual/reference/command/) — список всех db.runCommand(), которые можно вызывать из скриптов.

