# Kafka Integration - Quick Start Guide

## ✅ What's Implemented

Apache Kafka is **FULLY INTEGRATED** with:
- ✅ Kafka configuration
- ✅ Producer service (send events)
- ✅ Consumer service (process events)
- ✅ Automatic risk score calculation
- ✅ Database persistence
- ✅ Alert generation
- ✅ WebSocket broadcasting

## 🚀 Quick Start (3 Steps)

### Step 1: Start Kafka

**Option A: Using Docker Compose (Recommended)**
```bash
cd backend
docker-compose -f docker-compose.kafka.yml up -d
```

This starts:
- Zookeeper (port 2181)
- Kafka (port 9092)
- Kafka UI (port 8080) - Web interface at http://localhost:8080

**Option B: Using Individual Docker Commands**
```bash
# Start Zookeeper
docker run -d --name zookeeper -p 2181:2181 \
  -e ZOOKEEPER_CLIENT_PORT=2181 \
  confluentinc/cp-zookeeper:7.5.0

# Start Kafka
docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=host.docker.internal:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka:7.5.0
```

**Verify Kafka is Running:**
```bash
docker ps | grep kafka
```

### Step 2: Configure Backend

Update `.env` file:
```env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

### Step 3: Start Backend

```bash
cd backend
npm install  # Install kafkajs if not already installed
npm run dev
```

**Expected Output:**
```
✅ MongoDB connected
🔄 Initializing Kafka...
📡 Kafka admin connected
✅ Created Kafka topics: transactions, alerts, transaction-events
✅ Kafka Producer connected
✅ Kafka Consumer connected
✅ Subscribed to topics: transactions, alerts
✅ Kafka Consumer started and listening for messages
✅ Kafka initialized successfully
🚀 Server running on port 4000
```

## 🧪 Test It Works

### Test 1: Send Transaction (Consumer Processes It)

```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_kafka_test",
    "amount": 75000,
    "paymentMethod": "DIGITAL_WALLET"
  }'
```

**What Happens:**
1. Transaction saved to DB
2. Sent to Kafka topic `transactions`
3. Consumer receives message
4. Calculates risk score (amount: 30 + payment: 15 = ~45-55)
5. Saves to DB (if not duplicate)
6. Creates alert if needed (amount > 50000 ✅)
7. Broadcasts via WebSocket

**Check Backend Console:**
```
📤 Message sent to topic 'transactions': { partition: 0, offset: 0 }
📥 Received message from topic 'transactions' [partition: 0, offset: 0]
🔄 Processing transaction event: transaction.created
📊 Calculated risk score: 52
✅ Transaction saved to DB: TXN_...
🚨 Alert created for transaction TXN_...
📡 WebSocket broadcast sent to X clients
```

### Test 2: Verify Processing

```bash
# Check transaction
curl http://localhost:4000/api/transactions | grep riskScore

# Check alert was created
curl http://localhost:4000/api/alerts

# Expected: Transaction with calculated risk score and alert
```

### Test 3: View in Kafka UI

Open http://localhost:8080 in browser:
- View topics: `transactions`, `alerts`, `transaction-events`
- See messages
- Monitor consumer groups
- Check lag

## 📊 How It Works

### Flow Diagram

```
┌──────────────────┐
│  POST /api/      │
│  transactions    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Save to MongoDB  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Kafka Producer   │
│ Send to topic    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Kafka Broker    │
│  (transactions)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Kafka Consumer   │
│ - Receive msg    │
│ - Calc risk      │
│ - Save to DB     │
│ - Create alert   │
│ - Emit WebSocket │
└──────────────────┘
```

### Risk Score Calculation

Consumer automatically calculates risk based on:

| Factor | Points | Example |
|--------|--------|---------|
| Amount > $100k | 40 | $150,000 → 40 pts |
| Amount > $50k | 30 | $75,000 → 30 pts |
| Amount > $10k | 20 | $15,000 → 20 pts |
| Amount > $5k | 10 | $7,000 → 10 pts |
| Digital Wallet | 15 | DIGITAL_WALLET → 15 pts |
| Bank Transfer | 10 | BANK_TRANSFER → 10 pts |
| Credit/Debit | 5 | CREDIT_CARD → 5 pts |
| Other Payment | 20 | OTHER → 20 pts |
| High-risk Country | 25 | Country in list → 25 pts |
| Late Night (12am-6am) | 15 | 2:00 AM → 15 pts |

**Total:** 0-100 (capped)

### Alert Creation

Alert created if:
- **riskScore > 70** OR
- **amount > 50000**

Severity determined by:
- **CRITICAL**: riskScore >= 90 OR amount > 100000
- **HIGH**: riskScore >= 80 OR amount > 75000
- **MEDIUM**: riskScore > 70 OR amount > 50000

## 🎯 Test Scenarios

### Scenario 1: High Amount (Alert Created)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "amount": 80000,
    "paymentMethod": "CREDIT_CARD"
  }'
```
**Expected:**
- Risk score: ~35 (30 for amount + 5 for payment)
- Alert: YES (amount > 50000)
- Severity: MEDIUM

