import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { speakText, validateAnswer } from '../services/geminiService';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, ArrowRight, Chrome, Loader2, Shield } from 'lucide-react';
import Logo from './Logo';
import { authService } from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
  language: Language;
}

export default function Login({ onLoginSuccess, language }: LoginProps) {
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

    speakText('Welcome to Insight. Please sign in or register to continue.', language);
  }, [language]);

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
        const profile = await authService.register(email, password, { 
          fullName, 
          age: parseInt(age),
          phone,
          preferredLanguage: language
        });
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Hero/Branding */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-8 lg:p-20 bg-stone-950 border-r border-stone-800 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-coral/20 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black">
              <Logo />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase">Insight</span>
          </div>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase"
            >
              Empower <br />
              <span className="text-emerald-500">Your</span> <br />
              Vision.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-stone-500 font-medium max-w-md leading-relaxed"
            >
              {language === 'ml' 
                ? 'കാഴ്ചപരിമിതിയുള്ളവർക്കായി പ്രത്യേകം രൂപകൽപ്പന ചെയ്ത ഒരു നൂതന പഠന പ്ലാറ്റ്‌ഫോം.' 
                : 'A specialized learning platform designed with precision for the visually impaired community.'}
            </motion.p>
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t border-stone-900">
          <div className="flex items-center gap-8">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-stone-950 bg-stone-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="text-stone-500 text-sm font-black uppercase tracking-widest">
              Join 500+ <br /> Students
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-20 bg-black">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
              {isLogin 
                ? (language === 'ml' ? 'ലോഗിൻ ചെയ്യുക' : 'Welcome Back') 
                : (language === 'ml' ? 'രജിസ്റ്റർ ചെയ്യുക' : 'Create Account')}
            </h2>
            <p className="text-stone-500 font-medium">
              {isLogin 
                ? (language === 'ml' ? 'തുടരാൻ നിങ്ങളുടെ വിവരങ്ങൾ നൽകുക' : 'Enter your credentials to access your dashboard') 
                : (language === 'ml' ? 'പുതിയ അക്കൗണ്ട് തുടങ്ങാൻ വിവരങ്ങൾ നൽകുക' : 'Fill in the details below to start your journey')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        required={!isLogin}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-stone-900 border-2 border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Age</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full bg-stone-900 border-2 border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                          placeholder="25"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Phone</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-stone-900 border-2 border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                          placeholder="Phone"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-900 border-2 border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-900 border-2 border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black uppercase tracking-widest flex items-center gap-3"
              >
                <Shield className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-black font-black py-5 rounded-2xl hover:bg-white transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-widest"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isLogin ? (language === 'ml' ? 'ലോഗിൻ' : 'Login') : (language === 'ml' ? 'രജിസ്റ്റർ' : 'Register')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-black px-4 text-stone-600">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-stone-900 border-2 border-stone-800 text-white font-black py-4 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              <Chrome className="w-5 h-5 text-blue-600" />
              Google Account
            </button>
          </form>

          <div className="pt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-stone-500 hover:text-white font-black uppercase tracking-widest text-xs transition-colors"
            >
              {isLogin 
                ? (language === 'ml' ? 'പുതിയ അക്കൗണ്ട് തുടങ്ങണോ? രജിസ്റ്റർ ചെയ്യുക' : "Don't have an account? Register now") 
                : (language === 'ml' ? 'നിലവിൽ അക്കൗണ്ട് ഉണ്ടോ? ലോഗിൻ ചെയ്യുക' : 'Already have an account? Login')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
