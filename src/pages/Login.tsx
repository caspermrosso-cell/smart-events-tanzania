import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import smartEventsLogo from '@/assets/smart-events-logo.png';

const BIOMETRIC_KEY = 'se_bio_cred';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawNext = searchParams.get('next') ?? '';
  // Only allow same-origin relative paths.
  const nextPath = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  if (user) {
    navigate(nextPath, { replace: true });
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
      // Offer to save biometric
      if (window.PublicKeyCredential && email && password) {
        try {
          localStorage.setItem(BIOMETRIC_KEY, btoa(JSON.stringify({ e: email, p: password })));
          toast.info('Unaweza kutumia biometric login siku zijazo!');
        } catch { /* ignore */ }
      }
      navigate(nextPath);
    }
    setLoading(false);
  };

  const handleBiometric = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Biometric haipo kwenye kifaa hiki');
      return;
    }
    const stored = localStorage.getItem(BIOMETRIC_KEY);
    if (!stored) {
      toast.error('Tafadhali ingia kwanza kwa email/password ili kuwezesha biometric');
      return;
    }
    setLoading(true);
    try {
      // Use WebAuthn for biometric verification
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Smart Events' },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'admin',
            displayName: 'Admin',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });

      if (credential) {
        const cred = JSON.parse(atob(stored));
        const { error } = await signIn(cred.e, cred.p);
        if (error) {
          toast.error('Biometric imeshindikana. Jaribu email/password.');
          localStorage.removeItem(BIOMETRIC_KEY);
        } else {
          toast.success('Umeingia kwa biometric!');
          navigate(nextPath);
        }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Biometric imekataliwa na mtumiaji');
      } else {
        toast.error('Biometric haipo au haijawezeshwa');
      }
    }
    setLoading(false);
  };

  const hasBiometric = !!window.PublicKeyCredential && !!localStorage.getItem(BIOMETRIC_KEY);

  const inputClass = "w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card rounded-2xl p-8"
      >
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        <div className="text-center mb-8">
          <img src={smartEventsLogo} alt="Smart Events" className="w-80 h-auto mx-auto mb-4" />
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

        {hasBiometric && (
          <div className="mt-4">
            <div className="relative flex items-center justify-center my-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <span className="relative px-3 bg-card text-xs text-muted-foreground">au</span>
            </div>
            <button
              onClick={handleBiometric}
              disabled={loading}
              className="w-full py-3 rounded-lg border-2 border-primary/30 text-foreground font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Fingerprint className="w-5 h-5 text-primary" />
              Ingia kwa Biometric
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
