import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppModule, usePermissions } from '@/hooks/usePermissions';

interface Props {
  children: React.ReactNode;
  module?: AppModule;
  adminOnly?: boolean;
}

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, module, adminOnly }: Props) => {
  const { user, loading } = useAuth();
  const { isLoading, isAdmin, can, modules } = usePermissions();

  if (loading || (user && isLoading)) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  if (module && !can(module)) {
    // Redirect to first allowed module
    const first = Array.from(modules)[0];
    return <Navigate to={first ? `/${first === 'recycle_bin' ? 'recycle-bin' : first}` : '/login'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
