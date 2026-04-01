import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Language, UserProfile, ScreenReader } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LessonView from './components/LessonView';
import QuizView from './components/QuizView';
import { MODULES } from './constants';
import { Loader2, LogOut, Languages, Settings, AlertTriangle, RefreshCcw } from 'lucide-react';
import { speakText } from './services/geminiService';
import Logo from './components/Logo';
import { authService } from './services/authService';
import { moduleService } from './services/moduleService';
import AdminPanel from './components/AdminPanel';
import { Module, UserProgress } from './types';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2rem] border border-black/5 p-12 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-ink">Something went wrong</h2>
              <p className="text-zinc-500 text-sm">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>
            <div className="p-4 bg-red-50/50 rounded-xl text-left overflow-auto max-h-40">
              <code className="text-xs text-red-600 font-mono">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-ability-blue text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('App component rendering');
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  console.log('AppContent component rendering');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasStarted, setHasStarted] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setGlobalError(event.error?.message || 'Unknown global error');
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (globalError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-xl border border-red-100">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-red-900">Critical System Error</h2>
          <p className="text-red-700 text-sm font-mono bg-red-50 p-4 rounded-xl break-words">
            {globalError}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors"
          >
            Refresh Application
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    // Check for Gemini API Key
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is missing. AI features will not work.');
    }

    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    // Safety timeout for loading state
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timed out after 10s. Forcing loading to false.');
        setLoading(false);
        setAuthError('Authentication check timed out. Please check your connection.');
      }
    }, 10000);

    const unsubscribeAuth = authService.onAuthChange((userProfile) => {
      console.log('Auth state changed:', userProfile ? 'Logged in' : 'Logged out');
      clearTimeout(timeout);
      setProfile(userProfile);
      setLoading(false);
      setAuthError(null);
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!profile) return;

    console.log('Starting module subscription for user:', profile.email);
    const unsubscribeModules = moduleService.subscribeToModules((data) => {
      console.log('Received modules from Firestore:', data.length);
      if (data.length > 0) {
        setModules(data);
      } else {
        // If Firestore is empty, we might want to show the default modules
        // but only if the user hasn't uploaded anything.
        // For now, let's just set it to empty and see if it's a permission issue.
        setModules([]);
      }
    });

    return () => {
      unsubscribeModules();
    };
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      setUserProgress([]);
      return;
    }

    const unsubscribeProgress = moduleService.subscribeToUserProgress(profile.uid, (data) => {
      setUserProgress(data);
    });

    return () => {
      unsubscribeProgress();
    };
  }, [profile]);

  const toggleLanguage = async () => {
    if (!profile) return;
    const newLang: Language = profile.preferredLanguage === 'en' ? 'ml' : 'en';
    const updatedProfile = { ...profile, preferredLanguage: newLang };
    setProfile(updatedProfile);
    
    try {
      await authService.updateUserProfile(profile.uid, { preferredLanguage: newLang });
    } catch (error) {
      console.error('Failed to persist language change:', error);
    }
  };

  const updateLanguage = async (lang: Language) => {
    if (!profile) return;
    const updatedProfile = { ...profile, preferredLanguage: lang };
    setProfile(updatedProfile);
    
    try {
      await authService.updateUserProfile(profile.uid, { preferredLanguage: lang });
    } catch (error) {
      console.error('Failed to persist language change:', error);
    }
  };

  const updateScreenReader = async (sr: ScreenReader) => {
    if (!profile) return;
    const updatedProfile = { ...profile, preferredScreenReader: sr };
    setProfile(updatedProfile);
    
    try {
      await authService.updateUserProfile(profile.uid, { preferredScreenReader: sr });
    } catch (error) {
      console.error('Failed to persist screen reader change:', error);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setProfile(null);
    setCurrentModuleId(null);
    setShowQuiz(false);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n': // Next
            e.preventDefault();
            const nextBtn = document.querySelector('[aria-label*="Next"], [aria-label*="അടുത്ത"]') as HTMLButtonElement;
            if (nextBtn) nextBtn.click();
            break;
          case 'r': // Repeat / Read Aloud
          case 's': // Speak
            e.preventDefault();
            const speakBtn = document.querySelector('[aria-label*="Read"], [aria-label*="വായിക്കുക"]') as HTMLButtonElement;
            if (speakBtn) speakBtn.click();
            break;
          case 'l': // Listen
            e.preventDefault();
            const listenBtn = document.querySelector('[aria-label*="Listen"], [aria-label*="കേൾക്കാം"]') as HTMLButtonElement;
            if (listenBtn) listenBtn.click();
            break;
          case 'h': // Home
            e.preventDefault();
            setCurrentModuleId(null);
            setShowQuiz(false);
            setShowAdmin(false);
            speakText(profile?.preferredLanguage === 'ml' ? 'ഹോം പേജിലേക്ക് മടങ്ങി.' : 'Returned to Home Page.', profile?.preferredLanguage || 'en');
            break;
          case 'k': // Keyboard Help
            e.preventDefault();
            const helpMsg = profile?.preferredLanguage === 'ml'
              ? 'കീബോർഡ് ഷോർട്ട്കട്ടുകൾ ശ്രദ്ധിക്കുക. ആൾട്ട് പ്ലസ് എൻ അടുത്ത പാഠത്തിലേക്ക് പോകാൻ. ആൾട്ട് പ്ലസ് ആർ പാഠം വീണ്ടും കേൾക്കാൻ. ആൾട്ട് പ്ലസ് എൽ ഓഡിയോ കേൾക്കാൻ. ആൾട്ട് പ്ലസ് എച്ച് ഹോം പേജിലേക്ക് പോകാൻ. ആൾട്ട് പ്ലസ് ബി തിരികെ പോകാൻ. ആൾട്ട് പ്ലസ് ടി ഭാഷ മാറ്റാൻ. ആൾട്ട് പ്ലസ് കെ ഈ വിവരങ്ങൾ വീണ്ടും കേൾക്കാൻ.'
              : 'Keyboard shortcuts help. Press Alt plus N for next. Alt plus R to repeat. Alt plus L to listen. Alt plus H for home. Alt plus B to go back. Alt plus T to toggle language. Alt plus K to hear this help again.';
            speakText(helpMsg, profile?.preferredLanguage || 'en');
            break;
          case 'b': // Back
            e.preventDefault();
            const backBtn = document.querySelector('[aria-label*="Back"], [aria-label*="തിരികെ"]') as HTMLButtonElement;
            if (backBtn) backBtn.click();
            break;
          case 't': // Toggle Language
            e.preventDefault();
            toggleLanguage();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profile, toggleLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-ability-blue" />
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs animate-pulse">
          Initializing Ability Foundation...
        </p>
      </div>
    );
  }

  if (authError && !profile) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2rem] border border-black/5 p-12 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl mx-auto flex items-center justify-center">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-ink">Connection Issue</h2>
            <p className="text-zinc-500 text-sm">{authError}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-ability-blue text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Login onLoginSuccess={(p) => setProfile(p)} language={language} />;
  }

  const currentModule = modules.find(m => m.id === currentModuleId);

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] border border-black/5 p-12 text-center space-y-8 shadow-2xl animate-in zoom-in duration-700">
          <div className="w-24 h-24 bg-ability-blue rounded-3xl mx-auto flex items-center justify-center shadow-lg">
            <Logo className="w-16 h-16 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-ink">
              {profile.preferredLanguage === 'ml' ? 'സ്വാഗതം' : 'WELCOME'}
            </h1>
            <p className="text-zinc-500 font-medium">
              {profile.preferredLanguage === 'ml' 
                ? 'എബിലിറ്റി ലേണിംഗിലേക്ക് സ്വാഗതം. തുടങ്ങാൻ താഴെ ക്ലിക്ക് ചെയ്യുക.' 
                : 'Experience learning with full accessibility.'}
            </p>
          </div>
          <button
            onClick={() => {
              setHasStarted(true);
            }}
            className="w-full bg-ability-blue text-white font-bold py-6 rounded-2xl hover:opacity-90 transition-all text-2xl shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-ability-blue/30"
          >
            {profile.preferredLanguage === 'ml' ? 'തുടങ്ങാം' : 'START SYSTEM'}
          </button>
          
          <div className="pt-4 border-t border-black/5">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              {isDesktop ? 'Keyboard Shortcuts Active: Alt + N, R, L, H, B, T, K' : 'Touch Navigation Active'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans p-0 sm:p-2 md:p-4 flex items-center justify-center selection:bg-ability-blue/20">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-ability-blue focus:text-white focus:font-bold focus:rounded-xl focus:shadow-2xl"
      >
        Skip to Content
      </a>
      {/* Main Desktop Window */}
      <div className="w-full max-w-7xl h-full min-h-[90vh] bg-white rounded-2xl shadow-2xl border border-black/5 overflow-hidden flex flex-col">
        {/* Title Bar */}
        <div className="bg-ink px-6 py-2.5 flex items-center justify-between border-b border-white/5 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-ability-blue rounded flex items-center justify-center text-[10px] font-black text-white">AB</div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
              Ability Foundation // {language === 'ml' ? 'എബിലിറ്റി കമ്പ്യൂട്ടർ' : 'Ability Computer'} // {profile.fullName}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-2" aria-hidden="true">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
            <button 
              onClick={() => setShowAdmin(!showAdmin)}
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
            >
              {showAdmin ? 'User Mode' : 'Admin'}
            </button>
          </div>
        </div>

        {/* Menu Bar (Desktop Only) */}
        <div className="hidden lg:flex bg-paper border-b border-black/5 px-2 py-1 gap-1 shrink-0">
          {['File', 'Sync', 'Reports', 'Options', 'Help'].map((menu) => (
            <button 
              key={menu}
              className="px-3 py-1 text-[11px] font-medium text-zinc-600 hover:bg-ability-blue hover:text-white rounded transition-colors"
            >
              {menu}
            </button>
          ))}
        </div>

        {/* App Header / Navigation Bar */}
        <header className="bg-white border-b border-black/5 px-8 py-4 flex items-center justify-between shrink-0 z-20">
          <div 
            className="flex items-center gap-4 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ability-blue rounded-lg p-1" 
            onClick={() => { setCurrentModuleId(null); setShowQuiz(false); setShowAdmin(false); }}
            role="button"
            aria-label={profile.preferredLanguage === 'ml' ? 'ഹോം പേജ്' : 'Home'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentModuleId(null);
                setShowQuiz(false);
                setShowAdmin(false);
              }
            }}
          >
            <div className="p-2 bg-ability-blue rounded-xl transition-transform group-hover:scale-105">
              <Logo className="w-8 h-8 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <h1 className="text-xl font-black tracking-tight text-ink">
                {profile.preferredLanguage === 'ml' ? 'എബിലിറ്റി ഫൗണ്ടേഷൻ' : 'Ability Foundation'}
              </h1>
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Accessible Edu</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCurrentModuleId(null); setShowQuiz(false); setShowAdmin(false); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                !currentModuleId && !showAdmin ? 'bg-ink text-white shadow-md' : 'text-zinc-500 hover:bg-paper'
              }`}
            >
              {profile.preferredLanguage === 'ml' ? 'ഹോം' : 'Home'}
            </button>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2.5 bg-paper rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-all border border-black/5"
              title={profile.preferredLanguage === 'en' ? 'Switch to Malayalam' : 'Switch to English'}
            >
              <Languages className="w-4 h-4 text-ability-blue" />
              <span className="hidden md:inline">{profile.preferredLanguage === 'en' ? 'മലയാളം' : 'English'}</span>
            </button>

            {profile.role === 'admin' && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={`p-3 rounded-xl border transition-all ${showAdmin ? 'bg-ability-blue text-white border-ability-blue' : 'bg-paper text-zinc-400 border-black/5 hover:text-ability-blue'}`}
                title="Admin Panel"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-3 rounded-xl bg-paper text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-black/5"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-paper custom-scrollbar">
          <main id="main-content" className="max-w-6xl mx-auto p-8 pb-24">
            {showAdmin && profile.role === 'admin' ? (
              <AdminPanel 
                modules={modules} 
                language={profile.preferredLanguage} 
                onBack={() => setShowAdmin(false)}
              />
            ) : !currentModuleId ? (
              <Dashboard 
                modules={modules}
                userProgress={userProgress}
                language={profile.preferredLanguage} 
                screenReader={profile.preferredScreenReader || 'nvda'}
                onSelectModule={(id) => setCurrentModuleId(id)} 
                onUpdateLanguage={updateLanguage}
                onUpdateScreenReader={updateScreenReader}
              />
            ) : showQuiz ? (
              <QuizView
                module={currentModule!}
                language={profile.preferredLanguage}
                profile={profile}
                onComplete={() => {
                  setShowQuiz(false);
                  setCurrentModuleId(null);
                }}
                onBack={() => setShowQuiz(false)}
              />
            ) : (
              <LessonView
                module={currentModule!}
                userId={profile.uid}
                language={profile.preferredLanguage}
                onStartQuiz={() => setShowQuiz(true)}
                onBack={() => setCurrentModuleId(null)}
              />
            )}
          </main>
        </div>

        {/* Status Bar */}
        <footer className="bg-white border-t border-black/5 px-6 py-2 text-[10px] text-zinc-400 flex justify-between uppercase font-bold tracking-widest shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ability-blue animate-pulse" />
              {profile.preferredLanguage === 'ml' ? 'സിസ്റ്റം തയ്യാറാണ്' : 'System Ready'}
            </span>
            <span className="text-zinc-200">|</span>
            <span>{profile.preferredScreenReader || 'nvda'} active</span>
          </div>
          <div>
            {profile.fullName} // {profile.email}
          </div>
        </footer>
      </div>
    </div>
  );
}
