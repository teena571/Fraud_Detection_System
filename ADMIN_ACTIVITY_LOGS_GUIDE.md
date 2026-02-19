# Admin Activity Logs - Complete Guide

## Overview
Comprehensive activity logging system that tracks all administrative actions with detailed information including timestamps, user details, action types, and metadata.

## Features

### 1. Activity Tracking
- Automatic logging of admin actions
- Manual logging capability
- Detailed action descriptions
- User information (name, email, ID)
- Timestamp for each action
- IP address and user agent tracking
- Request metadata (method, path, query, body)

### 2. Activity Log Table
- Paginated list of all activities (20 per page)
- Real-time search across multiple fields
- Filter by action type (18 types)
- Filter by status (Success/Failure/Pending)
- Sortable columns
- View detailed information modal

### 3. Action Types Supported
- **Authentication**: LOGIN, LOGOUT
- **Profile**: PROFILE_UPDATE, PASSWORD_CHANGE, AVATAR_UPLOAD, AVATAR_DELETE
- **User Management**: USER_CREATE, USER_UPDATE, USER_BLOCK, USER_UNBLOCK, USER_DELETE
- **Rules**: RULE_CREATE, RULE_UPDATE, RULE_DELETE
- **Alerts**: ALERT_UPDATE, ALERT_DELETE
- **Transactions**: TRANSACTION_UPDATE
- **System**: SETTINGS_UPDATE, SYSTEM_CONFIG, OTHER

### 4. Search & Filters
- Search by: action description, user name, user email, target name
- Filter by action type (dropdown with 18 options)
- Filter by status (Success/Failure/Pending)
- Date range filtering (via API)
- User-specific filtering (via API)

### 5. Details Modal
- Full activity log information
- Timestamp and status
- User details
- Action type with icon
- Description
- Target information (type, ID, name)
- IP address and user agent
- Metadata (JSON formatted)
- Error messages (if any)

### 6. Visual Indicators
- Color-coded action badges
- Status badges (green/red/yellow)
- Action icons (emojis)
- Hover effects
- Responsive design

## Backend Implementation

### Database Model
File: `backend/src/models/ActivityLog.js`

**Schema Fields:**
```javascript
{
  userId: ObjectId (ref: User, indexed)
  userName: String
  userEmail: String
  action: String (enum, indexed)
  actionDescription: String
  targetType: String (enum)
  targetId: String
  targetName: String
  metadata: Mixed
  ipAddress: String
  userAgent: String
  status: String (enum: SUCCESS/FAILURE/PENDING)
  errorMessage: String
  createdAt: Date (indexed)
  updatedAt: Date
}
```

**Indexes:**
- `createdAt` (descending)
- `userId + createdAt`
- `action + createdAt`
- `status + createdAt`

**Static Methods:**
- `logActivity()` - Create new activity log
- `getUserActivities()` - Get user's recent activities
- `getActivitiesByAction()` - Get activities by action type

### API Endpoints

#### 1. Get All Activity Logs
```
GET /api/admin/activity
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search term
- `action` - Filter by action type
- `status` - Filter by status (SUCCESS/FAILURE/PENDING)
- `userId` - Filter by user ID
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "logs": [
      {
        "_id": "...",
        "userId": "...",
        "userName": "John Admin",
        "userEmail": "john@example.com",
        "action": "USER_BLOCK",
        "actionDescription": "Blocked user: jane@example.com",
        "targetType": "USER",
        "targetId": "...",
        "targetName": "Jane Doe",
        "metadata": {},
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "status": "SUCCESS",
        "createdAt": "2026-02-19T12:00:00Z",
        "updatedAt": "2026-02-19T12:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Activity logs retrieved successfully"
}
```

#### 2. Get Activity Statistics
```
GET /api/admin/activity/stats
```

**Query Parameters:**
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "totalLogs": 1250,
    "actionCounts": [
      { "action": "LOGIN", "count": 450 },
      { "action": "USER_UPDATE", "count": 200 }
    ],
    "statusCounts": [
      { "status": "SUCCESS", "count": 1200 },
      { "status": "FAILURE", "count": 50 }
    ],
    "recentLogs": [...],
    "topUsers": [
      {
        "userId": "...",
        "userName": "John Admin",
        "userEmail": "john@example.com",
        "activityCount": 150
      }
    ]
  },
  "message": "Activity statistics retrieved successfully"
}
```

#### 3. Get Single Activity Log
```
GET /api/admin/activity/:id
```

**Response:**
```json
{
  "statusCode": 200,
  "data": { ...activity log object... },
  "message": "Activity log retrieved successfully"
}
```

#### 4. Delete Activity Log
```
DELETE /api/admin/activity/:id
```

**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Activity log deleted successfully"
}
```

