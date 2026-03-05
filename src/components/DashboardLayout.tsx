import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, CreditCard, MessageSquare, Mail, QrCode, LogOut, LayoutDashboard, BarChart3, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Matukio', icon: Calendar, href: '/events' },
  { label: 'Wageni', icon: Users, href: '/guests' },
  { label: 'Michango', icon: CreditCard, href: '/pledges' },
  { label: 'SMS', icon: MessageSquare, href: '/sms' },
  { label: 'E-Cards', icon: Mail, href: '/ecards' },
  { label: 'Check-In', icon: QrCode, href: '/checkin' },
  { label: 'Malipo', icon: Wallet, href: '/payments' },
  { label: 'Ripoti', icon: BarChart3, href: '/reports' },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <Link to="/" className="font-heading text-xl font-bold text-gradient-gold">Smart Events</Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground truncate mb-2 px-3">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-muted transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Ondoka
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg font-bold text-gradient-gold">Smart Events</Link>
          <div className="flex items-center gap-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href} className={`p-2 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  <item.icon className="w-4 h-4" />
                </Link>
              );
            })}
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
