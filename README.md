#  Real-Time Transaction Audit System
---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Cloud Provider](#-cloud-provider--aws)
- [Tools & Technologies](#-tools--technologies)
- [Getting Started](#-getting-started)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Infrastructure (IaC)](#-infrastructure-iac)
- [Security](#-security)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)

---

## 🔍 Project Overview

The **Real-Time Transaction Audit System** is a full-stack financial platform that enables peer-to-peer (P2P) money transfers with live fund tracking, and a comprehensive transaction audit trail. Every financial event is captured and made observable in real time through WebSocket connections, giving both end-users and administrators instant visibility into balance changes and transaction status.

### Key Capabilities

| Feature | Description |
|---|---|
| 🔄 **Real-Time Notifications** | WebSocket (Socket.IO) pushes immediate balance and transaction updates to connected clients |
| 🔒 **Secure Authentication** | JWT access + refresh token strategy with `bcrypt` password hashing |
| 📊 **Audit Trail** | Immutable audit log service captures every transaction event with timestamps |
| 💸 **P2P Transfers** | Atomic database transactions ensure consistent fund movement between wallets |
| 📈 **Statistics Dashboard** | Aggregated analytics for spending, incoming, and net balance trends |
| 🛡️ **Security Hardened** | Helmet.js security headers, rate limiting, input validation with Zod, IMDSv2-enforced EC2 |
| 🗂️ **QR Code Payments** | QR code generation and scanning support for seamless peer transfers |

---

## 🏗️ Architecture

The system follows a **three-tier architecture** with a decoupled frontend, RESTful + WebSocket backend, and a containerised PostgreSQL database.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Browser)                          │
│   React 19 + Vite   │   Zustand State   │   Socket.IO Client   │  Axios  │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ HTTP REST + WebSocket (WS)
┌──────────────────────────────────▼───────────────────────────────────────┐
│                         APPLICATION LAYER (EC2)                          │
│                                                                          │
│  ┌─────────────┐   ┌─────────────────┐   ┌──────────────────────────┐   │
│  │   Express   │   │   Socket.IO     │   │     Service Layer        │   │
│  │   Routes    │──▶│   WebSocket     │   │  auth / transfer /       │   │
│  │  /api/*     │   │   Server        │   │  audit / stats /token    │   │
│  └──────┬──────┘   └────────┬────────┘   └──────────────────────────┘   │
│         │                   │                                            │
│  ┌──────▼───────────────────▼──────────────────────────────────────┐     │
│  │              Middleware Stack                                    │     │
│  │   Helmet · CORS · Rate Limiter · JWT Auth · Zod Validator       │     │
│  └─────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ Prisma ORM
┌──────────────────────────────────▼───────────────────────────────────────┐
│                          DATA LAYER (Docker)                             │
│        PostgreSQL 16-Alpine              │   pgAdmin 4 (UI)              │
│        container: transaction-audit-db   │   port: 5051                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow — P2P Transfer

```
User A → POST /api/transfers
       → JWT Middleware validates token
       → Zod validates payload
       → Transfer Service:
           1. BEGIN Prisma transaction
           2. Debit Sender wallet
           3. Credit Receiver wallet
           4. Create Transaction record
           5. Append Audit log entry
           6. COMMIT
           7. Emit transferEvents("TRANSFER_COMPLETED")
       → Socket.IO:
           • Emit "balance:updated"  → User A's room
           • Emit "transaction:new"  → User B's room
       → HTTP 201 response to User A
```

### Real-Time Event Architecture

```
Backend (EventEmitter)
    transferEvents.emit("TRANSFER_COMPLETED", payload)
         │
         ▼
    io.to(`user:${senderId}`).emit("balance:updated", ...)
    io.to(`user:${receiverId}`).emit("transaction:new", ...)
         │
         ▼
    Socket.IO   ────────────── WebSocket ──────────────▶   React Client
    rooms per                                               Zustand store
    user ID                                                 updates UI
```

### Backend Module Structure

```
backend/src/
├── config/          # env, database (Prisma), logger (Winston)
├── controllers/     # HTTP request handlers (auth, transfer, audit)
├── middleware/      # error handler, auth guard, rate limiter, validator
├── routes/          # Express router (auth, transfers, audit, stats)
├── services/        # Business logic (auth, transfer, audit, stats, token)
├── types/           # Shared TypeScript interfaces
├── utils/           # Utility helpers
├── validators/      # Zod schemas for request validation
└── server.ts        # App entry-point, Socket.IO bootstrap, graceful shutdown
```

---

## ☁️ Cloud Provider — AWS

All production infrastructure is provisioned on **Amazon Web Services (AWS)** in the `us-east-1` region using Infrastructure as Code (Terraform).

### AWS Services Used

| Service | Purpose |
|---|---|
| **EC2** (`t3.micro`) | Hosts the Node.js backend application server |
| **VPC** | Isolated network with public subnet, route table, internet gateway |
| **Security Group** | Restricts inbound to ports 80, 443, 3000 (app) and SSH to private CIDRs only |
| **Elastic IP** | Static public IP address bound to the EC2 instance |
| **S3** | Remote Terraform state storage (`real-time-audit-tfstate` bucket, encrypted at rest) |
| **DynamoDB** | Terraform state locking table (`real-time-audit-tfstate-lock`) with PITR enabled |
| **KMS** | Customer-managed key for EBS volume encryption and DynamoDB SSE |

### AWS Network Topology

```
Internet
    │
    ▼
Internet Gateway
    │
    ▼
VPC — 10.0.0.0/16
    │
    ├── Public Subnet — 10.0.1.0/24
    │       │
    │       ▼
    │   EC2 Instance (t3.micro, Amazon Linux 2023)
    │       ├── EBS volume — gp3, 20 GB, KMS-encrypted
    │       ├── IMDSv2 enforced (SSRF protection)
    │       └── Detailed CloudWatch monitoring enabled
    │
    └── Security Group
            ├── Ingress: 80, 443, 3000 → 0.0.0.0/0
            └── Ingress: 22 → 10.0.0.0/8 (private only)
```

---

## 🛠️ Tools & Technologies

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20.x | JavaScript runtime |
| **TypeScript** | 5.3 | Static typing and compile-time safety |
| **Express.js** | 4.18 | HTTP server and REST API framework |
| **Socket.IO** | 4.6 | Real-time bidirectional WebSocket communication |
| **Prisma ORM** | 5.7 | Type-safe database client and migrations |
| **PostgreSQL** | 16 | Relational database for all persistent data |
| **Redis / ioredis** | 5.3 | Caching and session store |
| **Winston** | 3.11 | Structured application logging |
| **JWT (jsonwebtoken)** | 9.x | Stateless access & refresh token authentication |
| **bcrypt** | 5.x | Secure password hashing |
| **Zod** | 3.x | Runtime request schema validation |
| **Helmet.js** | 7.x | HTTP security headers |
| **express-rate-limit** | 7.x | API rate limiting and abuse prevention |
| **UUID** | 9.x | Unique transaction and audit-log ID generation |
| **dotenv** | 16.x | Environment variable management |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI component library |
| **TypeScript** | 5.9 | Type-safe frontend code |
| **Vite** | 7.x | Fast dev server and bundler |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **Zustand** | 5.x | Lightweight global state management |
| **React Router DOM** | 7.x | Client-side routing |
| **TanStack Query** | 5.x | Server state, caching and background refetching |
| **Axios** | 1.x | HTTP client for API communication |
| **Socket.IO Client** | 4.8 | WebSocket client for real-time updates |
| **React Hook Form** | 7.x | Performant form state management |
| **Zod** | 4.x | Client-side schema validation |
| **Recharts** | 2.x | Transaction statistics charts |
| **qrcode.react** | 4.x | QR code generation for payments |
| **@zxing/browser** | 0.1 | QR code scanning from camera |
| **lucide-react** | 0.5 | Icon library |
| **date-fns** | 4.x | Date formatting utilities |

### Infrastructure & DevOps

| Tool | Purpose |
|---|---|
| **Terraform** | Infrastructure as Code — provisions all AWS resources |
| **Jenkins** | CI/CD pipeline automation |
| **Docker & Docker Compose** | Containerised local PostgreSQL + pgAdmin development environment |
| **Trivy** | Static security scanner for Terraform IaC (IaC misconfiguration detection) |
| **AWS S3** | Encrypted remote Terraform state backend |
| **AWS DynamoDB** | Terraform state locking to prevent concurrent apply conflicts |
| **AWS KMS** | Encryption key management for EBS and DynamoDB |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- Docker Desktop
- npm v9+

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/real-time-transaction-audit-system.git
cd real-time-transaction-audit-system
```

### 2. Start the Database

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on port `5433`
- **pgAdmin 4** on port `5051` (login: `admin@admin.com` / `admin123`)

### 3. Configure Backend

```bash
cd backend
cp .env.example .env   # Fill in your values
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 4. Configure Frontend

```bash
cd fontend
npm install
npm run dev
```

### 5. One-Command Startup (Windows)

```bash
python startup_project.py
```

---

## 🔄 CI/CD Pipeline

The `Jenkinsfile` defines a 5-stage automated pipeline:

```
┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐
│  1. Checkout │──▶│ 2. Verify Build  │──▶│ 3. Security Scan   │
│  (Git SCM)   │   │ (dist artifacts) │   │ (Trivy – Terraform)│
└──────────────┘   └──────────────────┘   └────────┬───────────┘
                                                    │ CRITICAL → FAIL
                                                    ▼
                                          ┌─────────────────────┐
                                          │  4. Terraform Plan  │
                                          │  (init → validate   │
                                          │   → plan)           │
                                          └──────────┬──────────┘
                                                     ▼
                                          ┌─────────────────────┐
                                          │  5. Deploy + Verify │
                                          │  (backend :3000 +   │
                                          │   frontend /var/www) │
                                          └─────────────────────┘
```

**Security Policy:**
- **CRITICAL** Trivy findings → pipeline fails immediately
- **HIGH** findings → printed as warnings, pipeline continues
- All Trivy reports (`.txt` + `.json`) are archived as Jenkins build artifacts

---

## 🏗️ Infrastructure (IaC)

Terraform configuration lives in the `terraform/` directory.

```bash
cd terraform

# Initialize (with remote S3 backend)
terraform init

# Preview changes
terraform plan -var="environment=dev"

# Apply
terraform apply -var="environment=dev"
```

**Remote State:**
- State file stored in S3 (`real-time-audit-tfstate`) with server-side encryption
- State locking via DynamoDB table (`real-time-audit-tfstate-lock`)

---

## 🔐 Security

| Measure | Implementation |
|---|---|
| **Secrets** | Environment variables via `.env`; never committed to git |
| **Password hashing** | `bcrypt` with salt rounds |
| **Token auth** | Short-lived JWT access tokens + refresh token rotation |
| **HTTP security headers** | `helmet.js` on all routes |
| **Rate limiting** | `express-rate-limit` prevents brute-force |
| **Input validation** | `Zod` schemas on all API endpoints |
| **EC2 IMDSv2** | Instance Metadata Service v2 enforced (blocks SSRF) |
| **EBS encryption** | KMS customer-managed key on root volume |
| **SSH restriction** | Port 22 locked to private CIDR `10.0.0.0/8` only |
| **IaC scanning** | Trivy v0.49 scans Terraform on every CI run |
| **State encryption** | Terraform state encrypted in S3 (`encrypt = true`) |

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5433/transaction_audit
FRONTEND_URL=http://localhost:5173

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379
```

### Docker (`/.env.docker`)

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=transaction_audit
POSTGRES_PORT=5433
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5051
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login and receive tokens |
| `POST` | `/api/auth/refresh` | ❌ | Refresh access token |
| `POST` | `/api/auth/logout` | ✅ | Revoke refresh token |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `POST` | `/api/transfers` | ✅ | Initiate a P2P transfer |
| `GET` | `/api/transfers` | ✅ | List user's transactions |
| `GET` | `/api/transfers/:id` | ✅ | Get single transaction |
| `GET` | `/api/audit` | ✅ | Retrieve audit log entries |
| `GET` | `/api/stats` | ✅ | Get spending/income statistics |

### WebSocket Events

| Event | Direction | Payload |
|---|---|---|
| `balance:updated` | Server → Client | `{ newBalance, timestamp }` |
| `transaction:new` | Server → Client | `{ transaction, newBalance, timestamp }` |
| `ping` | Client → Server | — |
| `pong` | Server → Client | — |


