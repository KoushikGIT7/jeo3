
/**
 * Utility to generate valid test QR codes for testing
 */

import { generateSecureHash } from '../services/qr';

export interface TestOrderData {
  orderId: string;
  userId: string;
  cafeteriaId: string;
  createdAt: number;
}

/**
 * Generate a valid QR code payload for testing
 */
export function generateTestQRCode(orderData: TestOrderData): string {
  const secureHash = generateSecureHash(
    orderData.orderId,
    orderData.userId,
    orderData.cafeteriaId,
    orderData.createdAt
  );

  const qrData = {
    orderId: orderData.orderId,
    userId: orderData.userId,
    cafeteriaId: orderData.cafeteriaId,
    secureHash: secureHash
  };

  return JSON.stringify(qrData);
}

/**
 * Create a test order and return the QR code
 */
export function createTestOrderWithQR(): { orderId: string; qrCode: string; orderData: TestOrderData } {
  const orderId = 'order_' + Math.random().toString(36).substr(2, 9);
  const userId = 'student_' + Math.random().toString(36).substr(2, 9);
  const cafeteriaId = 'MAIN_CAFE';
  const createdAt = Date.now();

  const orderData: TestOrderData = {
    orderId,
    userId,
    cafeteriaId,
    createdAt
  };

  const qrCode = generateTestQRCode(orderData);

  return {
    orderId,
    qrCode,
    orderData
  };
}
