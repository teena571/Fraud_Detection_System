# Alerts Module - Complete Implementation

## Overview

The Alerts module automatically creates alerts when transactions meet specific risk criteria. Alerts are generated in real-time and broadcast via WebSocket to connected clients.

## Alert Creation Logic

Alerts are automatically created when a transaction is saved if:
- **riskScore > 70** OR
- **amount > 50000**

### Severity Determination

The severity level is automatically assigned based on risk score and amount:

| Condition | Severity | Message |
|-----------|----------|---------|
| riskScore >= 90 OR amount > 100000 | CRITICAL | CRITICAL: High-risk transaction detected |
| riskScore >= 80 OR amount > 75000 | HIGH | HIGH: Suspicious transaction detected |
| riskScore > 70 OR amount > 50000 | MEDIUM | MEDIUM: Transaction requires review |

## Schema Fields

### Required Fields
- **transactionId** (String, indexed) - Associated transaction ID
- **message** (String, max: 500) - Alert message
- **severity** (Enum: LOW | MEDIUM | HIGH | CRITICAL, indexed) - Alert severity
- **createdAt** (Date, indexed, default: now) - Alert creation timestamp

### Additional Fields
- **transactionAmount** (Number) - Transaction amount for reference
- **transactionRiskScore** (Number, 0-100) - Transaction risk score
- **userId** (String, indexed) - User associated with transaction
- **status** (Enum: ACTIVE | ACKNOWLEDGED | RESOLVED | DISMISSED) - Alert status
- **acknowledgedBy** (String) - User who acknowledged the alert
- **acknowledgedAt** (Date) - Acknowledgment timestamp
- **resolvedBy** (String) - User who resolved/dismissed the alert
- **resolvedAt** (Date) - Resolution timestamp
- **notes** (String, max: 1000) - Additional notes
- **metadata** (Mixed) - Additional flexible data

## API Endpoints

### 1. GET /api/alerts
Get all alerts with pagination and filters

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `severity` (string or array) - Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `status` (string or array) - Filter by status (ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED)
- `transactionId` (string) - Filter by transaction ID
- `userId` (string) - Filter by user ID
- `startDate` (ISO 8601) - Start date filter
- `endDate` (ISO 8601) - End date filter
- `sortBy` (string) - Sort field (createdAt, severity, status, transactionAmount, transactionRiskScore)
- `sortOrder` (string) - Sort direction (asc, desc)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "alerts": [
      {
        "id": "...",
        "transactionId": "TXN_1234567890",
        "message": "HIGH: Suspicious transaction detected (Risk: 85, Amount: $5000)",
        "severity": "HIGH",
        "createdAt": "2024-02-12T10:30:00.000Z",
        "transactionAmount": 5000,
        "transactionRiskScore": 85,
        "userId": "user123",
        "status": "ACTIVE",
        "metadata": {...}
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false,
      "nextPage": 2,
      "prevPage": null
    },
    "stats": {
      "totalAlerts": 100,
      "activeAlerts": 45,
      "criticalCount": 10,
      "highCount": 20,
      "mediumCount": 50,
      "lowCount": 20,
      "acknowledgedCount": 30,
      "resolvedCount": 20,
      "dismissedCount": 5
    },
    "filters": {...}
  },
  "message": "Alerts retrieved successfully",
  "success": true
}
```

**Example Requests:**
```bash
# Get all alerts
GET /api/alerts

# Get critical alerts only
GET /api/alerts?severity=CRITICAL

# Get active high-severity alerts
GET /api/alerts?status=ACTIVE&severity=HIGH

# Get alerts for specific transaction
GET /api/alerts?transactionId=TXN_1234567890

# Get alerts in date range
GET /api/alerts?startDate=2024-01-01&endDate=2024-01-31

# Multiple filters with sorting
GET /api/alerts?severity=HIGH&severity=CRITICAL&status=ACTIVE&sortBy=createdAt&sortOrder=desc
```

### 2. DELETE /api/alerts/:id
Delete alert (Admin only)

**Parameters:**
- `id` (string) - Alert MongoDB ID

**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Alert deleted successfully",
  "success": true
}
```

