# System Health Dashboard - Test Checklist

## Pre-Test Setup

### Backend Running
```bash
cd backend
npm run dev
```
- [ ] Backend starts successfully
- [ ] MongoDB connected
- [ ] Server running on port 4001
- [ ] No errors in console

### Frontend Running
```bash
cd frontend
npm run dev
```
- [ ] Frontend accessible at http://localhost:5173
- [ ] No build errors

### Login as Admin
- [ ] Navigate to http://localhost:5173/login
- [ ] Login with admin credentials
- [ ] Redirected to dashboard

## Navigation Tests

### Sidebar Menu
- [ ] "System Health" menu item visible (💚 icon)
- [ ] Positioned between "Users" and "Admin Settings"
- [ ] Clicking navigates to /health route
- [ ] Active state highlights correctly

## Dashboard Display Tests

### Overall Status Card
- [ ] Shows overall system status (Healthy/Degraded/Unhealthy)
- [ ] Displays response time (e.g., "45ms")
- [ ] Shows timestamp in readable format
- [ ] Status badge has correct color (green/yellow/red)
- [ ] Status icon displays correctly (✅/⚠️/❌)
- [ ] "Last updated" timestamp shows and updates

### Backend Status Card
- [ ] Shows "healthy" status
- [ ] Displays uptime in human-readable format (e.g., "1h 30m 15s")
- [ ] Shows memory usage (used/total MB)
- [ ] Memory percentage calculated correctly
- [ ] Memory progress bar displays
- [ ] Progress bar color changes based on usage:
  - [ ] Green when < 60%
  - [ ] Yellow when 60-80%
  - [ ] Red when > 80%
- [ ] Shows environment (development/production)
- [ ] Shows port number (4001)

### MongoDB Status Card
- [ ] Shows connection status (Connected/Disconnected)
- [ ] Displays host information
- [ ] Shows database name
- [ ] Shows ready state (connected/connecting/disconnecting)
- [ ] Status badge color correct (green=healthy, red=unhealthy)

### Redis Status Card
- [ ] Shows correct status based on REDIS_ENABLED setting
- [ ] If disabled:
  - [ ] Shows "Disabled" status
  - [ ] Gray badge with pause icon (⏸️)
  - [ ] Helpful message displayed
- [ ] If enabled and connected:
  - [ ] Shows "Connected" status
  - [ ] Displays latency (e.g., "5ms")
  - [ ] Shows memory used
  - [ ] Green badge with checkmark (✅)
- [ ] If enabled but disconnected:
  - [ ] Shows "Disconnected" status
  - [ ] Red badge with X (❌)

### Kafka Status Card
- [ ] Shows correct status based on KAFKA_ENABLED setting
- [ ] If disabled:
  - [ ] Shows "Disabled" status
  - [ ] Gray badge with pause icon (⏸️)
  - [ ] Helpful message displayed
- [ ] If enabled and connected:
  - [ ] Shows "Connected" status
  - [ ] Displays number of brokers
  - [ ] Shows controller info
  - [ ] Green badge with checkmark (✅)
- [ ] If enabled but disconnected:
  - [ ] Shows "Disconnected" status
  - [ ] Red badge with X (❌)

### WebSocket Status Card
- [ ] Shows connection status (Active/Inactive)
- [ ] Displays active connections count
- [ ] Count is a number (not NaN or undefined)
- [ ] Shows descriptive text about real-time streaming
- [ ] Status badge color correct

### Active Connections Summary Card
- [ ] Shows WebSocket clients count
- [ ] MongoDB indicator:
  - [ ] Filled circle (●) when connected
  - [ ] Empty circle (○) when disconnected
  - [ ] Green when connected, red when disconnected
- [ ] Redis indicator:
  - [ ] Filled circle (●) when connected
  - [ ] Empty circle (○) when disconnected
  - [ ] Pause (⏸) when disabled
  - [ ] Correct color (green/red/gray)
- [ ] Kafka indicator:
  - [ ] Filled circle (●) when connected
  - [ ] Empty circle (○) when disconnected
  - [ ] Pause (⏸) when disabled
  - [ ] Correct color (green/red/gray)

## Auto-Refresh Tests

### Polling Functionality
- [ ] Dashboard loads initial data
- [ ] "Last updated" timestamp shows
- [ ] Wait 5 seconds
- [ ] "Last updated" timestamp updates
- [ ] Data refreshes automatically
- [ ] No errors in console during refresh
- [ ] No flickering or layout shifts

### Multiple Tabs Test
- [ ] Open dashboard in first tab
- [ ] Note WebSocket connections count
- [ ] Open dashboard in second tab
- [ ] WebSocket connections count increases
- [ ] Close second tab
- [ ] WebSocket connections count decreases

### Background Refresh
- [ ] Open dashboard
- [ ] Switch to another tab
- [ ] Wait 10+ seconds
- [ ] Switch back to dashboard
- [ ] Data is up-to-date
- [ ] Polling continued in background

## Responsive Design Tests

### Desktop (1920x1080)
- [ ] All cards visible in 3-column grid
- [ ] No horizontal scrolling
- [ ] Cards properly aligned
- [ ] Text not truncated