### Scenario 2: High Risk Score (Alert Created)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user2",
    "amount": 150000,
    "paymentMethod": "DIGITAL_WALLET"
  }'
```
**Expected:**
- Risk score: ~55 (40 for amount + 15 for payment)
- Alert: YES (amount > 50000 AND riskScore > 70 after calculation)
- Severity: MEDIUM or HIGH

### Scenario 3: Safe Transaction (No Alert)
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user3",
    "amount": 100,
    "paymentMethod": "CREDIT_CARD"
  }'
```
**Expected:**
- Risk score: ~5-15 (5 for payment + random)
- Alert: NO (amount <= 50000 AND riskScore <= 70)

## 🔍 Monitoring

### Check Kafka Topics
```bash
docker exec -it fraudshield-kafka kafka-topics \
  --list --bootstrap-server localhost:9092
```

**Expected Output:**
```
transactions
alerts
transaction-events
```

### Check Consumer Group
```bash
docker exec -it fraudshield-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group transaction-processor-group
```

### View Messages in Topic
```bash
docker exec -it fraudshield-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic transactions \
  --from-beginning \
  --max-messages 5
```

### Kafka UI (Web Interface)
Open http://localhost:8080
- View all topics
- See messages
- Monitor consumer lag
- Check broker health

## 🐛 Troubleshooting

### Issue: Kafka Connection Failed

**Error:** `Failed to connect Kafka Producer: connect ECONNREFUSED`

**Solution:**
```bash
# Check if Kafka is running
docker ps | grep kafka

# If not running, start it
docker-compose -f docker-compose.kafka.yml up -d

# Check logs
docker logs fraudshield-kafka
```

### Issue: Topics Not Created

**Error:** `Topic 'transactions' does not exist`

**Solution:**
Topics are auto-created. If not, create manually:
```bash
docker exec -it fraudshield-kafka kafka-topics \
  --create --topic transactions \
  --bootstrap-server localhost:9092 \
  --partitions 3 --replication-factor 1
```

### Issue: Consumer Not Processing

**Error:** `Consumer not receiving messages`

**Solution:**
1. Check consumer is running:
   ```bash
   # Look for "Kafka Consumer started" in logs
   ```
2. Restart backend:
   ```bash
   # Stop (Ctrl+C) and restart
   npm run dev
   ```

### Issue: Duplicate Transactions

**Error:** `Transaction already exists, skipping`

**Solution:**
This is normal! Consumer checks for duplicates and skips them.

## 🔧 Configuration

### Disable Kafka

To run without Kafka:
```env
KAFKA_ENABLED=false
```

Backend works normally without Kafka.

### Change Kafka Broker

```env
KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
```

### Adjust Partitions

```env
KAFKA_NUM_PARTITIONS=6
```

More partitions = more parallel processing.

## 📈 Performance Tips

### For High Throughput
1. Increase partitions:
   ```env
   KAFKA_NUM_PARTITIONS=6
   ```
2. Run multiple consumer instances
3. Use batch sending:
   ```javascript
   await kafkaProducer.sendBatch(topic, messages)
   ```

### For Low Latency
1. Reduce batch size
2. Decrease linger time
3. Use fewer partitions

## 🎉 Summary

✅ **Kafka Fully Integrated**
- Producer sends events
- Consumer processes events
- Automatic risk calculation
- Alert generation
- WebSocket broadcasting

✅ **Easy Setup**
- Docker Compose for Kafka
- Auto-topic creation
- Health checks
- Monitoring UI

✅ **Production Ready**
- Error handling
- Graceful shutdown
- Configurable
- Scalable

## 📚 Full Documentation

- **Complete Guide**: `KAFKA_INTEGRATION.md`
- **API Reference**: `API_QUICK_REFERENCE.md`
- **Module Summary**: `MODULE_SUMMARY.md`

## 🚀 Next Steps

1. ✅ Kafka is running
2. ✅ Backend connected
3. 🧪 Test transaction processing
4. 📊 Monitor via Kafka UI
5. 🌐 Connect frontend
6. 🚀 Deploy to production

Kafka integration is complete and ready to use!