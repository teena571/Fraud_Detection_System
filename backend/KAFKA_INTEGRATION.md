# Kafka Integration - Complete Documentation

## Overview

Apache Kafka has been fully integrated into the backend for event-driven architecture, enabling asynchronous transaction processing, risk score calculation, and real-time alerting.

## Architecture

```
┌─────────────────┐
│   API Request   │
│  POST /trans... │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Kafka Producer  │
│  Send to Topic  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Kafka Broker   │
│  transactions   │
│     alerts      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Kafka Consumer  │
│ - Calculate Risk│
│ - Save to DB    │
│ - Create Alert  │
│ - Emit WebSocket│
└─────────────────┘
```

## Components

### 1. Kafka Configuration (`src/config/kafka.js`)

**Features:**
- Kafka client initialization
- Topic management
- Auto-topic creation
- Health check functionality

**Topics:**
- `transactions` - Transaction events
- `alerts` - Alert events
- `transaction-events` - Transaction updates

**Configuration:**
```javascript
{
  clientId: 'fraudshield-backend',
  brokers: ['localhost:9092'],
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
}
```

### 2. Kafka Producer (`src/services/kafkaProducer.js`)

**Features:**
- Send messages to Kafka topics
- Batch message sending
- Idempotent producer
- Auto-reconnection
- Health monitoring

**Methods:**
- `connect()` - Connect to Kafka
- `disconnect()` - Disconnect from Kafka
- `sendMessage(topic, message, key)` - Send single message
- `sendBatch(topic, messages)` - Send batch of messages
- `sendTransaction(transaction)` - Send transaction event
- `sendTransactionUpdate(transaction)` - Send transaction update
- `sendAlert(alert)` - Send alert event
- `sendAlertUpdate(alert, action)` - Send alert update
- `healthCheck()` - Check producer health

### 3. Kafka Consumer (`src/services/kafkaConsumer.js`)

**Features:**
- Subscribe to multiple topics
- Process messages asynchronously
- Calculate risk scores
- Save transactions to database
- Create alerts automatically
- Emit WebSocket events
- Auto-commit offsets

**Methods:**
- `connect()` - Connect to Kafka
- `disconnect()` - Disconnect from Kafka
- `subscribe()` - Subscribe to topics
- `start()` - Start consuming messages
- `handleTransactionMessage(data)` - Process transaction events
- `handleAlertMessage(data)` - Process alert events
- `calculateRiskScore(transaction)` - Calculate risk score
- `broadcastWebSocket(data)` - Broadcast to WebSocket clients
- `healthCheck()` - Check consumer health

## Consumer Processing Flow

### Transaction Processing

```
1. Receive transaction from Kafka
   ↓
2. Calculate risk score (if not provided)
   - Amount-based risk (0-40 points)
   - Payment method risk (5-20 points)
   - Location risk (0-25 points)
   - Time-based risk (0-15 points)
   ↓
3. Determine status based on risk score
   - riskScore >= 80 → FRAUD
   - riskScore >= 50 → SUSPICIOUS
   - Otherwise → SAFE
   ↓
4. Save transaction to MongoDB
   ↓
5. Check alert conditions
   - If riskScore > 70 OR amount > 50000
   - Create alert with appropriate severity
   ↓
6. Emit WebSocket events
   - transaction event
   - alert_created event (if alert created)
```

### Risk Score Calculation

The consumer automatically calculates risk scores based on:

| Factor | Points | Condition |
|--------|--------|-----------|
| Amount | 40 | > $100,000 |
| Amount | 30 | > $50,000 |
| Amount | 20 | > $10,000 |
| Amount | 10 | > $5,000 |
| Payment Method | 20 | OTHER |
| Payment Method | 15 | DIGITAL_WALLET |
| Payment Method | 10 | BANK_TRANSFER |
| Payment Method | 5 | CREDIT/DEBIT_CARD |
| Location | 25 | High-risk country |
| Time | 15 | Late night (12am-6am) |

**Total Score:** 0-100 (capped)

## Environment Variables

```env
# Enable/Disable Kafka
KAFKA_ENABLED=true

# Kafka Connection
KAFKA_CLIENT_ID=fraudshield-backend
KAFKA_BROKERS=localhost:9092
KAFKA_CONNECTION_TIMEOUT=10000
KAFKA_REQUEST_TIMEOUT=30000

# Topic Configuration
KAFKA_NUM_PARTITIONS=3
KAFKA_REPLICATION_FACTOR=1

# Topics
KAFKA_TOPIC_TRANSACTIONS=transactions
KAFKA_TOPIC_ALERTS=alerts
KAFKA_TOPIC_TRANSACTION_EVENTS=transaction-events

# Consumer Groups
KAFKA_GROUP_TRANSACTION_PROCESSOR=transaction-processor-group
KAFKA_GROUP_ALERT_PROCESSOR=alert-processor-group
```

## Setup Instructions

### 1. Install Kafka

**Using Docker:**
```bash
# Start Zookeeper
docker run -d --name zookeeper -p 2181:2181 zookeeper:3.8

# Start Kafka
docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=host.docker.internal:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka:latest
```

**Using Docker Compose:**
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

This installs `kafkajs` along with other dependencies.

### 3. Configure Environment

Update `.env` file:
```env
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

### 4. Start Backend

```bash
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

## Usage Examples

### Send Transaction to Kafka

**Option 1: Via API (Automatic)**
```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 5000,
    "riskScore": 85
  }'
```

The transaction is automatically sent to Kafka after being saved to DB.

**Option 2: Direct Producer Call**
```javascript
import kafkaProducer from './src/services/kafkaProducer.js'

await kafkaProducer.sendTransaction({
  transactionId: 'TXN_123',
  userId: 'user123',
  amount: 5000,
  timestamp: new Date(),
  paymentMethod: 'CREDIT_CARD'
})
```

