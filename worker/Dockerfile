FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# tini for proper signal handling under xvfb-run; xvfb is already in the
# Playwright base image but we install both explicitly for safety.
RUN apt-get update && apt-get install -y --no-install-recommends tini xvfb \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Install the full Chromium binary (in addition to the headless-shell that
# ships in the base image). We launch with `channel: 'chromium'` so the
# launcher resolves to this binary, and run it under Xvfb so it operates
# in true headed mode — same event-pipeline behavior as macOS Chrome.
RUN npx playwright install chromium

COPY tsconfig.json ./
COPY src/ ./src/
COPY data/ ./data/

RUN npx tsc

RUN npm prune --omit=dev

# HEADLESS=false makes apply-engine.ts launch headed Chromium; xvfb-run
# wraps the process with a virtual X display so headed mode works in a
# container with no monitor. This is the standard production Playwright
# pattern for defeating Linux-headless event-delegation quirks (react-select
# on Greenhouse forms, etc.). DISPLAY is auto-managed by xvfb-run.
ENV HEADLESS=false

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1920x1080x24 -noreset", "node", "dist/index.js"]
