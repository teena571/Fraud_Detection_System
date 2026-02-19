# FraudShield - Complete User Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [First Time Setup](#first-time-setup)
3. [Running the Application](#running-the-application)
4. [Using the Application](#using-the-application)
5. [Features Guide](#features-guide)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (free tier works)
- Code editor (VS Code recommended)
- Terminal/Command Prompt

### 5-Minute Setup

1. **Clone/Open the project**
   ```bash
   cd FraudShield
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend (in new terminal)
   cd frontend
   npm install
   ```

3. **Configure MongoDB**
   - Go to https://cloud.mongodb.com/
   - Create free cluster (if you haven't)
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Update `backend/.env`:
     ```env
     MONGODB_URI=your_connection_string_here
     ```
   - Whitelist your IP: Network Access → Add IP Address → Add Current IP

4. **Start the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the app**
   - Open browser: http://localhost:5173
   - Login with default admin:
     - Email: `admin@fraudshield.com`
     - Password: `Admin@123`

---

## 🔧 First Time Setup

### Step 1: MongoDB Atlas Setup

1. **Create Account**
   - Go to https://cloud.mongodb.com/
   - Sign up for free account
   - Verify email

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "M0 Free" tier
   - Select region closest to you
   - Click "Create"

3. **Create Database User**
   - Security → Database Access
   - Click "Add New Database User"
   - Username: `fraudshield`
   - Password: Generate secure password
   - User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Address**
   - Security → Network Access
   - Click "Add IP Address"
   - Click "Add Current IP Address"
   - Or click "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Click "Confirm"

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `fraudshield`

### Step 2: Backend Configuration

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Create/Edit .env file**
   ```env
   # Server Configuration
   PORT=4001
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://fraudshield:<password>@cluster0.xxxxx.mongodb.net/fraudshield?retryWrites=true&w=majority

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173

   # Redis Configuration (Optional - Disabled by default)
   REDIS_ENABLED=false
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Kafka Configuration (Optional - Disabled by default)
   KAFKA_ENABLED=false
   KAFKA_BROKERS=localhost:9092
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Seed initial data (Optional)**
   ```bash
   npm run seed
   ```
   This creates:
   - Admin user (admin@fraudshield.com / Admin@123)
   - Sample transactions
   - Sample alerts

### Step 3: Frontend Configuration

1. **Navigate to frontend folder**
   ```bash
   cd frontend
   ```

2. **Create/Edit .env file**
   ```env
   VITE_API_URL=http://localhost:4001/api
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

### Development Mode

**Option 1: Two Terminals (Recommended)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
You should see:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
ℹ️ Redis is disabled
ℹ️ Kafka is disabled
WebSocket server initialized
🚀 Server running on port 4001
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
You should see:
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

**Option 2: Production Mode**

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

### Stopping the Application

- Press `Ctrl + C` in each terminal
- Or close the terminal windows

---

## 💻 Using the Application

### First Login

1. **Open browser**
   - Navigate to: http://localhost:5173

2. **Login page**
   - Email: `admin@fraudshield.com`
   - Password: `Admin@123`
   - Click "Sign In"

3. **You're in!**
   - You'll see the Dashboard

### Navigation

The sidebar menu has these sections:

```
📊 Dashboard          - Overview and statistics
💳 Transactions       - View all transactions
🚨 Alerts             - Fraud alerts and warnings
📈 Risk Analytics     - Analytics and charts
⚙️ Rules Engine       - Fraud detection rules
📋 Logs               - Admin activity logs
👥 Users              - User management (Admin only)
💚 System Health      - System status monitoring (Admin only)
👤 Admin Settings     - Profile and settings (Admin only)
```

---

## 📚 Features Guide

### 1. Dashboard (Home Page)

**What you see:**
- Total transactions count
- Fraud alerts count
- Risk score average
- Recent transactions list
- Real-time updates via WebSocket

**What you can do:**
- View system overview
- Monitor real-time transactions
- See latest alerts
- Quick access to other sections

### 2. Transactions Page

**What you see:**
- Table of all transactions
- Transaction ID, User, Amount, Status, Risk Score, Timestamp
- Color-coded status badges:
  - 🟢 SAFE (Green)
  - 🟡 SUSPICIOUS (Yellow)
  - 🔴 FRAUD (Red)

**What you can do:**
- View all transactions
- Search transactions
- Filter by status
- Sort by columns
- Navigate pages
- Click transaction for details

**How to use:**
1. Click "Transactions" in sidebar
2. Use search box to find specific transactions
3. Use status filter dropdown
4. Click on any transaction row for details

### 3. Alerts Page

**What you see:**
- List of fraud alerts
- Alert type, severity, transaction details
- Timestamp and status

**What you can do:**
- View all fraud alerts
- Filter by severity (High/Medium/Low)
- Mark alerts as resolved
- View alert details
- Take action on suspicious transactions

**How to use:**
1. Click "Alerts" in sidebar
2. Review alerts by severity
3. Click "View Details" to see full information
4. Mark as resolved when handled

### 4. Risk Analytics Page

**What you see:**
- Charts and graphs
- Risk score distribution
- Transaction trends over time
- Fraud detection statistics

**What you can do:**
- Analyze fraud patterns
- View trends
- Export data
- Generate reports

**How to use:**
1. Click "Risk Analytics" in sidebar
2. Review charts and statistics
3. Use date filters to analyze specific periods

### 5. Rules Engine Page (Admin Only)

**What you see:**
- List of fraud detection rules
- Rule conditions and actions
- Active/Inactive status

**What you can do:**
- Create new fraud detection rules
- Edit existing rules
- Enable/disable rules
- Delete rules
- Test rules

**How to use:**
1. Click "Rules Engine" in sidebar
2. Click "Create Rule" to add new rule
3. Define conditions (amount, location, frequency, etc.)
4. Set actions (flag, block, alert)
5. Save and activate rule

### 6. Admin Activity Logs Page (Admin Only)

**What you see:**
- Table of all admin actions
- Timestamp, User, Action, Description, Status
- Color-coded action badges with icons

**What you can do:**
- View all administrative actions
- Search logs by description, user, or email
- Filter by action type (18 types)
- Filter by status (Success/Failure/Pending)
- View detailed log information
- Track who did what and when

**How to use:**
1. Click "Logs" in sidebar
2. Use search box to find specific actions
3. Use action filter dropdown (Login, User Block, etc.)
4. Use status filter (Success/Failure/Pending)
5. Click 👁️ icon to view full details
6. Navigate pages with Previous/Next buttons

**Action Types:**
- 🔑 LOGIN - User logged in
- 🚪 LOGOUT - User logged out
- 👤 PROFILE_UPDATE - Profile updated
- ✏️ PASSWORD_CHANGE - Password changed
- 🖼️ AVATAR_UPLOAD/DELETE - Avatar changes
- ➕ USER_CREATE - New user created
- ✏️ USER_UPDATE - User updated
- 🔒 USER_BLOCK - User blocked
- 🔓 USER_UNBLOCK - User unblocked
- 🗑️ USER_DELETE - User deleted
- ⚙️ RULE_* - Rule operations
- 🚨 ALERT_* - Alert operations
- 🔧 SYSTEM_CONFIG - System changes

### 7. Users Management Page (Admin Only)

**What you see:**
- Table of all users
- User ID, Name, Email, Role, Status, Last Login
- Color-coded status and role badges

**What you can do:**
- View all system users
- Search users by name or email
- Filter by status (Active/Inactive)
- Filter by role (Admin/Analyst/Viewer)
- Block/Unblock users
- Delete users
- View user's transaction history

**How to use:**
1. Click "Users" in sidebar
2. Use search box to find users
3. Use filters to narrow results
4. Click 📊 to view user's transactions
5. Click 🔒 to block user
6. Click 🔓 to unblock user
7. Click 🗑️ to delete user (with confirmation)

**Security:**
- You cannot block yourself
- You cannot delete yourself
- All actions are logged

### 8. System Health Page (Admin Only)

**What you see:**
- Overall system status (Healthy/Degraded/Unhealthy)
- Backend status (uptime, memory usage)
- MongoDB status (connection, database)
- Redis status (connection, latency) - if enabled
- Kafka status (brokers, controller) - if enabled
- WebSocket status (active connections)
- Active connections summary

**What you can do:**
- Monitor system health in real-time
- Check service status
- View memory usage
- See active connections
- Auto-refresh every 5 seconds

**How to use:**
1. Click "System Health" in sidebar
2. View all service statuses
3. Check memory usage bar
4. Monitor active connections
5. Wait for auto-refresh (every 5 seconds)

**Status Colors:**
- 🟢 Green (✅) - Healthy
- 🟡 Yellow (⚠️) - Degraded
- 🔴 Red (❌) - Unhealthy
- ⚪ Gray (⏸️) - Disabled

### 9. Admin Settings Page (Admin Only)

**What you see:**
- Profile tab: Name, Email, Avatar
- Password tab: Change password form
- Settings tab: System preferences

**What you can do:**
- Update your name and email
- Change your password
- Upload/remove profile avatar
- Configure system settings

**How to use:**
1. Click "Admin Settings" in sidebar
2. **Profile Tab:**
   - Update name/email
   - Click "Save Changes"
3. **Password Tab:**
   - Enter current password
   - Enter new password (min 8 chars, uppercase, lowercase, number, special char)
   - Confirm new password
   - Click "Change Password"
4. **Avatar:**
   - Click "Upload Avatar" to add photo
   - Click "Remove Avatar" to delete

---

## 🎯 Common Tasks

### Task 1: Monitor Real-Time Transactions

1. Go to Dashboard
2. Watch "Recent Transactions" section
3. New transactions appear automatically via WebSocket
4. Click any transaction for details

### Task 2: Investigate Fraud Alert

1. Go to Alerts page
2. Find alert with High severity
3. Click "View Details"
4. Review transaction information
5. Check user history
6. Take action (block user, flag transaction)
7. Mark alert as resolved

### Task 3: Block Suspicious User

1. Go to Users page
2. Search for user by email
3. Click 🔒 (block) icon
4. Confirm action
5. User is now blocked
6. Action is logged in Activity Logs

### Task 4: Create Fraud Detection Rule

1. Go to Rules Engine
2. Click "Create Rule"
3. Set rule name: "High Amount Transaction"
4. Add condition: Amount > $10,000
5. Set action: Flag as SUSPICIOUS
6. Save and activate rule
7. Rule now applies to all transactions

### Task 5: Review Admin Activities

1. Go to Logs page
2. Use action filter: "USER_BLOCK"
3. See all user blocking actions
4. Click 👁️ to view details
5. Check who blocked which user and when

### Task 6: Check System Health

1. Go to System Health page
2. Verify all services show green (✅)
3. Check memory usage is below 80%
4. Verify MongoDB is connected
5. Check WebSocket connections count
6. Wait for auto-refresh to see updates

### Task 7: Export Transaction Data

1. Go to Transactions page
2. Apply filters (date range, status)
3. Click "Export" button
4. Choose format (CSV/JSON)
5. Download file

### Task 8: Change Your Password

1. Go to Admin Settings
2. Click "Password" tab
3. Enter current password
4. Enter new password (must meet requirements)
5. Confirm new password
6. Click "Change Password"
7. Success notification appears

---

## 🔍 Understanding the Data

### Transaction Status

- **SAFE** 🟢 - Normal transaction, low risk (score < 30)
- **SUSPICIOUS** 🟡 - Potentially fraudulent (score 30-70)
- **FRAUD** 🔴 - High probability of fraud (score > 70)

### Risk Score

- **0-29**: Low risk - Safe transaction
- **30-69**: Medium risk - Requires review
- **70-100**: High risk - Likely fraud

### User Roles

- **Admin**: Full access to all features
- **Analyst**: View and analyze data, create rules
- **Viewer**: Read-only access to transactions and alerts

### Alert Severity

- **High**: Immediate action required
- **Medium**: Review within 24 hours
- **Low**: Monitor for patterns

---

## 🛠️ Troubleshooting

### Issue: Cannot login

**Solution:**
1. Check backend is running (Terminal 1)
2. Check frontend is running (Terminal 2)
3. Verify MongoDB is connected (check backend logs)
4. Try default credentials:
   - Email: `admin@fraudshield.com`
   - Password: `Admin@123`
5. If still fails, run seed script:
   ```bash
   cd backend
   npm run seed
   ```

### Issue: "Failed to fetch" errors

**Solution:**
1. Check backend is running on port 4001
2. Check frontend .env has correct API URL:
   ```env
   VITE_API_URL=http://localhost:4001/api
   ```
3. Restart frontend after .env changes
4. Check browser console for errors

### Issue: MongoDB connection failed

**Solution:**
1. Check MongoDB Atlas is accessible
2. Verify IP is whitelisted:
   - Go to https://cloud.mongodb.com/
   - Network Access → Add Current IP
3. Check connection string in backend/.env
4. Verify password is correct (no special characters issues)
5. Try "Allow Access from Anywhere" (0.0.0.0/0) for testing

### Issue: No transactions showing

**Solution:**
1. Run seed script to generate sample data:
   ```bash
   cd backend
   npm run seed
   ```
2. Wait for WebSocket to connect
3. Check browser console for errors
4. Refresh page

### Issue: Real-time updates not working

**Solution:**
1. Check WebSocket connection in browser console
2. Verify backend WebSocket is initialized (check logs)
3. Check firewall isn't blocking WebSocket
4. Try refreshing page
5. Check System Health page for WebSocket status

### Issue: "System Health" shows services as unhealthy

**Solution:**
1. **MongoDB unhealthy:**
   - Check MongoDB Atlas is running
   - Verify connection string
   - Check IP whitelist

2. **Redis unhealthy:**
   - Redis is disabled by default
   - Set `REDIS_ENABLED=false` in backend/.env
   - Or install and run Redis if you want to enable it

3. **Kafka unhealthy:**
   - Kafka is disabled by default
   - Set `KAFKA_ENABLED=false` in backend/.env
   - Or install and run Kafka if you want to enable it

### Issue: High memory usage

**Solution:**
1. Check System Health page
2. If memory > 80%, restart backend:
   ```bash
   # Stop backend (Ctrl+C)
   # Start again
   npm run dev
   ```
3. Consider enabling Redis for caching
4. Cleanup old activity logs:
   ```bash
   # Via API or manually in MongoDB
   ```

### Issue: Cannot see "Users" or "System Health" menu

**Solution:**
- These are admin-only features
- Verify you're logged in as admin
- Check user role in Admin Settings
- If not admin, contact system administrator

### Issue: Activity logs not appearing

**Solution:**
1. Perform some admin actions (update profile, block user)
2. Refresh Logs page
3. Check MongoDB is connected
4. Verify you're logged in as admin
5. Check browser console for errors

---

## 📊 Performance Tips

### For Better Performance

1. **Enable Redis** (if you have Redis installed):
   ```env
   REDIS_ENABLED=true
   ```
   - Faster API responses (5ms vs 120ms)
   - Better caching
   - Reduced database load

2. **Enable Kafka** (if you have Kafka installed):
   ```env
   KAFKA_ENABLED=true
   ```
   - Better real-time streaming
   - Scalable message processing
   - Event-driven architecture

3. **Regular Cleanup**:
   - Delete old activity logs (> 90 days)
   - Archive old transactions
   - Clear browser cache periodically

4. **Monitor System Health**:
   - Check memory usage regularly
   - Restart if memory > 90%
   - Monitor active connections

---

## 🔐 Security Best Practices

1. **Change Default Password**
   - Go to Admin Settings → Password
   - Change from default `Admin@123`

2. **Use Strong Passwords**
   - Minimum 8 characters
   - Include uppercase, lowercase, number, special character

3. **Regular Monitoring**
   - Check Activity Logs daily
   - Review suspicious activities
   - Monitor failed login attempts

4. **User Management**
   - Remove inactive users
   - Block suspicious accounts
   - Review user permissions regularly

5. **Keep System Updated**
   - Update dependencies regularly
   - Monitor security advisories
   - Apply patches promptly

---

## 📞 Getting Help

### Documentation Files

- `README.md` - Project overview
- `COMPLETE_USER_GUIDE.md` - This file
- `TECH_STACK_GUIDE.md` - Technology explanations
- `ARCHITECTURE.md` - System architecture
- `USER_MANAGEMENT_GUIDE.md` - User management details
- `SYSTEM_HEALTH_GUIDE.md` - System health monitoring
- `ADMIN_ACTIVITY_LOGS_GUIDE.md` - Activity logs details

### Quick Reference

- Backend runs on: http://localhost:4001
- Frontend runs on: http://localhost:5173
- API endpoint: http://localhost:4001/api
- WebSocket: ws://localhost:4001/transactions

### Common Commands

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Seed data
cd backend && npm run seed

# Install dependencies
npm install

# Check for errors
npm run lint
```

---

## 🎉 You're Ready!

You now know how to:
- ✅ Set up and run FraudShield
- ✅ Navigate all features
- ✅ Monitor transactions and alerts
- ✅ Manage users
- ✅ Track admin activities
- ✅ Monitor system health
- ✅ Troubleshoot common issues

**Start exploring and detecting fraud!** 🚀

For more detailed information on specific features, check the individual guide files in the project root.
