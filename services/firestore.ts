
/**
 * FIRESTORE SCHEMA & ATOMIC TRANSACTIONS
 * 
 * This file contains the exact Firestore schema and atomic transaction code
 * for production deployment.
 */

import { runTransaction, doc, Timestamp, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// ============================================================================
// FIRESTORE SCHEMA DEFINITIONS
// ============================================================================

/**
 * 📁 orders/{orderId}
 */
export interface FirestoreOrder {
  orderNumber: number;
  userId: string;
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED";
  orderStatus: "ACTIVE" | "COMPLETED" | "PENDING" | "CANCELLED";
  qrStatus: "ACTIVE" | "USED" | "EXPIRED" | "PENDING_PAYMENT";
  createdAt: Timestamp;
  scannedAt?: Timestamp;
  items: FirestoreOrderItem[];
}

export interface FirestoreOrderItem {
  itemId: string;
  name: string;
  imageUrl: string;
  orderedQty: number;
  servedQty: number;
  remainingQty: number;
  status: "PENDING" | "COMPLETED";
}

/**
 * 📁 pendingItems/{pendingId}
 */
export interface FirestorePendingItem {
  orderId: string;
  orderNumber: number;
  itemId: string;
  itemName: string;
  imageUrl: string;
  remainingQty: number;
  createdAt: Timestamp;
}

/**
 * 📁 inventory/{itemId}
 */
export interface FirestoreInventory {
  itemName: string;
  available: number;
  threshold: number;
  updatedAt: Timestamp;
}

/**
 * 📁 serveLogs/{logId}
 */
export interface FirestoreServeLog {
  orderId: string;
  orderNumber: number;
  itemId: string;
  quantity: number;
  servedBy: string;
  servedAt: Timestamp;
}

// ============================================================================
// REQUIRED FIRESTORE INDEXES
// ============================================================================

/**
 * CREATE THESE INDEXES IN FIRESTORE CONSOLE:
 * 
 * Collection: orders
 * - orderStatus (Ascending), createdAt (Descending)
 * 
 * Collection: pendingItems
 * - createdAt (Ascending)
 * 
 * Collection: inventory
 * - available (Ascending)
 * 
 * Collection: serveLogs
 * - servedAt (Descending)
 */

// ============================================================================
// ATOMIC TRANSACTION: SERVE ONE ITEM
// ============================================================================

/**
 * Serve one item from an order (LIVE or PENDING)
 * Uses Firestore transactions to ensure atomicity
 * 
 * @param db Firestore instance
 * @param orderId Order document ID
 * @param itemId Item ID to serve
 * @param servedBy Counter/staff ID
 * @returns Updated order and completion status
 */
export async function serveItemAtomic(
  db: Firestore,
  orderId: string,
  itemId: string,
  servedBy: string
): Promise<{ order: FirestoreOrder; allItemsServed: boolean }> {
  const orderRef = doc(db, "orders", orderId);
  const serveLogsRef = collection(db, "serveLogs");

  return await runTransaction(db, async (tx) => {
    // Read order
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data() as FirestoreOrder;

    // Find item
    const itemIndex = order.items.findIndex((i) => i.itemId === itemId);
    if (itemIndex === -1) {
      throw new Error("Item not found in order");
    }

    const item = order.items[itemIndex];

    // Validate
    if (item.remainingQty <= 0) {
      throw new Error("Item already fully served");
    }

    if (order.orderStatus === "COMPLETED") {
      throw new Error("Order already completed");
    }

    // Update item
    item.servedQty += 1;
    item.remainingQty -= 1;
    item.status = item.remainingQty === 0 ? "COMPLETED" : "PENDING";

    // Check if all items are completed
    const allItemsServed = order.items.every((i) => i.remainingQty === 0);
    if (allItemsServed) {
      order.orderStatus = "COMPLETED";
    }

    // Update order
    tx.update(orderRef, {
      items: order.items,
      orderStatus: order.orderStatus,
    });

    // Update inventory atomically
    const inventoryRef = doc(db, "inventory", itemId);
    const invSnap = await tx.get(inventoryRef);
    if (invSnap.exists()) {
      const inventory = invSnap.data() as FirestoreInventory;
      if (inventory.available <= 0) {
        throw new Error("Inventory insufficient");
      }
      tx.update(inventoryRef, {
        available: inventory.available - 1,
        updatedAt: Timestamp.now(),
      });
    }

    // Create serve log
    const logRef = doc(serveLogsRef);
    const serveLog: FirestoreServeLog = {
      orderId,
      orderNumber: order.orderNumber,
      itemId,
      quantity: 1,
      servedBy,
      servedAt: Timestamp.now(),
    };
    tx.set(logRef, serveLog);

    // Update pending items collection
    if (item.remainingQty === 0) {
      // Remove from pendingItems if completed
      const pendingQuery = query(
        collection(db, "pendingItems"),
        where("orderId", "==", orderId),
        where("itemId", "==", itemId)
      );
      const pendingSnap = await getDocs(pendingQuery);
      pendingSnap.forEach((doc) => {
        tx.delete(doc.ref);
      });
    }

    return { order, allItemsServed };
  });
}

/**
 * Validate QR and mark as USED atomically
 */
export async function validateQRAtomic(
  db: Firestore,
  orderId: string
): Promise<FirestoreOrder> {
  const orderRef = doc(db, "orders", orderId);

  return await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data() as FirestoreOrder;

    if (order.qrStatus === "USED") {
      throw new Error("QR already used");
    }

    if (order.paymentStatus !== "SUCCESS") {
      throw new Error("Payment not verified");
    }

    // Mark QR as USED and order as ACTIVE
    tx.update(orderRef, {
      qrStatus: "USED",
      orderStatus: "ACTIVE",
      scannedAt: Timestamp.now(),
    });

    // Create pending items for items with remainingQty > 0
    const pendingItemsRef = collection(db, "pendingItems");
    order.items.forEach((item) => {
      if (item.remainingQty > 0) {
        const pendingRef = doc(pendingItemsRef);
        const pendingItem: FirestorePendingItem = {
          orderId,
          orderNumber: order.orderNumber,
          itemId: item.itemId,
          itemName: item.name,
          imageUrl: item.imageUrl,
          remainingQty: item.remainingQty,
          createdAt: Timestamp.now(),
        };
        tx.set(pendingRef, pendingItem);
      }
    });

    return { ...order, qrStatus: "USED", orderStatus: "ACTIVE" };
  });
}

/**
 * Listen to active orders
 */
export function listenToActiveOrdersFirestore(
  db: Firestore,
  callback: (orders: FirestoreOrder[]) => void
) {
  const q = query(
    collection(db, "orders"),
    where("orderStatus", "==", "ACTIVE"),
    where("paymentStatus", "==", "SUCCESS"),
    orderBy("createdAt", "desc")
  );

  // Use onSnapshot for real-time updates
  const { onSnapshot } = require("firebase/firestore");
  const unsubscribe = onSnapshot(q, (snapshot: any) => {
    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreOrder[];
    callback(orders);
  });

  return unsubscribe;
}

/**
 * Listen to pending items
 */
export function listenToPendingItemsFirestore(
  db: Firestore,
  callback: (items: FirestorePendingItem[]) => void
) {
  const q = query(
    collection(db, "pendingItems"),
    orderBy("createdAt", "asc")
  );

  const { onSnapshot } = require("firebase/firestore");
  const unsubscribe = onSnapshot(q, (snapshot: any) => {
    const items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestorePendingItem[];
    callback(items);
  });

  return unsubscribe;
}
