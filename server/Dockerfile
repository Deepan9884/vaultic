FROM node:20-alpine AS base
WORKDIR /app

# Install only production deps first (better layer caching).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# uploads/ must survive restarts -> mount a volume in compose.
VOLUME ["/app/uploads"]

CMD ["node", "src/index.js"]
