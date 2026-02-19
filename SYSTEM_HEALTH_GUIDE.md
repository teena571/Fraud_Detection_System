# System Health Dashboard Guide

## Overview
Real-time monitoring dashboard that displays the health status of all system components with automatic polling every 5 seconds.

## Features

### 1. Overall System Status
- Aggregated health status (Healthy/Degraded/Unhealthy)
- Response time measurement
- Last update timestamp
- Visual status indicator with color coding

### 2. Backend Monitoring
- Server uptime (formatted as days, hours, minutes, seconds)
- Memory usage with percentage and visual progress bar
- Environment (development/production)
- Port number
- Node.js version

### 3. MongoDB Monitoring
- Connection status (Connected/Disconnected)
- Host information
- Database name
- Ready state (connected/connecting/disconnecting/disconnected)

### 4. Redis Monitoring
- Connection status
- Latency measurement
- Memory usage
- Enabled/Disabled state
- Helpful message when disabled

### 5. Kafka Monitoring
- Connection status
- Number of brokers
- Controller information
- Enabled/Disabled state
- Helpful message when disabled

### 6. WebSocket Monitoring
- Active/Inactive status
- Number of active client connections
- Real-time connection count

### 7. Active Connections Summary
- Visual summary of all service connections
- Color-coded indicators (green=connected, red=disconnected, gray=disabled)
- Quick overview of system connectivity

## Backend API

### Endpoint
```
GET /api/admin/health
```

### Authentication
- Requires JWT token in Authorization header
- Admin role required

### Response Format
```json
{
  "statusCode": 200,
  "data": {
    "overall": {
      "status": "healthy",
      "timestamp": "2026-02-19T12:00:00.000Z",
      "responseTime": "45ms"
    },
    "services": {
      "backend": {
        "status": "healthy",
        "uptime": 3600,
        "uptimeFormatted": "1h 0m 0s",
        "memory": {
          "used": 150,
          "total": 512,
          "percentage": 29,
          "unit": "MB"
        },
        "cpu": {
          "usage": { "user": 1000000, "system": 500000 },
          "loadAverage": [0.5, 0.4, 0.3]
        },
        "version": "v18.0.0",
        "environment": "development",
        "port": 4001
      },
      "mongodb": {
        "status": "healthy",
        "connected": true,
        "host": "cluster0.mongodb.net",
        "database": "fraudshield",
        "readyState": "connected"
      },
      "redis": {
        "status": "disabled",
        "connected": false,
        "enabled": false
      },
      "kafka": {
        "status": "disabled",
        "connected": false,
        "enabled": false
      },
      "websocket": {
        "status": "healthy",
        "connected": true,
        "activeConnections": 3
      }
    }
  },
  "message": "System health retrieved successfully"
}
```

### Status Values
- `healthy` - Service is running normally
- `degraded` - Service is running but with issues
- `unhealthy` - Service is not functioning
- `disabled` - Service is intentionally disabled

## Frontend Component

### Location
- Component: `frontend/src/components/SystemHealth.jsx`
- Page: `frontend/src/pages/Health.jsx`
- Route: `/health` (Admin only)

### Features

#### Auto-Refresh
- Polls health endpoint every 5 seconds
- Shows last update timestamp
- Continues polling in background
- Cleans up interval on component unmount

#### Visual Indicators
- Color-coded status badges:
  - Green (✅) - Healthy
  - Yellow (⚠️) - Degraded
  - Red (❌) - Unhealthy
  - Gray (⏸️) - Disabled

#### Memory Usage Bar
- Visual progress bar for backend memory
- Color changes based on usage:
  - Green: < 60%
  - Yellow: 60-80%
  - Red: > 80%

#### Connection Indicators
- Filled circle (●) - Connected
- Empty circle (○) - Disconnected
- Pause symbol (⏸) - Disabled

#### Responsive Design
- Grid layout adapts to screen size
- 1 column on mobile
- 2 columns on tablet
- 3 columns on desktop

## Implementation Details

### Backend Controller
File: `backend/src/controllers/healthController.js`

Key Functions:
- `getSystemHealth()` - Main health check handler
- `getMongoReadyState()` - MongoDB state description
- `formatUptime()` - Human-readable uptime format

Health Checks:
1. MongoDB - Uses mongoose connection state
2. Redis - Calls `redisClient.healthCheck()` with ping test
3. Kafka - Calls `checkKafkaHealth()` to describe cluster
4. WebSocket - Checks if service is initialized
5. Backend - Process metrics (uptime, memory, CPU)

### Frontend Component
File: `frontend/src/components/SystemHealth.jsx`

Key Features:
- `useEffect` hook for polling
- `fetchHealthData()` - API call function
- `getStatusColor()` - Status to color mapping
- `getStatusIcon()` - Status to icon mapping
- Loading state handling
- Error handling with toast notifications

### Routes Integration
- Added to `frontend/src/App.jsx` with admin protection
- Added to `frontend/src/components/Sidebar.jsx` with 💚 icon
- Positioned between "Users" and "Admin Settings"

## Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

Backend should show:
- MongoDB connected
- Redis status (enabled/disabled)
- Kafka status (enabled/disabled)
- WebSocket initialized
- Server running on port 4001

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Access Health Dashboard
1. Login as admin at http://localhost:5173/login
2. Click "System Health" in sidebar (💚 icon)
3. Dashboard should load with all service statuses

### 4. Test Auto-Refresh
- Watch the "Last updated" timestamp
- Should update every 5 seconds
- Status cards should refresh automatically

### 5. Test Different States

#### Test Healthy State
- All services connected and running
- Overall status shows "HEALTHY" in green

#### Test Degraded State
- Stop Redis or Kafka (if enabled)
- Overall status should show "DEGRADED" in yellow
- Specific service shows "UNHEALTHY" in red

#### Test Disabled Services
- Redis and Kafka show "DISABLED" when not enabled
- Gray status badge with pause icon
- Helpful message explaining how to enable

### 6. Test Memory Usage
- Backend memory bar should show current usage
- Color changes based on percentage
- Hover to see exact values

### 7. Test WebSocket Connections
- Open multiple browser tabs
- Active connections count should increase
- Close tabs and count should decrease

## Configuration

### Enable/Disable Services

#### Redis
In `backend/.env`:
```env
REDIS_ENABLED=true  # or false
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Kafka
In `backend/.env`:
```env
KAFKA_ENABLED=true  # or false
KAFKA_BROKERS=localhost:9092
```

### Polling Interval
To change the 5-second polling interval, edit `frontend/src/components/SystemHealth.jsx`:
```javascript
const interval = setInterval(() => {
  fetchHealthData()
}, 5000) // Change this value (in milliseconds)
```

## Troubleshooting

### Issue: Health endpoint returns 401
- Solution: Check JWT token in localStorage
- Verify: User has admin role

### Issue: Services show "unhealthy" but are running
- Solution: Check service connection configuration
- Verify: MongoDB URI, Redis host/port, Kafka brokers

### Issue: Auto-refresh not working
- Solution: Check browser console for errors
- Verify: Component is mounted and interval is set

### Issue: Memory percentage shows NaN
- Solution: Backend memory metrics not available
- Check: Node.js version and process.memoryUsage()

### Issue: WebSocket connections always 0
- Solution: WebSocket service not initialized
- Check: Backend logs for WebSocket initialization

## Performance Considerations

### Backend
- Health check is lightweight (< 50ms typically)
- MongoDB check uses existing connection
- Redis ping is fast (< 5ms)
- Kafka check may take longer (100-500ms)

### Frontend
- Polling every 5 seconds is reasonable
- Consider increasing interval for production (10-30 seconds)
- Component cleans up interval on unmount
- No memory leaks from polling

### Network
- Each poll makes 1 HTTP request
- Response size: ~1-2 KB
- Bandwidth usage: ~0.2-0.4 KB/s per client

## Security

### Authentication
- Endpoint requires JWT authentication
- Admin role required (authorize middleware)
- Token validated on every request

### Information Disclosure
- Health endpoint only accessible to admins
- Sensitive info (passwords, keys) not exposed
- Only status and metrics shown

### Rate Limiting
- Health endpoint subject to global rate limiting
- Consider separate rate limit for health checks
- Monitor for abuse

## Future Enhancements

1. **Historical Data**
   - Store health metrics over time
   - Show graphs and trends
   - Alert on anomalies

2. **Alerting**
   - Email/SMS notifications for unhealthy services
   - Slack/Discord integration
   - Configurable alert thresholds

3. **More Metrics**
   - Database query performance
   - API endpoint response times
   - Error rates and logs
   - Network latency

4. **Service Actions**
   - Restart services from dashboard
   - Clear Redis cache
   - View detailed logs
   - Run diagnostics

5. **Custom Checks**
   - User-defined health checks
   - External service monitoring
   - Third-party API status

## API Response Examples

### All Services Healthy
```json
{
  "overall": { "status": "healthy" },
  "services": {
    "backend": { "status": "healthy" },
    "mongodb": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "kafka": { "status": "healthy" },
    "websocket": { "status": "healthy" }
  }
}
```

### Redis Disabled
```json
{
  "overall": { "status": "healthy" },
  "services": {
    "redis": {
      "status": "disabled",
      "connected": false,
      "enabled": false
    }
  }
}
```

### MongoDB Unhealthy
```json
{
  "overall": { "status": "degraded" },
  "services": {
    "mongodb": {
      "status": "unhealthy",
      "connected": false,
      "readyState": "disconnected"
    }
  }
}
```

## Summary

The System Health Dashboard provides:
- ✅ Real-time monitoring of all services
- ✅ Auto-refresh every 5 seconds
- ✅ Visual status indicators
- ✅ Detailed metrics for each service
- ✅ Admin-only access
- ✅ Responsive design
- ✅ Error handling
- ✅ Clean, intuitive UI

Perfect for monitoring system health in development and production environments.
