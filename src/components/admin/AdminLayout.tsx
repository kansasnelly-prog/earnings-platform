import React from 'react';
import { useAuth } from '../../contexts/SafeAuthProvider';
import Navbar from '../Navbar';
import { Outlet } from 'react-router-dom';

/**
 * AdminLayout is a simple wrapper that ensures the user is authenticated
 * and has admin privileges before rendering the admin UI. It also provides
 * a consistent layout with a navbar and a placeholder for nested routes.
 */
const AdminLayout: React.FC = ({ children }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // If not authenticated, redirect to login or show a message
  if (!isAuthenticated) {
    return <div className="p-4">You must be logged in to view this page.</div>;
  }

  // If authenticated but not an admin, show access denied
  if (!isAdmin) {
    return <div className="p-4">Access denied. Admins only.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-4">{children ?? <Outlet />}</main>
    </div>
  );
};

export default AdminLayout;
