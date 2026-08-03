# 📱 RaddiGo — Complete Mobile App API & WebSocket Specification

Exhaustive, production-ready integration reference for building the **RaddiGo Customer App** and **Collector/Driver App**.

---

## 📌 Table of Contents

1. [Base Configuration & Headers](#1-base-configuration--headers)
2. [Authentication & Profile APIs](#2-authentication--profile-apis)
3. [Categories & Market Rates API](#3-categories--market-rates-api)
4. [In-App Wallet & Transactions API](#4-in-app-wallet--transactions-api)
5. [Order REST APIs](#5-order-rest-apis)
6. [Real-Time WebSocket Protocol (Rides & Bidding)](#6-real-time-websocket-protocol-rides--bidding)
   - [6.1 Connection & Envelope Standard](#61-connection--envelope-standard)
   - [6.2 Driver GPS Updates](#62-driver-gps-updates)
   - [6.3 Order Placement](#63-order-placement)
   - [6.4 Bidding & Negotiation Flow](#64-bidding--negotiation-flow)
   - [6.5 Pickup & Order Completion (Wallet Transfer)](#65-pickup--order-completion-wallet-transfer)
   - [6.6 Live Driver Tracking](#66-live-driver-tracking)
7. [Foodpanda-Style Live Order Chat Protocol](#7-foodpanda-style-live-order-chat-protocol)
8. [Push Notifications Payload Index (FCM)](#8-push-notifications-payload-index-fcm)
9. [Complete WebSocket Event Summary Table](#9-complete-websocket-event-summary-table)

---

## 1. Base Configuration & Headers

| Service | Protocol | Nginx Gateway URL | Direct Port |
|---|---|---|---|
| **API Gateway** | HTTP / WS | `http://localhost` | Port 80 |
| **Auth & Wallet** | HTTP | `http://localhost/auth/api/v1` & `/wallet/api/v1` | Port 3002 |
| **Categories** | HTTP | `http://localhost/category/api/v1` | Port 3003 |
| **Order REST** | HTTP | `http://localhost/order/api/v1` | Port 3004 |
| **WebSockets** | WS | `ws://localhost/order/ws` | Port 3004 |

### Standard Request Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 2. Authentication & Profile APIs

### 2.1 Register User
- **Method & Route**: `POST /auth/api/v1/register`
- **Request Body**:
```json
{
  "username": "Ali Customer",
  "email": "ali@example.com",
  "password": "Password123!",
  "phone": "+923001234567",
  "address": "Gulberg III, Lahore",
  "role": "customer"  // Options: "customer" (Customer App) | "collector" (Driver App)
}
```
- **Response** (`201 Created`):
```json
{
  "message": "User registered successfully. Verification email sent.",
  "userId": 5
}
```

### 2.2 Verify Email OTP
- **Method & Route**: `POST /auth/api/v1/verify-email`
- **Request Body**:
```json
{
  "email": "ali@example.com",
  "otp": "123456"
}
```
- **Response** (`200 OK`): `{ "message": "Email verified successfully" }`

### 2.3 Resend Verification Email
- **Method & Route**: `POST /auth/api/v1/resend-verification-email`
- **Request Body**: `{ "email": "ali@example.com" }`

### 2.4 Login
- **Method & Route**: `POST /auth/api/v1/login`
- **Request Body**:
```json
{
  "email": "ali@example.com",
  "password": "Password123!"
}
```
- **Response** (`200 OK`):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "username": "Ali Customer",
    "email": "ali@example.com",
    "phone": "+923001234567",
    "role": "customer",
    "isVerified": true
  }
}
```

### 2.5 Register FCM Device Token (Call immediately after Login)
- **Method & Route**: `PUT /auth/api/v1/me/fcm-token` (Auth Required)
- **Request Body**:
```json
{
  "fcmToken": "FIREBASE_OR_EXPO_FCM_DEVICE_TOKEN"
}
```
- **Response** (`200 OK`): `{ "message": "FCM token updated successfully" }`

### 2.6 Get Own Profile
- **Method & Route**: `GET /auth/api/v1/me` (Auth Required)
- **Response** (`200 OK`):
```json
{
  "user": {
    "id": 5,
    "username": "Ali Customer",
    "email": "ali@example.com",
    "phone": "+923001234567",
    "address": "Gulberg III, Lahore",
    "role": "customer",
    "profilePicture": null,
    "isVerified": true,
    "createdAt": "2026-08-03T10:00:00.000Z"
  }
}
```

### 2.7 Update Profile
- **Method & Route**: `PUT /auth/api/v1/me/update` (Auth Required)
- **Request Body**:
```json
{
  "username": "Ali Customer Updated",
  "phone": "+923009876543",
  "address": "DHA Phase 5, Lahore",
  "profilePicture": "https://cdn.example.com/avatar.png"
}
```

### 2.8 Reset Password
- **Method & Route**: `POST /auth/api/v1/reset-password`
- **Request Body**:
```json
{
  "email": "ali@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

### 2.9 Delete Account
- **Method & Route**: `DELETE /auth/api/v1/me/delete` (Auth Required)

---

## 3. Categories & Market Rates API

### 3.1 Fetch All Categories & Prices
- **Method & Route**: `GET /category/api/v1/categories?page=1&limit=20` (Public / Redis Cached)
- **Response** (`200 OK`):
```json
{
  "categories": [
    {
      "id": 1,
      "nameEng": "Paper & Cardboard",
      "nameUrdu": "کاغذ اور گتا",
      "todayPrice": 45.00,
      "categoryLogo": "https://cdn.example.com/paper.png"
    },
    {
      "id": 2,
      "nameEng": "Plastic Scrap",
      "nameUrdu": "پلاسٹک",
      "todayPrice": 60.00,
      "categoryLogo": "https://cdn.example.com/plastic.png"
    },
    {
      "id": 3,
      "nameEng": "Iron & Metals",
      "nameUrdu": "لوہا",
      "todayPrice": 120.00,
      "categoryLogo": "https://cdn.example.com/iron.png"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

---

## 4. In-App Wallet & Transactions API

> **Automatic Payment Transfer**: When an order is completed by the Collector, the agreed amount is automatically debited from the Collector's wallet and credited to the Customer's wallet atomically in the DB.

### 4.1 Get Wallet Balance & Transactions
- **Method & Route**: `GET /wallet/api/v1` (Auth Required)
- **Response** (`200 OK`):
```json
{
  "wallet": {
    "id": 5,
    "user_id": 5,
    "balance": "2450.00",
    "updated_at": "2026-08-03T12:00:00Z"
  },
  "transactions": [
    {
      "id": 101,
      "user_id": 5,
      "type": "deposit",         // "deposit" | "withdrawal"
      "amount": "1250.00",
      "status": "approved",       // "pending" | "approved" | "rejected"
      "note": "Scrap payment for Order #15",
      "transaction_id": "ORDER-15-CREDIT",
      "created_at": "2026-08-03T11:45:00Z"
    }
  ]
}
```

### 4.2 Request Wallet Deposit (Bank / JazzCash / EasyPaisa)
- **Method & Route**: `POST /wallet/api/v1/deposit` (Auth Required)
- **Request Body**:
```json
{
  "amount": 2000,
  "senderAccount": "03001234567",
  "transactionId": "TID9876543210"
}
```
- **Response** (`200 OK`): `{ "message": "Deposit request submitted. Pending admin approval." }`

### 4.3 Request Wallet Withdrawal
- **Method & Route**: `POST /wallet/api/v1/withdraw` (Auth Required)
- **Request Body**:
```json
{
  "amount": 1000,
  "bankName": "JazzCash",
  "accountNo": "03001234567",
  "accountTitle": "Ali Customer"
}
```
- **Response** (`200 OK`): `{ "message": "Withdrawal request submitted. Pending admin approval." }`

---

## 5. Order REST APIs

### 5.1 Customer: My Orders List
- **Method & Route**: `GET /order/api/v1/my-orders?status=pending&page=1&limit=10` (Auth Required)
- **QueryParams**: `status` (`pending` | `bidding` | `accepted` | `in_progress` | `completed` | `cancelled`), `page`, `limit`
- **Response** (`200 OK`):
```json
{
  "orders": [
    {
      "id": 15,
      "customerId": 5,
      "collectorId": 8,
      "categoryId": 2,
      "status": "accepted",
      "pickupLatitude": "31.52040000",
      "pickupLongitude": "74.35870000",
      "pickupAddress": "Gulberg III, Lahore",
      "scheduleTime": "2026-08-03T14:00:00.000Z",
      "approximateRaddiInKg": "25.00",
      "expectedPrice": "1200.00",
      "finalPrice": "1300.00",
      "categoryName": "Plastic Scrap",
      "collectorName": "Mike Collector",
      "collectorPhone": "+923001112233",
      "bids": [
        {
          "id": 101,
          "order_id": 15,
          "collector_id": 8,
          "bid_amount": "1300.00",
          "counter_amount": null,
          "status": "accepted",
          "round": 1,
          "collectorName": "Mike Collector"
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

### 5.2 Collector: My Assigned Pickups
- **Method & Route**: `GET /order/api/v1/my-pickups?status=accepted&page=1&limit=10` (Auth Required)

### 5.3 Collector: Browse Available Orders Nearby
- **Method & Route**: `GET /order/api/v1/available?page=1&limit=20` (Auth Required)
- **QueryParams**: `categoryId` (optional), `page`, `limit`

### 5.4 Order Details with Bids & Chat History
- **Method & Route**: `GET /order/api/v1/:id` (Auth Required)
- **Response** (`200 OK`):
```json
{
  "order": {
    "id": 15,
    "customerId": 5,
    "collectorId": 8,
    "categoryId": 2,
    "status": "accepted",
    "pickupLatitude": "31.52040000",
    "pickupLongitude": "74.35870000",
    "pickupAddress": "Gulberg III, Lahore",
    "approximateRaddiInKg": "25.00",
    "expectedPrice": "1200.00",
    "finalPrice": "1300.00",
    "customerName": "Ali Customer",
    "customerPhone": "+923001234567",
    "collectorName": "Mike Collector",
    "collectorPhone": "+923001112233",
    "bids": [ ... ],
    "chats": [ ... ]
  }
}
```

### 5.5 Get Chat History via HTTP
- **Method & Route**: `GET /order/api/v1/:id/messages` (Auth Required)

### 5.6 Cancel Order
- **Method & Route**: `POST /order/api/v1/:id/cancel` (Auth Required)
- **Request Body**: `{ "reason": "No longer available" }`

---

## ⚡ 6. Real-Time WebSocket Protocol (Rides & Bidding)

### 6.1 Connection & Envelope Standard

- **WebSocket URL**: `ws://localhost/order/ws`
- **Envelope Standard**: All messages sent and received MUST follow this JSON envelope:

```json
{
  "event": "EVENT_NAME",
  "data": { ... }
}
```

---

### 📡 6.2 Driver GPS Updates (Collector App)

Collectors send GPS coordinates periodically (every 5-10 sec). This indexes them in Redis GEOADD and streams live updates to customers during active pickups.

**Client ➔ Server (`driverLocationUpdate`)**:
```json
{
  "event": "driverLocationUpdate",
  "data": {
    "driverId": 8,
    "latitude": 31.5204,
    "longitude": 74.3587
  }
}
```

**Server ➔ Client (`locationUpdated`)**:
```json
{
  "event": "locationUpdated",
  "data": { "success": true, "driverId": 8 }
}
```

---

### 🛒 6.3 Order Placement (Customer App)

Customer posts a scrap pickup order.

**Client ➔ Server (`createOrder`)**:
```json
{
  "event": "createOrder",
  "data": {
    "customerId": 5,
    "categoryId": 2,
    "pickupLatitude": 31.5204,
    "pickupLongitude": 74.3587,
    "pickupAddress": "Gulberg III, Lahore",
    "approximateRaddiInKg": 25.0,
    "expectedPrice": 1200.00,
    "scheduleTime": "2026-08-03T14:00:00.000Z"
  }
}
```

**Server ➔ Customer (`orderCreated`)**:
```json
{
  "event": "orderCreated",
  "data": {
    "success": true,
    "orderId": 15,
    "nearbyDriverCount": 4,
    "message": "Order created. 4 collectors notified."
  }
}
```

**Server ➔ Nearby Collectors (`newOrderAvailable` + FCM Push Notification)**:
```json
{
  "event": "newOrderAvailable",
  "data": {
    "orderId": 15,
    "customerId": 5,
    "pickupLatitude": 31.5204,
    "pickupLongitude": 74.3587,
    "pickupAddress": "Gulberg III, Lahore",
    "approximateRaddiInKg": 25.0,
    "expectedPrice": 1200.00,
    "categoryId": 2,
    "scheduleTime": "2026-08-03T14:00:00.000Z"
  }
}
```

---

### 💰 6.4 Bidding & Negotiation Flow

```
Customer App                      Collector App
     │                                  │
     │◄─── placeBid ────────────────────│ (newBidReceived + Push)
     │─── acceptBid ───────────────────>│ (bidAccepted + Push) ➔ ACCEPTED
     │              OR                  │
     │─── counterBid ──────────────────>│ (bidCountered + Push)
     │◄── acceptCounter ────────────────│ (counterAccepted + Push) ➔ ACCEPTED
```

#### Step 1: Collector Places Bid
**Client ➔ Server (`placeBid`)**:
```json
{
  "event": "placeBid",
  "data": {
    "orderId": 15,
    "collectorId": 8,
    "bidAmount": 1350.00,
    "note": "Can pick up within 20 minutes"
  }
}
```

**Server ➔ Collector (`bidPlaced`)**:
```json
{
  "event": "bidPlaced",
  "data": { "success": true, "bidId": 101, "orderId": 15, "bidAmount": 1350.00 }
}
```

**Server ➔ Customer (`newBidReceived` + FCM Push Notification)**:
```json
{
  "event": "newBidReceived",
  "data": {
    "orderId": 15,
    "bidId": 101,
    "collectorId": 8,
    "collectorName": "Mike Collector",
    "collectorPhone": "+923001112233",
    "bidAmount": 1350.00,
    "round": 1,
    "note": "Can pick up within 20 minutes"
  }
}
```

#### Step 2: Customer Accepts Bid
**Client ➔ Server (`acceptBid`)**:
```json
{
  "event": "acceptBid",
  "data": { "orderId": 15, "bidId": 101 }
}
```

**Server ➔ Accepting Collector (`bidAccepted` + FCM Push Notification)**:
```json
{
  "event": "bidAccepted",
  "data": {
    "orderId": 15,
    "bidId": 101,
    "finalPrice": 1350.00,
    "message": "Your bid was accepted! Head to the pickup location.",
    "order": {
      "pickupLatitude": 31.5204,
      "pickupLongitude": 74.3587,
      "pickupAddress": "Gulberg III, Lahore",
      "approximateRaddiInKg": 25.0
    }
  }
}
```

**Server ➔ Other Bidding Collectors (`bidRejected`)**:
```json
{
  "event": "bidRejected",
  "data": { "orderId": 15, "message": "Another bid was accepted for this order." }
}
```

#### Step 3 (Alternative): Customer Counter-Bids
**Client ➔ Server (`counterBid`)**:
```json
{
  "event": "counterBid",
  "data": {
    "orderId": 15,
    "bidId": 101,
    "counterAmount": 1250.00
  }
}
```

**Server ➔ Collector (`bidCountered` + FCM Push Notification)**:
```json
{
  "event": "bidCountered",
  "data": {
    "orderId": 15,
    "bidId": 101,
    "originalBid": 1350.00,
    "counterAmount": 1250.00,
    "customerName": "Ali Customer",
    "message": "Customer countered your bid of PKR 1350 with PKR 1250"
  }
}
```

#### Step 4: Collector Accepts Counter-Bid
**Client ➔ Server (`acceptCounter`)**:
```json
{
  "event": "acceptCounter",
  "data": { "orderId": 15, "bidId": 101 }
}
```

**Server ➔ Customer (`counterAccepted` + FCM Push Notification)**:
```json
{
  "event": "counterAccepted",
  "data": {
    "orderId": 15,
    "bidId": 101,
    "finalPrice": 1250.00,
    "collectorName": "Mike Collector",
    "collectorPhone": "+923001112233",
    "message": "Collector accepted your counter offer of PKR 1250!"
  }
}
```

---

### 🚚 6.5 Pickup & Order Completion (Wallet Transfer)

#### 1. Start Pickup (Collector App)
**Client ➔ Server (`startPickup`)**:
```json
{
  "event": "startPickup",
  "data": { "orderId": 15, "collectorId": 8 }
}
```

**Server ➔ Customer (`collectorEnRoute` + FCM Push Notification)**:
```json
{
  "event": "collectorEnRoute",
  "data": {
    "orderId": 15,
    "collectorId": 8,
    "message": "Your collector is on the way! Be ready with your scrap."
  }
}
```

#### 2. Complete Order & Transfer Payment (Collector App)
**Client ➔ Server (`completeOrder`)**:
```json
{
  "event": "completeOrder",
  "data": {
    "orderId": 15,
    "collectorId": 8,
    "actualRaddiInKg": 25.5
  }
}
```

- **Atomic Action**: `finalPrice` is debited from Collector's wallet and credited to Customer's wallet.
- **Server ➔ Customer (`orderCompleted` + FCM Push Notification)**:
```json
{
  "event": "orderCompleted",
  "data": {
    "orderId": 15,
    "finalPrice": 1250.00,
    "walletCredited": 1250.00,
    "message": "Order completed! PKR 1250 has been added to your wallet."
  }
}
```

- **Server ➔ Collector (`orderCompletedConfirmed`)**:
```json
{
  "event": "orderCompletedConfirmed",
  "data": {
    "success": true,
    "orderId": 15,
    "finalPrice": 1250.00,
    "message": "Order completed. PKR 1250 debited from your wallet."
  }
}
```

---

### 🛰️ 6.6 Live Driver Tracking (Customer App)

When an order is `in_progress`, the server automatically streams the driver's live GPS coordinates to the customer:

**Server ➔ Customer (`liveLocationUpdate`)**:
```json
{
  "event": "liveLocationUpdate",
  "data": {
    "orderId": 15,
    "collectorId": 8,
    "latitude": 31.5210,
    "longitude": 74.3590,
    "timestamp": 1785734700000
  }
}
```

---

## 💬 7. Foodpanda-Style Live Order Chat Protocol

Chat is active when an order status is `accepted` or `in_progress`.

### 7.1 Join Order Chat Room
**Client ➔ Server (`joinChat`)**:
```json
{
  "event": "joinChat",
  "data": { "orderId": 15, "userId": 5 }
}
```

**Server Response (`chatJoined`)**:
```json
{
  "event": "chatJoined",
  "data": {
    "orderId": 15,
    "roomId": "chat:15",
    "orderStatus": "accepted",
    "isChatActive": true
  }
}
```

### 7.2 Get Chat History
**Client ➔ Server (`getChatHistory`)**:
```json
{
  "event": "getChatHistory",
  "data": { "orderId": 15, "userId": 5 }
}
```

**Server Response (`chatHistory`)**:
```json
{
  "event": "chatHistory",
  "data": {
    "orderId": 15,
    "messages": [
      {
        "id": 1,
        "order_id": 15,
        "sender_id": 5,
        "senderName": "Ali Customer",
        "receiver_id": 8,
        "message": "Hello, I am standing near the main gate.",
        "is_read": true,
        "created_at": "2026-08-03T12:00:00.000Z"
      }
    ]
  }
}
```

### 7.3 Send Chat Message
**Client ➔ Server (`sendMessage`)**:
```json
{
  "event": "sendMessage",
  "data": {
    "orderId": 15,
    "senderId": 5,
    "receiverId": 8,
    "message": "I have brought the raddi to the parking area!"
  }
}
```

**Server ➔ Room (`newMessage`)**:
```json
{
  "event": "newMessage",
  "data": {
    "id": 2,
    "orderId": 15,
    "senderId": 5,
    "senderName": "Ali Customer",
    "receiverId": 8,
    "message": "I have brought the raddi to the parking area!",
    "is_read": false,
    "created_at": "2026-08-03T12:05:00.000Z"
  }
}
```
*(If the recipient is offline or has app in background, an FCM Push Notification `"💬 New message from Ali Customer"` is delivered automatically).*

### 7.4 Real-Time Typing Indicators
```json
// Start typing:
{ "event": "typing", "data": { "orderId": 15, "userId": 5 } }

// Stop typing:
{ "event": "stopTyping", "data": { "orderId": 15, "userId": 5 } }

// Recipient receives: "userTyping" and "userStoppedTyping"
```

### 7.5 Mark Messages Read
**Client ➔ Server (`markRead`)**:
```json
{ "event": "markRead", "data": { "orderId": 15, "readerId": 5 } }
```

**Server ➔ Room (`messagesMarkedRead`)**:
```json
{
  "event": "messagesMarkedRead",
  "data": { "orderId": 15, "readerId": 5 }
}
```

---

## 🔔 8. Push Notifications Payload Index (FCM)

Ensure mobile apps handle incoming background FCM notification payloads:

| Payload `data.type` | Trigger Condition | Notification Title & Body |
|---|---|---|
| `new_order` | Collector nearby when order is created | 🚛 **New Raddi Order Nearby!**<br>Pickup at Gulberg III, Lahore |
| `bid_received` | Customer receives a collector's bid | 💰 **New Bid Received**<br>Mike Collector bid PKR 1350 |
| `bid_accepted` | Collector bid accepted by customer | ✅ **Your Bid Was Accepted!**<br>Head to the pickup location |
| `counter_bid` | Collector receives customer counter-offer | 🔄 **Counter Offer Received**<br>Customer countered with PKR 1250 |
| `collector_en_route` | Customer notified collector started pickup | 🚗 **Collector On The Way!**<br>Be ready with your scrap |
| `order_completed` | Customer notified wallet credited | 🎉 **Order Completed!**<br>PKR 1250 added to your wallet |
| `order_cancelled` | Collectors notified order cancelled | ❌ **Order Cancelled**<br>Order cancelled by customer |
| `chat_message` | Offline/background user receives chat | 💬 **New message from Ali**<br>I am standing near the main gate |

---

## 📋 9. Complete WebSocket Event Summary Table

| Event Name | Direction | Originating App | Description |
|---|---|---|---|
| `driverLocationUpdate` | Client ➔ Server | Collector | Send driver GPS coordinates |
| `locationUpdated` | Server ➔ Client | Server | Confirmation of driver GPS save |
| `createOrder` | Client ➔ Server | Customer | Create scrap pickup request |
| `orderCreated` | Server ➔ Client | Server | Order creation confirmation to customer |
| `newOrderAvailable` | Server ➔ Client | Server | Broadcast order to nearby collectors |
| `placeBid` | Client ➔ Server | Collector | Bid PKR on an order |
| `bidPlaced` | Server ➔ Client | Server | Bid placement confirmation |
| `newBidReceived` | Server ➔ Client | Server | Notify customer of new bid |
| `acceptBid` | Client ➔ Server | Customer | Accept collector's bid |
| `bidAccepted` | Server ➔ Client | Server | Notify collector bid was accepted |
| `bidRejected` | Server ➔ Client | Server | Notify collector bid was rejected |
| `counterBid` | Client ➔ Server | Customer | Propose counter price to collector |
| `bidCountered` | Server ➔ Client | Server | Notify collector of counter offer |
| `acceptCounter` | Client ➔ Server | Collector | Accept customer's counter offer |
| `counterAccepted` | Server ➔ Client | Server | Notify customer counter was accepted |
| `rejectCounter` | Client ➔ Server | Collector | Reject customer's counter offer |
| `counterRejected` | Server ➔ Client | Server | Notify customer counter was rejected |
| `startPickup` | Client ➔ Server | Collector | Mark pickup started (`in_progress`) |
| `collectorEnRoute` | Server ➔ Client | Server | Notify customer collector is on the way |
| `liveLocationUpdate` | Server ➔ Client | Server | Real-time driver GPS stream to customer |
| `completeOrder` | Client ➔ Server | Collector | Mark order complete (triggers wallet transfer) |
| `orderCompleted` | Server ➔ Client | Server | Notify customer order complete & wallet credited |
| `orderCompletedConfirmed` | Server ➔ Client | Server | Confirm order complete & wallet debited |
| `cancelOrder` | Client ➔ Server | Customer | Cancel order before pickup |
| `orderCancelled` | Server ➔ Client | Server | Notify bidding collectors order cancelled |
| `joinChat` | Client ➔ Server | Customer / Collector | Join order chat room |
| `chatJoined` | Server ➔ Client | Server | Chat room joined confirmation |
| `getChatHistory` | Client ➔ Server | Customer / Collector | Fetch chat message history |
| `chatHistory` | Server ➔ Client | Server | Return array of past chat messages |
| `sendMessage` | Client ➔ Server | Customer / Collector | Send chat message |
| `newMessage` | Server ➔ Client | Server | Broadcast new chat message to room |
| `typing` | Client ➔ Server | Customer / Collector | Emit user typing status |
| `userTyping` | Server ➔ Client | Server | Broadcast typing indicator to room |
| `stopTyping` | Client ➔ Server | Customer / Collector | Emit user stopped typing status |
| `userStoppedTyping` | Server ➔ Client | Server | Broadcast stopped typing to room |
| `markRead` | Client ➔ Server | Customer / Collector | Mark chat messages read |
| `messagesMarkedRead` | Server ➔ Client | Server | Broadcast read status to room |
