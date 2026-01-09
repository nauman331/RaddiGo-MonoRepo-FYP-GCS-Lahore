🚀 RaddiGo - Microservices Monorepo for Scrap Collection in Pakistan
# RaddiGo (Microservices)

<div align="center">

![RaddiGo Banner](https://img.shields.io/badge/RaddiGo-Scrap_Marketplace-green?style=for-the-badge)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

**A Final Year Project by Government College of Science, Wahdat Road, Lahore**

[Services](#-services) • [Installation](#-installation) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

This repository is a monorepo of small backend microservices that together form the RaddiGo platform. The architecture has been refactored from a single monolith to a set of focused services (auth, categories, orders, gateway, sockets, and shared packages). Each service runs independently and communicates via HTTP and WebSockets where applicable.

This README documents the overall repo layout, how to run services locally, and where to find each service's API documentation.

---

## 🔧 Services

- apps/gateway — API Gateway / reverse proxy and routing
- apps/auth-service — Authentication, registration, verification
- apps/category-service — Category and pricing management
- apps/order-service — Postings, orders, rides, sockets (real-time)
- apps/ThirdPartyservices — mail sender, push notifications, keys
- packages/config — Shared configuration, DB migrations
- packages/types — Shared TypeScript types
- utils — shared utilities used by multiple services

Each service contains its own `package.json`, `.env` expectations and scripts. Treat services as independently runnable Node/Bun apps.

---

## 🏗 Architecture (microservices)

```
Clients (Mobile / Web / Admin)
        |
        ▼
   API Gateway (apps/gateway)
        |
  ┌─────┴────────┐
  │              │
  ▼              ▼
Auth Service  Category Service   Order Service  ThirdParty (mail/push)
...(apps/auth)   (apps/category)    (apps/order)   (apps/ThirdPartyservices)
  │              │                 │
  └──────────┬───┴────────────┬────┘
             │                │
          Shared Packages (packages/*) 
             │                │
         MySQL Databases   Redis Cache / PubSub
```

Notes:
- Services own their APIs and data models. Some services may share a single MySQL instance but keep separate schemas/tables.
- Real-time features (chat/notifications) live in the order-service and dedicated socket controllers.

---

## 📦 Installation (local development)

Prerequisites:
- Bun v1.3.3 or higher
- MySQL 8.x
- Redis 6/7
- Git

1. Clone the repo

```bash
git clone https://github.com/yourusername/raddigo.git
cd RaddiGo-MonoRepo-FYP-GCS-Lahore
```

2. Install dependencies

Install dependencies for the whole workspace or per-service. From the repo root you can install across packages, or run per-service installs:

```bash
# install at root (if you maintain a root-level install)
bun install

# Or per service (recommended for isolated work):
cd apps/auth-service && bun install
cd ../category-service && bun install
cd ../order-service && bun install
```

3. Configure environment variables

Each service reads its own `.env` (see each service folder for `.env.example`). Create and edit per-service `.env` files.

4. Start infrastructure

```bash
# Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# MySQL (example Docker)
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass mysql:8
```

5. Run services

Start services individually (example):

```bash
# API Gateway
cd apps/gateway && bun run dev

# Auth service
cd ../auth-service && bun run dev

# Category service
cd ../category-service && bun run dev

# Order service (includes sockets)
cd ../order-service && bun run dev
```

Tip: Use a process manager (tmux, iTerm panes, or a dev tool) to run multiple services concurrently. You may also create a root-level script to start a local dev environment.

---

## 🔐 Environment variables

Each service exposes an `.env.example` in its folder. Common variables used across services include:

- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (per-service DB or shared)
- REDIS_URL (redis://localhost:6379)
- JWT_SECRET_KEY, JWT_EXPIRES_IN
- NODEMAILER_USER, NODEMAILER_PASS (Third party mail)
- PORT (service-specific)

Example (service `.env`):

```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=raddigo_auth
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=supersecret
```

Check each service folder for more details.

---

## 📚 API Documentation

Each service documents its own endpoints in its folder (check `apps/<service>`). Example service base URLs when running locally (adjust ports in each service `.env`):

- Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Category Service: http://localhost:3002
- Order Service: http://localhost:3003

Example: Register (Auth service)

```
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "password": "SecurePass123",
  "phone": "+923001234567",
  "role": "customer"
}
```

Example: Get categories (Category service)

```
GET http://localhost:3002/api/categories
Authorization: Bearer <token>
```

Refer to each service's controllers and route files for full API details. Key files:

- [apps/auth-service/auth.route.ts](apps/auth-service/auth.route.ts)
- [apps/category-service/category.route.ts](apps/category-service/category.route.ts)
- [apps/order-service/rides.controller.ts](apps/order-service/rides.controller.ts)

---

## 🔌 WebSocket & Real-time

Real-time chat and notifications are implemented in the `order-service` and shared socket controllers. Connect to the sockets using the service's WebSocket endpoint (see `apps/order-service/socket.ts` or `socketControllers`):

Client examples:

```javascript
const chatSocket = new WebSocket('ws://localhost:3003/ws/chat');
const notifSocket = new WebSocket('ws://localhost:3003/ws/notifications');
```

Event schemas are similar to the previous monolith; check `apps/order-service/socketControllers` for server-side handlers.

---

## 📁 Project Structure (top-level)

```
/apps
  /auth-service
  /category-service
  /gateway
  /order-service
  /ThirdPartyservices
/packages
  /config
  /types
utils/
socketControllers/
README.md
```

Open individual service folders to see service-specific source layout and `.env.example` files.

---

## 🧪 Running Tests & Migrations

- Migrations are kept under `packages/config/mysqlMigrations` and service-level migrations may exist. Run migrations per service according to each service's scripts.
- Tests (if present) are located per-service. Run `bun test` or the service-specific test script.

---

## 🤝 Contributing

- Report issues via GitHub Issues
- Open PRs against feature branches
- Follow TypeScript style and add tests for new behavior

When making changes across services, document cross-service contract changes (API, types) and update `packages/types` accordingly.

---

## 👥 Team

- **Nauman** - Lead Developer

---

## 📄 License

This project is part of a Final Year Project (FYP) for academic purposes.

**Copyright © 2024 RaddiGo Team**

---

Made with ❤️ in Pakistan 🇵🇰

This project was initialized using `bun init` and uses Bun for development and runtime.