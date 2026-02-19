# Redis Setup Instructions

## 📦 Installation Steps

### Step 1: Install ioredis Package

```bash
cd backend
npm install ioredis
```

This will install the Redis client library.

### Step 2: Start Redis with Docker

```bash
docker-compose -f docker-compose.full.yml up -d redis
```

Wait for Redis to start (about 5-10 seconds).

### Step 3: Verify Redis is Running

```bash
# Check container status
docker ps | grep redis

# Test Redis connection
docker exec -it fraudshield-redis redis-cli ping
```

You should see `PONG` response.

### Step 4: Configure Environment

Make sure your `.env` file has:

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Step 5: Start Backend

```bash
npm run dev
```

You should see:
```
🔄 Initializing Redis...
✅ Redis connected and ready
✅ Redis initialized successfully
🚀 Server running on port 4000
```

## ✅ Verify Installation

### Test 1: Health Check

```bash
curl http://localhost:4000/health
```

Look for Redis status in response:
```json
{
  "services": {
    "redis": {
      "status": "healthy",
      "latency": "2ms",
      "usedMemory": "1.2M",
      "connected": true
    }
  }
}
```

### Test 2: Cache Performance

```bash
# First request (cache miss - slower)
time curl http://localhost:4000/api/transactions?page=1&limit=10

# Second request (cache hit - much faster)
time curl http://localhost:4000/api/transactions?page=1&limit=10
```

The second request should be 10-30x faster!

### Test 3: View Cache Keys

```bash
docker exec -it fraudshield-redis redis-cli KEYS "*"
```

You should see cache keys like:
```
1) "transactions:/api/transactions:page=1&limit=10"
2) "transaction-stats:/api/transactions/stats:timeframe=24h"
```

## 🔧 Troubleshooting

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install ioredis
```

### Issue: Redis container won't start

**Solution:**
```bash
# Check if port 6379 is in use
netstat -an | findstr 6379

# Stop any existing Redis
docker stop fraudshield-redis
docker rm fraudshield-redis

# Start fresh
docker-compose -f docker-compose.full.yml up -d redis
```

### Issue: Backend can't connect to Redis

**Solution:**
1. Verify Redis is running:
```bash
docker ps | grep redis
```

2. Check Redis logs:
```bash
docker logs fraudshield-redis
```

3. Test connection manually:
```bash
docker exec -it fraudshield-redis redis-cli ping
```

4. Verify `.env` configuration

5. Restart backend:
```bash
npm run dev
```

### Issue: Cache not working

**Solution:**
1. Check console logs for cache messages
2. Verify `REDIS_ENABLED=true` in `.env`
3. Clear cache and restart:
```bash
docker exec -it fraudshield-redis redis-cli FLUSHDB
npm run dev
```

## 📊 Monitor Cache Performance

### Real-time Monitoring

```bash
docker exec -it fraudshield-redis redis-cli MONITOR
```

Then make API requests and watch cache operations in real-time.

### Check Memory Usage

```bash
docker exec -it fraudshield-redis redis-cli INFO memory
```

### View Cache Statistics

```bash
docker exec -it fraudshield-redis redis-cli INFO stats
```

Look for:
- `keyspace_hits` - Number of cache hits
- `keyspace_misses` - Number of cache misses
- Hit rate = hits / (hits + misses)

## 🎯 Expected Results

After successful setup:

✅ Redis container running on port 6379  
✅ Backend connects to Redis on startup  
✅ GET requests are cached for 60 seconds  
✅ Cache invalidates on POST/PUT/DELETE  
✅ 10-30x faster response times for cached data  
✅ Health endpoint shows Redis status  

## 📚 Next Steps

1. Read [REDIS_QUICKSTART.md](./REDIS_QUICKSTART.md) for usage examples
2. Read [REDIS_INTEGRATION.md](./REDIS_INTEGRATION.md) for detailed documentation
3. Monitor cache performance in production
4. Adjust TTL if needed (currently 60 seconds)

## 🚀 Production Deployment

For production, consider:

1. **Redis Password**: Set `REDIS_PASSWORD` in `.env`
2. **Redis Persistence**: Already configured in docker-compose
3. **Memory Limits**: Configure `maxmemory` in Redis
4. **High Availability**: Use Redis Sentinel or Cluster
5. **Monitoring**: Set up Redis monitoring tools
6. **Backups**: Regular Redis snapshots

## 📝 Summary

Redis caching is now ready to use! The system will:
- Automatically cache all GET requests
- Invalidate cache on data changes
- Fall back to database if Redis is unavailable
- Provide 10-30x performance improvement

For questions or issues, refer to the documentation files or check the troubleshooting section above.
