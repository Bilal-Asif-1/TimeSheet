# Build stage
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite inlines these at build time — must be set here or via compose build.args (not at container runtime).
ARG VITE_API_BASE_URL
ARG VITE_APP_ORIGIN
ARG VITE_AUTH_MODE=microsoft
ARG VITE_MS_CLIENT_ID
ARG VITE_MS_TENANT_ID=common
ARG VITE_MS_REDIRECT_URI

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_ORIGIN=$VITE_APP_ORIGIN \
    VITE_AUTH_MODE=$VITE_AUTH_MODE \
    VITE_MS_CLIENT_ID=$VITE_MS_CLIENT_ID \
    VITE_MS_TENANT_ID=$VITE_MS_TENANT_ID \
    VITE_MS_REDIRECT_URI=$VITE_MS_REDIRECT_URI

RUN test -n "$VITE_API_BASE_URL" && test -n "$VITE_APP_ORIGIN" \
  || (echo "docker build: set VITE_API_BASE_URL and VITE_APP_ORIGIN (see docker-compose build.args)" && exit 1)

RUN npm run build


# Production stage
FROM nginx:alpine

# SPA fallback support (IMPORTANT)
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
