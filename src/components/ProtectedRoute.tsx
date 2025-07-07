

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children?: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // The isLoadingAuth check is handled in App.tsx before this component renders.
  // We only need to check if the user object exists.
  if (!user) {
    // User not authenticated, redirect to login page.
    // Save the current location they were trying to go to.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated. Render the child component passed in,
  // or render the nested routes via <Outlet /> if it's used as a layout route.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;