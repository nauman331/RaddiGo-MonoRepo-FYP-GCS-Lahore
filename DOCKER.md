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

The repository now uses one compose file for both local and deployed runs.

1. **Start the stack in detached mode:**
   ```bash
   bun run docker:prod
   ```

2. **Stop the stack:**
   ```bash
   bun run docker:prod:stop
   ```

## 📁 Docker Architecture

### Services Overview

- **Auth Service** (Port 3002): User authentication and authorization
- **Category Service** (Port 3003): Category management
- **Order Service** (Port 3004): Order management with WebSocket support
- **Nginx** (Port 80/443): Public reverse proxy and edge layer

### Health Checks

All services include health check endpoints via nginx (public):
- Nginx: `http://localhost/health`
- Auth: `http://localhost/auth/health`
- Category: `http://localhost/category/health`
- Order: `http://localhost/order/health`

## 🛠 Available Scripts

All services include health check endpoints (via nginx):
- Auth: `http://localhost/auth/health`
- Category: `http://localhost/category/health`
- Order: `http://localhost/order/health`
| `bun run docker:dev:stop` | Stop development environment |
| `bun run docker:dev:clean` | Clean up (remove containers, volumes, images) |
| `bun run docker:prod` | Start production environment |
| `bun run docker:prod:stop` | Stop production environment |
docker compose -f docker-compose.yml logs -f

# Specific service (nginx, auth, category, order)
docker compose -f docker-compose.yml logs -f nginx
docker compose -f docker-compose.yml logs -f auth-service
docker compose -f docker-compose.yml logs -f order-service
| `bun run docker:build` | Build all images |
| `bun run docker:build:prod` | Build production images |
| `bun run docker:health` | Check container health |
| `bun run docker:prune` | Clean up Docker system |

## 🏗 Development Features

- **Hot Reload**: Changes to your code are automatically reflected
curl http://localhost/health
curl http://localhost/auth/health
curl http://localhost/category/health
curl http://localhost/order/health

## 🚀 Production Features

   ```bash
   docker exec -it raddigo-auth-dev /bin/sh
   ```
- **Security**: Non-root users and security headers
- **Load Balancing**: Nginx reverse proxy remains available
   ```bash
   docker logs raddigo-nginx -f
   ```

### Check Service Health
```bash
# Check all container status
bun run docker:health

# Check specific service health (via nginx)
curl http://localhost/health
curl http://localhost/auth/health
curl http://localhost/category/health
curl http://localhost/order/health
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nginx
docker-compose logs -f auth-service
```

### Resource Usage
```bash
# View resource usage
docker stats

# View detailed container info
docker inspect raddigo-auth-dev
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
   docker exec -it raddigo-auth-dev /bin/sh
   ```

2. **Check container logs:**
   ```bash
   docker logs raddigo-nginx -f
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

**Enter a running container:**
    ```bash
    docker exec -it raddigo-auth-dev /bin/sh
    ```
# Scale specific services
**Check container logs:**
    ```bash
    docker logs raddigo-nginx -f
    ```

### Vertical Scaling
Edit resource limits in `docker-compose.yml`:
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
2. Use `docker-compose.yml` as the single orchestration file
3. Configure external load balancer if needed
4. Set up monitoring and logging

---

## Need Help?

- Check container status: `bun run docker:health`
- View logs: `bun run docker:dev:logs`
- Clean reset: `bun run docker:dev:clean && bun run docker:dev`