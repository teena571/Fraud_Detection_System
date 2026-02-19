# Admin Profile Management - Complete Guide

## ✅ What's Been Created

### Backend (API)
1. **User Model** - `backend/src/models/User.js`
2. **Admin Controller** - `backend/src/controllers/adminController.js`
3. **Admin Routes** - `backend/src/routes/adminRoutes.js`
4. **Server Integration** - Updated `backend/server.js`

### Frontend (UI)
1. **AdminProfile Component** - `frontend/src/components/AdminProfile.jsx`
2. **Settings Page** - `frontend/src/pages/Settings.jsx`

## 🚀 Features Implemented

### Profile Management
- ✅ Update admin name
- ✅ Update email address
- ✅ Change password (with validation)
- ✅ Upload profile avatar
- ✅ Remove avatar
- ✅ Form validation
- ✅ Success/error notifications

### Security
- ✅ Password strength validation
- ✅ Current password verification
- ✅ Secure password hashing (bcrypt)
- ✅ JWT authentication required
- ✅ Admin role authorization

## 📡 API Endpoints

### GET /api/admin/profile
Get current admin profile

### PUT /api/admin/profile
Update admin profile
- name, email, currentPassword, newPassword, avatar

### POST /api/admin/avatar
Upload avatar

### DELETE /api/admin/avatar
Delete avatar

## 🔧 Setup Instructions

### Step 1: Install Dependencies
```bash
cd backend
npm install bcryptjs
```

### Step 2: Restart Backend
```bash
npm run dev
```

### Step 3: Access Settings
Navigate to: http://localhost:5173/settings

## 🧪 Testing

### Test Profile Update
```bash
curl -X PUT http://localhost:4001/api/admin/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

## 🎯 Usage

1. Navigate to Settings page
2. Click "Profile" tab
3. Update your information
4. Upload avatar (optional)
5. Change password (optional)
6. Click "Save Changes"

## ✨ Features

- Real-time form validation
- Password strength requirements
- Image upload with preview
- Success/error toast notifications
- Responsive design
- Secure API endpoints

---

**Admin Profile Management is now complete!** 🎉
