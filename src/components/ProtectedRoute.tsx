import { useAuth } from "../contexts/SafeAuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import LoadingSpinner from "./ui/LoadingSpinner";

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
  const { isAuthenticated, isLoading } = authContext;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
