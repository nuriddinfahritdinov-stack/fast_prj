# ═══════════════════════════════════════════════════════════════════════════
#  DRE Lab — Web Container (Nginx + static files)
# ═══════════════════════════════════════════════════════════════════════════
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy all site files
COPY *.html *.css *.js /usr/share/nginx/html/

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

EXPOSE 80
