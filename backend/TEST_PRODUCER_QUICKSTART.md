# Kafka Test Producer - Quick Start

## 🚀 One Command Start

```bash
npm run producer
```

## 📋 Prerequisites

1. Kafka running (port 9092)
2. Backend running (port 4000)
3. MongoDB running (port 27017)

## 🎯 Quick Setup (3 Terminals)

### Terminal 1: Kafka
```bash
cd backend
docker-compose -f docker-compose.kafka.yml up -d
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```

### Terminal 3: Test Producer
```bash
cd backend
npm run producer
```

## 📊 What It Does

- ✅ Sends random transactions every 2 seconds
- ✅ 15% fraud probability
- ✅ 5 different fraud patterns
- ✅ Real-time statistics
- ✅ Auto-creates alerts for risky transactions

## 🎭 Fraud Patterns

| Pattern | Amount | Risk | Alert |
|---------|--------|------|-------|
| High Amount | $50k-$200k | Very High | CRITICAL |
| Rapid Transactions | $5k-$15k | High | HIGH |
| Unusual Payment | $10k-$50k | Medium | MEDIUM |
| Late Night | $5k-$25k | Medium | MEDIUM |
| High-Risk Location | $25k-$100k | High | HIGH |

## 📈 Expected Output

```
🚀 KAFKA TEST PRODUCER STARTED
============================================================
Interval:             2000ms (2s)
Fraud Probability:    15%
============================================================

✅ NORMAL | TXN_... | $1234.56 | user_003
🚨 FRAUD | TXN_... | $75000.00 | user_suspicious_001
   └─ Pattern: high_amount
✅ NORMAL | TXN_... | $567.89 | user_007

============================================================
📊 STATISTICS
Total Sent:           10
Normal Transactions:  8 (80%)
Fraud Patterns:       2 (20%)
============================================================
```

## 🔍 Monitor Results

### Check Transactions
```bash
curl http://localhost:4000/api/transactions | jq
```

### Check Alerts
```bash
curl http://localhost:4000/api/alerts | jq
```

### Check Statistics
```bash
curl http://localhost:4000/api/alerts/stats | jq
```

### View in Kafka UI
Open http://localhost:8080

## 🛑 Stop Producer

Press `Ctrl+C`

Shows final statistics before exiting.

## ⚙️ Configuration

Edit `src/scripts/kafkaTestProducer.js`:

```javascript
// Change send interval
const INTERVAL_MS = 2000 // milliseconds

// Change fraud probability
const FRAUD_PROBABILITY = 0.15 // 0.0 to 1.0
```

## 🧪 Test Scenarios

### Scenario 1: Normal Demo
```bash
npm run producer
# Default: 2s interval, 15% fraud
```

### Scenario 2: High Fraud Rate
```javascript
// Edit kafkaTestProducer.js
const FRAUD_PROBABILITY = 0.5 // 50% fraud
```

### Scenario 3: Fast Generation
```javascript
// Edit kafkaTestProducer.js
const INTERVAL_MS = 500 // 2 per second
```

### Scenario 4: Load Test
```javascript
// Edit kafkaTestProducer.js
const INTERVAL_MS = 100 // 10 per second
```

## 🎬 Demo Workflow

1. **Start all services** (Kafka, Backend, Producer)
2. **Open Kafka UI** (http://localhost:8080)
3. **Open browser console** with WebSocket connection
4. **Watch real-time processing:**
   - Producer sends → Kafka receives
   - Consumer processes → DB saves
   - Alerts created → WebSocket broadcasts
5. **Check results** via API or UI

## 🌐 WebSocket Monitoring

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:4000/transactions');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'transaction') {
    console.log('💰 Transaction:', data.payload.transactionId);
  }
  if (data.type === 'alert_created') {
    console.log('🚨 Alert:', data.payload.severity, data.payload.message);
  }
};
```

## 📊 Live Monitoring Commands

### Watch Alerts (Updates every 1s)
```bash
watch -n 1 'curl -s http://localhost:4000/api/alerts/stats | jq'
```

### Watch Transactions (Updates every 1s)
```bash
watch -n 1 'curl -s http://localhost:4000/api/transactions/stats | jq'
```

### Watch Active Alerts
```bash
watch -n 1 'curl -s http://localhost:4000/api/alerts/active | jq ".data | length"'
```

## 🐛 Troubleshooting

### Producer Won't Start
```bash
# Check Kafka is running
docker ps | grep kafka

# Check backend is running
curl http://localhost:4000/health
```

### No Alerts Created
```bash
# Check alert conditions
# Alert created if: riskScore > 70 OR amount > 50000

# Increase fraud probability
# Edit kafkaTestProducer.js: FRAUD_PROBABILITY = 0.5
```

### Backend Not Processing
```bash
# Check Kafka consumer logs in backend console
# Look for: "📥 Received message from topic 'transactions'"

# Restart backend if needed
```

## 💡 Tips

1. **Start producer AFTER backend** - Ensures consumer is ready
2. **Use Kafka UI** - Visual monitoring is easier
3. **Watch backend console** - See processing in real-time
4. **Check statistics** - Every 10 transactions
5. **Graceful shutdown** - Always use Ctrl+C

## 🎯 Success Indicators

✅ Producer shows "✅ Connected to Kafka"
✅ Transactions appear in console
✅ Backend shows "📥 Received message"
✅ Alerts created for fraud patterns
✅ WebSocket events broadcast
✅ Statistics update correctly

## 📚 Full Documentation

- **Complete Guide:** `KAFKA_TEST_PRODUCER.md`
- **Kafka Integration:** `KAFKA_INTEGRATION.md`
- **Kafka Quick Start:** `KAFKA_QUICKSTART.md`

## 🎉 Ready!

The test producer is perfect for:
- ✅ Live demos
- ✅ Frontend testing
- ✅ Load testing
- ✅ Development
- ✅ Presentations

Just run `npm run producer` and watch the magic happen!