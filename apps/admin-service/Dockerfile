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
COPY apps/admin-service ./apps/admin-service
COPY apps/utils ./apps/utils
COPY apps/ThirdPartyservices ./apps/ThirdPartyservices
WORKDIR /app/apps/admin-service
EXPOSE 8000
CMD ["bun", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy only production dependencies
RUN bun install --frozen-lockfile --production

# Copy admin service code
COPY apps/admin-service ./apps/admin-service
COPY apps/utils ./apps/utils
COPY apps/ThirdPartyservices ./apps/ThirdPartyservices
WORKDIR /app/apps/admin-service

# Create non-root user
RUN groupadd -g 1001 -r adminuser && useradd -r -g adminuser -u 1001 adminuser
USER adminuser

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["bun", "run", "index.ts"]