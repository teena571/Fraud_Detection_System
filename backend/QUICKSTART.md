# Backend Quick Start Guide

## ✅ Transaction Module Status

The Transaction module is **FULLY IMPLEMENTED** and ready to use!

### What's Included:
- ✅ Complete Transaction Model with validation
- ✅ 6 API endpoints (GET, POST, PUT, DELETE, Stats)
- ✅ Pagination and filtering
- ✅ Real-time WebSocket updates
- ✅ Input validation
- ✅ Error handling
- ✅ MVC architecture

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs:
- express, mongoose, cors, helmet
- jsonwebtoken, express-validator
- ws (WebSocket), compression
- And more...

### Step 2: Configure Environment

Create `.env` file in the `backend` directory:

```bash
# Copy this content to backend/.env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/fraudshield
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key-change-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Start MongoDB & Server

**Terminal 1 - Start MongoDB:**
```bash
mongod
```

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 4000
📊 WebSocket available at ws://localhost:4000/transactions
🌍 Environment: development
```

## 🧪 Test It Works

### Test 1: Health Check
```bash
curl http://localhost:4000/health
```

**Expected:** JSON response with `"success": true`

### Test 2: Create Transaction

**Option A - With Mock Auth (for testing):**

Edit `backend/src/routes/transactionRoutes.js` line 3:
```javascript
// Change this:
import { authenticate } from '../middleware/auth.js'

// To this:
import { mockAuthenticate as authenticate } from '../middleware/auth.js'
```

Then restart server and run:
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 1500.00,
    "riskScore": 35
  }'
```

**Option B - With Real Auth:**
You'll need a valid JWT token. See authentication setup in the main README.

### Test 3: Get Transactions
```bash
curl http://localhost:4000/api/transactions
```

## 📋 Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no auth) |
| GET | `/api/transactions` | Get all transactions with filters |
| GET | `/api/transactions/:id` | Get single transaction |
| POST | `/api/transactions` | Create new transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/stats` | Get statistics |

## 📖 Full Documentation

- **API Details**: See `TRANSACTION_MODULE.md`
- **Testing Guide**: See `TEST_TRANSACTION_API.md`
- **Main README**: See `README.md`

## 🔧 Common Issues

### Issue: MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Fix:**
```bash
# Start MongoDB
mongod

# Or if using Windows service:
net start MongoDB
```

### Issue: Port 4000 Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Fix:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9

# Or change PORT in .env file
```

### Issue: Dependencies Not Installed

**Error:** `Cannot find module 'express'`

**Fix:**
```bash
cd backend
npm install
```

## 🎯 Next Steps

1. ✅ Backend is running
2. 🔄 Test the API endpoints (see TEST_TRANSACTION_API.md)
3. 🌐 Connect your React frontend
4. 🔐 Set up proper authentication
5. 📊 Test WebSocket real-time updates

## 💡 Quick Examples

### Create a Safe Transaction
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 100.00,
    "riskScore": 10
  }'
```
Status will be auto-set to "SAFE"

### Create a Suspicious Transaction
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user456",
    "amount": 2500.00,
    "riskScore": 65
  }'
```
Status will be auto-set to "SUSPICIOUS" (riskScore >= 50)

### Create a Fraud Transaction
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user789",
    "amount": 5000.00,
    "riskScore": 95
  }'
```
Status will be auto-set to "FRAUD" (riskScore >= 80)

### Get High-Risk Transactions
```bash
curl "http://localhost:4000/api/transactions?minRiskScore=70&status=FRAUD"
```

### Get Transactions with Pagination
```bash
curl "http://localhost:4000/api/transactions?page=1&limit=10&sortBy=riskScore&sortOrder=desc"
```

## 🎉 You're Ready!

The Transaction module is complete and working. Start creating transactions and building your fraud detection system!

For detailed API documentation, see `TRANSACTION_MODULE.md`