# Alerts Module - Quick Test Guide

## ✅ What's Implemented

The Alerts module is **FULLY INTEGRATED** with automatic alert creation!

### Alert Creation Logic
- ✅ Automatically creates alerts when: `riskScore > 70 OR amount > 50000`
- ✅ Auto-determines severity (CRITICAL, HIGH, MEDIUM)
- ✅ Real-time WebSocket broadcasting
- ✅ Complete CRUD operations

## 🚀 Quick Test (5 Steps)

### Step 1: Start Server

```bash
cd backend
npm run dev
```

### Step 2: Create Transaction That Triggers Alert

**Test Case 1: High Risk Score (> 70)**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 1500.00,
    "riskScore": 85
  }'
```

**Expected Result:**
- ✅ Transaction created with status "FRAUD"
- ✅ Alert automatically created with severity "HIGH"
- ✅ WebSocket events broadcast

### Step 3: Verify Alert Was Created

```bash
curl http://localhost:4000/api/alerts
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "alerts": [
      {
        "id": "...",
        "transactionId": "TXN_...",
        "message": "HIGH: Suspicious transaction detected (Risk: 85, Amount: $1500)",
        "severity": "HIGH",
        "createdAt": "2024-02-12T...",
        "transactionAmount": 1500,
        "transactionRiskScore": 85,
        "userId": "user123",
        "status": "ACTIVE"
      }
    ],
    "pagination": {...},
    "stats": {
      "totalAlerts": 1,
      "activeAlerts": 1,
      "highCount": 1,
      ...
    }
  },
  "message": "Alerts retrieved successfully",
  "success": true
}
```

### Step 4: Test Different Alert Thresholds

**Test A: High Amount (> 50000)**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user456",
    "amount": 60000.00,
    "riskScore": 30
  }'
```
**Expected:** Alert created (amount > 50000) with MEDIUM severity

**Test B: Critical Risk Score (>= 90)**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user789",
    "amount": 2000.00,
    "riskScore": 95
  }'
```
**Expected:** Alert created with CRITICAL severity

**Test C: Below Thresholds (No Alert)**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user999",
    "amount": 100.00,
    "riskScore": 20
  }'
```
**Expected:** NO alert created (riskScore <= 70 AND amount <= 50000)

### Step 5: Test Alert Management

**Get All Alerts:**
```bash
curl http://localhost:4000/api/alerts
```

**Get Active Alerts Only:**
```bash
curl http://localhost:4000/api/alerts/active
```

**Get Critical Alerts:**
```bash
curl http://localhost:4000/api/alerts/critical
```

**Filter by Severity:**
```bash
curl "http://localhost:4000/api/alerts?severity=HIGH"
```

**Delete Alert (Admin):**
```bash
curl -X DELETE http://localhost:4000/api/alerts/ALERT_ID
```

## 📊 Alert Severity Matrix

| Risk Score | Amount | Severity | Message |
|------------|--------|----------|---------|
| >= 90 | Any | CRITICAL | CRITICAL: High-risk transaction detected |
| Any | > 100000 | CRITICAL | CRITICAL: High-risk transaction detected |
| >= 80 | Any | HIGH | HIGH: Suspicious transaction detected |
| Any | > 75000 | HIGH | HIGH: Suspicious transaction detected |
| > 70 | Any | MEDIUM | MEDIUM: Transaction requires review |
| Any | > 50000 | MEDIUM | MEDIUM: Transaction requires review |
| <= 70 | <= 50000 | - | No alert created |

## 🧪 Complete Test Scenarios

### Scenario 1: Critical Alert
```bash
# Create transaction
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_critical",
    "amount": 150000.00,
    "riskScore": 95,
    "description": "Large suspicious transaction"
  }'

# Check alerts
curl http://localhost:4000/api/alerts?severity=CRITICAL

# Expected: Alert with CRITICAL severity
```

### Scenario 2: Multiple Alerts
```bash
# Create 3 transactions with different risk levels
for i in {1..3}; do
  curl -X POST http://localhost:4000/api/transactions \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"user$i\",
      \"amount\": $((50000 + i * 10000)),
      \"riskScore\": $((70 + i * 10))
    }"
  echo ""
done

# Check all alerts
curl http://localhost:4000/api/alerts

# Expected: 3 alerts with different severities
```

