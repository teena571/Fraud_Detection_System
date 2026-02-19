# Transaction API Testing Guide

## Prerequisites

1. **Start MongoDB**:
```bash
mongod
```

2. **Install Dependencies**:
```bash
cd backend
npm install
```

3. **Configure Environment**:
Create `.env` file in backend directory:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/fraudshield
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key-change-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start Server**:
```bash
npm run dev
```

Server should start on http://localhost:4000

## Test Sequence

### 1. Health Check (No Auth Required)

```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "FraudShield API is running",
  "timestamp": "2024-02-12T...",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Create Transaction (Requires Auth)

**Note:** The backend uses JWT authentication. For testing, you can:
- Use a valid JWT token if you have authentication set up
- Temporarily disable auth by modifying the routes
- Use the mock authentication middleware

**With Auth Token:**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 1500.00,
    "riskScore": 35,
    "description": "Test transaction",
    "merchantId": "merchant456",
    "paymentMethod": "CREDIT_CARD"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 201,
  "data": {
    "id": "...",
    "transactionId": "TXN_...",
    "userId": "user123",
    "amount": 1500,
    "timestamp": "2024-02-12T...",
    "status": "SAFE",
    "riskScore": 35,
    "description": "Test transaction",
    "merchantId": "merchant456",
    "paymentMethod": "CREDIT_CARD",
    "createdAt": "2024-02-12T...",
    "updatedAt": "2024-02-12T..."
  },
  "message": "Transaction created successfully",
  "success": true,
  "timestamp": "2024-02-12T..."
}
```

### 3. Create High-Risk Transaction

```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user456",
    "amount": 5000.00,
    "riskScore": 85,
    "description": "High-risk transaction",
    "paymentMethod": "DIGITAL_WALLET"
  }'
```

**Expected:** Status should be auto-set to "FRAUD" (riskScore >= 80)

### 4. Create Suspicious Transaction

```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user789",
    "amount": 2500.00,
    "riskScore": 65,
    "description": "Suspicious transaction"
  }'
```

**Expected:** Status should be auto-set to "SUSPICIOUS" (riskScore >= 50)

### 5. Get All Transactions

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/transactions
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "transactions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 3,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false,
      "nextPage": null,
      "prevPage": null
    },
    "summary": {
      "totalAmount": 9000,
      "avgAmount": 3000,
      "avgRiskScore": 61.67,
      "safeCount": 1,
      "suspiciousCount": 1,
      "fraudCount": 1
    },
    "filters": {...}
  },
  "message": "Transactions retrieved successfully",
  "success": true
}
```

### 6. Get Transactions with Filters

**Filter by Status:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?status=FRAUD"
```

**Filter by Risk Score:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?minRiskScore=70"
```

**Filter by Amount Range:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?minAmount=1000&maxAmount=3000"
```

**Multiple Filters:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?status=SUSPICIOUS&minRiskScore=50&sortBy=riskScore&sortOrder=desc"
```

**Pagination:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?page=1&limit=5"
```

**Search:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?search=user123"
```

### 7. Get Single Transaction

**By Transaction ID:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/transactions/TXN_1234567890
```

**By MongoDB ID:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/transactions/65c9f1234567890abcdef123
```

### 8. Update Transaction

```bash
curl -X PUT http://localhost:4000/api/transactions/TXN_1234567890 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "FRAUD",
    "riskScore": 95,
    "description": "Updated: Confirmed fraudulent activity"
  }'
```

### 9. Get Transaction Statistics

```bash
# Last 24 hours
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4000/api/transactions/stats

# Last 7 days
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions/stats?timeframe=7d"
```

### 10. Delete Transaction

```bash
curl -X DELETE http://localhost:4000/api/transactions/TXN_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Without Authentication

If you want to test without setting up authentication, you can temporarily modify the routes file:

**Edit `backend/src/routes/transactionRoutes.js`:**

Replace:
```javascript
import { authenticate } from '../middleware/auth.js'
```

With:
```javascript
import { mockAuthenticate as authenticate } from '../middleware/auth.js'
```

This will use mock authentication for testing purposes.

## WebSocket Testing

### Using Browser Console

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:4000/transactions');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

### Expected WebSocket Events

When you create a transaction via API, you should receive:
```json
{
  "type": "transaction",
  "payload": {
    "transactionId": "TXN_...",
    "userId": "user123",
    "amount": 1500,
    ...
  }
}
```

When you update a transaction:
```json
{
  "type": "transaction_update",
  "payload": {...}
}
```

When you delete a transaction:
```json
{
  "type": "transaction_delete",
  "payload": {
    "id": "TXN_..."
  }
}
```

## Validation Testing

### Test Invalid Data

**Missing Required Field:**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1500.00
  }'
```

**Expected:** 400 error with validation message about missing userId

**Invalid Amount:**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": -100
  }'
```

**Expected:** 400 error about negative amount

**Invalid Risk Score:**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 1500,
    "riskScore": 150
  }'
```

**Expected:** 400 error about risk score range (0-100)

**Invalid Status:**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 1500,
    "status": "INVALID_STATUS"
  }'
```

**Expected:** 400 error about invalid status value

## Performance Testing

### Create Multiple Transactions

```bash
# Create 10 transactions
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/transactions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d "{
      \"userId\": \"user$i\",
      \"amount\": $((RANDOM % 5000 + 100)),
      \"riskScore\": $((RANDOM % 100))
    }"
  echo ""
done
```

### Test Pagination

```bash
# Get first page
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?page=1&limit=5"

# Get second page
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/transactions?page=2&limit=5"
```

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Check MongoDB URI in `.env` file
3. Verify MongoDB is listening on port 27017

### Authentication Error

**Error:** `401 Unauthorized`

**Solution:**
1. Check if JWT token is valid
2. Ensure Authorization header is set correctly
3. For testing, use mock authentication (see above)

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

Or change PORT in `.env` file

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

## Success Criteria

✅ Health check returns 200
✅ Can create transactions with auto-generated IDs
✅ Status is auto-determined from risk score
✅ Can retrieve transactions with pagination
✅ Filters work correctly (status, risk score, amount, date)
✅ Search functionality works
✅ Can get single transaction by ID
✅ Can update transaction
✅ Can delete transaction
✅ Statistics endpoint returns aggregated data
✅ WebSocket broadcasts events in real-time
✅ Validation errors are returned correctly
✅ Summary statistics are calculated correctly

## Next Steps

1. Set up proper authentication system
2. Connect frontend to these APIs
3. Add more test cases
4. Set up automated testing with Jest
5. Add API documentation with Swagger
6. Implement rate limiting per user
7. Add logging and monitoring