/**
 * Test utility for cash payment flow
 * Run this in browser console to test the flow
 */

import { confirmCashPayment } from '../services/db';
import { listenToOrder } from '../services/db';

/**
 * Test function to simulate cashier approval
 * Usage in console: 
 *   import { testCashApproval } from './utils/testCashFlow';
 *   testCashApproval('order_xxxxx');
 */
export const testCashApproval = async (orderId: string) => {
  console.log('🧪 Testing cash approval for order:', orderId);
  
  // Check current order state
  const checkOrder = () => {
    const orders = JSON.parse(localStorage.getItem('joe_mock_orders') || '[]');
    const order = orders.find((o: any) => o.id === orderId);
    console.log('📋 Current order state:', {
      found: !!order,
      paymentStatus: order?.paymentStatus,
      qrStatus: order?.qrStatus
    });
    return order;
  };
  
  const beforeOrder = checkOrder();
  console.log('📋 Before approval:', beforeOrder);
  
  // Approve the payment
  await confirmCashPayment(orderId, 'test_cashier');
  
  // Check order state after approval
  const afterOrder = checkOrder();
  console.log('📋 After approval:', afterOrder);
  
  // Set up a listener to verify it detects the change
  console.log('👂 Setting up test listener...');
  const unsubscribe = listenToOrder(orderId, (order) => {
    console.log('📦 Test listener received:', {
      orderId: order?.id,
      paymentStatus: order?.paymentStatus,
      qrStatus: order?.qrStatus
    });
    
    if (order && order.paymentStatus === 'SUCCESS' && order.qrStatus === 'ACTIVE') {
      console.log('✅ TEST PASSED: Order is approved and ready for QR!');
      unsubscribe();
    }
  });
  
  // Clean up after 5 seconds
  setTimeout(() => {
    unsubscribe();
    console.log('🧹 Test listener cleaned up');
  }, 5000);
  
  return { beforeOrder, afterOrder };
};

/**
 * Check if an order exists and its current state
 */
export const checkOrderState = (orderId: string) => {
  const orders = JSON.parse(localStorage.getItem('joe_mock_orders') || '[]');
  const order = orders.find((o: any) => o.id === orderId);
  
  if (!order) {
    console.log('❌ Order not found:', orderId);
    console.log('📋 Available orders:', orders.map((o: any) => ({ id: o.id, paymentStatus: o.paymentStatus })));
    return null;
  }
  
  console.log('📋 Order state:', {
    id: order.id,
    paymentStatus: order.paymentStatus,
    qrStatus: order.qrStatus,
    paymentType: order.paymentType,
    totalAmount: order.totalAmount
  });
  
  return order;
};