### Scenario 3: Alert Lifecycle
```bash
# 1. Create transaction (creates alert)
RESPONSE=$(curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_lifecycle",
    "amount": 5000.00,
    "riskScore": 85
  }')

# 2. Get alert ID
curl http://localhost:4000/api/alerts | grep -o '"id":"[^"]*"' | head -1

# 3. Acknowledge alert
curl -X POST http://localhost:4000/api/alerts/ALERT_ID/acknowledge

# 4. Resolve alert
curl -X POST http://localhost:4000/api/alerts/ALERT_ID/resolve \
  -H "Content-Type: application/json" \
  -d '{"notes": "Investigated and resolved"}'

# 5. Check alert status
curl http://localhost:4000/api/alerts/ALERT_ID
```

## 🔍 Filtering Examples

**Get High and Critical Alerts:**
```bash
curl "http://localhost:4000/api/alerts?severity=HIGH&severity=CRITICAL"
```

**Get Active Alerts Only:**
```bash
curl "http://localhost:4000/api/alerts?status=ACTIVE"
```

**Get Alerts for Specific User:**
```bash
curl "http://localhost:4000/api/alerts?userId=user123"
```

**Get Alerts in Date Range:**
```bash
curl "http://localhost:4000/api/alerts?startDate=2024-01-01&endDate=2024-12-31"
```

**Pagination:**
```bash
curl "http://localhost:4000/api/alerts?page=1&limit=10"
```

**Sort by Severity:**
```bash
curl "http://localhost:4000/api/alerts?sortBy=severity&sortOrder=desc"
```

## 📈 Statistics

**Get Alert Statistics:**
```bash
curl http://localhost:4000/api/alerts/stats
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "data": {
    "totalAlerts": 10,
    "activeAlerts": 7,
    "criticalCount": 2,
    "highCount": 3,
    "mediumCount": 5,
    "lowCount": 0,
    "acknowledgedCount": 2,
    "resolvedCount": 1,
    "dismissedCount": 0
  },
  "message": "Alert statistics retrieved successfully",
  "success": true
}
```

## 🌐 WebSocket Testing

### Browser Console Test
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:4000/transactions');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event Type:', data.type);
  console.log('Payload:', data.payload);
  
  if (data.type === 'alert_created') {
    console.log('🚨 NEW ALERT:', data.payload.message);
    console.log('Severity:', data.payload.severity);
  }
};

// Now create a transaction in another terminal
// You should see the alert_created event in the console
```

## ✅ Success Criteria

After running the tests, you should see:

- ✅ Alerts automatically created when riskScore > 70
- ✅ Alerts automatically created when amount > 50000
- ✅ Correct severity levels assigned
- ✅ No alerts created for safe transactions
- ✅ Alerts can be retrieved with filters
- ✅ Alerts can be deleted
- ✅ WebSocket events broadcast in real-time
- ✅ Statistics calculated correctly

## 🐛 Troubleshooting

### No Alerts Created

**Problem:** Transaction created but no alert appears

**Check:**
1. Verify transaction meets criteria: `riskScore > 70 OR amount > 50000`
2. Check server logs for errors
3. Query alerts: `curl http://localhost:4000/api/alerts`

### WebSocket Not Working

**Problem:** Not receiving real-time events

**Solution:**
1. Ensure WebSocket connection is established
2. Check browser console for errors
3. Verify server is running on correct port

### Authentication Errors

**Problem:** 401 Unauthorized errors

**Solution:**
For testing, use mock authentication:
- Edit `backend/src/routes/alertRoutes.js`
- Change: `import { authenticate } from '../middleware/auth.js'`
- To: `import { mockAuthenticate as authenticate } from '../middleware/auth.js'`

## 📝 Summary

The Alerts module is fully functional with:
- ✅ Automatic alert creation based on risk criteria
- ✅ 10 API endpoints
- ✅ Real-time WebSocket updates
- ✅ Complete alert lifecycle management
- ✅ Filtering and pagination
- ✅ Statistics and analytics

Ready to integrate with your frontend!