# Stage 1: Build the React application
# ARG CACHE_BUST=$(date +%s)-$(git rev-parse --short HEAD)
FROM node:20-alpine as build

WORKDIR /app

# 1) Definir args para las VITE_*
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# 2) Promocionarlas a ENV (lo que lee Vite)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
