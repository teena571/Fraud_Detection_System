# System Health Dashboard - Quick Start

## 🚀 Quick Access

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login as admin at http://localhost:5173/login
4. Click "System Health" (💚) in sidebar

## 📊 What You'll See

### Status Cards
- **Backend** - Uptime, memory usage, environment
- **MongoDB** - Connection status, host, database
- **Redis** - Connection, latency, memory (or disabled)
- **Kafka** - Brokers, controller (or disabled)
- **WebSocket** - Active connections count
- **Connections** - Summary of all service connections

### Status Colors
- 🟢 Green (✅) - Healthy
- 🟡 Yellow (⚠️) - Degraded
- 🔴 Red (❌) - Unhealthy
- ⚪ Gray (⏸️) - Disabled

## 🔄 Auto-Refresh

- Updates every 5 seconds automatically
- Shows "Last updated" timestamp
- Continues in background

## 🔧 Configuration

### Enable Redis
```env
# backend/.env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Enable Kafka
```env
# backend/.env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

## 📡 API Endpoint

```bash
GET /api/admin/health
Authorization: Bearer <JWT_TOKEN>
```

## 🎯 Key Features

- ✅ Real-time monitoring
- ✅ Auto-refresh every 5s
- ✅ Memory usage bar
- ✅ Connection indicators
- ✅ Responsive design
- ✅ Admin-only access

## 📁 Files

### Backend
- `backend/src/controllers/healthController.js`
- `backend/src/routes/adminRoutes.js`

### Frontend
- `frontend/src/components/SystemHealth.jsx`
- `frontend/src/pages/Health.jsx`

### Routes
- Frontend: `/health`
- API: `/api/admin/health`

## 🧪 Quick Test

1. Open dashboard
2. Check all services show status
3. Wait 5 seconds - timestamp updates
4. Open new tab - WebSocket count increases
5. Close tab - WebSocket count decreases

## 📚 Documentation

- `SYSTEM_HEALTH_GUIDE.md` - Complete guide
- `SYSTEM_HEALTH_TEST_CHECKLIST.md` - Testing checklist
- `SYSTEM_HEALTH_COMPLETION.md` - Implementation details

## ✅ Status: READY TO USE

All features implemented and tested. No errors found.
