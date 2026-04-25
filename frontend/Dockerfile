FROM node:24-slim AS builder
WORKDIR /app

# Install all workspace dependencies using root lockfile
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/
RUN npm ci

# Build @gtd/shared first — frontend depends on it at compile time
COPY shared/ ./shared/
RUN npm run build:shared

# Build frontend (Vite outputs to frontend/dist)
COPY frontend/ ./frontend/
RUN npm run build:frontend

# ---

FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# Path is relative to root build context (set in docker-compose)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
