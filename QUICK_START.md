# FraudShield - Quick Start

## ⚡ 3-Minute Setup

### 1. Install & Configure

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend  
npm install
```

**Configure MongoDB:**
- Create free cluster at https://cloud.mongodb.com/
- Whitelist your IP
- Update `backend/.env` with connection string

### 2. Start Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Login

- Open: http://localhost:5173
- Email: `admin@fraudshield.com`
- Password: `Admin@123`

## 🎯 What You Can Do

### 📊 Dashboard
Real-time transaction monitoring and statistics

### 💳 Transactions
View, search, and filter all transactions

### 🚨 Alerts
Monitor and manage fraud alerts

### 📈 Analytics
Analyze fraud patterns with charts

### 📋 Logs (Admin)
Track all admin activities
- 18 action types tracked
- Search and filter logs
- View detailed information
- See who did what and when

### 👥 Users (Admin)
Manage system users
- Block/unblock users
- View transaction history
- Delete users

### 💚 System Health (Admin)
Monitor system status in real-time
- Auto-refresh every 5 seconds
- Check all services
- Monitor memory usage

### 👤 Settings (Admin)
Update profile and password

## 🔧 Configuration

### Backend (.env)
```env
PORT=4001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
REDIS_ENABLED=false
KAFKA_ENABLED=false
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4001/api
```

## 🐛 Quick Fixes

**Cannot login?**
```bash
cd backend && npm run seed
```

**MongoDB error?**
- Whitelist IP at cloud.mongodb.com
- Check connection string

**Port conflict?**
- Backend uses 4001
- Frontend uses 5173

## 📚 Full Documentation

- `COMPLETE_USER_GUIDE.md` - Detailed user guide
- `HOW_TO_RUN.md` - Complete setup guide
- `TECH_STACK_GUIDE.md` - Technology stack
- Feature-specific guides in root folder

## ✅ Ready!

Your fraud detection system is running! 🚀