**Real-time Event:**
```json
{
  "type": "alert_deleted",
  "payload": {
    "id": "65c9f1234567890abcdef123"
  }
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:4000/api/alerts/65c9f1234567890abcdef123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. GET /api/alerts/:id
Get single alert by ID

**Parameters:**
- `id` (string) - Alert MongoDB ID

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "id": "...",
    "transactionId": "TXN_1234567890",
    "message": "HIGH: Suspicious transaction detected",
    "severity": "HIGH",
    "createdAt": "2024-02-12T10:30:00.000Z",
    "status": "ACTIVE",
    ...
  },
  "message": "Alert retrieved successfully",
  "success": true
}
```

### 4. GET /api/alerts/active
Get active alerts only

**Query Parameters:**
- `limit` (number, default: 50, max: 100) - Maximum number of alerts

**Response:**
```json
{
  "statusCode": 200,
  "data": [...],
  "message": "Active alerts retrieved successfully",
  "success": true
}
```

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/alerts/active?limit=20"
```

### 5. GET /api/alerts/critical
Get critical and high-severity alerts

**Query Parameters:**
- `limit` (number, default: 20, max: 100) - Maximum number of alerts

**Response:**
```json
{
  "statusCode": 200,
  "data": [...],
  "message": "Critical alerts retrieved successfully",
  "success": true
}
```

### 6. GET /api/alerts/transaction/:transactionId
Get all alerts for a specific transaction

**Parameters:**
- `transactionId` (string) - Transaction ID

**Response:**
```json
{
  "statusCode": 200,
  "data": [...],
  "message": "Transaction alerts retrieved successfully",
  "success": true
}
```

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/alerts/transaction/TXN_1234567890
```

### 7. GET /api/alerts/stats
Get alert statistics

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "totalAlerts": 100,
    "activeAlerts": 45,
    "criticalCount": 10,
    "highCount": 20,
    "mediumCount": 50,
    "lowCount": 20,
    "acknowledgedCount": 30,
    "resolvedCount": 20,
    "dismissedCount": 5
  },
  "message": "Alert statistics retrieved successfully",
  "success": true
}
```

### 8. POST /api/alerts/:id/acknowledge
Acknowledge an alert

**Parameters:**
- `id` (string) - Alert MongoDB ID

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "id": "...",
    "status": "ACKNOWLEDGED",
    "acknowledgedBy": "user123",
    "acknowledgedAt": "2024-02-12T11:00:00.000Z",
    ...
  },
  "message": "Alert acknowledged successfully",
  "success": true
}
```

**Real-time Event:**
```json
{
  "type": "alert_acknowledged",
  "payload": {...}
}
```

### 9. POST /api/alerts/:id/resolve
Resolve an alert

**Parameters:**
- `id` (string) - Alert MongoDB ID

**Request Body:**
```json
{
  "notes": "Issue resolved after investigation"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "id": "...",
    "status": "RESOLVED",
    "resolvedBy": "user123",
    "resolvedAt": "2024-02-12T11:30:00.000Z",
    "notes": "Issue resolved after investigation",
    ...
  },
  "message": "Alert resolved successfully",
  "success": true
}
```

**Real-time Event:**
```json
{
  "type": "alert_resolved",
  "payload": {...}
}
```

### 10. POST /api/alerts/:id/dismiss
Dismiss an alert

**Parameters:**
- `id` (string) - Alert MongoDB ID

**Request Body:**
```json
{
  "notes": "False positive"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "id": "...",
    "status": "DISMISSED",
    "resolvedBy": "user123",
    "resolvedAt": "2024-02-12T11:30:00.000Z",
    "notes": "False positive",
    ...
  },
  "message": "Alert dismissed successfully",
  "success": true
}
```

## Automatic Alert Creation

Alerts are automatically created when transactions are saved. The process:

1. Transaction is created via `POST /api/transactions`
2. Transaction is saved to database
3. Alert creation logic checks: `riskScore > 70 OR amount > 50000`
4. If conditions met, alert is created with appropriate severity
5. Alert is broadcast via WebSocket to all connected clients
6. Transaction creation response is sent

### Example Flow

**Create High-Risk Transaction:**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 5000.00,
    "riskScore": 85
  }'
```

**Result:**
1. Transaction created with status "FRAUD" (auto-determined from riskScore >= 80)
2. Alert automatically created with severity "HIGH"
3. WebSocket events broadcast:
   - `transaction` event with transaction data
   - `alert_created` event with alert data

**Check Alerts:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/alerts?transactionId=TXN_...
```

## Model Features

