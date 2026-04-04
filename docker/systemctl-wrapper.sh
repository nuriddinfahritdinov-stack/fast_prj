#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  systemctl wrapper for Docker (uses supervisorctl under the hood)
#  Эмулирует поведение systemctl для учебных целей
# ═══════════════════════════════════════════════════════════════════════════

# ── Service name mapping ─────────────────────────────────────────────────
resolve_service() {
    local svc="$1"
    svc="${svc%.service}"  # strip .service suffix
    case "$svc" in
        postgresql|postgresql@*|postgres)    echo "postgresql" ;;
        mongod|mongodb|mongo)                echo "mongodb" ;;
        ttyd)                                echo "ttyd" ;;
        *)                                   echo "$svc" ;;
    esac
}

# ── Formatted status output (mimics real systemctl) ──────────────────────
show_status() {
    local svc="$1"
    local supervisor_name
    supervisor_name=$(resolve_service "$svc")

    local raw
    raw=$(supervisorctl status "$supervisor_name" 2>/dev/null)

    if [ -z "$raw" ]; then
        echo "Unit ${svc}.service could not be found."
        return 4
    fi

    local state pid uptime_str
    state=$(echo "$raw" | awk '{print $2}')
    pid=$(echo "$raw" | grep -oP 'pid \K[0-9]+' || echo "")

    # Service descriptions
    local desc=""
    case "$supervisor_name" in
        postgresql)  desc="PostgreSQL 15 database server" ;;
        mongodb)     desc="MongoDB 7.0 database server" ;;
        ttyd)        desc="ttyd terminal server" ;;
        *)           desc="$supervisor_name service" ;;
    esac

    # Color and symbol
    local symbol color active_str
    if [ "$state" = "RUNNING" ]; then
        symbol="●"
        color="\033[0;32m"  # green
        active_str="active (running)"
    elif [ "$state" = "STARTING" ]; then
        symbol="●"
        color="\033[0;33m"  # yellow
        active_str="activating (start)"
    elif [ "$state" = "STOPPED" ] || [ "$state" = "EXITED" ]; then
        symbol="○"
        color="\033[0;37m"  # gray
        active_str="inactive (dead)"
    elif [ "$state" = "FATAL" ] || [ "$state" = "BACKOFF" ]; then
        symbol="×"
        color="\033[0;31m"  # red
        active_str="failed"
    else
        symbol="●"
        color="\033[0;33m"
        active_str="$state"
    fi

    echo -e "${color}${symbol}\033[0m ${svc}.service - ${desc}"
    echo "     Loaded: loaded (/etc/supervisor/conf.d/dre-services.conf; enabled)"
    echo -e "     Active: ${color}${active_str}\033[0m"

    if [ -n "$pid" ] && [ "$state" = "RUNNING" ]; then
        echo "   Main PID: ${pid} ($(basename $(readlink -f /proc/$pid/exe 2>/dev/null || echo $supervisor_name)))"

        # Memory info
        local mem_kb
        mem_kb=$(grep VmRSS /proc/$pid/status 2>/dev/null | awk '{print $2}')
        if [ -n "$mem_kb" ]; then
            local mem_mb=$((mem_kb / 1024))
            echo "     Memory: ${mem_mb}.$(( (mem_kb % 1024) * 10 / 1024 ))M"
        fi

        # Child processes for PostgreSQL
        if [ "$supervisor_name" = "postgresql" ]; then
            local children
            children=$(pgrep -P "$pid" 2>/dev/null | wc -l)
            echo "      Tasks: $((children + 1))"
            echo ""
            # Show process tree
            local procs
            procs=$(ps --ppid "$pid" -o pid,comm --no-headers 2>/dev/null)
            if [ -n "$procs" ]; then
                echo "   CGroup: (process tree)"
                echo "           ├─${pid} /usr/lib/postgresql/15/bin/postgres"
                echo "$procs" | while read cpid ccomm; do
                    echo "           ├─${cpid} postgres: ${ccomm}"
                done
            fi
        fi
    fi
    echo ""

    # Show last 3 log lines
    local logfile="/var/log/supervisor/${supervisor_name}.log"
    if [ -f "$logfile" ]; then
        echo "Last log entries:"
        tail -3 "$logfile" | sed 's/^/  /'
    fi
}

# ── Action handlers ──────────────────────────────────────────────────────
do_start() {
    local svc
    svc=$(resolve_service "$1")
    echo "Starting ${1%.service}.service..."
    supervisorctl start "$svc" >/dev/null 2>&1
    local rc=$?
    if [ $rc -eq 0 ]; then
        echo -e "\033[0;32m●\033[0m ${1%.service}.service started successfully."
    else
        echo -e "\033[0;31m×\033[0m Failed to start ${1%.service}.service."
    fi
    return $rc
}

