# Deploy Updated Firestore Rules for Guest Checkout

The firestore.rules have been updated to allow unauthenticated users (guests) to create orders.

## Deploy to Firebase

Run this command in your terminal:

```bash
firebase deploy --only firestore:rules
```

Or if you need to deploy everything:

```bash
firebase deploy
```

## What Changed

- **Orders collection `create` rule**: Changed from `allow create: if isAuthenticated();` to `allow create: if true;`
- This allows guest users (userId like `guest_1234567890`) to create orders without Firebase authentication
- Guests can now proceed directly to payment without logging in

## After Deployment

1. Clear browser cache
2. Test guest checkout flow:
   - Welcome → "Continue as Guest"
   - Browse items → Add to cart
   - "Process Order" → Payment page (no login required)
   - Select payment method → Order created
   - View QR code (for UPI/Card) or "Go to Cashier" (for Cash)

## Rollback (if needed)

If you need to revert:
```bash
git checkout firestore.rules
firebase deploy --only firestore:rules
```
