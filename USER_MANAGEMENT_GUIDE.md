# User Management System Guide

## Overview
Complete user management system for FraudShield with backend APIs and frontend interface.

## Features

### 1. User List & Search
- View all users in a paginated table
- Search by name or email
- Filter by status (Active/Inactive)
- Filter by role (Admin/Analyst/Viewer)
- Display user avatar, name, email, role, status, and last login

### 2. User Actions
- **Block/Unblock**: Toggle user active status
- **Delete**: Remove user from system (with confirmation)
- **View Transactions**: See user's transaction history in modal

### 3. Security Features
- Admin-only access (requires admin role)
- Cannot block or delete yourself
- JWT authentication required
- Input validation on all endpoints

## Backend APIs

### Get All Users
```
GET /api/admin/users
Query Parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10, max: 100)
  - search: Search by name or email
  - status: Filter by 'active' or 'inactive'
  - role: Filter by 'admin', 'analyst', or 'viewer'
  - sortBy: Sort field (default: 'createdAt')
  - sortOrder: 'asc' or 'desc' (default: 'desc')

Response:
{
  "statusCode": 200,
  "data": {
    "users": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Users retrieved successfully"
}
```

### Get Single User
```
GET /api/admin/users/:id

Response:
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "analyst",
    "isActive": true,
    "lastLogin": "2026-02-19T10:30:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  },
  "message": "User retrieved successfully"
}
```

### Block/Unblock User
```
PUT /api/admin/users/:id/block
Body:
{
  "isActive": false  // false to block, true to unblock
}

Response:
{
  "statusCode": 200,
  "data": { ...updated user... },
  "message": "User blocked successfully"
}
```

### Delete User
```
DELETE /api/admin/users/:id

Response:
{
  "statusCode": 200,
  "data": null,
  "message": "User deleted successfully"
}
```

### Get User Transactions
```
GET /api/admin/users/:id/transactions
Query Parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10, max: 100)

Response:
{
  "statusCode": 200,
  "data": {
    "transactions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 25,
      "limit": 10
    }
  },
  "message": "User transactions retrieved successfully"
}
```

## Frontend Component

### Location
- Component: `frontend/src/components/UserManagement.jsx`
- Page: `frontend/src/pages/Users.jsx`
- Route: `/users` (Admin only)

### Features
1. **Search & Filters**
   - Real-time search by name/email
   - Status filter dropdown
   - Role filter dropdown
   - Auto-reset to page 1 on filter change

2. **User Table**
   - Displays user avatar or initial
   - Shows user ID (last 8 chars), name, email, role, status, last login
   - Color-coded status badges (green=active, red=blocked)
   - Color-coded role badges (purple=admin, blue=analyst, gray=viewer)

3. **Actions**
   - 📊 View Transactions: Opens modal with transaction history
   - 🔒/🔓 Block/Unblock: Toggle user status
   - 🗑️ Delete: Remove user (with confirmation)

4. **Transaction Modal**
   - Shows user's transaction history
   - Displays transaction ID, amount, timestamp, status, risk score
   - Color-coded status (green=SAFE, yellow=SUSPICIOUS, red=FRAUD)
   - Scrollable list with loading state

5. **Pagination**
   - Previous/Next buttons
   - Shows current page and total pages
   - Disabled state when at boundaries

## Navigation

### Sidebar Menu
The Users menu item is added to the sidebar:
- Icon: 👥
- Label: "Users"
- Path: `/users`
- Position: Between "Logs" and "Admin Settings"

## Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

Backend should be running on http://localhost:4001

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

Frontend should be running on http://localhost:5173

### 3. Login as Admin
- Navigate to http://localhost:5173/login
- Login with admin credentials
- You should see the "Users" menu item in the sidebar

### 4. Test User Management
1. Click "Users" in sidebar
2. You should see the user list
3. Try searching for a user
4. Try filtering by status/role
5. Click 📊 to view a user's transactions
6. Click 🔒 to block a user
7. Click 🔓 to unblock a user
8. Click 🗑️ to delete a user (will ask for confirmation)

### 5. Test Security
- Try blocking yourself (should fail with error message)
- Try deleting yourself (should fail with error message)
- Logout and login as non-admin (Users menu should not appear)

## Error Handling

The system handles various errors:
- User not found (404)
- Cannot block/delete yourself (400)
- Invalid user ID (400)
- Unauthorized access (401)
- Validation errors (400)

All errors are displayed as toast notifications in the UI.

## Database Requirements

The User model must have these fields:
- `_id`: MongoDB ObjectId
- `name`: String
- `email`: String (unique)
- `role`: String (admin/analyst/viewer)
- `isActive`: Boolean
- `avatar`: String (optional)
- `lastLogin`: Date
- `createdAt`: Date
- `updatedAt`: Date

## Dependencies

### Backend
- express-validator: Input validation
- bcryptjs: Password hashing (already installed)
- mongoose: MongoDB ODM

### Frontend
- react-router-dom: Routing
- Toast context: Notifications
- Auth context: Authentication

## Next Steps

1. ✅ Backend APIs implemented
2. ✅ Frontend component created
3. ✅ Routes added to App.jsx
4. ✅ Navigation updated in Sidebar
5. ✅ bcryptjs dependency verified
6. 🔄 Ready to test!

## Notes

- All user management operations require admin role
- Pagination defaults to 10 items per page
- Search is case-insensitive
- Transactions are sorted by timestamp (newest first)
- User avatars can be base64 encoded images or URLs
- The system prevents self-blocking and self-deletion for safety
