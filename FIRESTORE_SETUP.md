# Firestore Setup Guide

## 📁 Collections & Schema

### orders/{orderId}
```typescript
{
  orderNumber: number,
  userId: string,
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED",
  orderStatus: "ACTIVE" | "COMPLETED" | "PENDING" | "CANCELLED",
  qrStatus: "ACTIVE" | "USED" | "EXPIRED" | "PENDING_PAYMENT",
  createdAt: Timestamp,
  scannedAt?: Timestamp,
  items: [
    {
      itemId: string,
      name: string,
      imageUrl: string,
      orderedQty: number,
      servedQty: number,
      remainingQty: number,
      status: "PENDING" | "COMPLETED"
    }
  ]
}
```

### pendingItems/{pendingId}
```typescript
{
  orderId: string,
  orderNumber: number,
  itemId: string,
  itemName: string,
  imageUrl: string,
  remainingQty: number,
  createdAt: Timestamp
}
```

### inventory/{itemId}
```typescript
{
  itemName: string,
  available: number,
  threshold: number,
  updatedAt: Timestamp
}
```

### serveLogs/{logId}
```typescript
{
  orderId: string,
  orderNumber: number,
  itemId: string,
  quantity: number,
  servedBy: string,
  servedAt: Timestamp
}
```

## 🔥 Required Indexes

Deploy indexes using:
```bash
firebase deploy --only firestore:indexes
```

Or create manually in Firestore Console:

1. **orders**: `orderStatus (ASC), createdAt (DESC)`
2. **pendingItems**: `createdAt (ASC)`
3. **inventory**: `available (ASC)`
4. **serveLogs**: `servedAt (DESC)`

## ⚡ Atomic Transactions

All serve operations use Firestore transactions to prevent:
- Double serving
- Race conditions
- Inventory corruption
- Data inconsistencies

See `services/firestore.ts` for implementation.

## 🔌 Hardware Scanner Setup

1. Connect USB scanner (HID mode)
2. Scanner acts as keyboard input
3. Suffix key: ENTER
4. Auto-focus on hidden input field
5. No manual typing allowed

See `services/scanner.ts` for implementation.

## 🚨 Offline Handling

- **Online**: Full functionality, real-time updates
- **Offline**: View-only mode, serve buttons disabled
- **Recovery**: Auto-resume when connection restored

No cached writes or delayed sync (too risky for inventory).

## 📊 Rush-Hour Performance

Target metrics:
- 120 scans/min
- 300 serve clicks/min
- 50+ concurrent orders
- 100+ pending items

System tested for:
- Rapid back-to-back scans
- Concurrent serve operations
- Network lag scenarios
- Inventory zero conditions
