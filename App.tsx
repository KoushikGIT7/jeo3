import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { initializeMenu, listenToLatestActiveQR } from './services/firestore-db';
import SplashScreen from './components/SplashScreen';
import { signInWithGoogleRedirect } from './services/auth';

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

  /**
   * Auth bootstrap & role routing
   * - Depends ONLY on Firebase auth state (via useAuth)
   * - No manual navigate after login
   * - Welcome view is shown only when auth user is null
   * - On refresh, Firebase restores session and we re-route based on role
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    // UNAUTHENTICATED / GUEST:
    // user === null → we can be on WELCOME or student guest flows (HOME / PAYMENT / QR)
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

    // AUTHENTICATED:
    // Once Firebase restores the session and we have a profile + role,
    // pick the correct portal exactly once and let sub-views handle their own flow.
    const validRoles: ViewState[] = ['ADMIN', 'CASHIER', 'SERVING_COUNTER', 'HOME'];
    let targetView: ViewState;
      
      if (role === 'admin') {
        targetView = 'ADMIN';
      } else if (role === 'cashier') {
        targetView = 'CASHIER';
      } else if (role === 'server') {
        targetView = 'SERVING_COUNTER';
    } else {
      // Default for authenticated users is student portal
        targetView = 'HOME';
      }
      
    setView((prev) => {
      // CRITICAL: If we're on WELCOME and user is authenticated, ALWAYS route to portal
      // This fixes the Google redirect issue where user gets stuck on Welcome
      if (prev === 'WELCOME') {
        console.log('🔄 Routing authenticated user away from WELCOME to:', targetView);
        return targetView;
      }

      // For students, don't override active in-flow views (PAYMENT / QR / ORDERS / HOME)
      if (role === 'student') {
        const studentFlows: ViewState[] = ['HOME', 'PAYMENT', 'QR', 'ORDERS'];
        if (studentFlows.includes(prev)) {
          return prev;
        }
      }

      // For staff/admin, or invalid views, route to exact portal
      if (!validRoles.includes(prev)) {
        console.log('🔄 Routing to valid portal:', targetView, 'from invalid view:', prev);
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
      // Pure Google redirect sign-in – routing after login is driven ONLY by onAuthStateChanged
      await signInWithGoogleRedirect();
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
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
      // CRITICAL SAFETY: If user is authenticated, show their portal immediately
      // This prevents getting stuck on Welcome after Google redirect
      // The routing effect should handle this, but this is a safety net
      if (user && profile && role) {
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
          return <HomeView profile={profile} onProceed={navigateToPayment} onLogout={handleLogout} />;
    case 'ORDERS':
      return <OrdersView profile={profile} onBack={navigateToHome} />;
    case 'PAYMENT':
      // Orders are allowed whenever Firebase user exists; no re-auth redirects here.
      if (!user || !profile) {
        return (
          <WelcomeView
            onStart={handleStartOrdering}
            onStaffLogin={navigateToLogin}
            onAdminLogin={navigateToStaffLogin}
            disabled={authLoading}
          />
        );
      }
      return <PaymentView profile={profile} onBack={navigateToHome} onSuccess={navigateToQR} />;
    case 'QR':
      return <QRView orderId={selectedOrderId!} onBack={navigateToHome} />;
    case 'STAFF_LOGIN':
      return (
        <LoginView
          onBack={() => setView('WELCOME')}
          onSuccess={() => {
            // No manual routing here.
            // Once Firebase auth + Firestore profile resolve, the auth bootstrap effect routes by role.
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
      // Default fallback: respect auth state to avoid welcome loop for logged-in users
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
  }
};

export default App;