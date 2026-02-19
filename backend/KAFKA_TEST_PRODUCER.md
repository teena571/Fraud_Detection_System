# Kafka Test Producer - Documentation

## Overview

A test producer script that generates random transactions with fraud patterns for testing and demo purposes. Sends transactions to Kafka every 2 seconds.

## Features

- ✅ Generates random transactions every 2 seconds
- ✅ Random amounts, users, and payment methods
- ✅ Simulates 5 different fraud patterns
- ✅ 15% fraud probability (configurable)
- ✅ Real-time statistics
- ✅ Graceful shutdown
- ✅ Color-coded console output

## Usage

### Start the Producer

```bash
npm run producer
```

### Stop the Producer

Press `Ctrl+C` to stop gracefully.

## Output Example

```
🚀 KAFKA TEST PRODUCER STARTED
============================================================
Interval:             2000ms (2s)
Fraud Probability:    15%
Kafka Topic:          transactions
Kafka Brokers:        localhost:9092
============================================================
Press Ctrl+C to stop

✅ NORMAL | TXN_1707750123456_ABC123 | $1234.56 | user_003
✅ NORMAL | TXN_1707750125456_DEF456 | $567.89 | user_007
🚨 FRAUD | TXN_1707750127456_GHI789 | $75000.00 | user_suspicious_001
   └─ Pattern: high_amount
✅ NORMAL | TXN_1707750129456_JKL012 | $234.50 | user_005
🚨 FRAUD | TXN_1707750131456_MNO345 | $12500.00 | user_fraud_001
   └─ Pattern: late_night

============================================================
📊 KAFKA TEST PRODUCER STATISTICS
============================================================
Total Sent:           10
Normal Transactions:  8 (80.0%)
Fraud Patterns:       2 (20.0%)
  - High Amount:      1
Errors:               0
============================================================
```

## Fraud Patterns

The producer simulates 5 different fraud patterns:

### 1. High Amount Transaction
- **Amount:** $50,000 - $200,000
- **Payment Method:** DIGITAL_WALLET or BANK_TRANSFER
- **Risk Factors:** Very high amount
- **Expected Alert:** CRITICAL or HIGH

### 2. Multiple Rapid Transactions
- **Amount:** $5,000 - $15,000
- **Payment Method:** CREDIT_CARD
- **Risk Factors:** Multiple transactions in short time
- **Metadata:** transactionCount: 5-15
- **Expected Alert:** MEDIUM or HIGH

### 3. Unusual Payment Method
- **Amount:** $10,000 - $50,000
- **Payment Method:** OTHER
- **Risk Factors:** Uncommon payment method
- **Expected Alert:** MEDIUM or HIGH

### 4. Late Night Transaction
- **Amount:** $5,000 - $25,000
- **Time:** 12:00 AM - 6:00 AM
- **Risk Factors:** Unusual transaction time
- **Expected Alert:** MEDIUM

### 5. High-Risk Location + High Amount
- **Amount:** $25,000 - $100,000
- **Payment Method:** DIGITAL_WALLET
- **Location:** Unknown country/city
- **Risk Factors:** Suspicious location + high amount
- **Expected Alert:** HIGH or CRITICAL

## Normal Transactions

Normal transactions have:
- **Amount:** $10 - $5,000
- **Payment Methods:** CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, DIGITAL_WALLET
- **Users:** user_001 through user_010
- **Locations:** Known countries and cities
- **Expected Alert:** Usually none (unless amount > $50k)

## Configuration

Edit `src/scripts/kafkaTestProducer.js` to customize:

```javascript
// Send interval (milliseconds)
const INTERVAL_MS = 2000 // 2 seconds

// Fraud probability (0.0 - 1.0)
const FRAUD_PROBABILITY = 0.15 // 15%
```

## Sample Data

### Users
- Normal: `user_001` through `user_010`
- Suspicious: `user_suspicious_001`, `user_suspicious_002`
- Fraud: `user_fraud_001`

### Payment Methods
- CREDIT_CARD
- DEBIT_CARD
- BANK_TRANSFER
- DIGITAL_WALLET
- OTHER

### Countries
USA, UK, Canada, Germany, France, Japan, Australia, Brazil, India, China

### Merchants
Amazon, Walmart, Target, Best Buy, Apple Store, Nike, Adidas, Starbucks, McDonalds, Uber, Netflix, Spotify, Steam, PlayStation, Xbox

## Testing Workflow

### 1. Start Backend with Kafka

**Terminal 1: Start Kafka**
```bash
docker-compose -f docker-compose.kafka.yml up -d
```

**Terminal 2: Start Backend**
```bash
npm run dev
```

**Terminal 3: Start Test Producer**
```bash
npm run producer
```

### 2. Monitor Results

**Watch Backend Console:**
```
📥 Received message from topic 'transactions'
🔄 Processing transaction event: transaction.created
📊 Calculated risk score: 85
✅ Transaction saved to DB: TXN_...
🚨 Alert created for transaction TXN_...
📡 WebSocket broadcast sent to X clients
```

