# RaddiGo Docker Setup Guide

This guide explains how to use Docker with your RaddiGo microservices monorepo.

## 🚀 Quick Start

### Development Environment

1. **Start all services in development mode:**
   ```bash
   bun run docker:dev
   ```

2. **Start in detached mode (background):**
   ```bash
   bun run docker:dev:detach
   ```

3. **View logs:**
   ```bash
   bun run docker:dev:logs
   ```

4. **Stop all services:**
   ```bash
   bun run docker:dev:stop
   ```

### Production Environment

1. **Create production environment file:**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your production values
   ```

2. **Start in production mode:**
   ```bash
   bun run docker:prod
   ```

3. **Stop production services:**
   ```bash
   bun run docker:prod:stop
   ```

## 📁 Docker Architecture

### Services Overview

- **Gateway Service** (Port 3001): API Gateway and load balancer
- **Auth Service** (Port 3002): User authentication and authorization
- **Category Service** (Port 3003): Category management
- **Order Service** (Port 3004): Order management with WebSocket support
- **Nginx** (Port 80/443): Production load balancer and reverse proxy

### Health Checks

All services include health check endpoints:
- Gateway: `http://localhost:3001/health`
- Auth: `http://localhost:3002/health`
- Category: `http://localhost:3003/health`
- Order: `http://localhost:3004/health`

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run docker:dev` | Start development environment |
| `bun run docker:dev:detach` | Start development in background |
| `bun run docker:dev:logs` | View development logs |
| `bun run docker:dev:stop` | Stop development environment |
| `bun run docker:dev:clean` | Clean up (remove containers, volumes, images) |
| `bun run docker:prod` | Start production environment |
| `bun run docker:prod:stop` | Stop production environment |
| `bun run docker:prod:logs` | View production logs |
| `bun run docker:build` | Build all images |
| `bun run docker:build:prod` | Build production images |
| `bun run docker:health` | Check container health |
| `bun run docker:prune` | Clean up Docker system |

## 🏗 Development Features

- **Hot Reload**: Changes to your code are automatically reflected
- **Volume Mounting**: Source code is mounted for instant updates
- **Shared Network**: All services can communicate with each other
- **Environment Variables**: Loaded from `.env` file
- **Health Monitoring**: Built-in health checks for all services

## 🚀 Production Features

- **Multi-stage Builds**: Optimized production images
- **Resource Limits**: CPU and memory constraints
- **Health Checks**: Robust health monitoring
- **Logging**: Structured logging with rotation
- **Security**: Non-root users and security headers
- **Load Balancing**: Nginx reverse proxy
- **SSL Ready**: HTTPS configuration template included

## 📊 Monitoring

### Check Service Health
```bash
# Check all container status
bun run docker:health

# Check specific service health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f gateway
docker-compose logs -f auth-service
```

### Resource Usage
```bash
# View resource usage
docker stats

# View detailed container info
docker inspect raddigo-gateway-dev
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Stop existing services
   bun run docker:dev:stop
   # Or kill processes using the ports
   lsof -ti:3001,3002,3003,3004 | xargs kill -9
   ```

2. **Database Connection Issues:**
   - Verify environment variables in `.env`
   - Check if database is accessible from containers
   - Ensure VPN is connected if using remote database

3. **Build Failures:**
   ```bash
   # Clean Docker cache
   bun run docker:prune
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Permission Issues:**
   ```bash
   # Fix file permissions
   chmod +x apps/*/index.ts
   ```

### Debugging

1. **Enter a running container:**
   ```bash
   docker exec -it raddigo-gateway-dev /bin/sh
   ```

2. **Check container logs:**
   ```bash
   docker logs raddigo-gateway-dev -f
   ```

3. **Inspect network:**
   ```bash
   docker network inspect raddigo-dev-network
   ```

## 🔒 Security Considerations

### Development
- Environment variables are mounted from `.env`
- Services run with elevated privileges for debugging

### Production
- Services run as non-root users
- Resource limits enforced
- Nginx provides additional security layer
- SSL/HTTPS configuration available
- Rate limiting and security headers configured

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale specific services
docker-compose up --scale auth-service=3 --scale category-service=2

# Load balancing handled by Nginx in production
```

### Vertical Scaling
Edit resource limits in `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '1.0'
```

## 🚀 Deployment

### Local Production Test
```bash
# Build and run production environment locally
bun run docker:prod
```

### Cloud Deployment
1. Push images to container registry
2. Use `docker-compose.prod.yml` as base for orchestration
3. Configure external load balancer
4. Set up monitoring and logging

---

## Need Help?

- Check container status: `bun run docker:health`
- View logs: `bun run docker:dev:logs`
- Clean reset: `bun run docker:dev:clean && bun run docker:dev`