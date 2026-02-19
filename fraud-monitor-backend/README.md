# Fraud Monitor Backend

A production-ready Node.js backend for fraud monitoring system with real-time capabilities.

## Features

- **RESTful API** with Express.js
- **MongoDB** with Mongoose ODM
- **Real-time WebSocket** communication
- **JWT Authentication** with role-based access control
- **Rate Limiting** and security middleware
- **Kafka Integration** for event streaming
- **Redis Caching** (optional)
- **Comprehensive Logging** with Winston
- **Health Checks** for monitoring
- **Input Validation** and sanitization
- **Error Handling** middleware
- **Docker Support**

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **WebSocket**: ws library
- **Message Queue**: Kafka (optional)
- **Cache**: Redis (optional)
- **Logging**: Winston
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- MongoDB running locally or connection string
- (Optional) Redis server
- (Optional) Kafka cluster

### Installation

1. **Clone and install dependencies**:
```bash
cd fraud-monitor-backend
npm install
```

2. **Environment Setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB** (if running locally):
```bash
mongod
```

4. **Start the server**:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The server will start on `http://localhost:4000`

## API Endpoints

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependencies
- `GET /api/health/ready` - Readiness check (Kubernetes)
- `GET /api/health/live` - Liveness check (Kubernetes)
- `GET /api/health/metrics` - Application metrics
- `GET /api/health/info` - Application information

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh token

### Transactions
- `GET /api/transactions` - Get transactions with filters
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/high-risk` - Get high-risk transactions
- `GET /api/transactions/statistics` - Get transaction statistics
- `POST /api/transactions/:id/mark-fraud` - Mark as fraud
- `POST /api/transactions/:id/mark-safe` - Mark as safe

## WebSocket Events

Connect to `ws://localhost:4000/ws?token=YOUR_JWT_TOKEN`

### Client Events
- `ping` - Heartbeat
- `subscribe` - Subscribe to channels
- `unsubscribe` - Unsubscribe from channels
- `join_room` - Join a room
- `leave_room` - Leave a room

### Server Events
- `connection` - Connection established
- `transaction_created` - New transaction
- `transaction_updated` - Transaction updated
- `transaction_fraud` - Transaction marked as fraud
- `transaction_safe` - Transaction marked as safe

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/fraud-monitor

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Optional Services
REDIS_ENABLED=false
KAFKA_ENABLED=false
WS_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## User Roles & Permissions

### Admin
- Full access to all endpoints
- Can manage users and rules
- Permissions: `read`, `write`, `delete`, `admin`, `review_transactions`, `manage_rules`

### Analyst
- Can view and review transactions
- Can mark transactions as fraud/safe
- Permissions: `read`, `write`, `review_transactions`

### Viewer
- Read-only access to transactions
- Permissions: `read`

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Health check
curl http://localhost:4000/api/health

# Get transactions (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/transactions?status=FRAUD&minRiskScore=70"
```

## Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

## Production Deployment

1. **Set environment variables**:
```bash
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-strong-secret-key
```

2. **Enable optional services**:
```bash
REDIS_ENABLED=true
KAFKA_ENABLED=true
```

3. **Start with PM2**:
```bash
npm install -g pm2
pm2 start server.js --name fraud-monitor-backend
```

## Monitoring

- Health checks available at `/api/health/*`
- Logs written to console and files (production)
- Metrics available at `/api/health/metrics`
- WebSocket statistics in health checks

## Security Features

- JWT authentication with blacklisting
- Rate limiting per IP/user
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Account lockout after failed attempts
- Password strength requirements

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Custom middleware
├── models/          # Mongoose models
├── routes/          # Express routes
├── services/        # Business logic
├── kafka/           # Kafka producers/consumers
├── sockets/         # WebSocket handling
└── utils/           # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License