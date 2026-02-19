# Fraud Monitor Backend - Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 18+ and npm 8+
- **MongoDB** 5.0+ (local or cloud)
- **Git**

Optional (for full features):
- **Redis** 6+ (for caching and rate limiting)
- **Kafka** (for event streaming)
- **Docker** and Docker Compose (for containerized deployment)

## Installation Steps

### 1. Install Dependencies

```bash
cd fraud-monitor-backend
npm install
```

This will install all required packages including:
- express, mongoose, cors, helmet
- jsonwebtoken, bcryptjs
- ws (WebSocket), kafkajs, redis
- winston (logging), express-validator
- And more...

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required Settings
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/fraud-monitor
JWT_SECRET=your-super-secret-jwt-key-change-this

# Optional Services (set to true to enable)
REDIS_ENABLED=false
KAFKA_ENABLED=false
WS_ENABLED=true
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create cluster and get connection string
- Update `MONGODB_URI` in `.env`

### 4. Start the Server

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

The server will start on `http://localhost:4000`

### 5. Verify Installation

Test the health endpoint:

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-12T...",
    "uptime": 5.123,
    "environment": "development"
  },
  "message": "Service is healthy"
}
```

## Docker Setup (Recommended for Production)

### Quick Start with Docker Compose

This will start MongoDB, Redis, Kafka, and the backend:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

### Build and Run Manually

```bash
# Build image
docker build -t fraud-monitor-backend .

# Run container
docker run -p 4000:4000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/fraud-monitor \
  -e JWT_SECRET=your-secret \
  fraud-monitor-backend
```

## Creating Your First User

### Using API

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Save the returned `token` for authenticated requests.

## Testing the API

### Create a Transaction

```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "amount": 1500.00,
    "riskScore": 75,
    "merchantId": "merchant456",
    "merchantName": "Test Store",
    "paymentMethod": "CREDIT_CARD"
  }'
```

### Get Transactions

```bash
# Get all transactions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/transactions

# Get high-risk transactions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/transactions/high-risk

# Filter by status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/transactions?status=FRAUD&minRiskScore=70"
```

## WebSocket Connection

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:4000/ws?token=YOUR_JWT_TOKEN');

ws.onopen = () => {
  console.log('Connected');
  
  // Subscribe to transaction updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['transactions', 'alerts']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Optional Services

### Enable Redis

1. Start Redis:
```bash
redis-server
```

2. Update `.env`:
```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

3. Restart server

### Enable Kafka

1. Start Kafka (using Docker):
```bash
docker-compose up -d zookeeper kafka
```

2. Update `.env`:
```env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

3. Restart server

## Troubleshooting

### MongoDB Connection Error

**Error**: `MongoServerError: connect ECONNREFUSED`

**Solution**:
- Ensure MongoDB is running: `mongod` or `sudo systemctl start mongod`
- Check connection string in `.env`
- For Docker: use `mongodb://host.docker.internal:27017/fraud-monitor`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4000`

**Solution**:
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

Or change `PORT` in `.env`

### JWT Secret Not Set

**Error**: `JWT_SECRET is not defined`

**Solution**: Set `JWT_SECRET` in `.env` file

### Module Not Found

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Auto-reload on Changes

Use nodemon (already configured):
```bash
npm run dev
```

### View Logs

Logs are written to:
- Console (all environments)
- `logs/app.log` (production)
- `logs/error.log` (production errors)

### Database Seeding

Create sample data:
```bash
npm run seed
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB (Atlas or managed service)
- [ ] Enable Redis for better performance
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Enable log aggregation
- [ ] Configure backup strategy
- [ ] Review rate limiting settings
- [ ] Test all endpoints
- [ ] Load test the application

## Next Steps

1. **Frontend Integration**: Connect the React frontend to this backend
2. **Add More Features**: Implement rules engine, alerts, analytics
3. **Monitoring**: Set up APM tools (New Relic, DataDog)
4. **CI/CD**: Configure automated deployment pipeline
5. **Documentation**: Generate API docs with Swagger/OpenAPI

## Support

For issues or questions:
- Check the main README.md
- Review API documentation
- Check logs for error details
- Ensure all prerequisites are met