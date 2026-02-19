# MongoDB Atlas IP Whitelist Setup

## 🚨 Error: IP Not Whitelisted

If you see this error:
```
Could not connect to any servers in your MongoDB Atlas cluster.
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

**This means your current IP address needs to be added to MongoDB Atlas.**

## ✅ Quick Fix (5 Minutes)

### Step 1: Go to MongoDB Atlas

1. Visit: https://cloud.mongodb.com/
2. Log in with your credentials

### Step 2: Navigate to Network Access

1. In the left sidebar, click **"Network Access"**
2. You'll see a list of whitelisted IP addresses

### Step 3: Add Your IP Address

**Option A: Add Current IP (Recommended for Development)**
1. Click **"Add IP Address"** button
2. Click **"Add Current IP Address"**
3. MongoDB will auto-detect your IP
4. Click **"Confirm"**

**Option B: Allow All IPs (Easy but Less Secure)**
1. Click **"Add IP Address"** button
2. Click **"Allow Access from Anywhere"**
3. This adds `0.0.0.0/0` (all IPs)
4. Click **"Confirm"**
5. ⚠️ Only use this for development, not production!

### Step 4: Wait for Update

- MongoDB Atlas takes **1-2 minutes** to update
- You'll see a green "Active" status when ready

### Step 5: Restart Backend

```bash
npm run dev
```

You should now see:
```
✅ MongoDB connected: cluster.hynxywh.mongodb.net
🚀 Server running on port 4000
```

## 🔍 Verify Your Connection

### Test 1: Check Health
```bash
curl http://localhost:4000/health
```

### Test 2: Check Transactions
```bash
curl http://localhost:4000/api/transactions
```

## 🌐 Why Does This Happen?

MongoDB Atlas uses IP whitelisting for security:
- ✅ Only whitelisted IPs can connect
- ✅ Prevents unauthorized access
- ✅ Protects your data

**Your IP changes when:**
- You connect to different WiFi
- Your ISP assigns a new IP
- You use VPN
- You restart your router

## 💡 Solutions for Changing IPs

### Solution 1: Whitelist Each New IP
When your IP changes, add the new IP to Atlas.

### Solution 2: Allow All IPs (Development Only)
Add `0.0.0.0/0` to allow any IP.

⚠️ **Warning:** Only use this for development, never in production!

### Solution 3: Use MongoDB Compass
MongoDB Compass can help manage connections:
1. Download: https://www.mongodb.com/try/download/compass
2. Connect with your connection string
3. Compass will prompt to whitelist your IP

## 🔧 Alternative: Use Local MongoDB

If you don't want to deal with IP whitelisting:

### Install MongoDB Locally

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start MongoDB service

**Update .env:**
```env
MONGODB_URI=mongodb://localhost:27017/fraudshield
```

**Pros:**
- ✅ No IP whitelisting needed
- ✅ Works offline
- ✅ Faster (local)

**Cons:**
- ❌ Need to install MongoDB
- ❌ Not accessible from other devices
- ❌ Need to manage backups

## 📱 Check Your Current IP

### Method 1: Google
Search "what is my ip" on Google

### Method 2: Command Line
```bash
curl ifconfig.me
```

### Method 3: PowerShell
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

## 🆘 Still Having Issues?

### Issue: Connection Timeout

**Check:**
1. Internet connection working?
2. MongoDB Atlas cluster running?
3. Correct connection string in `.env`?

**Test connection string:**
```bash
# Copy your MONGODB_URI from .env
# Paste it in MongoDB Compass to test
```

### Issue: Authentication Failed

**Check:**
1. Username correct in connection string?
2. Password correct (no special characters issues)?
3. Database user has read/write permissions?

**Fix:**
1. Go to MongoDB Atlas
2. Click "Database Access"
3. Verify user exists and has "Atlas Admin" role

### Issue: IP Keeps Changing

**Solutions:**
1. Use `0.0.0.0/0` for development
2. Get static IP from ISP
3. Use VPN with static IP
4. Use local MongoDB

## ✅ Success Checklist

After whitelisting your IP:

- [ ] IP address added to MongoDB Atlas
- [ ] Status shows "Active" (green)
- [ ] Waited 1-2 minutes for update
- [ ] Restarted backend server
- [ ] See "✅ MongoDB connected" message
- [ ] `/health` endpoint returns success
- [ ] Can fetch transactions

## 📚 Additional Resources

- **MongoDB Atlas Docs:** https://www.mongodb.com/docs/atlas/
- **IP Whitelist Guide:** https://www.mongodb.com/docs/atlas/security-whitelist/
- **Connection Troubleshooting:** https://www.mongodb.com/docs/atlas/troubleshoot-connection/

## 🎉 Summary

**Quick Steps:**
1. Go to https://cloud.mongodb.com/
2. Click "Network Access"
3. Click "Add IP Address"
4. Click "Add Current IP Address"
5. Click "Confirm"
6. Wait 1-2 minutes
7. Run `npm run dev`

**Done!** Your backend should now connect successfully! 🚀
