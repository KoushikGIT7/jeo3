import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { initializeMenu, listenToLatestActiveQR } from './services/firestore-db';
import SplashScreen from './components/SplashScreen';
import { signInWithGoogle } from './services/auth';

// Views
import WelcomeView from './views/Student/WelcomeView';
import HomeView from './views/Student/HomeView';
import StaffScannerView from './views/Staff/ScannerView';
import CashierView from './views/Staff/CashierView';
import AdminDashboard from './views/Admin/Dashboard';
import PaymentView from './views/Student/PaymentView';
import QRView from './views/Student/QRView';
import ServingCounterView from './views/Staff/ServingCounterView';
import OrdersView from './views/Student/OrdersView';
import LoginView from './views/Auth/LoginView';

type ViewState =
  | 'WELCOME'
  | 'HOME'
  | 'PAYMENT'
  | 'QR'
  | 'ORDERS'
  | 'CASHIER'
  | 'ADMIN'
  | 'SERVING_COUNTER'
  | 'STAFF_LOGIN';

const App: React.FC = () => {
  const { user, profile, loading: authLoading, role } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<ViewState>('WELCOME');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Initialize menu (non-blocking)
  useEffect(() => {
    initializeMenu().catch((error) => {
      console.warn("Menu initialization failed (non-critical):", error);
    });
  }, []);

  // Splash screen should only appear on FIRST app visit (per device)
  useEffect(() => {
    try {
      const hasSeenSplash = window.localStorage.getItem('joe_has_seen_splash');
      if (hasSeenSplash === 'true') {
        setShowSplash(false);
      }
    } catch (e) {
      // If localStorage is unavailable, fall back to showing splash once per load
      console.warn('Splash first-visit flag read failed:', e);
    }
  }, []);

  // Cross-session QR recovery for logged-in students
  useEffect(() => {
    if (authLoading) return;
    if (!profile?.uid || role !== 'student') return;
    const unsub = listenToLatestActiveQR(profile.uid, (order) => {
      if (!order) return;
      // Don't interrupt payment flow; otherwise always show active QR
      if (view === 'PAYMENT') return;
      setSelectedOrderId(order.id);
      setView('QR');
    });
    return unsub;
  }, [authLoading, profile?.uid, role, view]);

  // 🔑 GUEST CHECKOUT GUARD: If guest tries to access PAYMENT/QR, redirect to LOGIN
  // After login, user will return to PAYMENT (not Welcome)
  useEffect(() => {
    if (authLoading) return;
    
    const guestAccessingCheckout = !user && (view === 'PAYMENT' || view === 'QR' || view === 'ORDERS');
    
    if (guestAccessingCheckout) {
      console.log('🔑 [CHECKOUT-GUARD] Guest tried to access:', view, 'redirecting to STAFF_LOGIN (simplified login)');
      // Store the intended destination so we can redirect back after login
      try {
        sessionStorage.setItem('joe_checkout_redirect', view);
      } catch (e) {
        console.warn('Session storage unavailable', e);
      }
      setView('STAFF_LOGIN');
    }
  }, [authLoading, user, view]);

  /**
   * Auth bootstrap & role routing (CRITICAL FIX)
   * - Depends ONLY on Firebase auth state (via useAuth)
   * - No redirects while authLoading === true
   * - Welcome view is shown ONLY when user === null
   * - NEVER interrupt PAYMENT/QR/ORDERS flows for authenticated users
   * - On refresh, Firebase restores session and we route based on role
   */
  useEffect(() => {
    if (authLoading) {
      return; // 🚫 DO NOT redirect while loading
    }

    // UNAUTHENTICATED / GUEST:
    // user === null → only show WELCOME or guest flows (HOME / PAYMENT / QR)
    if (!user || !profile || !role) {
      // Ensure we never show staff/admin portals when there is no authenticated user
      setView((prev) => {
        const staffViews: ViewState[] = ['CASHIER', 'ADMIN', 'SERVING_COUNTER'];
        if (staffViews.includes(prev)) {
          return 'WELCOME';
        }
        return prev;
      });
      return;
    }

    // AUTHENTICATED USER:
    // Once Firebase restores the session and we have a profile + role,
    // apply routing ONLY if needed (WELCOME → portal, invalid views → portal).
    // NEVER interrupt PAYMENT / QR / ORDERS flows.
    
    let targetView: ViewState;
    if (role === 'admin') {
      targetView = 'ADMIN';
    } else if (role === 'cashier') {
      targetView = 'CASHIER';
    } else if (role === 'server') {
      targetView = 'SERVING_COUNTER';
    } else {
      // Default for authenticated users is HOME
      targetView = 'HOME';
    }

    setView((prev) => {
      // 🔴 CRITICAL SAFETY: If we're on WELCOME and user is authenticated, ALWAYS route away
      // This fixes the Google redirect issue where user gets stuck on Welcome
      if (prev === 'WELCOME') {
        console.log('🔄 [AUTH] Routing authenticated user away from WELCOME to:', targetView);
        return targetView;
      }

      // 🟢 CRITICAL RULE: For authenticated users in payment/order flow,
      // NEVER redirect them away from PAYMENT / QR / ORDERS
      // These views manage their own lifecycle and navigation
      const protectedFlows: ViewState[] = ['PAYMENT', 'QR', 'ORDERS'];
      if (protectedFlows.includes(prev)) {
        console.log('🟢 [AUTH] Preserving in-flow view:', prev, '(protected from redirect)');
        return prev;
      }

      // For students, don't override HOME view
      if (role === 'student' && prev === 'HOME') {
        return prev;
      }

      // For staff/admin, or genuinely invalid views, route to exact portal
      const validViews: ViewState[] = ['ADMIN', 'CASHIER', 'SERVING_COUNTER', 'HOME'];
      if (!validViews.includes(prev)) {
        console.log('🔄 [AUTH] Routing from invalid view:', prev, 'to valid portal:', targetView);
        return targetView;
      }

      return prev;
    });
  }, [authLoading, user, profile, role]);

  // Handle splash screen completion
  const handleSplashFinish = () => {
    try {
      window.localStorage.setItem('joe_has_seen_splash', 'true');
    } catch (e) {
      console.warn('Splash first-visit flag write failed:', e);
    }
    setShowSplash(false);
  };

  const handleStartOrdering = async () => {
    // Block navigation if auth is still loading
    if (authLoading) {
      console.log('⏸️ handleStartOrdering: Auth still loading, blocking navigation');
      return;
    }

    // Guest mode: only browse menu; no persisted guest profile
    console.log('🚀 Guest browsing mode');
      setView('HOME');
  };

  const navigateToHome = () => setView('HOME');
  const navigateToStaffLogin = () => setView('STAFF_LOGIN');
  const navigateToLogin = async () => {
    try {
      // Use popup-based Google sign-in (faster, no redirect loop)
      // signInWithGoogle handles profile creation automatically
      // onAuthStateChanged will handle routing after auth succeeds
      await signInWithGoogle();
      console.log('✅ Google sign-in completed, waiting for auth state to propagate...');
    } catch (error: any) {
      console.error('❌ Google sign-in failed:', error);
      alert('Google sign-in failed. Please try again.');
    }
  };
  const navigateToPayment = () => setView('PAYMENT');
  const navigateToQR = (orderId: string) => {
    console.log('🎯 Navigating to QR view for order:', orderId);
    setSelectedOrderId(orderId);
    setView('QR');
  };

  const handleLogout = async () => {
    console.log('🚪 handleLogout: Starting logout process...');
    
    try {
      if (user) {
          const { signOut } = await import('./services/auth');
          await signOut();
          console.log('✅ handleLogout: Signed out from Firebase');
      }

      // Once Firebase clears the session, useAuth → onAuthStateChanged will
      // set user=null and the auth bootstrap effect will keep us on guest screens.
      setView('WELCOME');
    } catch (error) {
      console.error('❌ handleLogout: Logout error:', error);
      setView('WELCOME');
    }
  };

  // Show splash screen during initial load or until minimum display time
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} minDisplayTime={2500} />;
  }

  // Show loading screen if auth state is still resolving (blocks routing until role is available)
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render views with role-based protection
  // Each portal view is protected - only accessible to users with matching role
  switch (view) {
    case 'WELCOME':
      // 🚫 CRITICAL SAFETY: If user is already authenticated, NEVER show Welcome
      // This is the final safety net to prevent Welcome → Payment → Welcome loops
      if (user && profile && role) {
        console.warn('🚨 [WELCOME] Authenticated user found on Welcome page, routing to portal immediately');
        if (role === 'admin') return <AdminDashboard profile={profile} onLogout={handleLogout} />;
        if (role === 'cashier') return <CashierView profile={profile} onLogout={handleLogout} />;
        if (role === 'server') return <ServingCounterView profile={profile} onLogout={handleLogout} />;
        return <HomeView profile={profile} onProceed={navigateToPayment} onLogout={handleLogout} />;
      }
      // Welcome is only meaningful when there is NO authenticated Firebase user
      return (
        <WelcomeView
          onStart={handleStartOrdering}
          onStaffLogin={navigateToLogin}
          onAdminLogin={navigateToStaffLogin}
          disabled={authLoading}
        />
      );
    case 'HOME':
      // 🟢 HOME can be shown to both authenticated AND unauthenticated users (guest browsing)
      // For authenticated users, show full home view
      // For unauthenticated, guest can still browse (cart won't persist)
      return <HomeView profile={profile} onProceed={navigateToPayment} onViewOrders={() => setView('ORDERS')} onLogout={handleLogout} />;
    case 'ORDERS':
      // 🟢 For authenticated users, show orders view with real-time updates
      // 🔑 If guest, they'll be redirected by CHECKOUT_GUARD effect above
      if (profile) {
        return <OrdersView profile={profile} onBack={navigateToHome} onQROpen={navigateToQR} />;
      }
      // Guest will be redirected by the effect, show nothing
      return null;
    case 'PAYMENT':
      // 🟢 PaymentView must NEVER redirect — it trusts routing
      // 🔑 If guest, they'll be redirected by CHECKOUT_GUARD effect above
      if (profile) {
        return <PaymentView profile={profile} onBack={navigateToHome} onSuccess={navigateToQR} />;
      }
      // Guest will be redirected by the effect, show nothing
      return null;
    case 'QR':
      // 🟢 QRView must NEVER redirect — it trusts routing
      // 🔑 If guest, they'll be redirected by CHECKOUT_GUARD effect above
      if (profile) {
        return <QRView orderId={selectedOrderId!} onBack={navigateToHome} />;
      }
      // Guest will be redirected by the effect, show nothing
      return null;
    case 'STAFF_LOGIN':
      return (
        <LoginView
          onBack={() => setView('WELCOME')}
          onSuccess={() => {
            // 🔑 After login, check if guest was trying to checkout
            const checkoutRedirect = sessionStorage.getItem('joe_checkout_redirect');
            if (checkoutRedirect) {
              sessionStorage.removeItem('joe_checkout_redirect');
              console.log('🔑 [LOGIN-SUCCESS] Redirecting guest to:', checkoutRedirect);
              setView(checkoutRedirect as ViewState);
            }
            // Otherwise, auth bootstrap effect will route by role
          }}
        />
      );
    case 'CASHIER':
      // Cashier portal - ONLY accessible to cashiers
      if (profile && role === 'cashier') {
        return <CashierView profile={profile} onLogout={handleLogout} />;
      }
      console.warn('⚠️ Unauthorized access attempt to CASHIER portal. Role:', role);
      // Authenticated but wrong role → fall back to student home
      if (user && profile) {
        return <HomeView profile={profile} onProceed={navigateToPayment} onLogout={handleLogout} />;
      }
      return (
        <WelcomeView
          onStart={handleStartOrdering}
          onStaffLogin={navigateToLogin}
          onAdminLogin={navigateToStaffLogin}
        />
      );
    case 'ADMIN':
      // Admin portal - ONLY accessible to admins
      if (profile && role === 'admin') {
        return <AdminDashboard profile={profile} onLogout={handleLogout} />;
      }
      console.warn('⚠️ Unauthorized access attempt to ADMIN portal. Role:', role);
      if (user && profile) {
        return <HomeView profile={profile} onProceed={navigateToPayment} onLogout={handleLogout} />;
      }
      return (
        <WelcomeView
          onStart={handleStartOrdering}
          onStaffLogin={navigateToLogin}
          onAdminLogin={navigateToStaffLogin}
        />
      );
    case 'SERVING_COUNTER':
      // Server portal - ONLY accessible to servers
      if (profile && role === 'server') {
        return <ServingCounterView profile={profile} onLogout={handleLogout} />;
      }
      console.warn('⚠️ Unauthorized access attempt to SERVING_COUNTER portal. Role:', role);
      if (user && profile) {
        return <HomeView profile={profile} onProceed={navigateToPayment} onLogout={handleLogout} />;
      }
      return (
        <WelcomeView
          onStart={handleStartOrdering}
          onStaffLogin={navigateToLogin}
          onAdminLogin={navigateToStaffLogin}
        />
      );
    default:
      // 🟢 Default fallback: respect auth state to avoid welcome loop for logged-in users
      if (user && profile) {
        console.warn('⚠️ [DEFAULT] Unexpected view state, routing authenticated user to HOME');
        return <HomeView profile={profile} onProceed={navigateToPayment} onLogout={handleLogout} />;
      }
      console.warn('⚠️ [DEFAULT] Unexpected view state, routing unauthenticated user to WELCOME');
      return (
        <WelcomeView
          onStart={handleStartOrdering}
          onStaffLogin={navigateToLogin}
          onAdminLogin={navigateToStaffLogin}
        />
      );
  }
};

export default App;