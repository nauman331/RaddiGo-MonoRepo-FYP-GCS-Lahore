FROM oven/bun:1.1-slim AS base
WORKDIR /app

# Copy root package.json and workspace packages
COPY package.json bun.lockb* ./
COPY packages ./packages

# Install dependencies
RUN bun install --frozen-lockfile

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY apps/order-service ./apps/order-service
COPY apps/auth-service ./apps/auth-service
COPY apps/category-service ./apps/category-service
COPY apps/ThirdPartyservices ./apps/ThirdPartyservices
COPY apps/utils ./apps/utils
WORKDIR /app/apps/order-service
EXPOSE 3004
CMD ["bun", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy only production dependencies
RUN bun install --frozen-lockfile --production

# Copy order service code
COPY apps/order-service ./apps/order-service
COPY apps/auth-service ./apps/auth-service
COPY apps/category-service ./apps/category-service
COPY apps/ThirdPartyservices ./apps/ThirdPartyservices
COPY apps/utils ./apps/utils
WORKDIR /app/apps/order-service

# Create non-root user
RUN groupadd -g 1001 -r orderuser && useradd -r -g orderuser -u 1001 orderuser
USER orderuser

EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

CMD ["bun", "run", "index.ts"]