#### 5. Cleanup Old Logs
```
DELETE /api/admin/activity/cleanup?days=90
```

**Query Parameters:**
- `days` - Delete logs older than X days (default: 90, max: 365)

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "deletedCount": 500,
    "cutoffDate": "2025-11-20T00:00:00Z"
  },
  "message": "Deleted 500 old activity logs"
}
```

### Activity Logger Middleware
File: `backend/src/middleware/activityLogger.js`

**Usage:**
```javascript
import { logActivity, manualLogActivity } from '../middleware/activityLogger.js'

// Automatic logging (middleware)
router.put('/users/:id/block',
  authenticate,
  authorize(['admin']),
  logActivity('USER_BLOCK', (req, data) => 
    `Blocked user: ${data.data.email}`
  ),
  toggleUserBlock
)

// Manual logging (in controller)
await manualLogActivity(req, 'LOGIN', 'User logged in successfully')
```

**Features:**
- Automatic logging after successful responses
- Sanitizes sensitive data (passwords, tokens)
- Captures request metadata
- Determines target type automatically
- Async logging (doesn't block response)

## Frontend Implementation

### Component
File: `frontend/src/components/AdminLogs.jsx`

**Features:**
- Activity logs table with pagination
- Search input (real-time)
- Action type filter (18 options)
- Status filter (Success/Failure/Pending)
- View details modal
- Color-coded badges
- Action icons
- Responsive design

**State Management:**
```javascript
- logs: Array of activity logs
- loading: Loading state
- searchTerm: Search input value
- actionFilter: Selected action type
- statusFilter: Selected status
- currentPage: Current page number
- totalPages: Total pages
- totalCount: Total logs count
- selectedLog: Log for details modal
- showDetails: Modal visibility
```

**Functions:**
- `fetchLogs()` - Fetch logs from API
- `viewLogDetails()` - Open details modal
- `closeDetails()` - Close details modal
- `formatDate()` - Format timestamp
- `getActionColor()` - Get badge color for action
- `getStatusColor()` - Get badge color for status
- `getActionIcon()` - Get emoji icon for action

### Page Integration
File: `frontend/src/pages/Logs.jsx`

The Logs page now uses the AdminLogs component instead of SystemLogs.

## How to Use

### 1. Automatic Logging (Recommended)

Add the `logActivity` middleware to routes:

```javascript
import { logActivity } from '../middleware/activityLogger.js'

router.put('/users/:id',
  authenticate,
  authorize(['admin']),
  logActivity('USER_UPDATE', (req, data) => 
    `Updated user: ${data.data.email}`
  ),
  updateUser
)
```

### 2. Manual Logging

In controllers:

```javascript
import { manualLogActivity } from '../middleware/activityLogger.js'

export const someAction = asyncHandler(async (req, res) => {
  // ... your logic ...
  
  await manualLogActivity(
    req,
    'CUSTOM_ACTION',
    'Description of what happened',
    {
      targetType: 'USER',
      targetId: userId,
      targetName: userName,
      metadata: { key: 'value' }
    }
  )
  
  res.json(...)
})
```

### 3. Using the Model Directly

```javascript
import ActivityLog from '../models/ActivityLog.js'

