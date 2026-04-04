# 🧪 DRE Lab — Database Reliability Engineering Laboratory

Интерактивная образовательная платформа для изучения администрирования баз данных (PostgreSQL, MongoDB) и Linux (Bash, grep, sed, awk) с полноценной виртуальной песочницей в Docker.

## 📋 Требования

- **Docker** ≥ 24.0
- **Docker Compose** ≥ 2.20
- Свободные порты: 8080 (web), 5432 (PostgreSQL), 27017 (MongoDB)
- Минимум 2 GB RAM, 5 GB диск

## 🚀 Быстрый старт

```bash
# 1. Клонируйте репозиторий
git clone <url> dre-lab
cd dre-lab

# 2. Создайте файл переменных окружения
cp .env.example .env

# 3. Запустите всё одной командой
chmod +x deploy.sh
./deploy.sh start
```

После запуска:
- 🌐 **Сайт:** http://localhost:8080
- 🖥️ **Песочница:** http://localhost:8080/sandbox.html
- 🔧 **Терминал (прямой):** http://localhost:8080/terminal/

## 🏗️ Архитектура

```
┌──────────────────────────────────────────────────────────┐
│  Browser → http://localhost:8080                         │
│                    │                                     │
│            ┌───────┴───────┐                             │
│            │  Nginx (web)  │  ← HTML/CSS/JS + Proxy     │
│            └──┬────────┬───┘                             │
│        static │  proxy │ /terminal/                      │
│               │        │                                 │
│               │   ┌────┴──────────────────────────┐      │
│               │   │  Sandbox (Ubuntu + Full Root)  │  Web Term  │
│               │   │   PostgreSQL 15 / MongoDB 7    │      │
│               │   └──┬─────────────┬─────────────┬─┘      │
│               │      │             │             │        │
│          ┌────┴──┐ ┌─┴────────┐ ┌──┴───────┐ ┌───┴──────┐ │
│          │  APT  │ │ Volumes  │ │ Volumes  │ │apt-cache │ │
│          │ cache │ │ (PG Data)│ │ (Mongo)  │ │    NG    │ │
│          └───────┘ └──────────┘ └──────────┘ └──────────┘ │
│                  docker network: dre-lab-net              │
└──────────────────────────────────────────────────────────┘
```

## 📦 Сервисы

| Сервис | Образ | Порт | Назначение |
|--------|-------|------|------------|
| `web` | nginx:1.25-alpine | 8080 | Веб-интерфейс + reverse proxy |
| `sandbox-terminal` | Ubuntu 22.04 + DRE configs | — | Автономная песочница с ttyd, PostgreSQL 15, MongoDB 7, sudo-доступом и утилитами |
| `apt-cache` | apt-cacher-ng | — | Кэш apt-пакетов для быстрого sudo apt install |

## 🔧 Команды deploy.sh

```bash
./deploy.sh start     # Сборка и запуск
./deploy.sh stop      # Остановка
./deploy.sh restart   # Перезапуск
./deploy.sh status    # Статус контейнеров
./deploy.sh logs      # Логи всех сервисов
./deploy.sh logs web  # Логи конкретного сервиса
./deploy.sh rebuild   # Пересборка без кэша
./deploy.sh clean     # Полное удаление (volumes + images)
```

## ⚙️ Переменные окружения (.env)

```env
DRE_PORT=8080            # Порт веб-интерфейса
POSTGRES_USER=dre        # Пользователь PostgreSQL
POSTGRES_PASSWORD=dre_password
POSTGRES_DB=drelab       # База данных
MONGO_DB=drelab          # MongoDB база
SESSION_TIMEOUT=600      # Таймаут сессии (сек)
```

## 🖥️ Песочница

В песочнице доступен полноценный Linux-терминал с предустановленными инструментами:

**Быстрые команды:**
```bash
sudo apt install <pkg> # Установка любимых утилит
sudo systemctl status  # Проверка сервисов
pg                     # Подключение к PostgreSQL
mongo                  # Подключение к MongoDB
sudo journalctl -u postgresql # Просмотр логов
htop                   # Мониторинг ресурсов
```

**Учебные данные:**
- PostgreSQL: таблицы `lab.servers`, `lab.incidents`, `lab.metrics`, view `lab.server_dashboard`
- MongoDB: коллекции `servers`, `incidents`, `metrics`, `orders`

## 📁 Структура проекта

```
dre-lab/
├── index.html              # Главная страница
├── sandbox.html            # Виртуальная песочница
├── theory.html             # Теоретический справочник
├── 01_Bash_Lab.html        # Лаборатория Bash
├── 02_PostgreSQL_Lab.html  # Лаборатория PostgreSQL
├── 03_Oracle_Lab.html      # Лаборатория Oracle
├── 04_MongoDB_Lab.html     # Лаборатория MongoDB
├── data.js                 # Учебный контент (задания)
├── theme.css / theme.js    # Система тем
├── Dockerfile              # Образ веб-сервера
├── docker-compose.yml      # Оркестрация
├── deploy.sh               # Скрипт развёртки
├── .env.example            # Шаблон переменных
└── docker/
    ├── sandbox.Dockerfile  # Образ песочницы
    ├── apt-cacher.Dockerfile
    ├── nginx.conf          # Конфигурация Nginx
    ├── bashrc.sandbox      # Настройки Bash
    ├── entrypoint-sandbox.sh
    ├── init-postgres.sql   # Начальные данные PG
    └── init-mongo.js       # Начальные данные Mongo
```

## 🔒 Безопасность

- Контейнеры изолированы в отдельной Docker-сети
- Данные песочницы эфемерны (не сохраняются между перезапусками)
- Таймаут сессии: 10 минут
- Nginx: Security headers (X-Frame-Options, X-XSS-Protection)

## 🛠️ Установка на другую машину

```bash
# На целевой машине:
# 1. Установите Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Установите Docker Compose
sudo apt-get install docker-compose-plugin

# 3. Скопируйте проект и запустите
scp -r dre-lab/ user@target:/opt/dre-lab/
ssh user@target "cd /opt/dre-lab && ./deploy.sh start"
```

---

**DRE Lab** · v2.1 · Разработано для обучения Database Reliability Engineering
