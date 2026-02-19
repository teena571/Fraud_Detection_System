# Transaction Module - Complete Implementation

## Overview

The Transaction module is fully implemented with MVC architecture, providing comprehensive CRUD operations, advanced filtering, pagination, and real-time WebSocket updates.

## Schema Fields

### Required Fields
- **transactionId** (String, unique, indexed) - Unique transaction identifier
- **userId** (String, indexed) - User who made the transaction
- **amount** (Number, min: 0) - Transaction amount
- **timestamp** (Date, indexed, default: now) - Transaction timestamp
- **status** (Enum: SAFE | SUSPICIOUS | FRAUD, indexed) - Transaction status
- **riskScore** (Number, 0-100) - Fraud risk score

### Optional Fields
- **description** (String, max: 500) - Transaction description
- **merchantId** (String, indexed) - Merchant identifier
- **paymentMethod** (Enum) - Payment method type
- **location** (Object) - Geographic information
  - country (String)
  - city (String)
  - ipAddress (String)
- **metadata** (Mixed) - Additional flexible data

### Audit Fields
- **createdAt** (Date) - Creation timestamp
- **updatedAt** (Date) - Last update timestamp
- **createdBy** (String) - Creator identifier
- **updatedBy** (String) - Last updater identifier

## API Endpoints

### 1. GET /api/transactions
Get all transactions with pagination and filters

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `status` (string or array) - Filter by status (SAFE, SUSPICIOUS, FRAUD)
- `userId` (string) - Filter by user ID
- `minAmount` (number) - Minimum amount
- `maxAmount` (number) - Maximum amount
- `minRiskScore` (number, 0-100) - Minimum risk score
- `maxRiskScore` (number, 0-100) - Maximum risk score
- `startDate` (ISO 8601) - Start date filter
- `endDate` (ISO 8601) - End date filter
- `sortBy` (string) - Sort field (timestamp, amount, riskScore, status, createdAt)
- `sortOrder` (string) - Sort direction (asc, desc)
- `search` (string) - Search in transactionId, userId, description

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "transactions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalCount": 100,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false,
      "nextPage": 2,
      "prevPage": null
    },
    "summary": {
      "totalAmount": 50000,
      "avgAmount": 500,
      "avgRiskScore": 35,
      "safeCount": 70,
      "suspiciousCount": 20,
      "fraudCount": 10
    },
    "filters": {...}
  },
  "message": "Transactions retrieved successfully",
  "success": true,
  "timestamp": "2024-02-12T..."
}
```

**Example Requests:**
```bash
# Get all transactions (page 1, 10 items)
GET /api/transactions

# Get high-risk transactions
GET /api/transactions?minRiskScore=70&status=FRAUD

# Get transactions for specific user
GET /api/transactions?userId=user123&page=1&limit=20

# Get transactions in date range
GET /api/transactions?startDate=2024-01-01&endDate=2024-01-31

# Search transactions
GET /api/transactions?search=TXN123

# Multiple filters
GET /api/transactions?status=SUSPICIOUS&minAmount=1000&maxAmount=5000&sortBy=riskScore&sortOrder=desc
```

### 2. GET /api/transactions/:id
Get single transaction by ID

**Parameters:**
- `id` (string) - Transaction ID or MongoDB _id

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "id": "...",
    "transactionId": "TXN_1234567890",
    "userId": "user123",
    "amount": 1500.00,
    "timestamp": "2024-02-12T10:30:00.000Z",
    "status": "SUSPICIOUS",
    "riskScore": 65,
    "description": "Online purchase",
    "merchantId": "merchant456",
    "paymentMethod": "CREDIT_CARD",
    "location": {
      "country": "USA",
      "city": "New York",
      "ipAddress": "192.168.1.1"
    },
    "createdAt": "2024-02-12T10:30:00.000Z",
    "updatedAt": "2024-02-12T10:30:00.000Z"
  },
  "message": "Transaction retrieved successfully",
  "success": true
}
```