do_stop() {
    local svc
    svc=$(resolve_service "$1")
    echo "Stopping ${1%.service}.service..."
    supervisorctl stop "$svc" >/dev/null 2>&1
    local rc=$?
    if [ $rc -eq 0 ]; then
        echo -e "\033[0;37m○\033[0m ${1%.service}.service stopped."
    else
        echo -e "\033[0;31m×\033[0m Failed to stop ${1%.service}.service."
    fi
    return $rc
}

do_restart() {
    local svc
    svc=$(resolve_service "$1")
    echo "Restarting ${1%.service}.service..."
    supervisorctl restart "$svc" >/dev/null 2>&1
    local rc=$?
    if [ $rc -eq 0 ]; then
        echo -e "\033[0;32m●\033[0m ${1%.service}.service restarted."
    else
        echo -e "\033[0;31m×\033[0m Failed to restart ${1%.service}.service."
    fi
    return $rc
}

do_reload() {
    local svc
    svc=$(resolve_service "$1")
    local pid
    pid=$(supervisorctl pid "$svc" 2>/dev/null)
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        echo "Reloading ${1%.service}.service..."
        kill -HUP "$pid" 2>/dev/null
        echo -e "\033[0;32m●\033[0m ${1%.service}.service reloaded (SIGHUP sent to PID $pid)."
    else
        echo "Service is not running."
        return 1
    fi
}

do_is_active() {
    local svc
    svc=$(resolve_service "$1")
    local raw
    raw=$(supervisorctl status "$svc" 2>/dev/null | awk '{print $2}')
    if [ "$raw" = "RUNNING" ]; then
        echo "active"
        return 0
    else
        echo "inactive"
        return 3
    fi
}

do_is_enabled() {
    echo "enabled"
    return 0
}

do_list_units() {
    echo "  UNIT                    LOAD   ACTIVE   SUB     DESCRIPTION"
    echo "──────────────────────────────────────────────────────────────────"
    for svc in postgresql mongodb ttyd; do
        local raw state load active sub desc
        raw=$(supervisorctl status "$svc" 2>/dev/null | awk '{print $2}')
        load="loaded"
        case "$svc" in
            postgresql) desc="PostgreSQL 15 database server" ;;
            mongodb)    desc="MongoDB 7.0 database server" ;;
            ttyd)       desc="ttyd terminal server" ;;
        esac
        if [ "$raw" = "RUNNING" ]; then
            active="active"
            sub="running"
        else
            active="inactive"
            sub="dead"
        fi
        printf "  %-24s %-6s %-8s %-8s %s\n" "${svc}.service" "$load" "$active" "$sub" "$desc"
    done
}

# ── Main dispatcher ──────────────────────────────────────────────────────
ACTION="$1"
SERVICE="$2"

case "$ACTION" in
    start)
        if [ -z "$SERVICE" ]; then echo "Usage: systemctl start <service>"; exit 1; fi
        do_start "$SERVICE"
        ;;
    stop)
        if [ -z "$SERVICE" ]; then echo "Usage: systemctl stop <service>"; exit 1; fi
        do_stop "$SERVICE"
        ;;
    restart)
        if [ -z "$SERVICE" ]; then echo "Usage: systemctl restart <service>"; exit 1; fi
        do_restart "$SERVICE"
        ;;
    reload)
        if [ -z "$SERVICE" ]; then echo "Usage: systemctl reload <service>"; exit 1; fi
        do_reload "$SERVICE"
        ;;
    status)
        if [ -z "$SERVICE" ]; then
            do_list_units
        else
            show_status "$SERVICE"
        fi
        ;;
    is-active)
        if [ -z "$SERVICE" ]; then echo "Usage: systemctl is-active <service>"; exit 1; fi
        do_is_active "$SERVICE"
        ;;
    is-enabled)
        if [ -z "$SERVICE" ]; then echo "Usage: systemctl is-enabled <service>"; exit 1; fi
        do_is_enabled "$SERVICE"
        ;;
    enable|disable)
        echo "${ACTION^}d ${SERVICE%.service}.service."
        ;;
    list-units|list-unit-files)
        do_list_units
        ;;
    daemon-reload)
        supervisorctl reread >/dev/null 2>&1
        supervisorctl update >/dev/null 2>&1
        echo "Daemon reloaded."
        ;;
    *)
        echo "Usage: systemctl {start|stop|restart|reload|status|enable|disable|is-active} [service]"
        echo ""
        echo "Available services:"
        echo "  postgresql.service    PostgreSQL 15 database server"
        echo "  mongod.service        MongoDB 7.0 database server"
        echo "  ttyd.service          ttyd terminal server"
        ;;
esac
