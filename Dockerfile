# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Production stage
FROM node:20-alpine AS runner

# Cache buster - change this to force rebuild
ARG CACHE_BUST=1
ENV CACHE_BUST=${CACHE_BUST}

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 formcrafts

# Copy from builder
COPY --from=builder --chown=formcrafts:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=formcrafts:nodejs /app/package*.json ./
COPY --from=builder --chown=formcrafts:nodejs /app/server.js ./
COPY --from=builder --chown=formcrafts:nodejs /app/public ./public
COPY --from=builder --chown=formcrafts:nodejs /app/data ./data

USER formcrafts

EXPOSE 3000

CMD ["node", "server.js"]