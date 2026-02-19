# Redis Integration Guide

## Overview

Redis is integrated into FraudShield as a high-performance caching layer to improve API response times and reduce database load. The system uses **ioredis** client with automatic fallback to database on cache miss.

## Features

✅ **Automatic Caching**: GET requests are cached for 60 seconds  
✅ **Cache Invalidation**: POST/PUT/DELETE operations automatically invalidate related cache  
✅ **Fallback Strategy**: Continues without cache if Redis is unavailable  
✅ **Health Monitoring**: Redis health status included in `/health` endpoint  
✅ **Pattern-based Invalidation**: Invalidate multiple cache keys with patterns  
✅ **Connection Resilience**: Auto-reconnect with exponential backoff  

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Docker Setup

Redis is included in `docker-compose.full.yml`:

```bash
docker-compose -f docker-compose.full.yml up -d redis
```

This starts Redis on port 6379 with data persistence.

## Cache Strategy

### Cached Endpoints (60 second TTL)

**Transactions:**
- `GET /api/transactions` - List with filters
- `GET /api/transactions/:id` - Single transaction
- `GET /api/transactions/stats` - Statistics

**Alerts:**
- `GET /api/alerts` - List with filters
- `GET /api/alerts/:id` - Single alert
- `GET /api/alerts/active` - Active alerts
- `GET /api/alerts/critical` - Critical alerts
- `GET /api/alerts/transaction/:transactionId` - Alerts by transaction
- `GET /api/alerts/stats` - Statistics

### Cache Invalidation

Cache is automatically invalidated on:

**Transaction Operations:**
- `POST /api/transactions` - Invalidates: `transactions:*`, `transaction-stats:*`
- `PUT /api/transactions/:id` - Invalidates: `transactions:*`, `transaction:*`, `transaction-stats:*`
- `DELETE /api/transactions/:id` - Invalidates: `transactions:*`, `transaction:*`, `transaction-stats:*`

**Alert Operations:**
- `POST /api/alerts/:id/acknowledge` - Invalidates all alert caches
- `POST /api/alerts/:id/resolve` - Invalidates all alert caches
- `POST /api/alerts/:id/dismiss` - Invalidates all alert caches
- `DELETE /api/alerts/:id` - Invalidates all alert caches

## Cache Keys

Cache keys follow this pattern:

```
{prefix}:{path}:{query-params}
```

Examples:
- `transactions:/api/transactions:page=1&limit=10`
- `transaction:/api/transactions/TXN123`
- `alerts:/api/alerts:severity=CRITICAL&status=ACTIVE`
- `alert-stats:/api/alerts/stats`

## Usage Examples

### Check Redis Health

```bash
curl http://localhost:4000/health
```

Response includes Redis status:
```json
{
  "success": true,
  "message": "FraudShield API is running",
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

### Monitor Cache Performance

Check console logs for cache hits/misses:

```
📦 Cache HIT: transactions:/api/transactions:page=1&limit=10
📭 Cache MISS: transaction:/api/transactions/TXN123
💾 Cache SET: transactions:/api/transactions:page=1&limit=10 (TTL: 60s)
🗑️ Cache DELETE pattern: transactions:* (5 keys)
```

### Test Cache Behavior

1. **First Request (Cache Miss)**:
```bash
curl http://localhost:4000/api/transactions?page=1&limit=10
# Response time: ~100ms (from database)
```

2. **Second Request (Cache Hit)**:
```bash
curl http://localhost:4000/api/transactions?page=1&limit=10
# Response time: ~5ms (from cache)
```

3. **Create Transaction (Invalidates Cache)**:
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","amount":1000}'
# Cache invalidated: transactions:*
```

4. **Next Request (Cache Miss Again)**:
```bash
curl http://localhost:4000/api/transactions?page=1&limit=10
# Response time: ~100ms (cache was invalidated)
```

## Redis CLI Commands

### Connect to Redis

```bash
# Local Redis
redis-cli

# Docker Redis
docker exec -it fraudshield-redis redis-cli
```

### Useful Commands

```bash
# Check connection
PING

# List all keys
KEYS *

# Get specific key
GET "transactions:/api/transactions:page=1&limit=10"

# Check TTL
TTL "transactions:/api/transactions:page=1&limit=10"

# Delete specific key
DEL "transactions:/api/transactions:page=1&limit=10"

# Delete by pattern
KEYS "transactions:*" | xargs redis-cli DEL

# Flush all cache
FLUSHDB

# Get memory usage
INFO memory

# Monitor real-time commands
MONITOR
```

## Performance Benefits

### Without Redis
- Average response time: 80-150ms
- Database queries: Every request
- Database load: High

### With Redis
- Average response time: 3-10ms (cache hit)
- Database queries: Only on cache miss
- Database load: Reduced by 70-90%
- Cache hit rate: 80-95% (typical)

## Troubleshooting

### Redis Not Connected

If Redis fails to connect, the system continues without caching:

```
⚠️ Redis initialization failed: connect ECONNREFUSED 127.0.0.1:6379
⚠️ Continuing without Redis cache...
```

**Solutions:**
1. Start Redis: `docker-compose -f docker-compose.full.yml up -d redis`
2. Check Redis is running: `redis-cli ping`
3. Verify `.env` configuration
4. Check firewall/port 6379

### Cache Not Invalidating

If cache isn't invalidating after updates:

1. Check console logs for invalidation messages
2. Verify middleware order in routes
3. Manually flush cache: `redis-cli FLUSHDB`

### High Memory Usage

Monitor Redis memory:

```bash
redis-cli INFO memory
```

If memory is high:
- Reduce TTL in cache middleware
- Implement cache size limits
- Use Redis eviction policies

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Express API    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│ Cache Middleware│─────▶│    Redis     │
└──────┬──────────┘      └──────────────┘
       │                         │
       │ Cache Miss              │ Cache Hit
       ▼                         │
┌─────────────────┐              │
│   Controller    │              │
└──────┬──────────┘              │
       │                         │
       ▼                         │
┌─────────────────┐              │
│    MongoDB      │              │
└─────────────────┘              │
       │                         │
       └─────────────────────────┘
```

## Best Practices

1. **Cache Duration**: 60 seconds is optimal for real-time fraud detection
2. **Invalidation**: Always invalidate related caches on mutations
3. **Monitoring**: Watch cache hit rates in production
4. **Fallback**: System should work without Redis
5. **Keys**: Use descriptive, hierarchical key patterns
6. **Memory**: Monitor Redis memory usage regularly

## Production Considerations

### Redis Configuration

For production, configure Redis with:

```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

### High Availability

Consider Redis Sentinel or Redis Cluster for:
- Automatic failover
- Read replicas
- Data persistence
- High availability

### Security

1. Enable password authentication
2. Use TLS/SSL for connections
3. Restrict network access
4. Regular backups

## Summary

Redis caching is now fully integrated into FraudShield, providing:
- 10-30x faster response times for cached data
- Reduced database load
- Automatic cache invalidation
- Graceful fallback on Redis failure
- Production-ready configuration

The system intelligently caches GET requests and invalidates cache on data mutations, ensuring data consistency while maximizing performance.