**Check Transactions:**
```bash
curl http://localhost:4000/api/transactions | jq
```

**Check Alerts:**
```bash
curl http://localhost:4000/api/alerts | jq
```

**View in Kafka UI:**
Open http://localhost:8080
- Navigate to Topics → transactions
- See messages in real-time

### 3. WebSocket Monitoring

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:4000/transactions');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type);
  console.log('Payload:', data.payload);
};

// You'll see real-time events as producer sends transactions
```

## Statistics

The producer tracks and displays:
- **Total Sent:** Total number of transactions sent
- **Normal Transactions:** Count and percentage
- **Fraud Patterns:** Count and percentage
- **High Amount:** Count of high-amount fraud patterns
- **Errors:** Failed sends

Statistics are displayed:
- Every 10 transactions
- On shutdown (Ctrl+C)

## Use Cases

### 1. Demo Fraud Detection
```bash
# Start producer with default settings
npm run producer

# Watch alerts being created in real-time
curl http://localhost:4000/api/alerts/active
```

### 2. Load Testing
```javascript
// Edit kafkaTestProducer.js
const INTERVAL_MS = 100 // Send every 100ms (10 per second)
```

### 3. Specific Fraud Pattern Testing
```javascript
// Edit kafkaTestProducer.js
const FRAUD_PROBABILITY = 1.0 // 100% fraud
```

### 4. High Volume Testing
```javascript
// Edit kafkaTestProducer.js
const INTERVAL_MS = 50 // 20 transactions per second
```

## Troubleshooting

### Issue: Producer Won't Start

**Error:** `Failed to connect Kafka Producer`

**Solution:**
1. Ensure Kafka is running:
   ```bash
   docker ps | grep kafka
   ```
2. Check `.env` file has correct Kafka settings
3. Verify Kafka is accessible on port 9092

### Issue: No Messages in Kafka

**Error:** Messages sent but not appearing in Kafka

**Solution:**
1. Check Kafka UI: http://localhost:8080
2. Verify topic exists:
   ```bash
   docker exec -it fraudshield-kafka kafka-topics \
     --list --bootstrap-server localhost:9092
   ```
3. Check producer logs for errors

### Issue: Backend Not Processing

**Error:** Messages in Kafka but backend not processing

**Solution:**
1. Ensure backend is running with Kafka enabled:
   ```env
   KAFKA_ENABLED=true
   ```
2. Check backend console for consumer logs
3. Restart backend to reconnect consumer

## Advanced Usage

### Custom Transaction Generator

Create your own transaction generator:

```javascript
function generateCustomTransaction() {
  return {
    transactionId: generateTransactionId(),
    userId: 'custom_user',
    amount: 100000, // Always high amount
    timestamp: new Date().toISOString(),
    paymentMethod: 'DIGITAL_WALLET',
    // ... other fields
  }
}
```

### Batch Sending

Send multiple transactions at once:

```javascript
const transactions = []
for (let i = 0; i < 10; i++) {
  transactions.push({
    key: generateTransactionId(),
    value: generateTransaction()
  })
}

await kafkaProducer.sendBatch(TOPICS.TRANSACTIONS, transactions)
```

### Custom Fraud Patterns

Add your own fraud patterns:

```javascript
case 6: // Custom pattern
  transaction.amount = 999999
  transaction.paymentMethod = 'OTHER'
  transaction.metadata.fraudPattern = 'custom_pattern'
  break
```

## Performance

### Default Settings
- **Rate:** 1 transaction per 2 seconds (30 per minute)
- **Fraud Rate:** 15%
- **Expected Alerts:** ~4-5 per minute

### High Volume Settings
```javascript
const INTERVAL_MS = 100 // 10 per second (600 per minute)
```

### Stress Test Settings
```javascript
const INTERVAL_MS = 10 // 100 per second (6000 per minute)
```

## Integration with Frontend

The test producer is perfect for:
1. **Live Demos:** Show real-time fraud detection
2. **Frontend Testing:** Test WebSocket updates
3. **Dashboard Testing:** Populate charts and graphs
4. **Alert Testing:** Test alert notifications
5. **Performance Testing:** Stress test the system

## Example Session

```bash
# Terminal 1: Start Kafka
docker-compose -f docker-compose.kafka.yml up -d

# Terminal 2: Start Backend
npm run dev

# Terminal 3: Start Producer
npm run producer

# Terminal 4: Monitor Alerts
watch -n 1 'curl -s http://localhost:4000/api/alerts/stats | jq'

# Terminal 5: Monitor Transactions
watch -n 1 'curl -s http://localhost:4000/api/transactions/stats | jq'
```

## Summary

✅ **Easy to Use**
- Single command: `npm run producer`
- No configuration needed
- Works out of the box

✅ **Realistic Data**
- Random but realistic transactions
- Multiple fraud patterns
- Proper data structure

✅ **Great for Testing**
- Continuous data generation
- Configurable fraud rate
- Real-time statistics

✅ **Perfect for Demos**
- Visual console output
- Real-time alerts
- WebSocket events

The Kafka test producer is ready for testing and demos!