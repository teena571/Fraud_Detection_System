# Docker Setup Guide for Windows

## 🚨 Error: Docker Desktop Not Running

If you see this error:
```
unable to get image 'redis:7-alpine': error during connect: 
Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/images/redis:7-alpine/json": 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**This means Docker Desktop is not running.**

## ✅ Solution 1: Start Docker Desktop (Recommended)

### Step 1: Check if Docker Desktop is Installed

1. Press `Windows Key` and search for "Docker Desktop"
2. If found, proceed to Step 2
3. If not found, download from: https://www.docker.com/products/docker-desktop/

### Step 2: Start Docker Desktop

1. Open Docker Desktop from Start Menu
2. Wait for Docker to start (you'll see a whale icon in system tray)
3. Wait until the icon stops animating (usually 30-60 seconds)
4. Verify Docker is running:

```bash
docker --version
docker ps
```

### Step 3: Start Redis

```bash
cd backend
docker-compose -f docker-compose.full.yml up -d redis
```

### Step 4: Verify Redis is Running

```bash
docker ps | findstr redis
docker exec -it fraudshield-redis redis-cli ping
```

Should return: `PONG`

## ✅ Solution 2: Use Local Redis (Without Docker)

If you don't want to use Docker, you can install Redis locally on Windows.

### Option A: Using Windows Subsystem for Linux (WSL)

1. **Install WSL:**
```bash
wsl --install
```

2. **Install Redis in WSL:**
```bash
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

3. **Verify Redis:**
```bash
redis-cli ping
```

4. **Update .env:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Option B: Using Memurai (Redis for Windows)

1. **Download Memurai:**
   - Visit: https://www.memurai.com/get-memurai
   - Download Memurai Developer Edition (Free)

2. **Install Memurai:**
   - Run the installer
   - Follow installation wizard
   - Memurai will start automatically

3. **Verify Memurai:**
```bash
memurai-cli ping
```

4. **Update .env:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Option C: Using Redis on Windows (Unofficial)

1. **Download Redis for Windows:**
   - Visit: https://github.com/tporadowski/redis/releases
   - Download latest `.msi` installer

2. **Install Redis:**
   - Run the installer
   - Keep default settings
   - Redis will start as a Windows service

3. **Verify Redis:**
```bash
redis-cli ping
```

4. **Update .env:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## ✅ Solution 3: Run Without Redis (Fallback)

If you can't install Redis, the backend will still work with reduced performance.

### Update .env:
```env
REDIS_ENABLED=false
```

**What happens:**
- ❌ No Redis caching (slower responses)
- ❌ Rate limiting uses memory store (not distributed)
- ✅ All other features work normally
- ✅ Backend starts successfully

**Performance impact:**
- Response times: 120ms instead of 5ms (cached)
- Rate limiting: Works but not shared across instances

## 🔧 Troubleshooting Docker Desktop

### Issue: Docker Desktop won't start

**Solution 1: Restart Docker Desktop**
1. Right-click Docker icon in system tray
2. Select "Quit Docker Desktop"
3. Wait 10 seconds
4. Start Docker Desktop again

**Solution 2: Restart Docker Service**
```bash
# Run as Administrator
net stop com.docker.service
net start com.docker.service
```

**Solution 3: Restart Computer**
Sometimes a simple restart fixes Docker issues.

### Issue: Docker Desktop is slow

**Solution:**
1. Open Docker Desktop Settings
2. Go to Resources
3. Increase CPU and Memory allocation
4. Click "Apply & Restart"

### Issue: WSL 2 not installed

**Error:**
```
Docker Desktop requires Windows Subsystem for Linux 2 (WSL 2)
```

**Solution:**
```bash
# Run as Administrator
wsl --install
wsl --set-default-version 2
```

Then restart computer and start Docker Desktop.

## 📊 Verify Your Setup

### Test 1: Check Docker
```bash
docker --version
docker ps
```

### Test 2: Start Redis
```bash
cd backend
docker-compose -f docker-compose.full.yml up -d redis
```

### Test 3: Verify Redis
```bash
docker ps | findstr redis
docker exec -it fraudshield-redis redis-cli ping
```

### Test 4: Start Backend
```bash
npm run dev
```

Should show:
```
🔄 Initializing Redis...
✅ Redis connected and ready
✅ Redis initialized successfully
```

### Test 5: Test API
```bash
curl http://localhost:4000/health
```

Should show Redis status as "healthy".

## 🎯 Recommended Setup

**For Development:**
- ✅ Use Docker Desktop (easiest)
- ✅ Start Redis with docker-compose
- ✅ All features work perfectly

**For Production:**
- ✅ Use managed Redis (AWS ElastiCache, Azure Cache, etc.)
- ✅ Or self-hosted Redis cluster
- ✅ Enable persistence and backups

## 📝 Quick Commands

### Docker Desktop
```bash
# Check if Docker is running
docker ps

# Start all services
docker-compose -f docker-compose.full.yml up -d

# Stop all services
docker-compose -f docker-compose.full.yml down

# View logs
docker logs fraudshield-redis

# Restart Redis
docker restart fraudshield-redis
```

### Redis CLI
```bash
# Connect to Redis
docker exec -it fraudshield-redis redis-cli

# Test connection
docker exec -it fraudshield-redis redis-cli ping

# View all keys
docker exec -it fraudshield-redis redis-cli KEYS "*"

# Clear all data
docker exec -it fraudshield-redis redis-cli FLUSHDB
```

## 🆘 Still Having Issues?

### Option 1: Use Cloud MongoDB Atlas (Already Working)
Your MongoDB is already on Atlas, so the backend works without local Docker.

### Option 2: Disable Redis Temporarily
```env
REDIS_ENABLED=false
```

Backend will work with:
- ✅ All APIs functional
- ✅ Database operations
- ✅ WebSocket support
- ✅ Kafka integration
- ❌ No caching (slower)
- ❌ Memory-based rate limiting

### Option 3: Use Alternative Redis Services

**Free Redis Cloud Services:**
1. **Redis Cloud** - https://redis.com/try-free/
2. **Upstash** - https://upstash.com/
3. **Railway** - https://railway.app/

Update `.env` with cloud Redis URL:
```env
REDIS_HOST=your-redis-cloud-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

## ✨ Summary

**Easiest Solution:**
1. Start Docker Desktop
2. Wait for it to fully start
3. Run: `docker-compose -f docker-compose.full.yml up -d redis`
4. Run: `npm run dev`

**Alternative Solution:**
1. Set `REDIS_ENABLED=false` in `.env`
2. Run: `npm run dev`
3. Backend works without Redis (reduced performance)

**Best Solution:**
1. Install Docker Desktop properly
2. Use Redis for optimal performance
3. All optimizations work perfectly

Choose the solution that works best for your setup!