**Example Requests:**
```bash
# Get by MongoDB ID
GET /api/transactions/65c9f1234567890abcdef123

# Get by transaction ID
GET /api/transactions/TXN_1234567890
```

### 3. POST /api/transactions
Create new transaction

**Request Body:**
```json
{
  "userId": "user123",
  "amount": 1500.00,
  "transactionId": "TXN_1234567890",  // Optional, auto-generated if not provided
  "timestamp": "2024-02-12T10:30:00.000Z",  // Optional, defaults to now
  "status": "SAFE",  // Optional, auto-determined from riskScore
  "riskScore": 35,  // Optional, defaults to 0
  "description": "Online purchase",  // Optional
  "merchantId": "merchant456",  // Optional
  "paymentMethod": "CREDIT_CARD",  // Optional
  "location": {  // Optional
    "country": "USA",
    "city": "New York",
    "ipAddress": "192.168.1.1"
  },
  "metadata": {}  // Optional
}
```

**Validation Rules:**
- `userId`: Required, string, 1-100 characters
- `amount`: Required, number, >= 0, <= 1,000,000
- `transactionId`: Optional, string, 1-100 characters, must be unique
- `timestamp`: Optional, valid ISO 8601 date
- `status`: Optional, one of: SAFE, SUSPICIOUS, FRAUD
- `riskScore`: Optional, number, 0-100
- `description`: Optional, string, max 500 characters
- `merchantId`: Optional, string, max 100 characters
- `paymentMethod`: Optional, one of: CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, DIGITAL_WALLET, OTHER
- `location.country`: Optional, string, max 100 characters
- `location.city`: Optional, string, max 100 characters
- `location.ipAddress`: Optional, valid IP address

**Auto-Status Assignment:**
- If `riskScore >= 80`: status = FRAUD
- If `riskScore >= 50`: status = SUSPICIOUS
- Otherwise: status = SAFE

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "id": "...",
    "transactionId": "TXN_1234567890",
    "userId": "user123",
    "amount": 1500.00,
    ...
  },
  "message": "Transaction created successfully",
  "success": true
}
```

**Real-time Event:**
When a transaction is created, a WebSocket event is broadcast to all connected clients:
```json
{
  "type": "transaction",
  "payload": {...}
}
```

**Example Requests:**
```bash
# Minimal transaction
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 1500.00,
    "riskScore": 35
  }'

# Full transaction
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 1500.00,
    "transactionId": "TXN_CUSTOM_123",
    "status": "SUSPICIOUS",
    "riskScore": 65,
    "description": "Large online purchase",
    "merchantId": "merchant456",
    "paymentMethod": "CREDIT_CARD",
    "location": {
      "country": "USA",
      "city": "New York",
      "ipAddress": "192.168.1.1"
    }
  }'
```

### 4. PUT /api/transactions/:id
Update transaction

**Parameters:**
- `id` (string) - Transaction ID or MongoDB _id

**Request Body (all fields optional):**
```json
{
  "status": "FRAUD",
  "riskScore": 85,
  "description": "Updated description",
  "merchantId": "merchant789",
  "paymentMethod": "DEBIT_CARD",
  "location": {
    "country": "Canada",
    "city": "Toronto"
  },
  "metadata": {}
}
```

**Allowed Update Fields:**
- status
- riskScore
- description
- merchantId
- paymentMethod
- location
- metadata

**Note:** Cannot update userId, amount, transactionId, or timestamp

**Response:**
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Transaction updated successfully",
  "success": true
}
```

**Real-time Event:**
```json
{
  "type": "transaction_update",
  "payload": {...}
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:4000/api/transactions/TXN_1234567890 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "FRAUD",
    "riskScore": 95,
    "description": "Confirmed fraudulent activity"
  }'
```

### 5. DELETE /api/transactions/:id
Delete transaction

**Parameters:**
- `id` (string) - Transaction ID or MongoDB _id

