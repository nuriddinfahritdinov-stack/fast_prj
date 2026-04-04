#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  DRE Lab — Deployment Script
#  Управление полным стеком: web + sandbox + databases
#
#  Использование:
#    ./deploy.sh start       — Сборка и запуск всех сервисов
#    ./deploy.sh stop        — Остановка всех контейнеров
#    ./deploy.sh restart     — Перезапуск
#    ./deploy.sh status      — Статус контейнеров и healthchecks
#    ./deploy.sh logs [svc]  — Просмотр логов (необязательно указать сервис)
#    ./deploy.sh clean       — Полная очистка (контейнеры + volumes + images)
#    ./deploy.sh rebuild     — Пересборка образов и перезапуск
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Helpers ───────────────────────────────────────────────────────────────
log()   { echo -e "${CYAN}[DRE]${NC} $*"; }
ok()    { echo -e "${GREEN}[✔]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[!]${NC}  $*"; }
fail()  { echo -e "${RED}[✘]${NC}  $*"; exit 1; }
line()  { echo -e "${CYAN}────────────────────────────────────────────────${NC}"; }

banner() {
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════════════╗"
    echo "║          🧪  DRE Lab — Deployment Tool          ║"
    echo "║              v1.0 · Docker Compose              ║"
    echo "╚══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ── Dependency check ─────────────────────────────────────────────────────
check_deps() {
    log "Проверка зависимостей..."

    if ! command -v docker &>/dev/null; then
        fail "Docker не найден! Установите: https://docs.docker.com/get-docker/"
    fi
    ok "Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"

    if docker compose version &>/dev/null; then
        ok "Docker Compose $(docker compose version --short 2>/dev/null || echo 'v2')"
        COMPOSE="docker compose"
    elif command -v docker-compose &>/dev/null; then
        ok "docker-compose $(docker-compose --version | grep -oP '\d+\.\d+\.\d+')"
        COMPOSE="docker-compose"
    else
        fail "Docker Compose не найден!"
    fi
}

# ── Create .env if not exists ────────────────────────────────────────────
ensure_env() {
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            warn "Создан .env из .env.example (проверьте настройки)"
        fi
    fi
}

# ── Start ─────────────────────────────────────────────────────────────────
cmd_start() {
    banner
    check_deps
    ensure_env
    line

    log "Сборка Docker образов..."
    $COMPOSE build --parallel 2>&1 | tail -5
    ok "Образы собраны"
    line

    log "Запуск контейнеров..."
    $COMPOSE up -d
    ok "Контейнеры запущены"
    line

    log "Ожидание healthcheck (до 90 сек)..."
    local tries=0
    local max_tries=18
    while [ $tries -lt $max_tries ]; do
        sleep 5
        tries=$((tries + 1))

        local healthy=0
        local total=0
        while IFS= read -r svc; do
            total=$((total + 1))
            local health
            health=$($COMPOSE ps --format '{{.Health}}' "$svc" 2>/dev/null || echo "unknown")
            if [ "$health" = "healthy" ]; then
                healthy=$((healthy + 1))
            fi
        done <<< "$($COMPOSE ps --services 2>/dev/null)"

        echo -ne "   ${healthy}/${total} healthy (${tries}/${max_tries})\r"

        if [ "$healthy" -ge "$total" ] && [ "$total" -gt 0 ]; then
            echo ""
            ok "Все сервисы healthy!"
            break
        fi
    done

    if [ $tries -ge $max_tries ]; then
        echo ""
        warn "Некоторые сервисы могут быть ещё не готовы"
        $COMPOSE ps
    fi

    line
    local port=${DRE_PORT:-8080}
    echo ""
    ok "${BOLD}DRE Lab запущен!${NC}"
    echo ""
    echo -e "   ${BOLD}🌐 Сайт:${NC}      http://localhost:${port}"
    echo -e "   ${BOLD}🖥️  Песочница:${NC}  http://localhost:${port}/sandbox.html"
    echo -e "   ${BOLD}🔧 Терминал:${NC}   http://localhost:${port}/terminal/"
    echo ""
    echo -e "   ${BOLD}📊 PostgreSQL:${NC} localhost:${PG_EXTERNAL_PORT:-5432} (user: ${POSTGRES_USER:-dre})"
    echo -e "   ${BOLD}🍃 MongoDB:${NC}    localhost:${MONGO_EXTERNAL_PORT:-27017}"
    echo ""
}

# ── Stop ──────────────────────────────────────────────────────────────────
cmd_stop() {
    banner
    check_deps
    log "Остановка контейнеров..."
    $COMPOSE down
    ok "Контейнеры остановлены"
}

# ── Restart ───────────────────────────────────────────────────────────────
cmd_restart() {
    cmd_stop
    echo ""
    cmd_start
}

# ── Status ────────────────────────────────────────────────────────────────
cmd_status() {
    banner
    check_deps
    line
    log "Статус контейнеров:"
    echo ""
    $COMPOSE ps
    echo ""
    line

    # Quick health summary
    log "Сводка:"
    for svc in web sandbox-terminal sandbox-postgres sandbox-mongo apt-cache; do
        local status
        status=$($COMPOSE ps --format '{{.Status}}' "$svc" 2>/dev/null || echo "not running")
        if echo "$status" | grep -q "healthy"; then
            ok "$svc: ${GREEN}healthy${NC}"
        elif echo "$status" | grep -q "Up"; then
            warn "$svc: ${YELLOW}starting...${NC}"
        else
            echo -e "   ${RED}✘${NC} $svc: ${RED}${status}${NC}"
        fi
    done
}

# ── Logs ──────────────────────────────────────────────────────────────────
cmd_logs() {
    check_deps
    local svc="${1:-}"
    if [ -n "$svc" ]; then
        $COMPOSE logs -f --tail=100 "$svc"
    else
        $COMPOSE logs -f --tail=50
    fi
}

# ── Clean ─────────────────────────────────────────────────────────────────
cmd_clean() {
    banner
    check_deps
    warn "Полная очистка: контейнеры, volumes, образы DRE Lab"
    read -r -p "Продолжить? [y/N] " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        log "Остановка и удаление..."
        $COMPOSE down -v --rmi local --remove-orphans 2>/dev/null || true
        ok "Очистка завершена"
    else
        log "Отменено"
    fi
}

# ── Rebuild ───────────────────────────────────────────────────────────────
cmd_rebuild() {
    banner
    check_deps
    ensure_env
    log "Пересборка образов (без кэша)..."
    $COMPOSE build --no-cache --parallel
    ok "Образы пересобраны"
    log "Перезапуск..."
    $COMPOSE up -d --force-recreate
    ok "Контейнеры перезапущены"
}

# ── Main ──────────────────────────────────────────────────────────────────
case "${1:-help}" in
    start)   cmd_start ;;
    stop)    cmd_stop ;;
    restart) cmd_restart ;;
    status)  cmd_status ;;
    logs)    cmd_logs "${2:-}" ;;
    clean)   cmd_clean ;;
    rebuild) cmd_rebuild ;;
    *)
        echo "DRE Lab — Deployment Script"
        echo ""
        echo "Использование: $0 <команда>"
        echo ""
        echo "Команды:"
        echo "  start     Сборка и запуск всех сервисов"
        echo "  stop      Остановка"
        echo "  restart   Перезапуск"
        echo "  status    Статус контейнеров"
        echo "  logs      Логи (можно указать сервис: logs web)"
        echo "  clean     Полное удаление (volumes, images)"
        echo "  rebuild   Пересборка без кэша"
        ;;
esac