### Indexes
- `transactionId`
- `severity`
- `status`
- `userId`
- `createdAt`
- Compound: `status + severity + createdAt`
- Compound: `status + createdAt`
- Compound: `severity + createdAt`
- Compound: `transactionId + createdAt`
- Compound: `userId + createdAt`

### Static Methods
- `createFromTransaction(transaction)` - Auto-create alert from transaction
- `getActiveAlerts(limit)` - Get active alerts
- `getCriticalAlerts(limit)` - Get critical/high severity alerts
- `getAlertsByTransaction(transactionId)` - Get alerts for transaction
- `getAlertStats()` - Get aggregated statistics

### Instance Methods
- `acknowledge(userId)` - Mark alert as acknowledged
- `resolve(userId, notes)` - Mark alert as resolved
- `dismiss(userId, notes)` - Mark alert as dismissed

## Real-time WebSocket Events

### Alert Created
```json
{
  "type": "alert_created",
  "payload": {
    "id": "...",
    "transactionId": "TXN_...",
    "message": "HIGH: Suspicious transaction detected",
    "severity": "HIGH",
    ...
  }
}
```

### Alert Acknowledged
```json
{
  "type": "alert_acknowledged",
  "payload": {...}
}
```

### Alert Resolved
```json
{
  "type": "alert_resolved",
  "payload": {...}
}
```

### Alert Dismissed
```json
{
  "type": "alert_dismissed",
  "payload": {...}
}
```

### Alert Deleted
```json
{
  "type": "alert_deleted",
  "payload": {
    "id": "65c9f1234567890abcdef123"
  }
}
```

## Authentication & Authorization

### Authentication
All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authorization
- **All Users**: Can view alerts (GET endpoints)
- **All Users**: Can acknowledge, resolve, dismiss alerts
- **Admin Only**: Can delete alerts (DELETE endpoint)

## Testing

### Test Alert Creation

**Step 1: Create High-Risk Transaction**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 5000.00,
    "riskScore": 85
  }'
```

**Step 2: Check Alerts**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/alerts
```

**Expected:** Alert with severity "HIGH" should be created

### Test Alert Thresholds

**Test 1: Risk Score > 70**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user456",
    "amount": 100.00,
    "riskScore": 75
  }'
```
**Expected:** Alert created (riskScore > 70)

**Test 2: Amount > 50000**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user789",
    "amount": 60000.00,
    "riskScore": 30
  }'
```
**Expected:** Alert created (amount > 50000)

**Test 3: Below Thresholds**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user999",
    "amount": 100.00,
    "riskScore": 20
  }'
```
**Expected:** No alert created (riskScore <= 70 AND amount <= 50000)

### Test Alert Actions

**Acknowledge Alert:**
```bash
curl -X POST http://localhost:4000/api/alerts/ALERT_ID/acknowledge \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resolve Alert:**
```bash
curl -X POST http://localhost:4000/api/alerts/ALERT_ID/resolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"notes": "Investigated and resolved"}'
```

**Delete Alert:**
```bash
curl -X DELETE http://localhost:4000/api/alerts/ALERT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration with Frontend

### Connect to WebSocket
```javascript
const ws = new WebSocket('ws://localhost:4000/transactions');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'alert_created') {
    // Show notification
    showNotification(data.payload.message, data.payload.severity);
    
    // Update alerts list
    addAlertToList(data.payload);
  }
};
```

### Fetch Alerts
```javascript
const response = await fetch('http://localhost:4000/api/alerts?status=ACTIVE', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
console.log('Active alerts:', data.alerts);
console.log('Statistics:', data.stats);
```

## Summary

✅ **Automatic Alert Creation**
- Triggered when riskScore > 70 OR amount > 50000
- Severity auto-determined based on risk level
- Real-time WebSocket broadcasting

✅ **Complete API**
- GET /api/alerts - List with filters
- DELETE /api/alerts/:id - Delete alert
- Plus 8 additional endpoints for management

✅ **Advanced Features**
- Pagination and filtering
- Alert lifecycle (Active → Acknowledged → Resolved/Dismissed)
- Statistics and analytics
- Real-time updates
- Audit trail

✅ **Production Ready**
- Input validation
- Error handling
- Authentication & authorization
- Performance indexes
- Comprehensive documentation

The Alerts module is fully integrated with the Transaction module and ready for use!