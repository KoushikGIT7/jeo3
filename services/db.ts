
import { UserProfile, Order, MenuItem, SystemSettings, ScanLog, InventoryItem, Cafeteria, TransactionRecord, DailyReport, ServeLog } from "../types";
import { INITIAL_MENU } from "../constants";
import { parseQRPayload, verifySecureHash } from "./qr";

// --- MOCK STATE ENGINE ---
let mockUsers: UserProfile[] = [
  { uid: 'admin_01', name: 'JOE Admin', email: 'admin@joe.com', role: 'admin', active: true, createdAt: Date.now() },
  { uid: 'staff_01', name: 'Server Node', email: 'server@joe.com', role: 'server', active: true, createdAt: Date.now() },
  { uid: 'cash_01', name: 'Cashier Node', email: 'cashier@joe.com', role: 'cashier', active: true, createdAt: Date.now() }
];

let mockMenu: MenuItem[] = [...INITIAL_MENU];
// Initialize orders from localStorage
const loadOrdersFromStorage = (): Order[] => {
  try {
    const stored = localStorage.getItem('joe_mock_orders');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading orders from storage:', e);
  }
  return [];
};

let mockOrders: Order[] = loadOrdersFromStorage();
let mockInventory: InventoryItem[] = mockMenu.map(m => ({
  itemId: m.id,
  itemName: m.name,
  openingStock: 100,
  consumed: 0,
  lastUpdated: Date.now(),
  category: m.category
}));
let mockScanLogs: ScanLog[] = JSON.parse(localStorage.getItem('joe_scan_logs') || '[]');
let mockServeLogs: ServeLog[] = JSON.parse(localStorage.getItem('joe_serve_logs') || '[]');

// Load settings from localStorage
const loadSettingsFromStorage = (): SystemSettings => {
  try {
    const stored = localStorage.getItem('joe_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading settings from storage:', e);
  }
  return {
    isMaintenanceMode: false,
    acceptingOrders: true,
    announcement: "JOE: New Indian Breakfast Catalog is now LIVE!",
    taxRate: 5,
    minOrderValue: 20,
    peakHourThreshold: 50,
    autoSettlementEnabled: true
  };
};

let mockSettings: SystemSettings = loadSettingsFromStorage();

const saveOrders = () => localStorage.setItem('joe_mock_orders', JSON.stringify(mockOrders));
const saveScanLogs = () => localStorage.setItem('joe_scan_logs', JSON.stringify(mockScanLogs));
const saveServeLogs = () => localStorage.setItem('joe_serve_logs', JSON.stringify(mockServeLogs));

/**
 * 1. USER & ROLE MANAGEMENT
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const newUser = { uid, active: true, createdAt: Date.now(), role: 'student', ...data } as UserProfile;
  mockUsers.push(newUser);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  return mockUsers.find(u => u.uid === uid) || null;
};

export const updateUserRole = async (uid: string, role: UserProfile['role']) => {
  mockUsers = mockUsers.map(u => u.uid === uid ? { ...u, role } : u);
};

export const toggleUserStatus = async (uid: string, active: boolean) => {
  mockUsers = mockUsers.map(u => u.uid === uid ? { ...u, active } : u);
};

export const listenToAllUsers = (callback: (users: UserProfile[]) => void) => {
  callback(mockUsers);
  const interval = setInterval(() => callback(mockUsers), 2000);
  return () => clearInterval(interval);
};

/**
 * 2. MENU & INVENTORY
 */
export const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
  const id = Math.random().toString(36).substr(2, 9);
  // Ensure imageUrl is set - use default Indian breakfast image if not provided
  const defaultImage = 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&q=80&w=400';
  const newItem = { 
    id, 
    ...item,
    imageUrl: item.imageUrl || defaultImage
  };
  mockMenu.push(newItem);
  
  // Also add to inventory
  mockInventory.push({
    itemId: id,
    itemName: item.name,
    openingStock: 100,
    consumed: 0,
    lastUpdated: Date.now(),
    category: item.category
  });
  
  return id;
};

export const updateMenuItem = async (id: string, data: Partial<MenuItem>) => {
  mockMenu = mockMenu.map(m => m.id === id ? { ...m, ...data } : m);
  mockInventory = mockInventory.map(i => i.itemId === id ? { ...i, itemName: data.name || i.itemName, category: data.category || i.category } : i);
};

export const deleteMenuItem = async (id: string) => {
  mockMenu = mockMenu.filter(m => m.id !== id);
  mockInventory = mockInventory.filter(i => i.itemId !== id);
};

