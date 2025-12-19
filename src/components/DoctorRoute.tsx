import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';

interface DoctorRouteProps {
  children: React.ReactNode;
}

const DoctorRoute = ({ children }: DoctorRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isDoctor, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isDoctor) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

export default DoctorRoute;
