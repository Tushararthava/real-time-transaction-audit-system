# 🚀 Real-Time Transaction Audit System - Setup Guide

> **Windows Setup Guide** - Quick and simple instructions to run this project

---

## Prerequisites

Install these on your Windows machine:

1. **Node.js** (v18+) - https://nodejs.org/
2. **Docker Desktop** - https://www.docker.com/products/docker-desktop/
3. **Git** - https://git-scm.com/downloads

---

## Option 1: Automated Setup (Recommended)

```powershell
# 1. Clone the repository
git clone <your-repository-url>
cd real-time-transaction-audit-system

# 2. Run setup script
.\setup.ps1

# 3. Update JWT secrets in backend\.env file (REQUIRED!)
# Generate secrets: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Start backend
cd backend
npm run dev

# 5. Start frontend (open new terminal)
cd fontend
npm run dev
```

**Access the app:** http://localhost:5173

---

## Option 2: Manual Setup

### Step 1: Clone Repository
```powershell
git clone <your-repository-url>
cd real-time-transaction-audit-system
```

### Step 2: Start Database
```powershell
# Make sure Docker Desktop is running
docker-compose up -d
```

### Step 3: Setup Backend
```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
```

Create `backend\.env` file:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5433/transaction_audit
JWT_ACCESS_SECRET=your-32-character-secret-key-change-this-immediately
JWT_REFRESH_SECRET=your-different-32-character-secret-key-change-this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
REDIS_URL=
```

Start backend:
```powershell
npm run dev
```

### Step 4: Setup Frontend
```powershell
# Open new terminal
cd fontend
npm install
npm run dev
```

**Access the app:** http://localhost:5173

---

## Default Credentials

**Database:**
- Host: localhost:5433
- Database: transaction_audit
- User: postgres
- Password: postgres123

**pgAdmin:** http://localhost:5051
- Email: admin@admin.com
- Password: admin123

---

## Common Issues

**Port already in use:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Docker not running:**
- Start Docker Desktop from Start menu

**Database connection failed:**
```powershell
docker-compose ps
docker-compose up -d
```

**JWT secret too short:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

**Done! Your app should be running at http://localhost:5173** ✅
