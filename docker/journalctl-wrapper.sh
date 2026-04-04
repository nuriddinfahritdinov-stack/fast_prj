#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
#  journalctl wrapper for Docker (reads from real log files)
#  Эмулирует journalctl для просмотра логов сервисов
# ═══════════════════════════════════════════════════════════════════════════

# ── Parse arguments ──────────────────────────────────────────────────────
UNIT=""
LINES=20
FOLLOW=false
EXTRA_CONTEXT=false
PRIORITY=""
SINCE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -u|--unit)      UNIT="$2"; shift 2 ;;
        -u=*)           UNIT="${1#-u=}"; shift ;;
        --unit=*)       UNIT="${1#--unit=}"; shift ;;
        -n|--lines)     LINES="$2"; shift 2 ;;
        -n=*)           LINES="${1#-n=}"; shift ;;
        -f|--follow)    FOLLOW=true; shift ;;
        -x|--catalog)   EXTRA_CONTEXT=true; shift ;;
        -e|--pager-end) shift ;;
        -xe|-ex)        EXTRA_CONTEXT=true; shift ;;
        -p|--priority)  PRIORITY="$2"; shift 2 ;;
        --since)        SINCE="$2"; shift 2 ;;
        --no-pager)     shift ;;
        -xn)            EXTRA_CONTEXT=true; LINES="${2:-20}"; shift; [ -n "$1" ] && shift ;;
        *)              shift ;;
    esac
done

# ── Resolve unit to log file(s) ─────────────────────────────────────────
resolve_logs() {
    local unit="${1%.service}"
    case "$unit" in
        postgresql|postgresql@*|postgres)
            echo "/var/log/postgresql/postgresql-15-main.log /var/log/supervisor/postgresql.log"
            ;;
        mongod|mongodb|mongo)
            echo "/var/log/mongodb/mongod.log /var/log/supervisor/mongodb.log"
            ;;
        ttyd)
            echo "/var/log/supervisor/ttyd.log"
            ;;
        supervisor|supervisord)
            echo "/var/log/supervisor/supervisord.log"
            ;;
        "")
            # All logs
            echo "/var/log/postgresql/postgresql-15-main.log /var/log/mongodb/mongod.log /var/log/supervisor/*.log /var/log/syslog"
            ;;
        *)
            echo "/var/log/supervisor/${unit}.log /var/log/${unit}*.log"
            ;;
    esac
}

LOG_FILES=$(resolve_logs "$UNIT")

# ── Check which log files actually exist ─────────────────────────────────
EXISTING_LOGS=""
for f in $LOG_FILES; do
    # Handle glob
    for expanded in $f; do
        if [ -f "$expanded" ]; then
            EXISTING_LOGS="$EXISTING_LOGS $expanded"
        fi
    done
done

if [ -z "$EXISTING_LOGS" ]; then
    if [ -n "$UNIT" ]; then
        echo "-- No entries for unit ${UNIT} --"
    else
        echo "-- No journal entries --"
    fi
    exit 0
fi

# ── Header ───────────────────────────────────────────────────────────────
if [ -n "$UNIT" ]; then
    echo -e "\033[1m-- Journal for unit ${UNIT%.service}.service --\033[0m"
else
    echo -e "\033[1m-- System Journal --\033[0m"
fi

# ── Output ───────────────────────────────────────────────────────────────
if $FOLLOW; then
    tail -f $EXISTING_LOGS 2>/dev/null
else
    # Combine, sort by date (best effort), show last N lines
    cat $EXISTING_LOGS 2>/dev/null | tail -n "$LINES"
fi
