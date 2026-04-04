# ═══════════════════════════════════════════════════════════════════════════
#  DRE Lab — APT Cache Container (apt-cacher-ng)
#  Кэширует apt пакеты для быстрой пересборки контейнеров
# ═══════════════════════════════════════════════════════════════════════════
FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends apt-cacher-ng curl && \
    rm -rf /var/lib/apt/lists/*

# Fix permissions
RUN chown -R apt-cacher-ng:apt-cacher-ng /var/cache/apt-cacher-ng

# Enable HTTPS passthrough (for repos like repo.mongodb.org)
RUN echo 'PassThroughPattern: .*' >> /etc/apt-cacher-ng/acng.conf

EXPOSE 3142

VOLUME /var/cache/apt-cacher-ng

# Run apt-cacher-ng in foreground
CMD ["apt-cacher-ng", "-c", "/etc/apt-cacher-ng", "ForeGround=1"]
