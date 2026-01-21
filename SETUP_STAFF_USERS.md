# Staff Users Setup Guide

This guide will help you create cashier and server users with proper Firestore profiles and demo credentials.

## Quick Setup (Browser Console)

### Step 1: Open Your App
1. Start your development server: `npm run dev`
2. Open your app in browser (usually `http://localhost:5173` or `http://localhost:5174`)
3. Open browser console (Press `F12` or `Right-click → Inspect → Console`)

### Step 2: Run Setup Script
1. Open the file `scripts/setupStaffUsers.js`
2. Copy the **ENTIRE** script content
3. Paste it into the browser console
4. Press `Enter`

### Step 3: Verify Setup
You should see output like:
```
🚀 Starting Staff Users Setup...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Setting up 2 staff users...

🔧 Processing: cashier@joe.com (cashier)
─────────────────────────────────────────
✅ Created Firebase Auth user: cashier@joe.com
✅ Created Firestore profile for cashier@joe.com
   Role: cashier
   Active: true
   Description: Handles cash payment approvals
✅ Verification:
   ✓ UID: [uid]
   ✓ Email: cashier@joe.com
   ✓ Name: Cashier Node
   ✓ Role: cashier
   ✓ Active: true

🔧 Processing: server@joe.com (server)
─────────────────────────────────────────
✅ Created Firebase Auth user: server@joe.com
✅ Created Firestore profile for server@joe.com
   Role: server
   Active: true
   Description: Handles order serving and QR scanning
✅ Verification:
   ✓ UID: [uid]
   ✓ Email: server@joe.com
   ✓ Name: Server Node
   ✓ Role: server
   ✓ Active: true

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Staff Users Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Demo Credentials:

   CASHIER PORTAL:
   📧 Email: cashier@joe.com
   🔑 Password: cashier123
   🎯 Portal: Cashier Dashboard

   SERVER PORTAL:
   📧 Email: server@joe.com
   🔑 Password: server123
   🎯 Portal: Serving Counter

💡 You can now login with these credentials!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Demo Credentials

### Cashier Portal
- **Email**: `cashier@joe.com`
- **Password**: `cashier123`
- **Portal**: Cashier Dashboard (handles cash payment approvals)

### Server Portal
- **Email**: `server@joe.com`
- **Password**: `server123`
- **Portal**: Serving Counter (handles order serving and QR scanning)

## Firestore Profile Structure

Each user profile in Firestore (`users` collection) has these fields:

```javascript
{
  uid: "user-uid-from-firebase-auth",
  email: "cashier@joe.com" or "server@joe.com",
  name: "Cashier Node" or "Server Node",
  role: "cashier" or "server",  // CRITICAL: Must match exactly
  active: true,
  studentType: null,  // Staff users don't have studentType
  createdAt: Timestamp,
  lastActive: Timestamp
}
```

## Troubleshooting

### Users Already Exist
If you see `⚠️ User already exists in Firebase Auth`:
- The script will still update/create the Firestore profile
- It will sign in temporarily to get the UID, then sign out
- The Firestore profile will be updated with correct role

### Permission Denied Error
If you see `permission-denied` error:
- Check Firestore security rules
- Ensure rules allow users to create/update their own profiles
- Admin users can create/update any profile

### Profile Not Found After Login
If login works but profile is missing:
- Run the setup script again (it will update existing profiles)
- Check Firestore Console to verify profile exists
- Ensure `role` field is set correctly (`cashier` or `server`)

### Wrong Portal After Login
If user logs in but goes to wrong portal:
- Check Firestore profile has correct `role` field
- Role must be exactly: `cashier` or `server` (case-sensitive)
- Run setup script again to update the role

## Manual Setup (Firebase Console)

If the script doesn't work, you can create users manually:

### 1. Create Users in Firebase Auth
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **joecafe-a7fff**
3. Go to **Authentication** → **Users** → **Add user**
4. Create:
   - `cashier@joe.com` / `cashier123`
   - `server@joe.com` / `server123`

### 2. Create Profiles in Firestore
1. Go to **Firestore Database** → `users` collection
2. For each user, create a document with their UID (from Authentication)
3. Add these fields:
   - `uid`: (user's UID from Auth)
   - `email`: `cashier@joe.com` or `server@joe.com`
   - `name`: `Cashier Node` or `Server Node`
   - `role`: `cashier` or `server` (CRITICAL - must match exactly)
   - `active`: `true`
   - `studentType`: `null`
   - `createdAt`: (timestamp)
   - `lastActive`: (timestamp)

## Testing Login

After setup, test login:

1. Click "Admin Login" button on welcome screen
2. Enter credentials:
   - Cashier: `cashier@joe.com` / `cashier123`
   - Server: `server@joe.com` / `server123`
3. You should be routed to:
   - Cashier → Cashier Dashboard
   - Server → Serving Counter

## Notes

- The script uses UPSERT pattern (`setDoc` with `merge: true`)
- Safe to run multiple times - won't create duplicates
- Updates existing profiles if users already exist
- Handles both new user creation and existing user updates
