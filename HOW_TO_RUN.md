# FraudShield - Complete Setup & Usage Guide

## 🚀 Quick Start (5 Steps)

### Step 1: Start MongoDB

**Windows:**
```bash
# If MongoDB is installed as a service
net start MongoDB

# Or run manually
mongod
```

**Mac/Linux:**
```bash
# If installed via Homebrew
brew services start mongodb-community

# Or run manually
mongod
```

### Step 2: Start Kafka (Optional but Recommended)

```bash
cd backend
docker-compose -f docker-compose.kafka.yml up -d
```

**Verify Kafka is running:**
```bash
docker ps | grep kafka
```

You should see:
- fraudshield-zookeeper
- fraudshield-kafka
- fraudshield-kafka-ui

### Step 3: Start Backend

```bash
cd backend
npm install
npm run dev
```

**Expected Output:**
```
✅ MongoDB connected
🔄 Initializing Kafka...
✅ Kafka Producer connected
✅ Kafka Consumer connected
✅ Kafka initialized successfully
🚀 Server running on port 4000
📊 WebSocket available at ws://localhost:4000/transactions
```

### Step 4: Start Frontend

**New Terminal:**
```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 5: Start Test Producer (Optional - For Demo)

**New Terminal:**
```bash
cd backend
npm run producer
```

This generates random transactions every 2 seconds for testing.

## 🌐 Access the Application

### Frontend
Open your browser: **http://localhost:5173**

### Backend API
- Health Check: http://localhost:4000/health
- API Base: http://localhost:4000/api

### Kafka UI
- Web Interface: http://localhost:8080

## 📱 Using the Frontend

### 1. Login Page

**Default Credentials:**
- Email: `admin@fraudshield.com`
- Password: `Admin@123`

Or any email/password (mock authentication for demo)

### 2. Dashboard

After login, you'll see:
- **Transaction Statistics** - Total, Safe, Suspicious, Fraud counts
- **Recent Transactions** - Live transaction feed
- **Risk Distribution Chart** - Bar chart showing risk levels
- **Alert Summary** - Active alerts count

### 3. Transactions Page

**Features:**
- View all transactions in a table
- **Search** - Search by transaction ID, user ID
- **Filter** - Filter by status (SAFE, SUSPICIOUS, FRAUD)
- **Sort** - Sort by any column
- **Pagination** - Navigate through pages
- **Real-time Updates** - New transactions appear automatically

**Actions:**
- Click on a transaction to view details
- High-risk transactions highlighted in red

### 4. Alerts Page

**Features:**
- View all alerts
- Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Filter by status (ACTIVE, ACKNOWLEDGED, RESOLVED)
- Real-time alert notifications

**Actions:**
- **Acknowledge** - Mark alert as seen
- **Resolve** - Mark alert as resolved
- **Dismiss** - Dismiss false positives

### 5. Analytics Page

**Features:**
- **Risk Score Distribution** - Bar chart
- **Transactions Per Minute** - Line chart
- **Fraud vs Safe** - Pie chart
- **Time-based Analysis** - Trends over time

All charts update in real-time!

### 6. Rules Page

**Features:**
- View fraud detection rules
- Add new rules
- Edit existing rules
- Enable/disable rules
- Delete rules

**Example Rule:**
- Name: "High Amount Alert"
- Threshold: $50,000
- Risk Score Limit: 70
- Action: Create alert

### 7. Logs Page

**Features:**
- System logs viewer
- Filter by log type (INFO, WARNING, ALERT, ERROR)
- Search logs
- Auto-refresh every 5 seconds

### 8. Settings Page

**Features:**
- User profile settings
- System configuration
- Notification preferences
- Theme settings

## 🧪 Testing the System

### Test 1: Create a Transaction via API

```bash
curl -X POST http://localhost:4000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 75000,
    "riskScore": 85,
    "paymentMethod": "CREDIT_CARD"
  }'
