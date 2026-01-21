
import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, CheckCircle2, Info, Share2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { listenToOrder } from '../../services/firestore-db';
import { Order } from '../../types';
import { generateQRPayload } from '../../services/qr';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import SyncStatus from '../../components/SyncStatus';

interface QRViewProps {
  orderId: string;
  onBack: () => void;
}

const QRView: React.FC<QRViewProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrString, setQrString] = useState<string | null>(null);
  const qrGeneratedRef = useRef(false);

  useEffect(() => {
    console.log('📱 QRView: Setting up listener for order:', orderId);
    const unsubscribe = listenToOrder(orderId, (data) => {
      console.log('📱 QRView: Order update received:', {
        orderId: data?.id,
        paymentStatus: data?.paymentStatus,
        qrStatus: data?.qrStatus,
        hasQR: !!qrString
      });
      
      setOrder(data);
      setLoading(false);
      
      // Prefer persisted Firestore token (durable across refresh/devices)
      if (data?.qr?.token && data.qrStatus === 'ACTIVE') {
        setQrString(data.qr.token);
        qrGeneratedRef.current = true;
        return;
      }

      // Legacy/backfill: if ACTIVE + SUCCESS but token missing, generate once and persist into Firestore
      if (data && data.paymentStatus === 'SUCCESS' && data.qrStatus === 'ACTIVE' && !qrGeneratedRef.current) {
        (async () => {
          try {
            console.log('🎨 QRView: Generating QR code for order:', data.id);
            const qr = await generateQRPayload(data);
            setQrString(qr);
            qrGeneratedRef.current = true; // Mark as generated to prevent regeneration
            console.log('✅ QRView: QR code generated successfully');
            try {
              await updateDoc(doc(db, 'orders', data.id), {
                qr: { token: qr, status: 'ACTIVE', createdAt: serverTimestamp() }
              });
            } catch (e) {
              // non-blocking
            }
          } catch (err) {
            console.error('❌ QRView: QR generation failed:', err);
            // Fallback to sync version for backward compatibility
            try {
              const { generateQRPayloadSync } = await import('../../services/qr');
              const qr = generateQRPayloadSync(data);
              setQrString(qr);
              qrGeneratedRef.current = true;
              console.log('✅ QRView: QR code generated using fallback method');
            } catch (fallbackErr) {
              console.error('❌ QRView: Fallback QR generation also failed:', fallbackErr);
              setQrString(null);
            }
          }
        })();
      } else if (data && (data.paymentStatus !== 'SUCCESS' || data.qrStatus !== 'ACTIVE')) {
        console.log('⚠️ QRView: Order not ready for QR - Payment:', data.paymentStatus, 'QR:', data.qrStatus);
        setQrString(null);
      }
    });
    return unsubscribe;
  }, [orderId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }
  
  if (!order) return <div className="p-10 text-center">Order not found.</div>;

  const canShowQR = order.paymentStatus === 'SUCCESS' && order.qrStatus === 'ACTIVE' && qrString !== null;
  const isUsed = order.qrStatus === 'USED';
  const paymentPending = order.paymentStatus !== 'SUCCESS';

  if (paymentPending) {
    return (
      <div className="h-screen w-full flex flex-col bg-background max-w-md mx-auto">
        <div className="p-4 bg-white flex items-center gap-4 border-b">
          <button onClick={onBack} className="p-2 -ml-2 text-textMain"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-xl font-bold text-textMain">Meal Token</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-error mb-4" />
          <h3 className="text-xl font-bold text-textMain mb-2">Payment Pending</h3>
          <p className="text-textSecondary">QR code will be available after payment is confirmed.</p>
          <button 
            onClick={onBack}
            className="mt-8 w-full bg-primary text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 bg-white flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-textMain"><ChevronLeft className="w-6 h-6" /></button>
          <h2 className="text-xl font-bold text-textMain">Meal Token</h2>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatus showLabel={false} />
          <button className="p-2 text-textSecondary"><Share2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 items-center overflow-y-auto min-h-0">
        {/* Success Banner */}
        <div className="w-full bg-success/10 text-success p-4 rounded-2xl flex items-center gap-3 mb-8">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p className="text-sm font-bold">Payment Successful! Order Confirmed.</p>
        </div>

        {/* QR Card */}
        <div className={`w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-t-8 transition-all ${isUsed ? 'border-error/50 grayscale opacity-60' : 'border-green-500'} text-center relative overflow-visible`}>
          {isUsed && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-3xl">
              <div className="bg-error text-white px-6 py-2 rounded-full font-bold -rotate-12 shadow-lg">ALREADY SCANNED</div>
            </div>
          )}
          
          <h3 className="text-xl font-bold text-textMain mb-1">Scan this QR at the serving counter</h3>
          <p className="text-xs text-textSecondary mb-6">Show this to the server to get your food</p>

          {canShowQR && qrString && (
            <div className="w-full flex justify-center items-center mb-6">
              <div className="p-8 bg-white border-4 border-green-500 rounded-3xl shadow-2xl flex items-center justify-center">
                <div className="bg-white p-4 rounded-2xl">
                  <QRCodeSVG 
                    value={qrString}
                    size={300}
                    level="M"
                    includeMargin={true}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>
              </div>
            </div>
          )}

          {!canShowQR && !isUsed && (
            <div className="p-6 mb-6">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            </div>
          )}

          <div className="space-y-1 mb-6">
            <p className="text-xs text-textSecondary font-bold">ORDER ID</p>
            <p className="text-sm font-mono font-bold text-textMain">#{order.id.slice(-8).toUpperCase()}</p>
          </div>

          <div className="pt-6 border-t border-dashed border-gray-200">
             <div className="flex justify-between items-center px-4">
                <span className="text-xs text-textSecondary font-bold">AMOUNT PAID</span>
                <span className="text-lg font-bold text-primary">₹{order.totalAmount}</span>
             </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 space-y-4 w-full">
           <div className="flex flex-col gap-3 bg-primary/5 border border-primary/10 p-5 rounded-2xl">
             <div className="flex items-start gap-3">
               <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
               <div className="text-[11px] text-textSecondary leading-relaxed font-medium">
                 This QR code is valid for <strong>one scan only</strong>. Once scanned at the serving counter, it will be deactivated permanently.
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="p-6">
        <button 
          onClick={onBack}
          className="w-full bg-white text-textMain font-bold py-4 rounded-2xl border-2 border-gray-100 active:scale-95 transition-all shadow-sm"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default QRView;