export const listenToMenu = (callback: (items: MenuItem[]) => void) => {
  callback(mockMenu);
  const interval = setInterval(() => callback(mockMenu), 2000);
  return () => clearInterval(interval);
};

export const listenToInventory = (callback: (inv: InventoryItem[]) => void) => {
  callback(mockInventory);
  const interval = setInterval(() => callback(mockInventory), 2000);
  return () => clearInterval(interval);
};

export const updateInventoryItem = async (itemId: string, data: Partial<InventoryItem>) => {
  mockInventory = mockInventory.map(i => i.itemId === itemId ? { ...i, ...data, lastUpdated: Date.now() } : i);
};

/**
 * 3. SYSTEM SETTINGS
 */
const saveSettings = () => {
  localStorage.setItem('joe_settings', JSON.stringify(mockSettings));
};

export const listenToSettings = (callback: (settings: SystemSettings) => void) => {
  // Load initial settings
  const storedSettings = loadSettingsFromStorage();
  if (storedSettings) {
    mockSettings = storedSettings;
  }
  callback(mockSettings);
  
  // Poll for changes every 1 second (for cross-tab updates)
  const interval = setInterval(() => {
    const stored = loadSettingsFromStorage();
    if (JSON.stringify(stored) !== JSON.stringify(mockSettings)) {
      mockSettings = stored;
      callback(mockSettings);
    }
  }, 1000);
  
  // Listen to storage events for cross-tab updates
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'joe_settings') {
      const stored = loadSettingsFromStorage();
      mockSettings = stored;
      callback(mockSettings);
    }
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }
  
  return () => {
    clearInterval(interval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
  };
};

export const updateSettings = async (data: Partial<SystemSettings>) => {
  mockSettings = { ...mockSettings, ...data };
  saveSettings();
  
  // Trigger storage event for other tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('joe_settings_updated', {
      detail: mockSettings
    }));
  }
  
  console.log('✅ Settings updated:', data);
};

