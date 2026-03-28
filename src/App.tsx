import React, { useState, useEffect } from 'react';
import { Language, UserProfile, ScreenReader } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LessonView from './components/LessonView';
import QuizView from './components/QuizView';
import { MODULES } from './constants';
import { Loader2, LogOut, Languages, Settings } from 'lucide-react';
import { speakText } from './services/geminiService';
import Logo from './components/Logo';
import { authService } from './services/authService';
import { moduleService } from './services/moduleService';
import AdminPanel from './components/AdminPanel';
import { Module } from './types';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = authService.onAuthChange((userProfile) => {
      setProfile(userProfile);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
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

  const toggleLanguage = async () => {
    if (!profile) return;
    const newLang: Language = profile.preferredLanguage === 'en' ? 'ml' : 'en';
    const updatedProfile = { ...profile, preferredLanguage: newLang };
    setProfile(updatedProfile);
    
    const msg = newLang === 'ml' ? 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി' : 'Language changed to English';
    speakText(msg, newLang);
  };

  const updateLanguage = (lang: Language) => {
    if (!profile) return;
    const updatedProfile = { ...profile, preferredLanguage: lang };
    setProfile(updatedProfile);
    speakText('Language updated', lang);
  };

  const updateScreenReader = (sr: ScreenReader) => {
    if (!profile) return;
    const updatedProfile = { ...profile, preferredScreenReader: sr };
    setProfile(updatedProfile);
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
            speakText(profile?.preferredLanguage === 'ml' ? 'ഹോം പേജിലേക്ക് പോയി' : 'Returned to Home', profile?.preferredLanguage || 'en');
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
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-coral" />
      </div>
    );
  }

  if (!profile) {
    return <Login onLoginSuccess={(p) => setProfile(p)} />;
  }

  const currentModule = modules.find(m => m.id === currentModuleId);

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-ink-light rounded-[3.5rem] border-2 border-white/5 p-12 text-center space-y-8 shadow-[0_0_100px_rgba(255,107,107,0.05)] animate-in zoom-in duration-700">
          <div className="w-24 h-24 bg-coral rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(255,107,107,0.3)]">
            <Logo className="w-16 h-16 text-ink" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase">
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
              const srName = profile.preferredScreenReader?.toUpperCase() || 'NVDA';
              let welcomeMsg = profile.preferredLanguage === 'ml' 
                ? `എബിലിറ്റി ലേണിംഗിലേക്ക് സ്വാഗതം. നിങ്ങൾ ${srName} ആണ് ഉപയോഗിക്കുന്നത്.` 
                : `Welcome to Ability Learning. You are using ${srName}.`;
              
              if (isDesktop) {
                welcomeMsg += profile.preferredLanguage === 'ml'
                  ? ' ഈ സൈറ്റ് ഉപയോഗിക്കാൻ ചില കീബോർഡ് ഷോർട്ട്കട്ടുകൾ സഹായിക്കും. ആൾട്ട് പ്ലസ് എൻ അടുത്ത പാഠത്തിലേക്ക് പോകാൻ ഉപയോഗിക്കാം. ആൾട്ട് പ്ലസ് ആർ പാഠം വീണ്ടും കേൾക്കാൻ സഹായിക്കും. കൂടുതൽ വിവരങ്ങൾക്ക് ആൾട്ട് പ്ലസ് കെ അമർത്തുക.'
                  : ' You can use keyboard shortcuts to navigate. Press Alt plus N for next, and Alt plus R to repeat content. For full help, press Alt plus K anytime.';
              }

              speakText(welcomeMsg, profile.preferredLanguage);
            }}
            className="w-full bg-coral text-ink font-black py-6 rounded-2xl hover:bg-white transition-all text-2xl shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-coral"
          >
            {profile.preferredLanguage === 'ml' ? 'തുടങ്ങാം' : 'START SYSTEM'}
          </button>
          
          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
              {isDesktop ? 'Keyboard Shortcuts Active: Alt + N, R, L, H, B, T, K' : 'Touch Navigation Active'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-0 sm:p-2 md:p-4 flex items-center justify-center selection:bg-coral/30">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-coral focus:text-ink focus:font-black focus:rounded-xl focus:shadow-2xl"
      >
        Skip to Content
      </a>
      {/* Main Desktop Window */}
      <div className="w-full max-w-7xl h-full min-h-[90vh] bg-ink-light rounded-2xl shadow-[0_0_50px_rgba(255,107,107,0.05)] border-2 border-white/5 overflow-hidden flex flex-col">
        {/* Title Bar */}
        <div className="bg-black px-6 py-3 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <Logo className="w-6 h-6 text-coral" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
              Ability OS v2.0 // {profile.fullName}
            </span>
          </div>
          <div className="flex gap-3" aria-hidden="true">
            <div className="w-3 h-3 rounded-full bg-zinc-900 border border-white/5" />
            <div className="w-3 h-3 rounded-full bg-zinc-900 border border-white/5" />
            <div className="w-3 h-3 rounded-full bg-coral/50 border border-coral" />
          </div>
        </div>

        {/* App Header / Menu Bar */}
        <header className="bg-ink-light/50 backdrop-blur-md border-b border-white/5 px-8 py-5 flex items-center justify-between shrink-0">
          <div 
            className="flex items-center gap-4 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-coral rounded-lg p-1" 
            onClick={() => { setCurrentModuleId(null); setShowQuiz(false); }}
            role="button"
            aria-label={profile.preferredLanguage === 'ml' ? 'ഹോം പേജ്' : 'Home'}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentModuleId(null);
                setShowQuiz(false);
              }
            }}
          >
            <div className="p-2 bg-coral rounded-xl group-hover:rotate-12 transition-transform">
              <Logo className="w-8 h-8 text-ink" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter hidden sm:block uppercase">
              {profile.preferredLanguage === 'ml' ? 'എബിലിറ്റി ലേണിംഗ്' : 'Ability Learning'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { setCurrentModuleId(null); setShowQuiz(false); setShowAdmin(false); }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-coral hover:text-ink transition-all font-black text-xs uppercase tracking-widest border border-white/5 focus:outline-none focus:ring-4 focus:ring-coral/50"
              aria-label={profile.preferredLanguage === 'ml' ? 'ഹോം' : 'Home'}
            >
              <span>{profile.preferredLanguage === 'ml' ? 'ഹോം' : 'Home'}</span>
            </button>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-coral hover:text-ink transition-all font-black text-xs uppercase tracking-widest border border-white/5 focus:outline-none focus:ring-4 focus:ring-coral/50"
              aria-label={profile.preferredLanguage === 'en' ? 'മലയാളത്തിലേക്ക് മാറ്റുക' : 'Switch to English'}
            >
              <Languages className="w-4 h-4" />
              <span>{profile.preferredLanguage === 'en' ? 'മലയാളം' : 'English'}</span>
            </button>
            
            {profile.role === 'admin' && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={`p-3 rounded-xl border transition-all focus:outline-none focus:ring-4 focus:ring-coral/50 ${showAdmin ? 'bg-coral text-ink border-coral/40' : 'bg-black text-zinc-400 border-white/5 hover:text-coral'}`}
                aria-label={profile.preferredLanguage === 'ml' ? 'അഡ്മിൻ പാനൽ' : 'Admin Panel'}
                aria-pressed={showAdmin}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="p-3 rounded-xl bg-black text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5 focus:outline-none focus:ring-4 focus:ring-red-500/50"
              aria-label={profile.preferredLanguage === 'ml' ? 'ലോഗ് ഔട്ട്' : 'Logout'}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-ink custom-scrollbar">
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
                language={profile.preferredLanguage}
                onStartQuiz={() => setShowQuiz(true)}
                onBack={() => setCurrentModuleId(null)}
              />
            )}
          </main>
        </div>

        {/* Status Bar */}
        <footer className="bg-black border-t border-white/5 px-6 py-2 text-[10px] text-zinc-600 flex justify-between uppercase font-black tracking-[0.2em] shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              {profile.preferredLanguage === 'ml' ? 'സിസ്റ്റം തയ്യാറാണ്' : 'System Ready'}
            </span>
            <span className="text-zinc-800">|</span>
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
