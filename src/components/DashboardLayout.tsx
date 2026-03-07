import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, CreditCard, MessageSquare, Mail, QrCode, LogOut, LayoutDashboard, BarChart3, Wallet, FileText } from 'lucide-react';
import smartEventsLogo from '@/assets/smart-events-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Matukio', icon: Calendar, href: '/events' },
  { label: 'Wageni', icon: Users, href: '/guests' },
  { label: 'Michango', icon: CreditCard, href: '/pledges' },
  { label: 'SMS', icon: MessageSquare, href: '/sms' },
  { label: 'E-Cards', icon: Mail, href: '/ecards' },
  { label: 'Check-In', icon: QrCode, href: '/checkin' },
  { label: 'Malipo', icon: Wallet, href: '/payments' },
  { label: 'Nyaraka', icon: FileText, href: '/quotations' },
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
          <Link to="/" className="flex items-center gap-2">
            <img src={smartEventsLogo} alt="Smart Events" className="w-14 h-auto" />
            <span className="font-heading text-lg font-bold text-gradient-gold">Smart Events</span>
          </Link>
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
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            <ThemeToggle />
          </div>
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
        <header className="md:hidden border-b border-border bg-card px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={smartEventsLogo} alt="Smart Events" className="w-8 h-auto" />
              <span className="font-heading text-base font-bold text-gradient-gold">Smart Events</span>
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs whitespace-nowrap ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}>
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{item.label}</span>
                </Link>
              );
            })}
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
