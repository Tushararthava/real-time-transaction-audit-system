# Railway Deployment Guide

## Real-Time Transaction Audit System - Railway Deployment

This guide walks you through deploying the complete application to Railway platform with GitHub integration.

---

## 📋 Prerequisites

1. **GitHub Account** with your code pushed to `https://github.com/Tushararthava/real-time-transaction-audit-system.git`
2. **Railway Account** - Sign up at [https://railway.app](https://railway.app)
3. **Payment Method** (Railway offers free tier with limitations)

---

## 🚀 Deployment Steps

### Step 1: Create Railway Project

1. Login to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select repository: `Tushararthava/real-time-transaction-audit-system`

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will provision the database and generate `DATABASE_URL`
4. **Note**: The `DATABASE_URL` is automatically available to all services in the project

### Step 3: Add Redis Database

1. Click **"+ New"** again
2. Select **"Database"** → **"Redis"**
3. Railway will provision Redis and generate `REDIS_URL`
4. **Note**: The `REDIS_URL` is automatically available to all services in the project

### Step 4: Deploy Backend Service

#### 4.1 Create Backend Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select the repository again
3. Railway will detect it's a monorepo

#### 4.2 Configure Backend Build Settings
1. Click on the new service → **"Settings"**
2. Set **Root Directory**: `backend`
3. Set **Build Command**: (leave default, Nixpacks will handle it)
4. Set **Start Command**: (leave default, uses nixpacks.toml)
5. Click **"Deploy"**

#### 4.3 Set Backend Environment Variables
1. Go to service → **"Variables"** tab
2. Click **"+ New Variable"** and add:

**Generate JWT Secrets First:**
```bash
# Run this command twice to generate two different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add these variables:**
```
JWT_SECRET=<paste-first-generated-secret>
JWT_REFRESH_SECRET=<paste-second-generated-secret>
NODE_ENV=production
CORS_ORIGIN=<will-set-after-frontend-deployed>
```

**Note**: `DATABASE_URL`, `REDIS_URL`, and `PORT` are automatically provided by Railway

#### 4.4 Verify Backend Deployment
1. Go to **"Deployments"** tab
2. Wait for build to complete (2-3 minutes)
3. Check **"Logs"** for:
   - ✅ `Database migration completed`
   - ✅ `Server running on port...`
   - ✅ No errors about DATABASE_URL or REDIS_URL
4. Copy the **Public URL** (e.g., `https://your-backend.railway.app`)

### Step 5: Deploy Frontend Service

#### 5.1 Create Frontend Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Railway creates another service

#### 5.2 Configure Frontend Build Settings
1. Click on the frontend service → **"Settings"**
2. Set **Root Directory**: `fontend`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm run preview`

#### 5.3 Set Frontend Environment Variables
1. Go to **"Variables"** tab
2. Add these variables (using backend URL from Step 4.4):

```
VITE_API_URL=https://your-backend.railway.app/api
VITE_WS_URL=https://your-backend.railway.app
```

Replace `your-backend.railway.app` with your actual backend URL

#### 5.4 Deploy Frontend
1. Click **"Deploy"** or it will auto-deploy
2. Wait for build (1-2 minutes)
3. Copy the **Public URL** (e.g., `https://your-frontend.railway.app`)

### Step 6: Update Backend CORS

1. Go back to **Backend Service** → **"Variables"**
2. Update `CORS_ORIGIN` variable:
```
CORS_ORIGIN=https://your-frontend.railway.app
```
3. Replace with your actual frontend URL
4. Backend will auto-redeploy

---

## ✅ Verification

### 1. Check Backend Health
- Open browser: `https://your-backend.railway.app/api`
- You should see API response (not 404)

### 2. Check Frontend
- Open: `https://your-frontend.railway.app`
- Application should load
- Check browser console - no CORS errors

### 3. Test Complete Flow
1. **Sign Up**: Create test account
   - Email: `test@railway.com`
   - Password: `TestPassword123!`
   - Name: `Test User`
   - UPI PIN: `123456`
2. **Login**: Login with same credentials
3. **Send Money**: 
   - Create second account
   - Send money from account 1 to account 2
   - Verify transaction completes
4. **Check WebSocket**: 
   - Open DevTools → Network → WS tab
   - Should show active WebSocket connection
5. **View Analytics**: Check stats/analytics page loads

---

## 🔧 Troubleshooting

### Build Failures

**"Prisma generation failed"**
- Check `DATABASE_URL` is available in environment
- Verify Prisma is in `dependencies` (not `devDependencies`)
- Check logs for specific error

**"TypeScript build errors"**
- Run `npm run build` locally first
- Fix any TypeScript errors shown
- Commit and push fixes

### Runtime Errors

**"Database connection failed"**
- Verify PostgreSQL service is running
- Check `DATABASE_URL` environment variable exists
- View logs for connection error details

**"Redis connection failed"**
- Verify Redis service is running
- Check `REDIS_URL` environment variable exists

**CORS errors in frontend**
- Verify `CORS_ORIGIN` in backend matches frontend URL exactly
- Frontend URL should NOT have trailing slash
- Redeploy backend after changing CORS_ORIGIN

**WebSocket not connecting**
- Verify `VITE_WS_URL` in frontend matches backend URL
- Check browser console for connection errors
- Ensure backend is running and accessible

### Migration Issues

**"Migration failed"**
Railway runs migrations automatically via `npx prisma migrate deploy` in the start command.

If migrations fail:
1. Go to backend service → **"Logs"**
2. Look for migration error details
3. May need to reset database (⚠️ **destroys all data**):
   - Connect to database using Railway CLI
   - Run `npx prisma migrate reset`

---

## 🎯 Post-Deployment

### Optional: Custom Domains
1. Go to service → **"Settings"** → **"Domains"**
2. Click **"+ Custom Domain"**
3. Enter your domain
4. Update DNS records as instructed

### Monitor Application
- Check **"Metrics"** tab for CPU/Memory usage
- Monitor **"Logs"** for errors
- Set up alerts in Railway dashboard

### Database Backups
- Railway Pro plan includes automated backups
- Manual backup: Use `pg_dump` via Railway CLI

---

## 📝 Environment Variables Summary

### Backend
```
DATABASE_URL          (auto-provided by PostgreSQL service)
REDIS_URL             (auto-provided by Redis service)
PORT                  (auto-provided by Railway)
JWT_SECRET            (generate with crypto.randomBytes)
JWT_REFRESH_SECRET    (generate with crypto.randomBytes)
NODE_ENV=production
CORS_ORIGIN          (frontend Railway URL)
```

### Frontend
```
VITE_API_URL         (backend Railway URL + /api)
VITE_WS_URL          (backend Railway URL)
```

---

## 🔗 Useful Links

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway) - Get help from community
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 🆘 Getting Help

If you encounter issues:
1. Check Railway **Logs** for error details
2. Review this guide's **Troubleshooting** section
3. Check [Railway Documentation](https://docs.railway.app)
4. Ask in [Railway Discord](https://discord.gg/railway)

---

**Congratulations! Your Real-Time Transaction Audit System is now live on Railway! 🎉**
