FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install the full Chromium binary (in addition to the headless-shell that
# ships in the base image). We launch with `channel: 'chromium'` to opt out
# of headless-shell's stripped-down event pipeline — needed for react-select
# components on Greenhouse forms to fire their onMouseDown handlers reliably.
RUN npx playwright install chromium

COPY tsconfig.json ./
COPY src/ ./src/
COPY data/ ./data/

RUN npx tsc

RUN npm prune --omit=dev

CMD ["node", "dist/index.js"]
