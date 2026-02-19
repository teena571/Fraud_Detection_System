# API Quick Reference Card

## 🚀 Base URL
```
http://localhost:4000
```

## 🔐 Authentication
All endpoints (except /health) require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📦 Transaction APIs

### Create Transaction
```bash
POST /api/transactions
{
  "userId": "user123",
  "amount": 1500.00,
  "riskScore": 35
}
```

### Get All Transactions
```bash
GET /api/transactions?page=1&limit=10&status=FRAUD&minRiskScore=70
```

### Get Transaction by ID
```bash
GET /api/transactions/:id
```

### Update Transaction
```bash
PUT /api/transactions/:id
{
  "status": "FRAUD",
  "riskScore": 95
}
```

### Delete Transaction
```bash
DELETE /api/transactions/:id
```

### Get Statistics
```bash
GET /api/transactions/stats?timeframe=24h
```

---

## 🚨 Alert APIs

### Get All Alerts
```bash
GET /api/alerts?page=1&limit=20&severity=HIGH&status=ACTIVE
```

### Get Alert by ID
```bash
GET /api/alerts/:id
```

### Get Active Alerts
```bash
GET /api/alerts/active?limit=50
```

### Get Critical Alerts
```bash
GET /api/alerts/critical?limit=20
```

### Get Alerts by Transaction
```bash
GET /api/alerts/transaction/:transactionId
```

### Get Alert Statistics
```bash
GET /api/alerts/stats
```

### Acknowledge Alert
```bash
POST /api/alerts/:id/acknowledge
```

### Resolve Alert
```bash
POST /api/alerts/:id/resolve
{
  "notes": "Issue resolved"
}
```

### Dismiss Alert
```bash
POST /api/alerts/:id/dismiss
{
  "notes": "False positive"
}
```

### Delete Alert (Admin)
```bash
DELETE /api/alerts/:id
```

---

## 🔄 Alert Creation Logic

Alerts are automatically created when:
```
riskScore > 70  OR  amount > 50000
```

### Severity Levels
- **CRITICAL**: riskScore >= 90 OR amount > 100000
- **HIGH**: riskScore >= 80 OR amount > 75000
- **MEDIUM**: riskScore > 70 OR amount > 50000

---

## 📡 WebSocket

### Connect
```javascript
const ws = new WebSocket('ws://localhost:4000/transactions');
```

### Events
- `transaction` - New transaction
- `transaction_update` - Transaction updated
- `transaction_delete` - Transaction deleted
- `alert_created` - New alert
- `alert_acknowledged` - Alert acknowledged
- `alert_resolved` - Alert resolved
- `alert_dismissed` - Alert dismissed
- `alert_deleted` - Alert deleted

---

## 🧪 Quick Test Commands

### Test 1: Create High-Risk Transaction (Creates Alert)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","amount":5000,"riskScore":85}'
```

### Test 2: Check Alerts
```bash
curl http://localhost:4000/api/alerts
```

### Test 3: Get Active Alerts
```bash
curl http://localhost:4000/api/alerts/active
```

### Test 4: Get Critical Alerts
```bash
curl http://localhost:4000/api/alerts/critical
```

---

## 📊 Common Filters

### Transactions
```
?page=1
&limit=10
&status=FRAUD
&minRiskScore=70
&maxRiskScore=100
&minAmount=1000
&maxAmount=10000
&userId=user123
&startDate=2024-01-01
&endDate=2024-12-31
&sortBy=riskScore
&sortOrder=desc
&search=TXN123
```

### Alerts
```
?page=1
&limit=20
&severity=HIGH
&status=ACTIVE
&transactionId=TXN_123
&userId=user123
&startDate=2024-01-01
&endDate=2024-12-31
&sortBy=createdAt
&sortOrder=desc
```

---

## ✅ Response Format

### Success
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Success message",
  "success": true,
  "timestamp": "2024-02-12T..."
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "timestamp": "2024-02-12T...",
  "errors": [...]
}
```

---

## 🎯 Quick Examples

### Example 1: Create Safe Transaction (No Alert)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","amount":100,"riskScore":20}'
```
**Result:** Transaction created, NO alert

### Example 2: Create Suspicious Transaction (Alert)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId":"user2","amount":2500,"riskScore":75}'
```
**Result:** Transaction + MEDIUM alert

### Example 3: Create Fraud Transaction (Alert)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId":"user3","amount":5000,"riskScore":95}'
```
**Result:** Transaction + CRITICAL alert

### Example 4: Large Amount (Alert)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId":"user4","amount":60000,"riskScore":30}'
```
**Result:** Transaction + MEDIUM alert (amount > 50000)

---

## 📝 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🔧 For Testing Without Auth

Edit route files and change:
```javascript
import { authenticate } from '../middleware/auth.js'
```
To:
```javascript
import { mockAuthenticate as authenticate } from '../middleware/auth.js'
```

---

## 📚 Full Documentation

- **Transactions**: `TRANSACTION_MODULE.md`
- **Alerts**: `ALERTS_MODULE.md`
- **Testing**: `TEST_TRANSACTION_API.md`, `TEST_ALERTS.md`
- **Quick Start**: `QUICKSTART.md`
- **Summary**: `MODULE_SUMMARY.md`