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
COPY apps/auth-service ./apps/auth-service
COPY apps/utils ./apps/utils
COPY apps/ThirdPartyservices ./apps/ThirdPartyservices
WORKDIR /app/apps/auth-service
EXPOSE 3002
CMD ["bun", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy only production dependencies
RUN bun install --frozen-lockfile --production

# Copy auth service code
COPY apps/auth-service ./apps/auth-service
COPY apps/utils ./apps/utils
COPY apps/ThirdPartyservices ./apps/ThirdPartyservices
WORKDIR /app/apps/auth-service

# Create non-root user
RUN groupadd -g 1001 -r authuser && useradd -r -g authuser -u 1001 authuser
USER authuser

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["bun", "run", "index.ts"]