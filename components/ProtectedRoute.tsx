/**
 * ProtectedRoute Component - Role-based route protection
 * Blocks rendering until auth state and role are resolved
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  unauthorizedComponent?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo,
  unauthorizedComponent
}) => {
  const { user, profile, loading, role } = useAuth();

  // Show loader while auth state is being resolved
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated - show unauthorized or redirect
  if (!user || !profile) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }
    // Default: redirect will be handled by parent router
    return null;
  }

  // Check role requirement
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !requiredRoles.includes(role)) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>;
      }
      // Default: redirect will be handled by parent router
      return null;
    }
  }

  // Check if account is active
  if (!profile.active) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-error mb-4">Account Deactivated</h2>
          <p className="text-textSecondary">Your account has been deactivated. Please contact administrator.</p>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
};

export default ProtectedRoute;
