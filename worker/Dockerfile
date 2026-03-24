FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
COPY data/ ./data/

RUN npx tsc

RUN npm prune --omit=dev

CMD ["node", "dist/index.js"]
