# 🚀 RaddiGo - Revolutionizing Scrap Collection in Pakistan

<div align="center">

![RaddiGo Banner](https://img.shields.io/badge/RaddiGo-Scrap_Marketplace-green?style=for-the-badge)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

**A Final Year Project by Government College of Science, Wahdat Road, Lahore**

[Features](#-features) • [Installation](#-installation) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🔴 The Problem: "The Raddi-wala Timing Struggle"

### The Desi Reality

In Pakistan, every household faces this daily frustration:

- 📰 **The Wait**: We hoard old newspapers, plastic bottles, cardboard, and broken electronics, waiting for the *Raddi-wala* (scrap collector)
- 🔊 **The Miss**: You hear his iconic call *"Raddi walaaa!"* from the street, but by the time you rush to the gate - he's gone!
- 😴 **The Bad Timing**: He arrives when you're sleeping, at work, or busy
- 💰 **The Uncertainty**: No transparency in pricing - dealers often underweigh or underpay
- 📍 **The Search**: No way to contact or schedule pickups with collectors

> **Result**: Trash piles up, valuable recyclables go to waste, and collectors miss potential earnings.

---

## ✅ The Solution: RaddiGo

**An Uber-like marketplace connecting households with scrap collectors in real-time.**

### How It Works

#### For Households 🏠
1. **Post Your Scrap**: Take photos of newspapers, plastic, iron, electronics
2. **Set Location**: Mark your address in Gulberg, Model Town, DHA, etc.
3. **Get Offers**: Receive real-time bids from nearby collectors
4. **Schedule Pickup**: Choose your preferred time and collector
5. **Fair Pricing**: See live market rates (Iron @ Rs. 200/kg today)

#### For Raddi-walas (Collectors) ♻️
1. **Receive Notifications**: Get alerted about nearby scrap postings
2. **View Details**: See photos, quantity estimates, and location
3. **Accept Jobs**: Navigate to the house using built-in maps
4. **Earn More**: Access more customers, optimize routes, maximize earnings
5. **Digital Payments**: Receive payments through the app

#### The Twist 🎯
- **Live Market Rates**: Real-time scrap prices (updated daily)
- **No Haggling**: Transparent pricing based on weight and current rates
- **Verified Weights**: Digital scale integration (optional)
- **Ratings & Reviews**: Trust-based system for both parties
- **Urdu/Punjabi Support**: Simple interface for local collectors

---

## ✨ Features

### 🏠 Customer Features
- 📸 **Photo Upload**: Capture and post scrap items with descriptions
- 📍 **Geolocation**: Automatic address detection and manual location setting
- 💵 **Price Calculator**: Estimate earnings based on live market rates
- 🔔 **Real-time Notifications**: Get alerts when collectors respond
- ⭐ **Rating System**: Review and rate collectors
- 📅 **Scheduling**: Set preferred pickup times
- 💬 **In-app Chat**: Communicate directly with collectors
- 📊 **Dashboard**: Track earnings and pickup history

### ♻️ Collector Features
- 🗺️ **Route Optimization**: Find nearby scrap postings
- 📱 **Simple UI**: Easy-to-use interface with Urdu/Punjabi support
- 🔔 **Push Notifications**: Instant alerts for new postings
- 💰 **Earnings Tracker**: Monitor daily/weekly/monthly income
- 🚗 **Navigation**: Built-in maps to customer locations
- ⚖️ **Digital Scale Integration**: Fair weight measurement
- 👥 **Customer Management**: Build trusted customer base
- 📈 **Analytics**: Track performance and optimize routes

### 🔐 Security & Trust
- ✅ **Verified Users**: Phone/CNIC verification
- 🛡️ **Secure Payments**: Integrated payment gateway
- 🔒 **Data Privacy**: Encrypted communication
- ⚖️ **Dispute Resolution**: Built-in complaint system
- 📜 **Terms Compliance**: Legal protection for both parties

---

## 🛠 Tech Stack

### Backend (This Repository)
- **Runtime**: [Bun](https://bun.sh) - Ultra-fast JavaScript runtime
- **Language**: TypeScript (Strict mode)
- **Database**: MySQL 8.x - Relational data storage
- **Cache**: Redis - Session management and real-time data
- **WebSockets**: Bun native WebSocket - Real-time chat and notifications
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with Gmail SMTP

### Frontend (Separate Repositories)
- **Mobile App**: React Native (iOS & Android)
- **Web Dashboard**: React.js + TypeScript
- **State Management**: Redux Toolkit
- **Maps**: Google Maps API
- **Real-time**: Socket.io Client

### DevOps & Tools
- **Version Control**: Git + GitHub
- **API Testing**: Postman
- **Code Quality**: ESLint + Prettier
- **Deployment**: Docker + AWS/Heroku

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        RaddiGo System                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────┐
│  React Native │   │   React Web      │   │   Admin      │
│  Mobile App   │   │   Dashboard      │   │   Panel      │
└───────────────┘   └──────────────────┘   └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                      ┌───────▼────────┐
                      │  API Gateway   │
                      │  (Bun Server)  │
                      └───────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────┐
│  WebSocket    │   │      MySQL       │   │    Redis     │
│  Server       │   │    Database      │   │    Cache     │
└───────────────┘   └──────────────────┘   └──────────────┘
```

### System Components

1. **API Server**: RESTful API with Bun.serve
2. **WebSocket Server**: Real-time chat and notifications
3. **Database Layer**: MySQL for persistent storage
4. **Cache Layer**: Redis for sessions and real-time data
5. **Authentication**: JWT-based auth system
6. **Email Service**: Nodemailer for OTP and notifications

---

## 📦 Installation

### Prerequisites

- [Bun](https://bun.sh) v1.3.3 or higher
- MySQL 8.x
- Redis 7.x
- Node.js (for tooling)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/raddigo.git
cd raddigo
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#-environment-variables))

### Step 4: Setup Database

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE RADDIGO;

# Run migrations (if available)
bun run migrate
```

### Step 5: Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or using local Redis
redis-server
```

### Step 6: Run the Server

```bash
# Development mode with auto-reload
bun run dev

# Production mode
bun start
```

The server will start on `http://localhost:3000`

---

## 🔐 Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=RADDIGO
DB_USER=root
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
SOCKET_PORT=3001

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP)
NODEMAILER_USER=your_email@gmail.com
NODEMAILER_PASS=your_app_password
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### Setting Up Gmail SMTP

1. Enable 2-Factor Authentication in your Google Account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the generated password in `NODEMAILER_PASS`

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "password": "SecurePass123",
  "phone": "+923001234567",
  "role": "customer" | "collector"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "SecurePass123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "otp": "123456"
}
```

### Category Endpoints

#### Get All Categories
```http
GET /api/categories
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "name": "Newspaper",
    "nameUrdu": "اخبار",
    "pricePerKg": 200,
    "icon": "📰"
  }
]
```

### Scrap Posting Endpoints

#### Create Scrap Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "categoryId": 1,
  "quantity": 10,
  "unit": "kg",
  "description": "Old newspapers",
  "images": [File, File],
  "location": {
    "lat": 31.5497,
    "lng": 74.3436,
    "address": "Gulberg, Lahore"
  }
}
```

