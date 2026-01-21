# Quick Deploy Guide - Firestore Indexes

## ✅ PowerShell Execution Policy Fixed

The execution policy issue has been resolved. You can now deploy indexes.

## 🚀 Quick Deploy (Recommended)

**Run this single command:**

```powershell
cd "D:\Joe 3rd time proj"
.\deploy-indexes-fixed.ps1
```

This script will:
1. ✅ Fix PowerShell execution policy automatically
2. ✅ Check Firebase CLI installation
3. ✅ Authenticate with Firebase (opens browser)
4. ✅ Set Firebase project
5. ✅ Deploy all 8 Firestore indexes

## 📋 Manual Steps (Alternative)

If you prefer to run commands manually:

```powershell
# 1. Fix execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# 2. Navigate to project
cd "D:\Joe 3rd time proj"

# 3. Login to Firebase (opens browser)
firebase login

# 4. Set project
firebase use joecafe-a7fff

# 5. Deploy indexes
firebase deploy --only firestore:indexes
```

## ⚠️ Important Notes

1. **Execution Policy:** The script fixes this automatically for the current session
2. **Authentication:** Browser window will open - complete authentication there
3. **Build Time:** Indexes take 5-15 minutes to build after deployment
4. **No Downtime:** Queries continue to work during index build

## ✅ What Gets Deployed

- **8 Firestore indexes** covering all query patterns:
  - Orders by createdAt
  - Orders by paymentType + paymentStatus + createdAt
  - Orders by orderStatus + paymentStatus + qrStatus + scannedAt
  - Scan logs by scanTime
  - Serve logs by servedAt
  - And more...

## 📊 Verify Deployment

After deployment, check status:
- **Firebase Console:** https://console.firebase.google.com/project/joecafe-a7fff/firestore/indexes
- **Status:** Building → Enabled (when ready)

---

**Ready to deploy!** Run `.\deploy-indexes-fixed.ps1` to start.
