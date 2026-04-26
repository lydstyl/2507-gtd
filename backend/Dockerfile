FROM node:24-alpine AS builder
WORKDIR /app

# Build tools required for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Install all workspace dependencies using root lockfile
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
RUN npm ci

# Build @gtd/shared first — backend depends on it at compile time
COPY shared/ ./shared/
RUN npm run build:shared

# Build backend
COPY backend/ ./backend/
RUN npx prisma generate --schema=./backend/prisma/schema.prisma
RUN npm run build:backend

# ---

FROM node:24-alpine AS production
WORKDIR /app

# Copy workspace node_modules — the @gtd/shared symlink will be broken, fixed below
COPY --from=builder /app/node_modules ./node_modules

# Replace broken @gtd/shared workspace symlink with actual built package files
RUN rm -rf ./node_modules/@gtd/shared
COPY --from=builder /app/shared/dist ./node_modules/@gtd/shared/dist
COPY --from=builder /app/shared/package.json ./node_modules/@gtd/shared/package.json

# Copy backend artifacts
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 \
    && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

# Run pending migrations then start the server
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/server.js"]
