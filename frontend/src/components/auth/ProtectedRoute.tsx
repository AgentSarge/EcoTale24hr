import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session } = useAuthStore();

  if (!session?.user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}; 