import React, { useState } from 'react';
import { UserProfile } from '../types';
import { speakText } from '../services/geminiService';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, ArrowRight, Chrome } from 'lucide-react';
import Logo from './Logo';
import { authService } from '../services/authService';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const checkRedirect = async () => {
      try {
        const profile = await authService.handleRedirectResult();
        if (profile) {
          onLoginSuccess(profile);
        }
      } catch (err: any) {
        console.error('Redirect error:', err);
        setError("Google Login failed. " + (err.message || ""));
      }
    };
    checkRedirect();

    speakText('Welcome to Ability Learning. Please sign in or register to continue.', 'en');
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const profile = await authService.signInWithGoogle();
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error(err);
      setError("Google Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const profile = await authService.login(email, password);
        onLoginSuccess(profile);
      } else {
        const profileData: Partial<UserProfile> = {
          fullName,
          age: age ? parseInt(age) : undefined,
          phone,
          preferredLanguage: 'ml'
        };
        const profile = await authService.register(email, password, profileData);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use.');
      } else {
        setError("Authentication failed. " + (err.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-coral/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl bg-ink-light/40 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side - Branding & Info */}
        <div className="md:w-[40%] bg-coral p-10 text-ink flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-28 h-28 bg-ink rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl relative z-10"
          >
            <Logo className="w-16 h-16 text-coral" />
          </motion.div>
          
          <h2 className="text-3xl font-black mb-4 leading-tight relative z-10 tracking-tight uppercase">Ability Learning</h2>
          <p className="text-ink/60 text-base font-medium relative z-10 max-w-[200px]">
            {isLogin ? 'Welcome back, student! Ready to learn?' : 'Join our inclusive learning community today.'}
          </p>

          <div className="mt-12 space-y-4 w-full max-w-[240px] relative z-10">
             <div className="flex items-center gap-3 text-ink/40 text-xs font-bold uppercase tracking-widest">
                <div className="w-1 h-1 rounded-full bg-ink" />
                <span>Screen Reader Ready</span>
             </div>
             <div className="flex items-center gap-3 text-ink/40 text-xs font-bold uppercase tracking-widest">
                <div className="w-1 h-1 rounded-full bg-ink" />
                <span>Multilingual Support</span>
             </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-[60%] p-8 sm:p-12 flex flex-col justify-center bg-ink-light/60">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white mb-2 uppercase">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h3>
            <p className="text-zinc-500 text-sm font-medium">
              {isLogin ? 'Access your personalized learning dashboard.' : 'Fill in your details to get started.'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl text-xs border border-red-500/20 font-bold flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] flex justify-between items-center px-1">
                      <span>Full Name / പൂർണ്ണനാമം</span>
                    </label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-coral transition-colors" />
                      <input
                        type="text"
                        required={!isLogin}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-black/50 text-white pl-14 pr-6 py-4 rounded-2xl border-2 border-white/5 focus:border-coral/50 focus:bg-black outline-none transition-all text-sm font-bold placeholder:text-zinc-700"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] px-1">
                        Age / വയസ്സ്
                      </label>
                      <div className="relative group">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-coral transition-colors" />
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full bg-black/50 text-white pl-14 pr-6 py-4 rounded-2xl border-2 border-white/5 focus:border-coral/50 focus:bg-black outline-none transition-all text-sm font-bold placeholder:text-zinc-700"
                          placeholder="Age"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">
                        Phone / ഫോൺ
                      </label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-coral transition-colors" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-black/50 text-white pl-14 pr-6 py-4 rounded-2xl border-2 border-white/5 focus:border-coral/50 focus:bg-black outline-none transition-all text-sm font-bold placeholder:text-zinc-700"
                          placeholder="Phone"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex justify-between items-center px-1">
                <span>Email Address / ഇമെയിൽ</span>
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-coral transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 text-white pl-14 pr-6 py-4 rounded-2xl border-2 border-white/5 focus:border-coral/50 focus:bg-black outline-none transition-all text-sm font-bold placeholder:text-zinc-700"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex justify-between items-center px-1">
                <span>Password / പാസ്‌വേഡ്</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-coral transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 text-white pl-14 pr-14 py-4 rounded-2xl border-2 border-white/5 focus:border-coral/50 focus:bg-black outline-none transition-all text-sm font-bold placeholder:text-zinc-700"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-coral transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coral hover:bg-coral-dark text-ink font-black py-4 rounded-2xl shadow-lg shadow-coral/20 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-ink/20 border-t-ink rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Access System' : 'Initialize Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
              <span className="bg-ink-light px-4 text-zinc-600">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 text-ink font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-[0.98] disabled:opacity-50"
          >
            <Chrome className="w-5 h-5 text-blue-600" />
            <span>Google Login</span>
          </button>

          {/wv|Version\/[\d\.]+/i.test(navigator.userAgent) && (
            <p className="mt-4 text-[10px] text-stone-500 text-center font-bold uppercase tracking-widest">
              Note: If Google Login fails in APK, please use Email/Password.
            </p>
          )}

          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-500 font-bold hover:text-coral text-[11px] uppercase tracking-widest transition-colors"
            >
              {isLogin ? "New Student? Create an Account" : 'Existing User? Sign In'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
