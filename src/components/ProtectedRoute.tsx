import React from "react";
import { useAuth } from "../contexts/SafeAuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import LoadingSpinner from "./ui/LoadingSpinner";

export const MASTER_ADMIN_EMAIL = 'kansasnelly@gmail.com';
export const DUAL_ADMIN_EMAIL = 'admin@earnings.ink';
/** Additional master admin username key — treated as identical to MASTER_ADMIN_EMAIL */
export const MASTER_ADMIN_USERNAME = 'kan112';

/** Check if a user identifier matches master admin (email or username) */
export function isMasterAdmin(identifier: string | undefined | null): boolean {
  if (!identifier) return false;
  const trimmed = identifier.trim().toLowerCase();
  return (
    trimmed === MASTER_ADMIN_EMAIL.toLowerCase() ||
    trimmed === MASTER_ADMIN_USERNAME.toLowerCase()
  );
}

/**
 * A wrapper that ensures the user is authenticated before rendering child routes.
 * It respects the global loading state from SafeAuthProvider.
 */
const ProtectedRoute: React.FC = () => {
  let authContext;
  try {
    authContext = useAuth();
  } catch (e) {
    console.error('ProtectedRoute: AuthProvider missing', e);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { isAuthenticated, isLoading, user } = authContext;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

/**
 * Ironclad session guard for master admin only.
 * Ensures only kansasnelly@gmail.com can access administrative features.
 */
export const MasterAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let authContext;
  try {
    authContext = useAuth();
  } catch (e) {
    console.error('MasterAdminRoute: AuthProvider missing', e);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { isAuthenticated, isLoading, user } = authContext;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.error('[SECURITY] Unauthorized access attempt - not authenticated');
    return <Navigate to="/" replace />;
  }

  // Ironclad check — accepts both email and username as master admin keys
  // kan112 and kansasnelly@gmail.com are treated as identical master admin identifiers
  if (!isMasterAdmin(user?.email) && !isMasterAdmin(user?.username)) {
    console.error(`[SECURITY] Unauthorized admin access attempt by: ${user?.email} / ${user?.username}`);
    return <Navigate to="/" replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

/**
 * Dual-admin route guard - allows both master and secondary admin accounts.
 * Used for shared monitoring dashboards and analytics panels.
 */
export const DualAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let authContext;
  try {
    authContext = useAuth();
  } catch (e) {
    console.error('DualAdminRoute: AuthProvider missing', e);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { isAuthenticated, isLoading, user } = authContext;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.error('[SECURITY] Unauthorized access attempt - not authenticated');
    return <Navigate to="/" replace />;
  }

  // Dual-admin email check - allows both admin accounts
  const isAuthorized = user?.email === MASTER_ADMIN_EMAIL || user?.email === DUAL_ADMIN_EMAIL;
  if (!isAuthorized) {
    console.error(`[SECURITY] Unauthorized dual-admin access attempt by: ${user?.email}`);
    return <Navigate to="/" replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default ProtectedRoute;