### Tablet (768x1024)
- [ ] Cards display in 2-column grid
- [ ] Layout adjusts properly
- [ ] All content readable

### Mobile (375x667)
- [ ] Cards display in 1-column stack
- [ ] All cards accessible by scrolling
- [ ] Text remains readable
- [ ] No horizontal overflow

## Loading States

### Initial Load
- [ ] Shows loading spinner
- [ ] Spinner centered on page
- [ ] No flash of empty content
- [ ] Smooth transition to data display

### Error State
- [ ] If API fails, shows error message
- [ ] Error toast notification appears
- [ ] Helpful error message displayed
- [ ] Can retry by refreshing page

## API Tests

### Endpoint Access
```bash
# Get JWT token from localStorage after login
curl -X GET "http://localhost:4001/api/admin/health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 200 OK
- [ ] Response has correct structure
- [ ] All service statuses included
- [ ] Response time < 100ms (typically)

### Authentication
```bash
# Without token
curl -X GET "http://localhost:4001/api/admin/health"
```
- [ ] Returns 401 Unauthorized
- [ ] Error message clear

### Non-Admin Access
- [ ] Logout and login as non-admin user
- [ ] "System Health" menu should not appear
- [ ] Direct navigation to /health should redirect or error
- [ ] API call returns 403 Forbidden

## Service State Tests

### All Services Healthy
- [ ] Overall status: "HEALTHY" (green)
- [ ] All service cards show healthy status
- [ ] No error messages

### Redis Disabled (REDIS_ENABLED=false)
- [ ] Redis card shows "Disabled"
- [ ] Gray badge with pause icon
- [ ] Overall status still "HEALTHY"
- [ ] Helpful message about enabling Redis

### Kafka Disabled (KAFKA_ENABLED=false)
- [ ] Kafka card shows "Disabled"
- [ ] Gray badge with pause icon
- [ ] Overall status still "HEALTHY"
- [ ] Helpful message about enabling Kafka

### MongoDB Disconnected (simulate)
- [ ] MongoDB card shows "Unhealthy"
- [ ] Red badge with X icon
- [ ] Overall status: "DEGRADED" (yellow)
- [ ] Other services still show correct status

## Performance Tests

### Response Time
- [ ] Initial load < 2 seconds
- [ ] Auto-refresh < 500ms
- [ ] No lag or freezing
- [ ] Smooth animations

### Memory Usage
- [ ] No memory leaks after 5+ minutes
- [ ] Browser memory stable
- [ ] No console warnings

### Network Usage
- [ ] Each poll makes 1 request
- [ ] Response size reasonable (< 5KB)
- [ ] No unnecessary requests

## Edge Cases

### Long Uptime
- [ ] Uptime formats correctly for days (e.g., "5d 12h 30m 15s")
- [ ] No overflow or wrapping issues

### High Memory Usage
- [ ] Memory bar shows correctly at 90%+
- [ ] Red color applied
- [ ] Percentage accurate

### Zero WebSocket Connections
- [ ] Shows "0" not blank or error
- [ ] Card still displays properly

### Very Long Host Names
- [ ] MongoDB host truncates with ellipsis
- [ ] Hover shows full hostname (title attribute)
- [ ] No layout breaking

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Proper rendering

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Proper rendering

### Safari (if available)
- [ ] All features work
- [ ] No console errors
- [ ] Proper rendering

### Edge
- [ ] All features work
- [ ] No console errors
- [ ] Proper rendering

## Cleanup Tests

### Component Unmount
- [ ] Navigate away from health page
- [ ] Check console for cleanup
- [ ] No "Can't perform a React state update on unmounted component" warnings
- [ ] Polling interval cleared

### Browser Close
- [ ] Close browser tab
- [ ] No errors in backend logs
- [ ] WebSocket connections decrease

## Success Criteria

All checkboxes above should be checked (✅) for the feature to be considered complete and production-ready.

## Common Issues & Solutions

### Issue: "Last updated" not changing
- Check: Browser console for errors
- Check: Network tab for API calls
- Solution: Verify polling interval is set

### Issue: WebSocket connections always 0
- Check: Backend logs for WebSocket initialization
- Check: WebSocket service is running
- Solution: Restart backend

### Issue: Services show "unhealthy" incorrectly
- Check: Service configuration in .env
- Check: Service is actually running
- Solution: Verify connection strings and ports

### Issue: Memory bar not showing
- Check: Backend returns memory data
- Check: Percentage calculation
- Solution: Verify process.memoryUsage() works

### Issue: Auto-refresh stops
- Check: Component is still mounted
- Check: No JavaScript errors
- Solution: Check useEffect cleanup

## Test Data Requirements

For complete testing, ensure:
- MongoDB is connected and accessible
- Backend is running on port 4001
- At least 1 admin user exists
- WebSocket service is initialized
- Redis/Kafka can be enabled/disabled for testing

## Notes

- Test in both development and production modes
- Test with different .env configurations
- Monitor backend logs during testing
- Use browser DevTools Network tab to verify API calls
- Check for any console warnings or errors
