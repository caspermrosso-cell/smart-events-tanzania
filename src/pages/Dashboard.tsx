import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, CreditCard, MessageSquare, Mail, QrCode, ArrowLeft, LogOut } from 'lucide-react';

const stats = [
  { label: 'Total Events', value: '0', icon: Calendar },
  { label: 'Total Guests', value: '0', icon: Users },
  { label: 'Total Pledges', value: 'TZS 0', icon: CreditCard },
  { label: 'Pending Payments', value: 'TZS 0', icon: CreditCard },
];

const modules = [
  { title: 'Events', desc: 'Create & manage events', icon: Calendar, color: 'bg-primary/10 text-primary' },
  { title: 'Guest Lists', desc: 'Manage invitations & RSVPs', icon: Users, color: 'bg-gold/10 text-gold' },
  { title: 'Pledges & Ledger', desc: 'Track contributions & balances', icon: CreditCard, color: 'bg-accent/10 text-accent' },
  { title: 'SMS Center', desc: 'Send bulk SMS & reminders', icon: MessageSquare, color: 'bg-primary/10 text-primary' },
  { title: 'E-Cards', desc: 'Design & send branded cards', icon: Mail, color: 'bg-gold/10 text-gold' },
  { title: 'Check-In Scanner', desc: 'Scan barcodes at venue', icon: QrCode, color: 'bg-accent/10 text-accent' },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-xl font-bold text-gradient-gold">Smart Events</h1>
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </Link>
      </header>

      <div className="container mx-auto px-4 py-8">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-heading text-2xl font-bold text-foreground mb-8"
        >
          Welcome to Smart Events Dashboard
        </motion.h2>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Modules */}
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Modules</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card rounded-xl p-5 hover:shadow-warm transition-all cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <m.icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">{m.title}</h4>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-xl border-2 border-dashed border-border text-center">
          <p className="text-muted-foreground text-sm">
            🚀 Connect Lovable Cloud to enable authentication, database, SMS integration, and all backend features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
