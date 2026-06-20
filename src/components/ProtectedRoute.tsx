import { useAuth } from "../contexts/SafeAuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import LoadingSpinner from "./ui/LoadingSpinner";

const MASTER_ADMIN_EMAIL = 'kansasnelly@gmail.com';

/**
 * A wrapper that ensures the user is authenticated before rendering child routes.
 * It respects the global loading state from SafeAuthProvider.
 */
const ProtectedRoute: React.FC = () => {
  // useAuth will throw if called outside of AuthProvider. In rare cases
  // (e.g., during server‑side rendering or when the component tree
  // changes unexpectedly) this can cause the entire app to crash.  We
  // guard against that by catching the error and rendering a fallback.
  let authContext;
  try {
    authContext = useAuth();
  } catch (e) {
    console.error('ProtectedRoute: AuthProvider missing', e);
    return null;
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
    return null;
  }
  const { isAuthenticated, isLoading, user } = authContext;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.error('[SECURITY] Unauthorized access attempt - not authenticated');
    return <Navigate to="/" replace />;
  }

  // Ironclad email check - must match exactly
  if (user?.email !== MASTER_ADMIN_EMAIL) {
    console.error(`[SECURITY] Unauthorized admin access attempt by: ${user?.email}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
