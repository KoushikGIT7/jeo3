import React, { useEffect, useState } from 'react';
import { ArrowLeft, QrCode, CheckCircle2 } from 'lucide-react';
import { UserProfile, Order } from '../../types';
import { listenToAllUserOrders } from '../../services/firestore-db';

interface OrdersViewProps {
  profile: UserProfile | null;
  onBack: () => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ profile, onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenToAllUserOrders(profile.uid, (data) => {
      const sorted = [...data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(sorted);
    });
    return unsub;
  }, [profile?.uid]);

  return (
    <div className="min-h-screen bg-background pb-10 max-w-md mx-auto">
      <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-black/5 p-4 flex items-center gap-3">
        <button onClick={onBack} className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-black/5 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-textSecondary" />
        </button>
        <h1 className="text-xl font-black text-textMain">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="p-10 text-center text-textSecondary font-bold">No orders found</div>
      ) : (
        <div className="p-4 space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-black text-textSecondary uppercase tracking-widest">Order</p>
                  <p className="text-lg font-black text-textMain">#{order.id.slice(-8).toUpperCase()}</p>
                </div>
                {order.qrStatus === 'ACTIVE' && (
                  <span className="flex items-center gap-1 text-primary text-xs font-black">
                    <QrCode className="w-4 h-4" /> View QR
                  </span>
                )}
                {order.qrStatus === 'USED' && (
                  <span className="flex items-center gap-1 text-success text-xs font-black">
                    <CheckCircle2 className="w-4 h-4" /> Served
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-textSecondary">
                {order.items.map(it => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.name}</span>
                    <span className="font-black text-textMain">x{it.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between items-center text-xs font-black text-textSecondary">
                <span>Status: {order.orderStatus}</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersView;