---

## 🔌 WebSocket Events

### Connection

```javascript
// Connect to chat
const chatSocket = new WebSocket('ws://localhost:3000/ws/chat');

// Connect to notifications
const notifSocket = new WebSocket('ws://localhost:3000/ws/notifications');
```

### Chat Events

#### Client → Server
```javascript
// Join chat room
ws.send(JSON.stringify({
  type: 'join',
  roomId: 'post_123',
  userId: 'user_456'
}));

// Send message
ws.send(JSON.stringify({
  type: 'message',
  roomId: 'post_123',
  message: 'What is your final price?',
  timestamp: Date.now()
}));
```

#### Server → Client
```javascript
// Receive message
{
  type: 'message',
  userId: 'user_789',
  username: 'Collector Ali',
  message: 'Rs. 200 per kg',
  timestamp: 1234567890
}
```

### Notification Events

```javascript
// New scrap post notification
{
  type: 'new_post',
  postId: 123,
  category: 'Newspaper',
  distance: '2.5 km',
  estimatedPrice: 2000
}

// Pickup accepted
{
  type: 'pickup_accepted',
  collectorName: 'Ali Raddi Wala',
  eta: '15 minutes'
}
```

---

## 📁 Project Structure

```
raddigo/
├── src/
│   ├── config/
│   │   ├── sqldb.ts           # MySQL connection
│   │   └── redis.ts           # Redis connection
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── post.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── post.model.ts
│   │   └── category.model.ts
│   ├── routes/
│   │   ├── auth.route.ts
│   │   └── category.route.ts
│   ├── socketControllers/
│   │   ├── chat.controller.ts
│   │   └── notification.controller.ts
│   ├── services/
│   │   ├── email.service.ts
│   │   └── location.service.ts
│   └── utils/
│       ├── jwt.util.ts
│       └── validators.util.ts
├── index.ts                   # Main server file
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

---

## 🗄 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  role ENUM('customer', 'collector', 'admin') DEFAULT 'customer',
  verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  name_urdu VARCHAR(100),
  price_per_kg DECIMAL(10,2) NOT NULL,
  icon VARCHAR(10),
  active BOOLEAN DEFAULT TRUE
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  description TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  address TEXT,
  status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Reporting Bugs
- Use GitHub Issues
- Provide detailed description
- Include steps to reproduce

### Feature Requests
- Explain the use case
- Describe expected behavior
- Consider implementation complexity

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use meaningful variable names
- Add comments for complex logic
- Write unit tests for new features

---

## 👥 Team

**Government College of Science, Wahdat Road, Lahore**  
**Final Year Project - Computer Science Department**

- **Nauman** - Lead Developer
- **Supervisor**: [Your Supervisor's Name]
- **Department**: Computer Science

---

## 📄 License

This project is part of a Final Year Project (FYP) for academic purposes.

**Copyright © 2024 RaddiGo Team**

---

## 🙏 Acknowledgments

- Government College of Science, Lahore
- Local Raddi-walas who inspired this solution
- Open source community for amazing tools
- Our families for their support

---

## 🌟 Future Roadmap

- [ ] AI-based price prediction
- [ ] Multi-language support (Urdu, Punjabi, Sindhi)
- [ ] Bulk collection scheduling
- [ ] Corporate partnerships
- [ ] Carbon credit tracking
- [ ] Social impact metrics
- [ ] Offline mode support
- [ ] Blockchain-based transactions

---

## 📞 Contact

- **Project Email**: raddigo@example.com
- **GitHub**: [github.com/yourusername/raddigo](https://github.com/yourusername/raddigo)
- **Website**: Coming Soon

---

<div align="center">

**Made with ❤️ in Pakistan 🇵🇰**

*Transforming waste into opportunity, one pickup at a time.*

</div>
