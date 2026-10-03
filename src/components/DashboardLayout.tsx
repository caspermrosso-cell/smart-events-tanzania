import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Calendar, ChevronDown, Coins, CreditCard, FileText, Globe, Home,
  Landmark, LogOut, Mail, MessageCircle, MessageSquare, Package, QrCode, Quote,
  ShoppingCart, Trash2, UserCog, Users, Wallet,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/data/translations';
import { AppModule, usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type NavItem = { labelKey?: TranslationKey; label?: string; icon: any; href: string; module: AppModule };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: 'Overview', items: [{ label: 'Command Center', icon: Home, href: '/dashboard', module: 'dashboard' }] },
  { label: 'Events', items: [
    { labelKey: 'admin.events', icon: Calendar, href: '/events', module: 'events' },
    { labelKey: 'admin.packages', icon: Package, href: '/packages', module: 'packages' },
  ] },
  { label: 'Communications', items: [
    { label: 'Channel Overview', icon: MessageCircle, href: '/communications', module: 'sms' },
    { labelKey: 'admin.sms', icon: MessageSquare, href: '/sms', module: 'sms' },
    { labelKey: 'admin.whatsapp', icon: MessageCircle, href: '/whatsapp', module: 'whatsapp' },
  ] },
  { label: 'Guest Experience', items: [
    { labelKey: 'admin.guests', icon: Users, href: '/guests', module: 'guests' },
    { labelKey: 'admin.ecards', icon: Mail, href: '/ecards', module: 'ecards' },
    { labelKey: 'admin.checkin', icon: QrCode, href: '/checkin', module: 'checkin' },
    { labelKey: 'admin.pledges', icon: CreditCard, href: '/pledges', module: 'pledges' },
  ] },
  { label: 'Finance & Documents', items: [
    { labelKey: 'admin.payments', icon: Wallet, href: '/payments', module: 'payments' },
    { labelKey: 'admin.quotations', icon: FileText, href: '/quotations', module: 'quotations' },
    { label: 'Manunuzi ya Units', icon: ShoppingCart, href: '/purchases', module: 'quotations' },
    { label: 'Mipangilio ya Bei', icon: Coins, href: '/pricing-setup', module: 'users' },
    { label: 'Financial Statements', icon: Landmark, href: '/financial-statements', module: 'users' },
  ] },
  { label: 'Insights', items: [
    { labelKey: 'admin.reports', icon: BarChart3, href: '/reports', module: 'reports' },
    { labelKey: 'admin.testimonials', icon: Quote, href: '/testimonials', module: 'testimonials' },
  ] },
  { label: 'Administration', items: [
    { label: 'Watumiaji', icon: UserCog, href: '/users', module: 'users' },
    { label: 'Recycle Bin', icon: Trash2, href: '/recycle-bin', module: 'recycle_bin' },
  ] },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { can } = usePermissions();
  const groups = useMemo(() => navGroups.map((group) => ({ ...group, items: group.items.filter((item) => can(item.module)) })).filter((group) => group.items.length), [can]);
  const label = (item: NavItem) => item.labelKey ? t(item.labelKey) : item.label;
  const handleLogout = async () => { await signOut(); navigate('/'); };
  const toggleLanguage = () => setLanguage(language === 'sw' ? 'en' : 'sw');

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5">
          <img src="/smart-events-logo.png" alt="Smart Events" className="h-11 w-11 object-contain" />
          <div><p className="font-heading text-base font-bold text-sidebar-foreground">Smart Events</p><p className="text-[10px] text-sidebar-foreground/60">Event command center</p></div>
        </Link>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5 scrollbar-hide">
          {groups.map((group) => (
            <section key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase text-sidebar-foreground/50">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = location.pathname === item.href;
                  return <Link key={item.href} to={item.href} className={cn('flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}><item.icon className="h-4 w-4" /><span className="truncate">{label(item)}</span></Link>;
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 text-[11px] text-sidebar-foreground/60">{user?.email}</p>
          <div className="mt-2 flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} title={language === 'sw' ? 'Switch to English' : 'Badili kuwa Kiswahili'} className="text-sidebar-foreground hover:bg-sidebar-accent"><Globe /></Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} title={t('admin.logout')} className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent"><LogOut /></Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card md:hidden">
          <div className="flex items-center justify-between px-4 py-2">
            <Link to="/" className="flex items-center gap-2"><img src="/smart-events-logo.png" alt="Smart Events" className="h-10 w-10 object-contain" /><span className="font-heading text-sm font-bold">Smart Events</span></Link>
            <div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={toggleLanguage}>{language === 'sw' ? 'EN' : 'SW'}</Button><ThemeToggle /><Button variant="ghost" size="icon" onClick={handleLogout}><LogOut /></Button></div>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 pb-2 scrollbar-hide">
            {groups.map((group) => <Collapsible key={group.label} className="shrink-0"><CollapsibleTrigger asChild><Button variant="outline" size="sm" className="gap-1">{group.label}<ChevronDown className="h-3 w-3" /></Button></CollapsibleTrigger><CollapsibleContent className="absolute z-50 mt-1 min-w-48 rounded-md border border-border bg-popover p-1 shadow-lg">{group.items.map((item) => <Link key={item.href} to={item.href} className={cn('flex items-center gap-2 rounded px-3 py-2 text-xs', location.pathname === item.href ? 'bg-primary text-primary-foreground' : 'text-popover-foreground hover:bg-muted')}><item.icon className="h-3.5 w-3.5" />{label(item)}</Link>)}</CollapsibleContent></Collapsible>)}
          </div>
        </header>
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;