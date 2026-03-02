import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Akaunti imetengenezwa! Unaweza kuingia sasa.');
        navigate('/dashboard');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Umeingia kikamilifu!');
        navigate('/dashboard');
      }
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
            {isSignUp ? <UserPlus className="w-7 h-7 text-primary" /> : <Lock className="w-7 h-7 text-primary" />}
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {isSignUp ? 'Create Account' : 'Admin Login'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Smart Events Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              required
              placeholder="Full Name"
              className={inputClass}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              maxLength={100}
            />
          )}
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
            {loading ? '...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
