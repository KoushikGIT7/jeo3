# 🧪 Real Crowd Simulation - Stress Test Guide

## Setup (2 minutes)

1. **Open 4 Browser Tabs:**
   - Tab 1: Student Portal (http://localhost:5173)
   - Tab 2: Cashier Portal (http://localhost:5173)
   - Tab 3: Server Portal (http://localhost:5173)
   - Tab 4: Admin Dashboard (http://localhost:5173)

2. **Login to Each:**
   - Student: Use student account
   - Cashier: Use cashier account
   - Server: Use server account
   - Admin: Use admin account

---

## Test Sequence (15 minutes)

### Test 1: Rapid Cash Orders (3 min)

**Student Tab:**
1. Add 5 items to cart
2. Proceed to payment
3. Select "Cash" payment
4. Submit order
5. **Repeat 4 more times** (total 5 orders)

**Expected Results:**
- ✅ All 5 orders appear in Cashier tab
- ✅ Orders appear in real-time (no refresh needed)
- ✅ No duplicate orders
- ✅ Order numbers are unique

**Cashier Tab:**
- ✅ See all 5 pending cash orders
- ✅ Orders sorted by creation time (newest first)
- ✅ Can approve each order individually

---

### Test 2: Rapid Approval (2 min)

**Cashier Tab:**
1. Click "Approve" on Order 1
2. Immediately click "Approve" on Order 2
3. Continue for all 5 orders rapidly

**Expected Results:**
- ✅ All approvals succeed
- ✅ No "already processing" errors
- ✅ QR codes generated for all orders
- ✅ Orders move to "Approved" state

**Student Tab:**
- ✅ QR codes appear automatically
- ✅ No refresh needed
- ✅ Can see all 5 QR codes

---

### Test 3: Simultaneous Serving (3 min)

**Server Tab:**
1. Wait for orders to appear (after approval)
2. **Open second browser window** (same server account)
3. In Window 1: Scan QR for Order 1
4. **At same time**, in Window 2: Scan QR for Order 2

**Expected Results:**
- ✅ Both scans succeed
- ✅ No "order locked" errors
- ✅ Both orders appear in "Active Orders"
- ✅ Items show as "Ready to Serve"

---

### Test 4: Partial Serving (3 min)

**Server Tab:**
1. Find an order with 3 items
2. Serve 2 items (leave 1 pending)
3. Check order status

**Expected Results:**
- ✅ Order shows "1 item pending"
- ✅ Served items show correct quantity
- ✅ Pending item still visible

---

### Test 5: Search & Complete Pending (2 min)

**Server Tab:**
1. Use search bar
2. Search for order number from Test 4
3. Serve remaining pending item

**Expected Results:**
- ✅ Order found via search
- ✅ Can serve remaining item
- ✅ Order status changes to "Completed"
- ✅ Order disappears from active list

---

### Test 6: Offline Resilience (2 min)

**Server Tab:**
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to serve an item

**Expected Results:**
- ✅ 🔴 Offline indicator appears
- ✅ Serve button disabled
- ✅ Clear error message: "No internet connection"
- ✅ Re-enable network → buttons re-enable
- ✅ Data auto-refreshes

---

## Success Criteria

### ✅ All Tests Pass If:

1. **No Duplicates**
   - Each order has unique ID
   - No duplicate QR codes
   - No duplicate items in serving list

2. **No Blocking**
   - Can approve multiple orders rapidly
   - Can serve from multiple tabs simultaneously
   - No "processing" locks

3. **No Refresh Needed**
   - Real-time updates across all tabs
   - QR codes appear automatically
   - Order status updates instantly

4. **Offline Handling**
   - Buttons disable when offline
   - Clear status indicators
   - Auto-recovery on reconnect

---

## Failure Scenarios to Watch For

### ❌ If You See:

1. **"Index required" error**
   - **Fix:** Wait for indexes to build (5-15 min)
   - **Check:** Firebase Console → Firestore → Indexes

2. **"Order not found" error**
   - **Fix:** Check Firestore connection
   - **Check:** Verify order exists in database

3. **Duplicate orders**
   - **Fix:** Check order creation logic
   - **Check:** Verify Firestore transactions

4. **QR codes not generating**
   - **Fix:** Check payment status
   - **Fix:** Check QR generation function

5. **Real-time updates not working**
   - **Fix:** Check Firestore listeners
   - **Fix:** Verify network connection

---

## Post-Test Verification

After completing all tests:

1. **Check Admin Dashboard:**
   - ✅ All 5 orders visible
   - ✅ Correct payment statuses
   - ✅ Correct serving statuses
   - ✅ Scan logs recorded

2. **Check Firestore Console:**
   - ✅ All orders in `orders` collection
   - ✅ Scan logs in `scanLogs` collection
   - ✅ Serve logs in `serveLogs` collection

3. **Check Browser Console:**
   - ✅ No errors
   - ✅ No warnings
   - ✅ All listeners active

---

**If all tests pass → System is production-ready! 🚀**
