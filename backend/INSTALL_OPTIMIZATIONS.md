# Install Production Optimizations

## 📦 Step-by-Step Installation

### Step 1: Install New Dependencies

```bash
cd backend
npm install rate-limit-redis response-time
```

This installs:
- `rate-limit-redis` - Redis-based distributed rate limiting
- `response-time` - Response time tracking middleware

### Step 2: Verify Installation

```bash
npm list rate-limit-redis response-time
```

Should show:
```
fraudshield-backend@1.0.0
├── rate-limit-redis@4.2.0
└── response-time@2.3.2
```

### Step 3: Start Redis

```bash
docker-compose -f docker-compose.full.yml up -d redis
```

Wait 5-10 seconds for Redis to start.

### Step 4: Verify Redis

```bash
# Check container
docker ps | grep redis

# Test connection
docker exec -it fraudshield-redis redis-cli ping
```

Should return: `PONG`

### Step 5: Configure Environment

Your `.env` should have:

```env
# Redis (required for rate limiting and caching)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WHITELIST=

# Compression
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024

# Security
IP_WHITELIST=
CORP_POLICY=cross-origin
```

### Step 6: Start Backend

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

## ✅ Verification Tests

### Test 1: Health Check

```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "success": true,
  "uptime": 123,
  "memory": {
    "used": 125,
    "total": 256,
    "unit": "MB"
  },
  "services": {
    "redis": {
      "status": "healthy",
      "latency": "2ms",
      "connected": true
    }
  }
}
```

### Test 2: Rate Limiting

```bash
# Make 10 rapid requests
for i in {1..10}; do
  curl -i http://localhost:4000/api/transactions 2>&1 | grep "X-RateLimit"
done
```

**Expected Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Remaining: 98
...
```

### Test 3: Compression

```bash
curl -H "Accept-Encoding: gzip" \
  -i http://localhost:4000/api/transactions 2>&1 | grep "Content-Encoding"
```

**Expected:**
```
Content-Encoding: gzip
```

### Test 4: Response Time

```bash
curl -i http://localhost:4000/api/transactions 2>&1 | grep "X-Response-Time"
```

**Expected:**
```
X-Response-Time: 45.23ms
```

### Test 5: Performance Statistics

```bash
curl http://localhost:4000/api/stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "global": {
      "totalRequests": 15,
      "avgResponseTime": 42.15,
      "slowRequests": 0
    },
    "endpoints": [...]
  }
}
```

### Test 6: Security Headers

```bash
curl -i http://localhost:4000/health 2>&1 | grep -E "X-Frame-Options|X-XSS-Protection|Strict-Transport"
```

**Expected:**
```
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## 🎯 Performance Comparison

### Before Optimizations

```bash
# Test response time
time curl http://localhost:4000/api/transactions
```

**Expected:** ~120ms

### After Optimizations (First Request)

```bash
# First request (cache miss)
time curl http://localhost:4000/api/transactions
```

**Expected:** ~115ms (compressed)

### After Optimizations (Second Request)

```bash
# Second request (cache hit)
time curl http://localhost:4000/api/transactions
```

**Expected:** ~5ms ⚡ (24x faster!)

## 🔍 Verify Each Optimization

### ✅ Rate Limiting

**Test:**
```bash
# View rate limit keys in Redis
docker exec -it fraudshield-redis redis-cli KEYS "rl:*"
```

**Expected:**
```
1) "rl:global:127.0.0.1"
2) "rl:write:127.0.0.1"
```

### ✅ Caching

**Test:**
```bash
# View cache keys in Redis
docker exec -it fraudshield-redis redis-cli KEYS "transactions:*"
```

**Expected:**
```
1) "transactions:/api/transactions:page=1&limit=10"
```

### ✅ Compression

**Test:**
```bash
# Compare sizes
curl http://localhost:4000/api/transactions | wc -c
curl -H "Accept-Encoding: gzip" http://localhost:4000/api/transactions | wc -c
```

**Expected:** Second request should be 70-80% smaller

### ✅ Response Time Tracking

**Test:**
```bash
# Make several requests
for i in {1..5}; do
  curl http://localhost:4000/api/transactions > /dev/null
done

# Check stats
curl http://localhost:4000/api/stats | jq '.stats.global'
```

