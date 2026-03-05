import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Umeingia kikamilifu!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card rounded-2xl p-8"
      >
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Smart Events Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            className={inputClass}
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={255}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className={inputClass}
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            maxLength={128}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-accent transition-colors shadow-warm disabled:opacity-50"
          >
            {loading ? '...' : 'Login'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
