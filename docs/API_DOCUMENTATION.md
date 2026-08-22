# PulseChat API Reference & Developer Guide

## Overview

PulseChat provides a dual REST and WebSocket (Socket.io) interface for real-time messaging, direct conversations, multi-user groups, and member authorization.

- **REST Base URL**: `https://frontend-task-chatapp.onrender.com/api`
- **WebSocket Gateway**: `https://frontend-task-chatapp.onrender.com` (Socket.io at root origin)

---

## 1. Authentication Flow

### Single-Step Login / Auto-Registration
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "phone": "+15551234567",
    "name": "Ada Lovelace"
  }
  ```
- **Behavior**: If the phone number is new, a user profile is created automatically. If it already exists in the backend database, the user is authenticated.
- **Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "usr_99812",
      "phone": "+15551234567",
      "name": "Ada Lovelace",
      "createdAt": "2026-08-21T14:00:00Z"
    }
  }
  ```

### Bearer Token Authorization
Include the JWT token in all protected HTTP requests:
```http
Authorization: Bearer <token>
```

---

## 2. Real-Time WebSocket Channel (Socket.io)

### Connection Handshake
Connect to the host root (not `/api`) with the JWT token in the handshake auth object:
```javascript
import { io } from "socket.io-client";

const socket = io("https://frontend-task-chatapp.onrender.com", {
  auth: { token: "eyJhbGciOiJIUzI1Ni..." },
  transports: ["websocket", "polling"],
});
```

### Event Specifications

#### Client -> Server
- `message:send`: Transmit a text message in real-time.
  ```json
  {
    "conversationId": "conv_123",
    "text": "Hello world!"
  }
  ```

#### Server -> Client
- `message:new`: Broadcast when a new message arrives in any conversation the user is part of.
  ```json
  {
    "id": "msg_456",
    "conversationId": "conv_123",
    "senderId": "usr_99812",
    "sender": { "id": "usr_99812", "name": "Ada Lovelace" },
    "text": "Hello world!",
    "createdAt": "2026-08-21T14:05:00Z"
  }
  ```
- `conversation:updated`: Broadcast when group details change (member added/removed, admin promoted, title renamed).

---

## 3. Endpoints Matrix

| Route | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/auth/login` | POST | Public | Authenticates or registers user by phone number |
| `/auth/me` | GET | Protected | Retrieves current user session profile |
| `/users/search` | GET | Protected | Queries users by name string or phone digits (`?q=Ada`) |
| `/conversations` | GET | Protected | Lists direct and group conversations for active user |
| `/conversations` | POST | Protected | Starts or retrieves 1-to-1 conversation (`{ userId }`) |
| `/conversations/{id}/messages` | GET | Protected | Fetches paginated history (`?limit=20&before=msg_id`) |
| `/messages` | POST | Protected | Transmits message over REST (`{ conversationId, text }`) |
| `/conversations/group` | POST | Protected | Instantiates multi-user group chat (`{ name, participantIds }`) |
| `/conversations/{id}/participants` | POST | Protected | Adds members to group (Admin only) (`{ userIds }`) |
| `/conversations/{id}/participants/{userId}` | DELETE | Protected | Removes member (Admin only) or leaves group (Self) |
| `/conversations/{id}/admins` | POST | Protected | Promotes member to admin role (`{ userId }`) |
| `/conversations/{id}` | PATCH | Protected | Renames group title (`{ name }`) |

---

## 4. Error Handling & Resiliency

- **Gateway Latency & Cold Starts**: Standard HTTP 502/503/504 responses trigger an automated client retry with exponential backoff (up to 3 retries).
- **Client Offline Fallback**: In the event of backend unavailability, messages are saved in an **IndexedDB Queue** and synchronized upon reconnection.
