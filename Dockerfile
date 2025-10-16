# WebKurierCore Dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata locales ca-certificates curl tini \
 && rm -rf /var/lib/apt/lists/* \
 && echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && locale-gen

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Europe/Kyiv \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt || true

COPY . /app

RUN mkdir -p /app/engine/config /app/engine/logs /app/engine/memory
RUN printf '#!/usr/bin/env bash\npgrep -f startup_loader.py >/dev/null\n' > /healthcheck.sh && chmod +x /healthcheck.sh

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["python3", "/app/engine/startup_loader.py"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 CMD ["/healthcheck.sh"]