/**
 * 4. ORDERING SYSTEM
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
  // Reload existing orders from storage first
  const storedOrders = loadOrdersFromStorage();
  if (storedOrders.length > 0) {
    mockOrders = storedOrders;
  }
  
  const id = 'order_' + Math.random().toString(36).substr(2, 9);
  const createdAt = Date.now();
  const itemsWithQty = orderData.items.map(item => ({
    ...item,
    servedQty: 0,
    remainingQty: item.quantity
  }));
  const newOrder: Order = { 
    ...orderData, 
    items: itemsWithQty,
    id, 
    createdAt,
    orderStatus: 'PENDING' 
  } as Order;
  mockOrders.push(newOrder);
  saveOrders();
  console.log('✅ Order created:', { 
    id, 
    paymentType: orderData.paymentType,
    paymentStatus: orderData.paymentStatus,
    createdAt: new Date(createdAt).toISOString() 
  });
  
  // Trigger storage event for other tabs/browsers (note: storage event only fires in OTHER tabs)
  // The polling in other tabs will pick it up within 1 second
  
  return id;
};

export const listenToOrder = (orderId: string, callback: (order: Order | null) => void) => {
  let lastOrderState: string | null = null;
  let lastOrderData: Order | null = null;
  
  const update = () => {
    // Always reload orders from localStorage to get latest updates from other tabs/browsers
    const storedOrders = loadOrdersFromStorage();
    
    // Update mockOrders with latest data from storage
    if (storedOrders.length > 0) {
      // Merge stored orders with mockOrders, prioritizing stored data
      storedOrders.forEach(storedOrder => {
        const existingIndex = mockOrders.findIndex(o => o.id === storedOrder.id);
        if (existingIndex >= 0) {
          mockOrders[existingIndex] = storedOrder;
        } else {
          mockOrders.push(storedOrder);
        }
      });
    }
    
    const order = mockOrders.find(o => o.id === orderId) || null;
    
    // Check if order state or data actually changed
    const currentState = order ? `${order.paymentStatus}-${order.qrStatus}` : 'null';
    const orderChanged = !lastOrderData || 
      lastOrderData.paymentStatus !== order?.paymentStatus ||
      lastOrderData.qrStatus !== order?.qrStatus ||
      lastOrderData.confirmedAt !== order?.confirmedAt;
    
    if (currentState !== lastOrderState || orderChanged) {
      lastOrderState = currentState;
      lastOrderData = order ? { ...order } : null;
      
      console.log(`🔄 Order ${orderId} state changed:`, {
        paymentStatus: order?.paymentStatus,
        qrStatus: order?.qrStatus,
        found: !!order,
        confirmedAt: order?.confirmedAt
      });
      
      // Always call callback to ensure updates are received
      callback(order);
    }
  };
  
  update(); // Initial call
  const interval = setInterval(update, 300); // Check more frequently (every 300ms) for real-time updates
  
  // Also listen to storage events for cross-tab/browser updates (only fires for other tabs/browsers)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'joe_mock_orders') {
      console.log('📡 Storage event detected for orders, updating immediately...');
      // Force update immediately when storage changes
      lastOrderState = null; // Reset state to force callback
      lastOrderData = null;
      update();
    }
  };
  
  // Listen to custom events for same-tab updates
  const handleCustomStorageChange = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.orderId === orderId || !customEvent.detail?.orderId) {
      console.log('📡 Custom event detected for order update, updating immediately...');
      // Force update immediately when custom event fires
      lastOrderState = null; // Reset state to force callback
      lastOrderData = null;
      update();
    }
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('joe_order_updated', handleCustomStorageChange);
  }
  
  return () => {
    clearInterval(interval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('joe_order_updated', handleCustomStorageChange);
    }
  };
};

export const listenToAllOrders = (callback: (orders: Order[]) => void) => {
  const update = () => {
    // Reload orders from localStorage to get latest updates from other tabs/browsers
    const storedOrders = loadOrdersFromStorage();
    
    // Merge stored orders with mockOrders, prioritizing stored data
    if (storedOrders.length > 0) {
      storedOrders.forEach(storedOrder => {
        const existingIndex = mockOrders.findIndex(o => o.id === storedOrder.id);
        if (existingIndex >= 0) {
          mockOrders[existingIndex] = storedOrder;
        } else {
          mockOrders.push(storedOrder);
        }
      });
    }
    
    callback([...mockOrders].reverse());
  };
  update();
  const interval = setInterval(update, 1000); // Check every second for new orders
  
  // Listen to storage events for cross-tab/browser updates
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'joe_mock_orders') {
      update();
    }
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }
  
  return () => {
    clearInterval(interval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
  };
};

export const listenToPendingCashOrders = (callback: (orders: Order[]) => void) => {
  const update = () => {
    // Reload orders from localStorage to get latest updates from other tabs/browsers
    const storedOrders = loadOrdersFromStorage();
    
    // Merge stored orders with mockOrders, prioritizing stored data
    if (storedOrders.length > 0) {
      storedOrders.forEach(storedOrder => {
        const existingIndex = mockOrders.findIndex(o => o.id === storedOrder.id);
        if (existingIndex >= 0) {
          mockOrders[existingIndex] = storedOrder;
        } else {
          mockOrders.push(storedOrder);
        }
      });
    }
    
    // Filter for pending cash orders
    const pendingCashOrders = mockOrders.filter(o => 
      o.paymentType === 'CASH' && o.paymentStatus === 'PENDING'
    ).reverse();
    
    callback(pendingCashOrders);
  };
  update();
  const interval = setInterval(update, 1000); // Check every second for new orders
  
  // Listen to storage events for cross-tab/browser updates
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'joe_mock_orders') {
      console.log('📡 Cashier: Storage event detected, updating pending orders...');
      update();
    }
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }
  
  return () => {
    clearInterval(interval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
  };
};

export const listenToActiveOrders = (callback: (orders: Order[]) => void) => {
  const update = () => callback(mockOrders.filter(o => 
    o.orderStatus === 'ACTIVE' && 
    o.paymentStatus === 'SUCCESS' &&
    o.qrStatus === 'USED' &&
    o.scannedAt !== undefined
  ).reverse());
  update();
  const interval = setInterval(update, 500);
  return () => clearInterval(interval);
};

export interface PendingItem {
  orderId: string;
  orderNumber: string;
  userName: string;
  itemId: string;
  itemName: string;
  imageUrl: string;
  remainingQty: number;
  orderedQty: number;
  servedQty: number;
}

export const getPendingItems = (): PendingItem[] => {
  const pendingItems: PendingItem[] = [];
  
  // Only include items from orders that have been scanned (qrStatus = USED, scannedAt exists)
  mockOrders
    .filter(o => 
      o.orderStatus === 'ACTIVE' && 
      o.paymentStatus === 'SUCCESS' &&
      o.qrStatus === 'USED' &&
      o.scannedAt !== undefined
    )
    .forEach(order => {
      order.items.forEach(item => {
        const remainingQty = item.remainingQty !== undefined ? item.remainingQty : item.quantity;
        if (remainingQty > 0) {
          pendingItems.push({
            orderId: order.id,
            orderNumber: order.id.slice(-8).toUpperCase(),
            userName: order.userName,
            itemId: item.id,
            itemName: item.name,
            imageUrl: item.imageUrl,
            remainingQty,
            orderedQty: item.quantity,
            servedQty: item.servedQty || 0
          });
        }
      });
    });
  
  return pendingItems;
};

export const listenToPendingItems = (callback: (items: PendingItem[]) => void) => {
  const update = () => callback(getPendingItems());
  update();
  const interval = setInterval(update, 500);
  return () => clearInterval(interval);
};

export const confirmCashPayment = async (orderId: string, cashierUid: string) => {
  // Reload orders from storage first to ensure we have latest data
  const storedOrders = loadOrdersFromStorage();
  if (storedOrders.length > 0) {
    mockOrders = storedOrders;
  }
  
  const confirmedAt = Date.now();
  mockOrders = mockOrders.map(o => o.id === orderId ? { 
    ...o, 
    paymentStatus: 'SUCCESS', 
    qrStatus: 'ACTIVE', 
    confirmedBy: cashierUid, 
    confirmedAt: confirmedAt
  } : o);
  
  saveOrders();
  
  console.log('✅ Cash payment confirmed for order:', orderId, {
    paymentStatus: 'SUCCESS',
    qrStatus: 'ACTIVE',
    confirmedAt: new Date(confirmedAt).toISOString()
  });
  
  // Trigger a custom event to notify listeners in the same tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('joe_order_updated', {
      detail: { orderId, paymentStatus: 'SUCCESS', qrStatus: 'ACTIVE' }
    }));
    console.log('📢 Custom event dispatched for order:', orderId);
  }
  
  // Note: Storage events only fire in OTHER tabs/browsers, not the same tab
  // The polling in other tabs will pick up the change within 300ms
};

export const scanAndServeOrder = async (qrDataRaw: string, scannedBy: string = 'server_01') => {
  const scanTime = Date.now();
  let logEntry: ScanLog;
  
  try {
    const payload = parseQRPayload(qrDataRaw);
    if (!payload) {
      logEntry = {
        id: 'log_' + Date.now(),
        orderId: 'UNKNOWN',
        userId: 'UNKNOWN',
        userName: 'UNKNOWN',
        scannedBy,
        scanTime,
        scanResult: 'FAILURE',
        totalAmount: 0,
        failureReason: 'Invalid Token Format'
      };
      mockScanLogs.push(logEntry);
      saveScanLogs();
      throw new Error("Invalid Token Format");
    }

    const { orderId, userId, cafeteriaId, secureHash } = payload;

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      logEntry = {
        id: 'log_' + Date.now(),
        orderId,
        userId,
        userName: 'UNKNOWN',
        scannedBy,
        scanTime,
        scanResult: 'FAILURE',
        totalAmount: 0,
        failureReason: 'Order not found'
      };
      mockScanLogs.push(logEntry);
      saveScanLogs();
      throw new Error("Order not found");
    }

    const order = mockOrders[orderIndex];

    if (!verifySecureHash(orderId, userId, cafeteriaId, order.createdAt, secureHash)) {
      logEntry = {
        id: 'log_' + Date.now(),
        orderId,
        userId: order.userId,
        userName: order.userName,
        scannedBy,
        scanTime,
        scanResult: 'FAILURE',
        totalAmount: order.totalAmount,
        failureReason: 'Invalid signature/hash'
      };
      mockScanLogs.push(logEntry);
      saveScanLogs();
      throw new Error("Invalid Token Signature");
    }

    if (order.paymentStatus !== 'SUCCESS') {
      logEntry = {
        id: 'log_' + Date.now(),
        orderId,
        userId: order.userId,
        userName: order.userName,
        scannedBy,
        scanTime,
        scanResult: 'FAILURE',
        totalAmount: order.totalAmount,
        failureReason: 'Payment not verified'
      };
      mockScanLogs.push(logEntry);
      saveScanLogs();
      throw new Error("PAYMENT_NOT_VERIFIED");
    }

    if (order.qrStatus === 'USED') {
      logEntry = {
        id: 'log_' + Date.now(),
        orderId,
        userId: order.userId,
        userName: order.userName,
        scannedBy,
        scanTime,
        scanResult: 'FAILURE',
        totalAmount: order.totalAmount,
        failureReason: 'Token already used'
      };
      mockScanLogs.push(logEntry);
      saveScanLogs();
      throw new Error("TOKEN_ALREADY_USED");
    }

    if (order.qrStatus !== 'ACTIVE') {
      logEntry = {
        id: 'log_' + Date.now(),
        orderId,
        userId: order.userId,
        userName: order.userName,
        scannedBy,
        scanTime,
        scanResult: 'FAILURE',
        totalAmount: order.totalAmount,
        failureReason: 'QR not active'
      };
      mockScanLogs.push(logEntry);
      saveScanLogs();
      throw new Error("QR_NOT_ACTIVE");
    }

    mockOrders[orderIndex] = { 
      ...order, 
      orderStatus: 'SERVED', 
      qrStatus: 'USED', 
      servedAt: scanTime 
    };
    
    logEntry = {
      id: 'log_' + Date.now(),
      orderId,
      userId: order.userId,
      userName: order.userName,
      scannedBy,
      scanTime,
      scanResult: 'SUCCESS',
      totalAmount: order.totalAmount
    };
    mockScanLogs.push(logEntry);
    
    order.items.forEach(item => {
      const invIdx = mockInventory.findIndex(i => i.itemId === item.id);
      if (invIdx !== -1) {
        mockInventory[invIdx].consumed += item.quantity;
        mockInventory[invIdx].lastUpdated = Date.now();
      }
    });

    saveOrders();
    saveScanLogs();
    
    return { 
      success: true, 
      message: 'TOKEN VALIDATED', 
      order: { userName: order.userName, items: order.items } 
    };
  } catch (err: any) {
    if (!logEntry) {
      logEntry = {
        id: 'log_' + Date.now(),
        orderId: 'UNKNOWN',
        userId: 'UNKNOWN',
        userName: 'UNKNOWN',
        scannedBy,
        scanTime,
        scanResult: 'FAILURE',
        totalAmount: 0,
        failureReason: err.message || 'Unknown error'
      };
      mockScanLogs.push(logEntry);
      saveScanLogs();
    }
    throw err;
  }
};

export const validateQRForServing = async (qrDataRaw: string) => {
  // Handle both JSON string and object
  let payload;
  try {
    if (typeof qrDataRaw === 'string') {
      payload = JSON.parse(qrDataRaw);
    } else {
      payload = qrDataRaw;
    }
  } catch {
    const parsed = parseQRPayload(qrDataRaw);
    if (!parsed) {
      throw new Error("Invalid Token Format - Cannot parse QR data");
    }
    payload = parsed;
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error("Invalid Token Format - Invalid payload structure");
  }

  const { orderId, userId, cafeteriaId, secureHash } = payload;

  if (!orderId || !userId || !cafeteriaId || !secureHash) {
    throw new Error("Invalid Token Format - Missing required fields");
  }

  // Reload orders from localStorage to ensure we have latest data
  const savedOrders = loadOrdersFromStorage();
  const allOrders = [...mockOrders];
  
  // Add any orders from storage that aren't in mockOrders
  savedOrders.forEach(savedOrder => {
    if (!allOrders.find(o => o.id === savedOrder.id)) {
      allOrders.push(savedOrder);
    }
  });
  
  const orderIndex = allOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    console.error('Order not found. Looking for:', orderId);
    console.error('Available orders:', allOrders.map(o => ({ id: o.id, userId: o.userId })));
    throw new Error(`Order not found: ${orderId}. Please ensure the order exists and payment is confirmed.`);
  }

  const order = allOrders[orderIndex];
  
  // Ensure order is in mockOrders for future operations
  const mockIndex = mockOrders.findIndex(o => o.id === orderId);
  if (mockIndex === -1) {
    mockOrders.push(order);
    saveOrders();
  }
  
  if (!verifySecureHash(orderId, userId, cafeteriaId, order.createdAt, secureHash)) {
    throw new Error("Invalid Token Signature - Hash verification failed");
  }

  if (order.paymentStatus !== 'SUCCESS') {
    throw new Error("PAYMENT_NOT_VERIFIED");
  }

  if (order.qrStatus === 'USED') {
    throw new Error("TOKEN_ALREADY_USED");
  }

  if (order.qrStatus !== 'ACTIVE') {
    throw new Error("QR_NOT_ACTIVE");
  }

  if (order.orderStatus === 'COMPLETED') {
    throw new Error("Order Already Completed");
  }

  const itemsWithQty = order.items.map(item => ({
    ...item,
    servedQty: item.servedQty || 0,
    remainingQty: item.remainingQty !== undefined ? item.remainingQty : item.quantity
  }));

  const scannedAt = Date.now();

  // Update order in both arrays
  const finalOrder: Order = {
    ...order,
    qrStatus: 'USED',
    orderStatus: 'ACTIVE',
    items: itemsWithQty,
    scannedAt
  };

  // Update in mockOrders
  const updateIndex = mockOrders.findIndex(o => o.id === orderId);
  if (updateIndex !== -1) {
    mockOrders[updateIndex] = finalOrder;
  } else {
    mockOrders.push(finalOrder);
  }

  saveOrders();

  return finalOrder;
};

export const serveItem = async (orderId: string, itemId: string, servedBy: string) => {
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) throw new Error("Order not found");
  
  const order = mockOrders[orderIndex];
  
  if (order.orderStatus === 'COMPLETED') throw new Error("Order already completed");
  if (order.paymentStatus !== 'SUCCESS') throw new Error("Payment not verified");
  
  const itemIndex = order.items.findIndex(i => i.id === itemId);
  if (itemIndex === -1) throw new Error("Item not found in order");
  
  const item = order.items[itemIndex];
  const servedQty = item.servedQty || 0;
  const remainingQty = item.remainingQty !== undefined ? item.remainingQty : item.quantity;
  
  if (remainingQty <= 0) throw new Error("Item already fully served");
  
  const newServedQty = servedQty + 1;
  const newRemainingQty = remainingQty - 1;
  
  const updatedItems = [...order.items];
  updatedItems[itemIndex] = {
    ...item,
    servedQty: newServedQty,
    remainingQty: newRemainingQty
  };
  
  const allItemsServed = updatedItems.every(i => (i.remainingQty || i.quantity) <= 0);
  
  const servedAt = Date.now();
  
  mockOrders[orderIndex] = {
    ...order,
    items: updatedItems,
    orderStatus: allItemsServed ? 'COMPLETED' : 'ACTIVE',
    servedAt: allItemsServed ? servedAt : order.servedAt
  };
  
  const invIdx = mockInventory.findIndex(i => i.itemId === itemId);
  if (invIdx !== -1) {
    mockInventory[invIdx].consumed += 1;
    mockInventory[invIdx].lastUpdated = servedAt;
  }
  
  const serveLog: ServeLog = {
    id: 'serve_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    orderId,
    itemId,
    itemName: item.name,
    quantityServed: 1,
    servedBy,
    servedAt
  };
  
  mockServeLogs.push(serveLog);
  
  saveOrders();
  saveServeLogs();
  
  return { success: true, order: mockOrders[orderIndex], allItemsServed };
};

export const listenToScanLogs = (callback: (logs: ScanLog[]) => void) => {
  const update = () => callback([...mockScanLogs].reverse());
  update();
  const interval = setInterval(update, 2000);
  return () => clearInterval(interval);
};

export const listenToCafeterias = (callback: (cafes: Cafeteria[]) => void) => {
  callback([{ id: 'main', name: 'Main Campus Cafe', counters: 4, active: true, healthStatus: 'HEALTHY' }]);
  return () => {};
};

export const listenToTransactions = (callback: (trans: TransactionRecord[]) => void) => {
  callback([]);
  return () => {};
};

export const listenToReports = (callback: (reports: DailyReport[]) => void) => {
  const now = new Date();
  callback([{
    id: 'rep_1',
    date: now.toISOString().split('T')[0],
    totalOrders: mockOrders.length,
    totalRevenue: mockOrders.filter(o => o.paymentStatus === 'SUCCESS').reduce((a, b) => a + b.totalAmount, 0),
    onlineRevenue: mockOrders.filter(o => o.paymentStatus === 'SUCCESS' && o.paymentType !== 'CASH').reduce((a, b) => a + b.totalAmount, 0),
    cashRevenue: mockOrders.filter(o => o.paymentStatus === 'SUCCESS' && o.paymentType === 'CASH').reduce((a, b) => a + b.totalAmount, 0),
    pnl: mockOrders.filter(o => o.paymentStatus === 'SUCCESS').reduce((a, b) => a + (b.totalAmount * 0.4), 0)
  }]);
  return () => {};
};
