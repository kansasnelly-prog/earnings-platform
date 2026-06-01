import { useAuth } from "../contexts/SafeAuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import LoadingSpinner from "./ui/LoadingSpinner";

/**
 * A wrapper that ensures the user is authenticated before rendering child routes.
 * It respects the global loading state from SafeAuthProvider.
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
