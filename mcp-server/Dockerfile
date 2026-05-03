FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests first (for caching)
COPY package.json package-lock.json ./
# --ignore-scripts prevents the "prepare" hook from running tsc before source is copied
RUN npm ci --ignore-scripts

# Now copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---

FROM node:22-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 \
    && chown -R nodejs:nodejs /app

# Copy only production deps + build artifacts
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs
EXPOSE 3003

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:3003/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "build/index.js"]
