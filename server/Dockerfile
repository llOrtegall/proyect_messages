# Dockerfile para la API usando Node.js
FROM node:24-alpine

WORKDIR /app

COPY . .

RUN npm i -g bun \
    && bun install --frozen-lockfile \
    && bun run build


EXPOSE 3000

CMD ["npm", "start"]
