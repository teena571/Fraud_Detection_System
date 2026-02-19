# System Health Dashboard - Visual Summary

## 🎨 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  System Health                              ✅ HEALTHY          │
│  Real-time monitoring of system components  Last: 12:30:45 PM   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Overall Status                                          │   │
│  │  Status: HEALTHY  |  Response Time: 45ms  |  Timestamp  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Backend    │  │   MongoDB    │  │    Redis     │         │
│  │   ✅ healthy │  │   ✅ healthy │  │   ⏸️ disabled│         │
│  │              │  │              │  │              │         │
│  │ Uptime: 1h   │  │ Connected    │  │ Status:      │         │
│  │ Memory: 29%  │  │ Host: ...    │  │ Disabled     │         │
│  │ ████░░░░░░   │  │ DB: fraud... │  │              │         │
│  │ Env: dev     │  │ State: conn  │  │ Set REDIS_   │         │
│  │ Port: 4001   │  │              │  │ ENABLED=true │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Kafka     │  │  WebSocket   │  │   Active     │         │
│  │  ⏸️ disabled │  │   ✅ healthy │  │ Connections  │         │
│  │              │  │              │  │              │         │
│  │ Status:      │  │ Connection:  │  │ WebSocket: 3 │         │
│  │ Disabled     │  │ Active       │  │ MongoDB:  ● │         │
│  │              │  │              │  │ Redis:    ⏸ │         │
│  │ Set KAFKA_   │  │ Active Conn: │  │ Kafka:    ⏸ │         │
│  │ ENABLED=true │  │      3       │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│              Auto-refreshing every 5 seconds                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Status Indicators

### Status Badges
```
✅ HEALTHY    - Green background, checkmark icon
⚠️ DEGRADED   - Yellow background, warning icon
❌ UNHEALTHY  - Red background, X icon
⏸️ DISABLED   - Gray background, pause icon
```

### Connection Indicators
```
● Green  - Connected and healthy
○ Red    - Disconnected or unhealthy
⏸ Gray   - Disabled (not enabled in config)
```

### Memory Usage Bar
```
Low Usage (< 60%):     ████████░░  Green
Medium Usage (60-80%): ████████░░  Yellow
High Usage (> 80%):    ██████████  Red
```

## 📊 Service Cards Detail

### Backend Card
```
┌─────────────────────────┐
│ Backend        ✅ healthy│
├─────────────────────────┤
│ Uptime: 1h 30m 15s      │
│ Memory: 150 / 512 MB    │
│ (29%)                   │
│ ████░░░░░░░░░░░░        │
│ Environment: development│
│ Port: 4001              │
└─────────────────────────┘
```

### MongoDB Card
```
┌─────────────────────────┐
│ MongoDB        ✅ healthy│
├─────────────────────────┤
│ Connection: Connected   │
│ Host: cluster0.mongo... │
│ Database: fraudshield   │
│ Ready State: connected  │
└─────────────────────────┘
```

### Redis Card (Disabled)
```
┌─────────────────────────┐
│ Redis         ⏸️ disabled│
├─────────────────────────┤
│ Status: Disabled        │
│                         │
│ Redis is disabled.      │
│ Set REDIS_ENABLED=true  │
│ to enable caching.      │
└─────────────────────────┘
```

### Redis Card (Enabled & Connected)
```
┌─────────────────────────┐
│ Redis          ✅ healthy│
├─────────────────────────┤
│ Status: Connected       │
│ Latency: 5ms            │
│ Memory Used: 2.5M       │
└─────────────────────────┘
```

### Kafka Card (Disabled)
```
┌─────────────────────────┐
│ Kafka         ⏸️ disabled│
├─────────────────────────┤
│ Status: Disabled        │
│                         │
│ Kafka is disabled.      │
│ Set KAFKA_ENABLED=true  │
│ to enable streaming.    │
└─────────────────────────┘
```

### Kafka Card (Enabled & Connected)
```
┌─────────────────────────┐
│ Kafka          ✅ healthy│
├─────────────────────────┤
│ Status: Connected       │
│ Brokers: 3              │
│ Controller: 1           │
└─────────────────────────┘
```

### WebSocket Card
```
┌─────────────────────────┐
│ WebSocket      ✅ healthy│
├─────────────────────────┤
│ Connection: Active      │
│ Active Connections:     │
│         3               │
│                         │
│ Real-time data streaming│
│ for transactions and    │
│ alerts                  │
└─────────────────────────┘
```

### Active Connections Card
```
┌─────────────────────────┐
│ Active Connections   🔌 │
├─────────────────────────┤
│ WebSocket Clients    3  │
│ MongoDB              ●  │
│ Redis                ⏸  │
│ Kafka                ⏸  │
└─────────────────────────┘
```

## 🔄 Auto-Refresh Flow

