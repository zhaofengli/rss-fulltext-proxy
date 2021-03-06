FROM node:14-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN apk update && apk add --no-cache git && \
	npm install

COPY . .
RUN npm run build
RUN rm -Rf node_modules/

# Production
FROM node:14-alpine

COPY --from=builder /app/dist /app/dist
WORKDIR /app
COPY package*.json ./
RUN apk update && apk add --no-cache git && \
	npm ci --only=production

ENV NODE_ENV=production

CMD [ "node", "dist/server.js" ]
