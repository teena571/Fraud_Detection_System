# User Management Testing Checklist

## Pre-Test Setup

### 1. Backend Running
```bash
cd backend
npm run dev
```
✅ Backend should show:
- MongoDB connected
- Server running on port 4001
- No errors in console

### 2. Frontend Running
```bash
cd frontend
npm run dev
```
✅ Frontend should be accessible at http://localhost:5173

### 3. Login as Admin
- Navigate to http://localhost:5173/login
- Use admin credentials
- Should redirect to dashboard

## Test Cases

### ✅ Navigation Test
- [ ] "Users" menu item appears in sidebar (with 👥 icon)
- [ ] "Users" is positioned between "Logs" and "Admin Settings"
- [ ] Clicking "Users" navigates to /users route
- [ ] Page title shows "User Management"

### ✅ User List Display
- [ ] Users table loads successfully
- [ ] Shows columns: User ID, Name, Email, Role, Status, Last Login, Actions
- [ ] User avatars or initials display correctly
- [ ] Status badges show correct colors (green=active, red=blocked)
- [ ] Role badges show correct colors (purple=admin, blue=analyst, gray=viewer)
- [ ] Total user count displays at top right

### ✅ Search Functionality
- [ ] Search box accepts input
- [ ] Search filters users by name (case-insensitive)
- [ ] Search filters users by email (case-insensitive)
- [ ] Search resets to page 1
- [ ] Clearing search shows all users again

### ✅ Filter Functionality
- [ ] Status filter dropdown works (All/Active/Inactive)
- [ ] Role filter dropdown works (All/Admin/Analyst/Viewer)
- [ ] Filters reset to page 1
- [ ] Multiple filters work together
- [ ] "No users found" message shows when no results

### ✅ Pagination
- [ ] Shows "Page X of Y" text
- [ ] Previous button disabled on first page
- [ ] Next button disabled on last page
- [ ] Previous button navigates to previous page
- [ ] Next button navigates to next page
- [ ] Page navigation maintains filters

### ✅ View Transactions Action (📊)
- [ ] Clicking 📊 icon opens transaction modal
- [ ] Modal shows user name and email in header
- [ ] Transaction list loads (or shows "No transactions found")
- [ ] Each transaction shows: ID, amount, timestamp, status, risk score
- [ ] Status badges colored correctly (green/yellow/red)
- [ ] Modal scrolls if many transactions
- [ ] Close button closes modal
- [ ] Clicking outside modal closes it

### ✅ Block/Unblock Action (🔒/🔓)
- [ ] Active user shows 🔒 (block) icon
- [ ] Blocked user shows 🔓 (unblock) icon
- [ ] Clicking 🔒 blocks user (status changes to "Blocked")
- [ ] Clicking 🔓 unblocks user (status changes to "Active")
- [ ] Success toast notification appears
- [ ] User list refreshes automatically
- [ ] Cannot block yourself (error toast appears)

### ✅ Delete Action (🗑️)
- [ ] Clicking 🗑️ shows confirmation dialog
- [ ] Confirmation dialog has proper message
- [ ] Clicking "Cancel" does nothing
- [ ] Clicking "OK" deletes user
- [ ] Success toast notification appears
- [ ] User list refreshes automatically
- [ ] Deleted user no longer appears in list
- [ ] Cannot delete yourself (error toast appears)

### ✅ Error Handling
- [ ] Invalid user ID shows error toast
- [ ] Network errors show error toast
- [ ] Unauthorized access redirects to login
- [ ] Self-blocking shows error: "Cannot block yourself"
- [ ] Self-deletion shows error: "Cannot delete yourself"

### ✅ Loading States
- [ ] Initial load shows loading spinner
- [ ] Transaction modal shows loading spinner
- [ ] Actions disable during API calls (optional)

### ✅ Responsive Design
- [ ] Table scrolls horizontally on small screens
- [ ] Modal is responsive and scrollable
- [ ] Filters stack properly on mobile
- [ ] Pagination buttons work on mobile

### ✅ Security Tests
- [ ] Logout and login as non-admin user
- [ ] "Users" menu should NOT appear for non-admin
- [ ] Direct navigation to /users should redirect or show error
- [ ] API calls without admin role should fail (401)

## API Endpoint Tests (Optional - Use Postman/Thunder Client)

### GET /api/admin/users
```bash
curl -X GET "http://localhost:4001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200 OK with user list

### GET /api/admin/users/:id
```bash
curl -X GET "http://localhost:4001/api/admin/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200 OK with user details

### PUT /api/admin/users/:id/block
```bash
curl -X PUT "http://localhost:4001/api/admin/users/USER_ID/block" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```
Expected: 200 OK with updated user

### DELETE /api/admin/users/:id
```bash
curl -X DELETE "http://localhost:4001/api/admin/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200 OK with success message

### GET /api/admin/users/:id/transactions
```bash
curl -X GET "http://localhost:4001/api/admin/users/USER_ID/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Expected: 200 OK with transaction list

## Common Issues & Solutions

### Issue: "Users" menu not appearing
- Solution: Make sure you're logged in as admin role
- Check: AuthContext provides correct user role

### Issue: API returns 401 Unauthorized
- Solution: Check JWT token in localStorage
- Check: Token hasn't expired
- Check: Backend auth middleware is working

### Issue: Cannot see any users
- Solution: Make sure MongoDB has user data
- Run: `npm run seed` in backend to create test data

### Issue: Transactions not loading
- Solution: Check if Transaction model exists
- Check: User email matches transaction userId field

### Issue: Self-blocking/deletion not prevented
- Solution: Check backend controller logic
- Check: req.user.id is correctly set by auth middleware

## Test Data Requirements

For complete testing, you need:
- At least 3-5 users with different roles
- At least 1 admin user (for login)
- At least 1 user with transactions
- At least 1 blocked user
- At least 1 active user

You can create test data using the seed script:
```bash
cd backend
npm run seed
```

## Success Criteria

All checkboxes above should be checked (✅) for the feature to be considered complete and working.

## Notes

- Test in both Chrome and Firefox if possible
- Test with network throttling (slow 3G) to see loading states
- Test with browser console open to catch any JavaScript errors
- Check backend logs for any server errors during testing