await ActivityLog.logActivity({
  userId: req.user.id,
  userName: req.user.name,
  userEmail: req.user.email,
  action: 'LOGIN',
  actionDescription: 'User logged in successfully',
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  status: 'SUCCESS'
})
```

## Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Access Logs Page
1. Login as admin at http://localhost:5173/login
2. Click "Logs" in sidebar (📋 icon)
3. You should see the activity logs table

### 4. Test Features

**Search:**
- Type in search box
- Should filter logs by description, user name, email, or target name
- Results update in real-time

**Action Filter:**
- Select action type from dropdown
- Table shows only logs of that action type
- "All Actions" shows everything

**Status Filter:**
- Select status from dropdown
- Table shows only logs with that status

**Pagination:**
- Click "Next" to go to next page
- Click "Previous" to go back
- Page number updates

**View Details:**
- Click 👁️ icon on any log
- Modal opens with full details
- Shows all metadata and information
- Click "Close" to dismiss

### 5. Generate Test Data

Perform admin actions to generate logs:
- Login/Logout
- Update profile
- Change password
- Block/unblock users
- Delete users
- Update settings

Each action should create a log entry.

## Action Type Reference

| Action | Description | Icon | Color |
|--------|-------------|------|-------|
| LOGIN | User logged in | 🔑 | Purple |
| LOGOUT | User logged out | 🚪 | Gray |
| PROFILE_UPDATE | Profile updated | 👤 | Blue |
| PASSWORD_CHANGE | Password changed | ✏️ | Blue |
| AVATAR_UPLOAD | Avatar uploaded | 🖼️ | Blue |
| AVATAR_DELETE | Avatar deleted | 🗑️ | Red |
| USER_CREATE | User created | ➕ | Green |
| USER_UPDATE | User updated | ✏️ | Blue |
| USER_BLOCK | User blocked | 🔒 | Yellow |
| USER_UNBLOCK | User unblocked | 🔓 | Green |
| USER_DELETE | User deleted | 🗑️ | Red |
| RULE_CREATE | Rule created | ➕ | Green |
| RULE_UPDATE | Rule updated | ✏️ | Blue |
| RULE_DELETE | Rule deleted | 🗑️ | Red |
| ALERT_UPDATE | Alert updated | 🚨 | Blue |
| ALERT_DELETE | Alert deleted | 🗑️ | Red |
| TRANSACTION_UPDATE | Transaction updated | ✏️ | Blue |
| SETTINGS_UPDATE | Settings updated | ✏️ | Blue |
| SYSTEM_CONFIG | System configured | 🔧 | Blue |
| OTHER | Other action | 📝 | Gray |

## Security

### Authentication
- All endpoints require JWT authentication
- Admin role required (authorize middleware)
- Token validated on every request

### Data Sanitization
- Passwords and tokens are redacted in metadata
- Sensitive fields replaced with [REDACTED]
- Only safe data stored in logs

### Access Control
- Only admins can view activity logs
- Only admins can delete logs
- Logs track who performed each action

## Performance

### Database Indexes
- Efficient querying with multiple indexes
- Fast searches on common fields
- Optimized for time-based queries

### Pagination
- Default 20 items per page
- Maximum 100 items per page
- Reduces memory usage and load time

### Async Logging
- Logging doesn't block responses
- Fire-and-forget approach
- Errors logged but don't affect operations

## Maintenance

### Cleanup Old Logs
```bash
# Delete logs older than 90 days
curl -X DELETE "http://localhost:4001/api/admin/activity/cleanup?days=90" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitor Log Growth
```bash
# Get statistics
curl -X GET "http://localhost:4001/api/admin/activity/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export Logs
Use the API to fetch logs and export to CSV or JSON for archival.

## Troubleshooting

### Issue: Logs not appearing
- Check: Backend is running
- Check: MongoDB is connected
- Check: User is authenticated as admin
- Solution: Verify API endpoint is accessible

### Issue: Search not working
- Check: Search term is not empty
- Check: Logs exist matching search
- Solution: Try different search terms

### Issue: Filters not working
- Check: Filter value is valid
- Check: Logs exist with that filter
- Solution: Reset filters to "All"

### Issue: Details modal not opening
- Check: Browser console for errors
- Check: Log object has all required fields
- Solution: Refresh page and try again

## Future Enhancements

1. **Export Functionality**
   - Export logs to CSV
   - Export logs to JSON
   - Export filtered results

2. **Advanced Filters**
   - Date range picker
   - Multiple action types
   - User selection dropdown

3. **Real-Time Updates**
   - WebSocket integration
   - Live log streaming
   - Notifications for critical actions

4. **Analytics Dashboard**
   - Activity charts and graphs
   - User activity heatmap
   - Action type distribution
   - Trend analysis

5. **Audit Reports**
   - Generate PDF reports
   - Scheduled email reports
   - Compliance reports

## Summary

The Admin Activity Logs system provides:
- ✅ Comprehensive activity tracking
- ✅ 18 different action types
- ✅ Search and filter capabilities
- ✅ Detailed information modal
- ✅ Color-coded visual indicators
- ✅ Pagination for large datasets
- ✅ Admin-only access
- ✅ Automatic and manual logging
- ✅ Data sanitization
- ✅ Performance optimized
- ✅ Responsive design

Perfect for auditing, compliance, and monitoring administrative actions in the FraudShield system!
