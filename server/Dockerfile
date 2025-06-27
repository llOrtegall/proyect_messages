# Dockerfile para la API usando Bun
FROM oven/bun:1.1.13-alpine

WORKDIR /app

COPY package*.json ./
RUN bun install --production

COPY . .

EXPOSE 3000

CMD ["bun", "start"]
