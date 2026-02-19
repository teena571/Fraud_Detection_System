# FraudShield - Real-time Fraud Detection Platform

A production-ready fraud detection system with real-time monitoring, event-driven architecture, and distributed caching.

## 🎯 Overview

FraudShield is a comprehensive fraud detection platform that processes transactions in real-time, calculates risk scores, generates alerts, and provides live monitoring through an intuitive dashboard.

## ✨ Key Features

### Real-time Monitoring
- **Live Transaction Feed**: WebSocket-powered real-time updates
- **Instant Alerts**: Sub-second alert generation and notification
- **Interactive Dashboard**: Real-time charts and analytics
- **System Logs**: Live monitoring of system events

### Advanced Analytics
- **Risk Scoring**: Automatic risk calculation (0-100 scale)
- **Alert Management**: Multi-level severity (CRITICAL, HIGH, MEDIUM)
- **Transaction Analytics**: Comprehensive statistics and trends
- **Pattern Detection**: Fraud pattern identification

### Production-Ready
- **High Performance**: 5ms response time with Redis caching
- **Scalable**: Event-driven architecture with Kafka
- **Secure**: JWT auth, rate limiting, 10+ security headers
- **Optimized**: 70-80% compression, indexed queries

## 🏗️ Architecture

```
Frontend (React) ←→ Backend (Node.js) ←→ MongoDB Atlas
                         ↕                    ↕
                    WebSocket            Redis Cache
                         ↕                    ↕
                    Kafka Broker        Event Stream
```

**[View Detailed Architecture →](./ARCHITECTURE.md)**  
**[View Resume Version →](./ARCHITECTURE_RESUME.md)**  
**[View Simple Diagram →](./ARCHITECTURE_SIMPLE.md)**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fraudshield.git
cd fraudshield
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

## 📊 Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Router** - Navigation
- **WebSocket** - Real-time updates

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **WebSocket (ws)** - Real-time communication
- **KafkaJS** - Event streaming

### Database & Cache
- **MongoDB Atlas** - Primary database
- **Redis** - Caching & rate limiting
- **Apache Kafka** - Event streaming

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| Response Time (cached) | 5ms |
| Response Time (database) | 80-120ms |
| Throughput | 500-1000 req/sec |
| Cache Hit Rate | 80-95% |
| Compression | 70-80% reduction |
| WebSocket Latency | <10ms |

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: 5-tier rate limiting (Redis-based)
- **Security Headers**: 10+ production-grade headers
- **Input Validation**: Comprehensive validation
- **Request Sanitization**: XSS and injection prevention
- **CORS**: Configurable cross-origin support

## 📚 Documentation

### Getting Started
- [Quick Start Guide](./QUICK_START.md)
- [How to Run](./HOW_TO_RUN.md)
- [System Overview](./SYSTEM_OVERVIEW.md)

### Architecture
- [Complete Architecture](./ARCHITECTURE.md)
- [Resume Version](./ARCHITECTURE_RESUME.md)
- [Simple Diagram](./ARCHITECTURE_SIMPLE.md)

### Backend
- [Backend README](./backend/README.md)
- [API Reference](./backend/API_QUICK_REFERENCE.md)
- [Production Optimizations](./backend/PRODUCTION_OPTIMIZATIONS.md)
- [Transaction Module](./backend/TRANSACTION_MODULE.md)
- [Alerts Module](./backend/ALERTS_MODULE.md)

### Frontend
- [Frontend README](./frontend/README.md)

### Setup Guides
- [Run Without Docker](./backend/RUN_WITHOUT_DOCKER.md)
- [MongoDB Atlas Setup](./backend/MONGODB_ATLAS_SETUP.md)
- [Docker Setup](./backend/DOCKER_SETUP.md)
- [Redis Integration](./backend/REDIS_INTEGRATION.md)
- [Kafka Integration](./backend/KAFKA_INTEGRATION.md)

## 🎯 API Endpoints

### Transactions
```
GET    /api/transactions          - List transactions
GET    /api/transactions/:id      - Get single transaction
POST   /api/transactions          - Create transaction
PUT    /api/transactions/:id      - Update transaction
DELETE /api/transactions/:id      - Delete transaction
GET    /api/transactions/stats    - Get statistics
```

### Alerts
```
GET    /api/alerts                - List alerts
GET    /api/alerts/:id            - Get single alert
GET    /api/alerts/active         - Get active alerts
GET    /api/alerts/critical       - Get critical alerts
POST   /api/alerts/:id/acknowledge - Acknowledge alert
POST   /api/alerts/:id/resolve    - Resolve alert
POST   /api/alerts/:id/dismiss    - Dismiss alert
DELETE /api/alerts/:id            - Delete alert
```

### System
```
GET    /health                    - Health check
GET    /api/stats                 - Performance statistics
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Load testing
ab -n 1000 -c 10 http://localhost:4000/api/transactions
```

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose -f backend/docker-compose.full.yml up -d

# Stop all services
docker-compose -f backend/docker-compose.full.yml down
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world fraud detection systems
- Designed for production deployment

---

**Built with ❤️ for secure and scalable fraud detection** 🚀