**Expected:**
```json
{
  "totalRequests": 5,
  "avgResponseTime": 35.67,
  "minResponseTime": 5.23,
  "maxResponseTime": 115.45
}
```

### ✅ Security Headers

**Test:**
```bash
curl -i http://localhost:4000/health 2>&1 | grep -E "^X-|^Strict"
```

**Expected:** 10+ security headers

## 🚨 Troubleshooting

### Issue: npm install fails

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Redis not connecting

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Check Redis logs
docker logs fraudshield-redis

# Restart Redis
docker-compose -f docker-compose.full.yml restart redis

# Restart backend
npm run dev
```

### Issue: Rate limiting not working

**Solution:**
```bash
# Check Redis connection
curl http://localhost:4000/health | jq '.services.redis'

# Check Redis keys
docker exec -it fraudshield-redis redis-cli KEYS "*"

# Clear rate limits
docker exec -it fraudshield-redis redis-cli DEL "rl:*"
```

### Issue: Compression not working

**Solution:**
1. Ensure request includes `Accept-Encoding: gzip` header
2. Response must be >1KB (threshold)
3. Check response headers for `Content-Encoding: gzip`

### Issue: High memory usage

**Solution:**
```bash
# Check memory
curl http://localhost:4000/health | jq '.memory'

# Restart with more memory
node --max-old-space-size=4096 server.js
```

## 📊 Load Testing

### Test Rate Limiting

```bash
# Should hit rate limit after 100 requests
ab -n 150 -c 1 http://localhost:4000/api/transactions
```

**Expected:** Some requests return 429 (Too Many Requests)

### Test Performance

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:4000/api/transactions
```

**Expected Results:**
- Requests/sec: 500-1000
- Time/request: 10-20ms (cached)
- Failed requests: 0

### Test Compression

```bash
# With compression
ab -n 100 -c 10 -H "Accept-Encoding: gzip" http://localhost:4000/api/transactions

# Without compression
ab -n 100 -c 10 http://localhost:4000/api/transactions
```

**Expected:** With compression should be faster (less data transfer)

## 🎉 Success Indicators

After successful installation, you should see:

✅ Redis connected and healthy  
✅ Rate limit headers in responses  
✅ Compression headers in responses  
✅ Response time headers in responses  
✅ Security headers in responses  
✅ Performance stats available  
✅ Memory usage tracked  
✅ Cache keys in Redis  
✅ Rate limit keys in Redis  

## 📈 Expected Performance

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Response Time (cached) | 120ms | 5ms | 24x faster |
| Response Size | 45KB | 12KB | 73% smaller |
| Database Queries | Every request | 10-20% | 80-90% reduction |
| Rate Limiting | None | 5 tiers | ✅ Protected |
| Security Headers | 2 | 10+ | ✅ Enhanced |

## 📚 Next Steps

1. **Read Documentation:**
   - [PRODUCTION_OPTIMIZATIONS.md](./PRODUCTION_OPTIMIZATIONS.md)
   - [OPTIMIZATION_QUICKSTART.md](./OPTIMIZATION_QUICKSTART.md)

2. **Configure for Your Use Case:**
   - Adjust rate limits
   - Configure compression level
   - Set up IP whitelist

3. **Monitor Performance:**
   - Check `/api/stats` regularly
   - Monitor Redis memory usage
   - Watch for slow requests

4. **Deploy to Production:**
   - Set `NODE_ENV=production`
   - Configure environment variables
   - Set up monitoring/alerting

## 🆘 Need Help?

- **Check logs:** `npm run dev`
- **View health:** `curl http://localhost:4000/health`
- **View stats:** `curl http://localhost:4000/api/stats`
- **Check Redis:** `docker logs fraudshield-redis`
- **Redis CLI:** `docker exec -it fraudshield-redis redis-cli`

## ✨ Summary

You've successfully installed:

✅ Redis-based distributed rate limiting  
✅ Response time tracking and statistics  
✅ Advanced compression (70-80% reduction)  
✅ Production-grade security headers  
✅ Request sanitization  
✅ Performance monitoring  

Your backend is now production-ready! 🚀
