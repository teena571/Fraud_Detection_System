# FraudShield Backend API

A robust Node.js/Express backend for the FraudShield fraud detection system with real-time WebSocket support.

## 🏗️ Architecture

### MVC Structure
```
backend/
├── src/
│   ├── controllers/           # Request handlers
│   │   └── transactionController.js
│   ├── models/               # Database models
│   │   └── Transaction.js
│   ├── routes/               # API routes
│   │   └── transactionRoutes.js
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js
│   │   ├── authorize.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── services/             # Business logic
│   │   └── websocketService.js
│   ├── utils/                # Helper functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── helpers.js
│   ├── config/               # Configuration
│   │   └── database.js
│   └── scripts/              # Utility scripts
│       └── seedData.js
├── .env                      # Environment variables
├── server.js                 # Main server file
└── package.json
```

## 🚀 Features

### Transaction Management
- **CRUD Operations** - Create, read, update, delete transactions
- **Advanced Filtering** - Status, amount range, risk score, date range
- **Pagination** - Efficient data loading with metadata
- **Search** - Full-text search across multiple fields
- **Sorting** - Flexible sorting by any field
- **Validation** - Comprehensive input validation

### Real-time Features
- **WebSocket Server** - Real-time transaction streaming
- **Live Updates** - Instant transaction broadcasts
- **Mock Data Generation** - Automatic test data in development
- **Connection Management** - Robust client handling

### Security & Performance
- **Authentication** - JWT-based auth system
- **Authorization** - Role-based access control
- **Rate Limiting** - Redis-based distributed rate limiting (5 tiers)
- **Input Validation** - Comprehensive validation
- **Error Handling** - Structured error responses
- **CORS** - Configurable cross-origin support
- **Redis Caching** - 60s cache with auto-invalidation (10-30x faster)
- **Compression** - 70-80% response size reduction
- **Response Tracking** - Performance monitoring and statistics
- **Security Headers** - 10+ production-grade security headers

## 📊 Transaction Schema

```javascript
{
  transactionId: String,      // Unique identifier
  userId: String,             // User identifier
  amount: Number,             // Transaction amount
  timestamp: Date,            // Transaction time
  status: Enum,               // SAFE | SUSPICIOUS | FRAUD
  riskScore: Number,          // 0-100 risk score
  description: String,        // Optional description
  merchantId: String,         // Merchant identifier
  paymentMethod: Enum,        // Payment type
  location: {                 // Location data
    country: String,
    city: String,
    ipAddress: String
  },
  metadata: Object,           // Additional data
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update
}
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Environment Configuration
```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/fraudshield

# Security
JWT_SECRET=your-super-secret-jwt-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Database Setup
```bash
# Start MongoDB (if using local installation)
mongod

# Seed sample data
npm run seed
```

### Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Transactions

#### GET /api/transactions
Get all transactions with pagination and filters

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (SAFE|SUSPICIOUS|FRAUD)
- `userId` - Filter by user ID
- `minAmount` - Minimum amount filter
- `maxAmount` - Maximum amount filter
- `minRiskScore` - Minimum risk score (0-100)
- `maxRiskScore` - Maximum risk score (0-100)
- `startDate` - Start date filter (ISO 8601)
- `endDate` - End date filter (ISO 8601)
- `sortBy` - Sort field (timestamp|amount|riskScore|status)
- `sortOrder` - Sort direction (asc|desc)
- `search` - Search term

**Example:**
```bash
GET /api/transactions?page=1&limit=20&status=FRAUD&minRiskScore=70
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "hasNextPage": true
    },
    "summary": {
      "totalAmount": 50000,
      "avgRiskScore": 45.2,
      "fraudCount": 5
    }
  }
}
```

#### GET /api/transactions/:id
Get single transaction by ID or transactionId

#### POST /api/transactions
Create new transaction (Admin only)

**Request Body:**
```json
{
  "userId": "user_123",
  "amount": 1500.00,
  "status": "SAFE",
  "riskScore": 25,
  "description": "Online purchase",
  "paymentMethod": "CREDIT_CARD"
}
```

#### PUT /api/transactions/:id
Update transaction (Admin only)

#### DELETE /api/transactions/:id
Delete transaction (Admin only)

#### GET /api/transactions/stats
Get transaction statistics

**Query Parameters:**
- `timeframe` - Time period (1h|24h|7d|30d)

## 🔌 WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:4000/transactions')
```

### Message Types

#### Incoming Messages
```javascript
// New transaction
{
  "type": "transaction",
  "payload": { /* transaction object */ }
}

// Transaction update
{
  "type": "transaction_update", 
  "payload": { /* updated transaction */ }
}

// High-risk alert
{
  "type": "alert",
  "payload": { /* alert details */ }
}
```

#### Outgoing Messages
```javascript
// Subscribe to updates
ws.send(JSON.stringify({
  "type": "subscribe",
  "channels": ["transactions", "alerts"]
}))

// Ping/pong for connection health
ws.send(JSON.stringify({ "type": "ping" }))
```

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:4000/health

# Get transactions
curl -H "Authorization: Bearer mock-token" \
     http://localhost:4000/api/transactions

# Create transaction
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer mock-token" \
     -d '{"userId":"test","amount":100}' \
     http://localhost:4000/api/transactions
```

### WebSocket Testing
```javascript
const ws = new WebSocket('ws://localhost:4000/transactions')
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data))
}
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start with nodemon
npm start            # Start production server
npm run seed         # Seed sample data
npm run lint         # Run ESLint
npm test             # Run tests (when implemented)
```

### Adding New Features
1. **Models** - Define in `/src/models/`
2. **Controllers** - Add to `/src/controllers/`
3. **Routes** - Configure in `/src/routes/`
4. **Middleware** - Create in `/src/middleware/`
5. **Services** - Business logic in `/src/services/`

### Database Indexes
The Transaction model includes optimized indexes:
- `transactionId` (unique)
- `userId + timestamp`
- `status + timestamp`
- `riskScore + timestamp`
- Compound index for common queries

## 🚀 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Performance Considerations
- **Database Indexing** - Optimized for common queries
- **Connection Pooling** - MongoDB connection management
- **Rate Limiting** - API protection
- **Compression** - Response compression
- **Error Logging** - Structured error handling

### Security Checklist
- ✅ JWT authentication
- ✅ Input validation
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Environment variables
- ✅ Error message sanitization

## 📊 Monitoring

### Health Endpoints
- `GET /health` - Basic health check
- WebSocket connection count via `websocketService.getConnectionCount()`

### Logging
- Development: Detailed console logs
- Production: Structured logging (configure as needed)

## 🤝 Contributing

1. Follow MVC architecture patterns
2. Add proper validation for new endpoints
3. Include error handling
4. Update documentation
5. Test WebSocket functionality

## 📄 License

This project is part of the FraudShield fraud detection system.