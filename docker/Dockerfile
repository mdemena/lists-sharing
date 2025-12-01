# Stage 1: Build the React application
# ARG CACHE_BUST=$(date +%s)-$(git rev-parse --short HEAD)
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve the application with Node.js
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/api ./api
COPY --from=build /app/server.ts ./

EXPOSE 80

CMD ["npx", "tsx", "server.ts"]