### Consumer Processing

The consumer automatically:
1. Receives the transaction from Kafka
2. Calculates risk score (if not provided)
3. Saves to MongoDB
4. Creates alert if conditions met
5. Broadcasts via WebSocket

**No manual intervention required!**

## Testing

### Test 1: Send Transaction via Kafka

```bash
# Start backend with Kafka enabled
npm run dev

# In another terminal, send transaction
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_kafka_test",
    "amount": 75000,
    "paymentMethod": "DIGITAL_WALLET"
  }'
```

**Expected Console Output:**
```
📤 Message sent to topic 'transactions': { partition: 0, offset: 5 }
📥 Received message from topic 'transactions' [partition: 0, offset: 5]
🔄 Processing transaction event: transaction.created
📊 Calculated risk score: 65
✅ Transaction saved to DB: TXN_...
🚨 Alert created for transaction TXN_...
📡 WebSocket broadcast sent to X clients
```

### Test 2: Verify Consumer Processing

```bash
# Check transaction was saved
curl http://localhost:4000/api/transactions

# Check alert was created
curl http://localhost:4000/api/alerts

# Expected: Transaction with calculated risk score and alert
```

### Test 3: Risk Score Calculation

```bash
# Test high amount (should get high risk score)
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_high_risk",
    "amount": 150000,
    "paymentMethod": "DIGITAL_WALLET"
  }'

# Check calculated risk score
curl http://localhost:4000/api/transactions | grep riskScore

# Expected: Risk score around 55-75 (40 for amount + 15 for payment method + random)
```

### Test 4: WebSocket Events

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:4000/transactions');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type);
  console.log('Payload:', data.payload);
};

// Now send a transaction via API
// You should see WebSocket events in console
```

## Monitoring

### Check Kafka Health

```bash
# Via API (add health endpoint)
curl http://localhost:4000/health/kafka

# Check topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Check consumer groups
docker exec -it kafka kafka-consumer-groups --list --bootstrap-server localhost:9092

# Check consumer lag
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group transaction-processor-group
```

### View Kafka Logs

```bash
# Producer logs
grep "Kafka Producer" backend/logs/app.log

# Consumer logs
grep "Kafka Consumer" backend/logs/app.log

# Message processing logs
grep "Processing transaction event" backend/logs/app.log
```

## Troubleshooting

### Issue: Kafka Connection Failed

**Error:** `Failed to connect Kafka Producer: connect ECONNREFUSED`

**Solution:**
1. Ensure Kafka is running:
   ```bash
   docker ps | grep kafka
   ```
2. Check Kafka broker address in `.env`
3. Verify Kafka is listening on port 9092:
   ```bash
   netstat -an | grep 9092
   ```

### Issue: Topics Not Created

**Error:** `Topic 'transactions' does not exist`

**Solution:**
1. Topics are auto-created on first message
2. Or manually create:
   ```bash
   docker exec -it kafka kafka-topics --create \
     --topic transactions \
     --bootstrap-server localhost:9092 \
     --partitions 3 \
     --replication-factor 1
   ```

### Issue: Consumer Not Processing Messages

**Error:** `Consumer not receiving messages`

**Solution:**
1. Check consumer is running:
   ```bash
   grep "Kafka Consumer started" backend/logs/app.log
   ```
2. Check consumer group:
   ```bash
   docker exec -it kafka kafka-consumer-groups \
     --bootstrap-server localhost:9092 \
     --describe --group transaction-processor-group
   ```
3. Restart backend to reconnect consumer

### Issue: Duplicate Transactions

**Error:** `Transaction already exists`

**Solution:**
- Consumer checks for existing transactions before saving
- Duplicate messages are skipped automatically
- Check logs for "already exists, skipping" messages

## Disable Kafka

To run without Kafka:

```env
KAFKA_ENABLED=false
```

The backend will work normally without Kafka, using direct database operations.

## Performance Considerations

### Producer
- Uses idempotent producer to prevent duplicates
- Batching supported for high throughput
- Async sending for non-blocking operations

### Consumer
- Auto-commit enabled (5-second interval)
- Processes messages asynchronously
- Error handling prevents consumer crashes
- Continues processing even if individual messages fail

### Scaling
- Increase partitions for parallel processing:
  ```env
  KAFKA_NUM_PARTITIONS=6
  ```
- Run multiple consumer instances (same group ID)
- Each partition processed by one consumer

## Integration with Existing Code

### Transaction Controller

Transactions are automatically sent to Kafka after creation:
```javascript
// In transactionController.js
const savedTransaction = await transaction.save()

// Send to Kafka (if enabled)
if (process.env.KAFKA_ENABLED === 'true') {
  await kafkaProducer.sendTransaction(savedTransaction)
}
```

### Alert Controller

Alerts are sent to Kafka when created:
```javascript
// In alertController.js
const alert = await Alert.createFromTransaction(transaction)

// Send to Kafka (if enabled)
if (process.env.KAFKA_ENABLED === 'true') {
  await kafkaProducer.sendAlert(alert)
}
```

## Summary

✅ **Complete Kafka Integration**
- Producer service for sending events
- Consumer service for processing events
- Automatic risk score calculation
- Database persistence
- Alert generation
- WebSocket broadcasting

✅ **Event-Driven Architecture**
- Asynchronous processing
- Decoupled components
- Scalable design
- Fault-tolerant

✅ **Production Ready**
- Error handling
- Health checks
- Graceful shutdown
- Monitoring support
- Configurable via environment variables

The Kafka integration is fully functional and ready for production use!