**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Transaction deleted successfully",
  "success": true
}
```

**Real-time Event:**
```json
{
  "type": "transaction_delete",
  "payload": {
    "id": "TXN_1234567890"
  }
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:4000/api/transactions/TXN_1234567890 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. GET /api/transactions/stats
Get transaction statistics

**Query Parameters:**
- `timeframe` (string) - Time period (1h, 24h, 7d, 30d), default: 24h

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "timeframe": "24h",
    "statusCounts": [
      {
        "_id": "SAFE",
        "count": 150,
        "totalAmount": 75000,
        "avgRiskScore": 25
      },
      {
        "_id": "SUSPICIOUS",
        "count": 30,
        "totalAmount": 45000,
        "avgRiskScore": 60
      },
      {
        "_id": "FRAUD",
        "count": 10,
        "totalAmount": 15000,
        "avgRiskScore": 85
      }
    ],
    "riskDistribution": [
      { "_id": 0, "count": 100, "avgAmount": 500 },
      { "_id": 25, "count": 50, "avgAmount": 1000 },
      { "_id": 50, "count": 30, "avgAmount": 1500 },
      { "_id": 75, "count": 10, "avgAmount": 1500 }
    ],
    "recentTrends": [...]
  },
  "message": "Transaction statistics retrieved successfully",
  "success": true
}
```

**Example Requests:**
```bash
# Last 24 hours
GET /api/transactions/stats

# Last 7 days
GET /api/transactions/stats?timeframe=7d
```

## Model Features

### Indexes
- `transactionId` (unique)
- `userId`
- `timestamp`
- `status`
- `riskScore`
- `merchantId`
- `createdAt`
- Compound: `userId + timestamp`
- Compound: `status + timestamp`
- Compound: `riskScore + timestamp`
- Compound: `amount + timestamp`
- Compound: `status + riskScore + timestamp`

### Static Methods
- `getStatusCounts()` - Aggregate counts by status
- `getRiskDistribution()` - Risk score distribution
- `getRecentTransactions(limit)` - Get recent transactions

### Instance Methods
- `updateRiskScore(newScore)` - Update risk score and auto-adjust status
- `toSafeObject()` - Remove sensitive fields

### Pre-save Middleware
- Auto-update `updatedAt` timestamp
- Auto-determine status from risk score on creation

## Authentication & Authorization

### Authentication
All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authorization Roles
- **Admin**: Full access to all endpoints
- **System**: Can create transactions
- **User**: Can view transactions (GET endpoints)

### Endpoint Permissions
- `GET /api/transactions` - Authenticated users
- `GET /api/transactions/:id` - Authenticated users
- `POST /api/transactions` - Admin or System role
- `PUT /api/transactions/:id` - Admin role
- `DELETE /api/transactions/:id` - Admin role
- `GET /api/transactions/stats` - Admin role

## Real-time WebSocket

### Connection
```javascript
const ws = new WebSocket('ws://localhost:4000/transactions');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.payload);
};
```

### Events
- `transaction` - New transaction created
- `transaction_update` - Transaction updated
- `transaction_delete` - Transaction deleted

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "timestamp": "2024-02-12T...",
  "path": "/api/transactions",
  "method": "POST",
  "errors": [...]  // Validation errors if applicable
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (transaction doesn't exist)
- `409` - Conflict (duplicate transaction ID)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Testing

### Start Server
```bash
cd backend
npm install
npm run dev
```

### Test Endpoints
```bash
# Health check
curl http://localhost:4000/health

# Get transactions (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/transactions

# Create transaction (requires admin auth)
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 1500.00,
    "riskScore": 35
  }'
```

## Summary

✅ **Complete MVC Implementation**
- Model: Transaction schema with validation and methods
- Controller: 6 controller functions with business logic
- Routes: RESTful API with validation and authorization

✅ **Advanced Features**
- Pagination with metadata
- Multiple filter options
- Search functionality
- Sorting capabilities
- Summary statistics
- Real-time WebSocket updates
- Comprehensive validation
- Role-based access control

✅ **Production Ready**
- Error handling
- Input validation
- Security middleware
- Rate limiting
- Audit trails
- Performance indexes
- Documentation

The Transaction module is fully implemented and ready for use!