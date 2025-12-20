# Backend Production Environment Configuration Template
#
# Instructions:
# Set these environment variables in Railway dashboard for your backend service
# Railway will auto-provide DATABASE_URL and REDIS_URL when you add those services

# Database (Auto-provided by Railway PostgreSQL service)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis (Auto-provided by Railway Redis service)
REDIS_URL=redis://default:password@host:port

# JWT Secrets (Generate these using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=YOUR_GENERATED_32_CHAR_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_GENERATED_32_CHAR_REFRESH_SECRET_HERE

# Server Configuration
PORT=$PORT
NODE_ENV=production

# CORS (Set to your frontend Railway URL)
CORS_ORIGIN=https://your-frontend-service.railway.app

# Optional: Logging
LOG_LEVEL=info