```

**What Happens:**
1. Transaction saved to database
2. Alert created (amount > 50000 AND riskScore > 70)
3. WebSocket event broadcast
4. Frontend updates automatically
5. Alert appears in Alerts page

### Test 2: Use Test Producer

```bash
cd backend
npm run producer
```

**What You'll See:**
- Transactions appearing in real-time on Dashboard
- Alerts being created for risky transactions
- Charts updating automatically
- Statistics changing

### Test 3: Filter Transactions

1. Go to **Transactions** page
2. Use filters:
   - Status: Select "FRAUD"
   - Min Risk Score: 70
3. Click "Apply Filters"
4. See only high-risk transactions

### Test 4: Acknowledge an Alert

1. Go to **Alerts** page
2. Find an active alert
3. Click "Acknowledge" button
4. Alert status changes to "ACKNOWLEDGED"
5. Real-time update via WebSocket

## 📊 Monitoring

### Backend Console

Watch for:
```
📥 Received message from topic 'transactions'
🔄 Processing transaction event: transaction.created
📊 Calculated risk score: 85
✅ Transaction saved to DB: TXN_...
🚨 Alert created for transaction TXN_...
📡 WebSocket broadcast sent to X clients
```

### Frontend Console (Browser DevTools)

Open browser console (F12) to see:
- WebSocket connection status
- Real-time events
- API calls
- Errors (if any)

### Kafka UI

Open http://localhost:8080:
1. Click "Topics"
2. Select "transactions"
3. View messages in real-time
4. Monitor consumer lag

## 🎯 Common Workflows

### Workflow 1: Monitor Fraud in Real-Time

1. **Start all services** (MongoDB, Kafka, Backend, Frontend)
2. **Start test producer** (`npm run producer`)
3. **Open Dashboard** (http://localhost:5173)
4. **Watch real-time updates:**
   - Transactions appearing
   - Alerts being created
   - Charts updating
   - Statistics changing

### Workflow 2: Investigate a Suspicious Transaction

1. **Go to Alerts page**
2. **Click on a HIGH severity alert**
3. **View transaction details:**
   - Amount
   - Risk score
   - User ID
   - Payment method
   - Location
4. **Take action:**
   - Acknowledge alert
   - Resolve if legitimate
   - Dismiss if false positive

### Workflow 3: Analyze Fraud Patterns

1. **Go to Analytics page**
2. **View charts:**
   - Risk distribution
   - Time-based trends
   - Fraud vs Safe ratio
3. **Identify patterns:**
   - Peak fraud times
   - Common risk scores
   - Fraud percentage

### Workflow 4: Configure Rules

1. **Go to Rules page**
2. **Add new rule:**
   - Name: "Large Transfer Alert"
   - Threshold: $100,000
   - Risk Score: 80
   - Enable: Yes
3. **Save rule**
4. **Test with high-amount transaction**

## 🔍 API Testing

### Get All Transactions
```bash
curl http://localhost:4000/api/transactions
```

### Get High-Risk Transactions
```bash
curl "http://localhost:4000/api/transactions?minRiskScore=70&status=FRAUD"
```

### Get All Alerts
```bash
curl http://localhost:4000/api/alerts
```

### Get Active Alerts
```bash
curl http://localhost:4000/api/alerts/active
```

### Get Statistics
```bash
curl http://localhost:4000/api/transactions/stats
curl http://localhost:4000/api/alerts/stats
```

## 🐛 Troubleshooting

### Issue: Frontend Won't Start

**Error:** `EADDRINUSE: address already in use :::5173`

**Solution:**
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

### Issue: Backend Won't Start

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Kill process on port 4000
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9
```

### Issue: MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
1. Start MongoDB:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is running:
   ```bash
   # Windows
   tasklist | findstr mongod
   
   # Mac/Linux
   ps aux | grep mongod
   ```

### Issue: Kafka Connection Failed

**Error:** `Failed to connect Kafka Producer`

**Solution:**
```bash
# Check if Kafka is running
docker ps | grep kafka

# If not running, start it
cd backend
docker-compose -f docker-compose.kafka.yml up -d

# Check logs
docker logs fraudshield-kafka
```

### Issue: No Real-Time Updates

**Error:** WebSocket not connecting

**Solution:**
1. Check browser console for WebSocket errors
2. Verify backend is running
3. Check WebSocket URL in frontend code
4. Refresh the page

### Issue: No Transactions Appearing

**Error:** Empty transaction list

**Solution:**
1. Create a transaction via API:
   ```bash
   curl -X POST http://localhost:4000/api/transactions \
     -H "Content-Type: application/json" \
     -d '{"userId":"user123","amount":1500,"riskScore":35}'
   ```

2. Or start test producer:
   ```bash
   npm run producer
   ```

## 📋 Checklist

Before using the application, ensure:

- ✅ MongoDB is running (port 27017)
- ✅ Kafka is running (port 9092) - Optional
- ✅ Backend is running (port 4000)
- ✅ Frontend is running (port 5173)
- ✅ No port conflicts
- ✅ All dependencies installed (`npm install`)

## 🎓 Tips & Best Practices

### For Demo/Presentation

1. **Start test producer** for continuous data
2. **Open Dashboard** to show real-time updates
3. **Open Alerts page** to show fraud detection
4. **Open Analytics** to show charts
5. **Open Kafka UI** to show event streaming

### For Development

1. **Use mock authentication** (no need for real login)
2. **Check browser console** for errors
3. **Monitor backend console** for processing logs
4. **Use Kafka UI** for debugging
5. **Check MongoDB** with MongoDB Compass

### For Testing

1. **Use test producer** for load testing
2. **Create specific transactions** via API
3. **Test different fraud patterns**
4. **Monitor WebSocket events**
5. **Check alert creation logic**

## 🎉 You're Ready!

The complete FraudShield system is now running:

- ✅ **Frontend** - http://localhost:5173
- ✅ **Backend API** - http://localhost:4000
- ✅ **Kafka UI** - http://localhost:8080
- ✅ **MongoDB** - localhost:27017

### Quick Links

- **Dashboard**: http://localhost:5173/dashboard
- **Transactions**: http://localhost:5173/transactions
- **Alerts**: http://localhost:5173/alerts
- **Analytics**: http://localhost:5173/analytics
- **API Health**: http://localhost:4000/health
- **Kafka Topics**: http://localhost:8080

### Next Steps

1. Explore the Dashboard
2. Create some transactions
3. Watch alerts being created
4. Analyze fraud patterns
5. Configure rules
6. Monitor system logs

Enjoy using FraudShield! 🚀