```
User Opens Dashboard
        ↓
Initial API Call
        ↓
Display Data
        ↓
Start 5s Timer ──────┐
        ↓            │
    Wait 5s          │
        ↓            │
    API Call         │
        ↓            │
  Update Display     │
        ↓            │
Update Timestamp     │
        ↓            │
        └────────────┘
     (Loop Forever)
```

## 📱 Responsive Layout

### Desktop (3 columns)
```
┌────────┬────────┬────────┐
│Backend │MongoDB │ Redis  │
├────────┼────────┼────────┤
│ Kafka  │WebSock │Connect │
└────────┴────────┴────────┘
```

### Tablet (2 columns)
```
┌────────┬────────┐
│Backend │MongoDB │
├────────┼────────┤
│ Redis  │ Kafka  │
├────────┼────────┤
│WebSock │Connect │
└────────┴────────┘
```

### Mobile (1 column)
```
┌────────┐
│Backend │
├────────┤
│MongoDB │
├────────┤
│ Redis  │
├────────┤
│ Kafka  │
├────────┤
│WebSock │
├────────┤
│Connect │
└────────┘
```

## 🎨 Color Scheme

### Status Colors
- **Healthy**: `bg-green-100 text-green-800`
- **Degraded**: `bg-yellow-100 text-yellow-800`
- **Unhealthy**: `bg-red-100 text-red-800`
- **Disabled**: `bg-gray-100 text-gray-600`

### Memory Bar Colors
- **Low (< 60%)**: `bg-green-500`
- **Medium (60-80%)**: `bg-yellow-500`
- **High (> 80%)**: `bg-red-500`

### Connection Indicators
- **Connected**: `text-green-600`
- **Disconnected**: `text-red-600`
- **Disabled**: `text-gray-400`

## 🔗 Navigation

### Sidebar Menu
```
📊 Dashboard
💳 Transactions
🚨 Alerts
📈 Risk Analytics
⚙️ Rules Engine
📋 Logs
👥 Users
💚 System Health  ← NEW
👤 Admin Settings
```

## 📊 Data Flow

```
Frontend Component
        ↓
   API Request
   (every 5s)
        ↓
Backend Controller
        ↓
    ┌───┴───┐
    ↓       ↓
MongoDB  Redis
Check    Check
    ↓       ↓
    └───┬───┘
        ↓
    Kafka Check
        ↓
  WebSocket Check
        ↓
  Backend Metrics
        ↓
  Aggregate Status
        ↓
   JSON Response
        ↓
Frontend Component
        ↓
  Update Display
```

## 🎯 Key Metrics Displayed

### Backend
- Uptime (formatted)
- Memory usage (MB and %)
- Environment
- Port
- Node.js version

### MongoDB
- Connection status
- Host
- Database name
- Ready state

### Redis
- Connection status
- Latency
- Memory used
- Enabled/Disabled

### Kafka
- Connection status
- Broker count
- Controller ID
- Enabled/Disabled

### WebSocket
- Active/Inactive
- Connection count

## 🚀 Quick Stats

- **Total Services Monitored**: 5
- **Refresh Interval**: 5 seconds
- **Response Time**: < 50ms (typical)
- **API Endpoint**: `/api/admin/health`
- **Frontend Route**: `/health`
- **Access Level**: Admin only
- **Auto-refresh**: Yes
- **Real-time**: Yes

## ✨ Visual Features

- ✅ Color-coded status badges
- ✅ Animated progress bars
- ✅ Real-time updates
- ✅ Loading spinners
- ✅ Toast notifications
- ✅ Responsive grid
- ✅ Clean typography
- ✅ Consistent spacing
- ✅ Hover effects
- ✅ Smooth transitions

## 📐 Component Structure

```
SystemHealth.jsx
├── Header
│   ├── Title
│   ├── Description
│   └── Overall Status Badge
├── Overall Status Card
│   ├── Status
│   ├── Response Time
│   └── Timestamp
└── Service Cards Grid
    ├── Backend Card
    ├── MongoDB Card
    ├── Redis Card
    ├── Kafka Card
    ├── WebSocket Card
    └── Connections Card
```

## 🎨 UI Components Used

- `Card` - Container for each service
- `LoadingSpinner` - Initial load state
- `Toast` - Error notifications
- Status badges - Custom styled spans
- Progress bars - Custom div elements
- Connection indicators - Unicode symbols

## 📊 Status Summary

```
Overall Status = All services healthy?
├── Yes → ✅ HEALTHY (green)
├── Some issues → ⚠️ DEGRADED (yellow)
└── Critical issues → ❌ UNHEALTHY (red)

Service Status = Individual check
├── Running & OK → ✅ healthy (green)
├── Running with issues → ⚠️ degraded (yellow)
├── Not running → ❌ unhealthy (red)
└── Not enabled → ⏸️ disabled (gray)
```

This visual summary provides a complete picture of the System Health Dashboard's appearance and functionality!
