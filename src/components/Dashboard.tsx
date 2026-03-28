import React, { useState, useMemo, useEffect } from 'react';
import { Module, Language, ScreenReader } from '../types';
import { BookOpen, PlayCircle, Filter, Monitor, Globe, HelpCircle, ChevronRight, Star, Zap, Layout, Terminal, Cpu, Settings2 } from 'lucide-react';
import { speakText } from '../services/geminiService';

interface DashboardProps {
  modules: Module[];
  language: Language;
  screenReader: ScreenReader;
  onSelectModule: (id: string) => void;
  onUpdateLanguage: (lang: Language) => void;
  onUpdateScreenReader: (sr: ScreenReader) => void;
}

const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'te', name: 'Telugu' },
];

const SCREEN_READERS: { id: ScreenReader; name: string }[] = [
  { id: 'nvda', name: 'NVDA' },
  { id: 'jaws', name: 'JAWS' },
  { id: 'narrator', name: 'Narrator' },
];

export default function Dashboard({ 
  modules,
  language, 
  screenReader, 
  onSelectModule, 
  onUpdateLanguage, 
  onUpdateScreenReader 
}: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(modules.map(m => m.category));
    return ['All', ...Array.from(cats)];
  }, [modules]);

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const catMatch = selectedCategory === 'All' || m.category === selectedCategory;
      const levelMatch = selectedLevel === 'All' || m.level === selectedLevel;
      return catMatch && levelMatch;
    });
  }, [modules, selectedCategory, selectedLevel]);

  const welcomeMsg = language === 'ml' 
    ? 'എബിലിറ്റി ലേണിംഗിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ പാഠങ്ങൾ തിരഞ്ഞെടുക്കാം.' 
    : 'Welcome to Ability Learning. Select your lessons.';

  useEffect(() => {
    speakText(welcomeMsg, language);
  }, [language]);

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'internet': return <Globe className="w-5 h-5" />;
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'ms word basic':
      case 'ms word advanced': return <Layout className="w-5 h-5" />;
      case 'excel': return <Terminal className="w-5 h-5" />;
      case 'powerpoint': return <PlayCircle className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700" role="main">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden rounded-[3.5rem] bg-ink-light border border-white/5 p-10 md:p-20"
        aria-labelledby="hero-title"
      >
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-coral/10 blur-[120px] rounded-full animate-pulse" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" aria-hidden="true" />
        
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-coral/10 rounded-full border border-coral/20">
            <Star className="w-4 h-4 text-coral fill-coral" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-coral">
              {language === 'ml' ? 'മികച്ച പഠനാനുഭവം' : 'Premium Learning Experience'}
            </span>
          </div>
          <h1 id="hero-title" className="text-6xl md:text-9xl font-black tracking-tighter text-white leading-[0.85] uppercase">
            {language === 'ml' ? 'പഠനം തുടങ്ങാം' : "Let's Start Learning"}
          </h1>
          <p className="text-zinc-400 text-xl md:text-3xl max-w-3xl font-medium leading-tight tracking-tight">
            {language === 'ml' 
              ? 'ഏറ്റവും മികച്ച രീതിയിൽ കമ്പ്യൂട്ടർ പഠിക്കൂ. ലളിതമായ പാഠങ്ങളും ക്വിസ്സുകളും നിങ്ങളെ സഹായിക്കും.' 
              : 'Master computer skills with ease. Simple lessons and interactive quizzes designed for everyone.'}
          </p>
        </div>
      </section>

      {/* Settings & Filters Toggle */}
      <nav className="flex flex-wrap items-center justify-between gap-6" aria-label={language === 'ml' ? 'ക്രമീകരണങ്ങളും ഫിൽട്ടറുകളും' : 'Settings and Filters'}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="settings-panel"
            className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all focus:outline-none focus:ring-4 focus:ring-coral/50 shadow-2xl ${
              showFilters ? 'bg-coral text-ink scale-105' : 'bg-ink-light text-zinc-400 border border-white/5 hover:border-coral/50'
            }`}
          >
            <Settings2 className="w-5 h-5" aria-hidden="true" />
            <span>{language === 'ml' ? 'ക്രമീകരണങ്ങൾ' : 'Settings'}</span>
          </button>

          {isDesktop && (
            <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-black rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500" aria-live="polite">
              <div className="flex items-center gap-2">
                <span className="text-coral">Alt + N</span>
                <span>Next</span>
              </div>
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
              <div className="flex items-center gap-2">
                <span className="text-coral">Alt + R</span>
                <span>Repeat</span>
              </div>
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
              <div className="flex items-center gap-2">
                <span className="text-coral">Alt + H</span>
                <span>Home</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar max-w-full md:max-w-none" role="group" aria-label={language === 'ml' ? 'ലെവൽ തിരഞ്ഞെടുക്കുക' : 'Select Level'}>
          {['All', 'basic', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              aria-pressed={selectedLevel === lvl}
              className={`flex-shrink-0 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all focus:outline-none focus:ring-4 focus:ring-white/20 ${
                selectedLevel === lvl 
                  ? 'bg-white text-ink scale-105 shadow-2xl shadow-white/10' 
                  : 'bg-ink-light text-zinc-500 hover:text-white border border-white/5'
              }`}
            >
              {lvl === 'All' ? (language === 'ml' ? 'എല്ലാം' : 'All Levels') : lvl}
            </button>
          ))}
        </div>
      </nav>

      {/* Expandable Settings Panel */}
      {showFilters && (
        <div 
          id="settings-panel"
          className="bg-black p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300"
          role="region"
          aria-label={language === 'ml' ? 'ക്രമീകരണ പാനൽ' : 'Settings Panel'}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Screen Reader Filter */}
            <div className="space-y-4">
              <label id="sr-label" className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                <Monitor className="w-3 h-3" aria-hidden="true" />
                {language === 'ml' ? 'സ്ക്രീൻ റീഡർ' : 'Screen Reader'}
              </label>
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-labelledby="sr-label">
                {SCREEN_READERS.map((sr) => (
                  <button
                    key={sr.id}
                    onClick={() => onUpdateScreenReader(sr.id)}
                    role="radio"
                    aria-checked={screenReader === sr.id}
                    className={`py-4 rounded-xl font-black text-xs transition-all focus:outline-none focus:ring-4 focus:ring-coral/50 ${
                      screenReader === sr.id ? 'bg-coral text-ink' : 'bg-ink-light text-zinc-500 border border-white/5'
                    }`}
                  >
                    {sr.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="space-y-4">
              <label id="lang-label" className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                <Globe className="w-3 h-3" aria-hidden="true" />
                {language === 'ml' ? 'ഭാഷ' : 'Language'}
              </label>
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-labelledby="lang-label">
                {LANGUAGES.slice(0, 6).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onUpdateLanguage(lang.code)}
                    role="radio"
                    aria-checked={language === lang.code}
                    className={`py-4 rounded-xl font-black text-xs transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/50 ${
                      language === lang.code ? 'bg-blue-500 text-white' : 'bg-ink-light text-zinc-500 border border-white/5'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Test */}
            <div className="md:col-span-2 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  {language === 'ml' ? 'ഓഡിയോ പരിശോധന' : 'Audio Diagnostics'}
                </p>
                <p className="text-sm text-zinc-600 font-medium">
                  {language === 'ml' ? 'ശബ്ദം കേൾക്കുന്നുണ്ടോ എന്ന് പരിശോധിക്കാം.' : 'Test if the audio system is working correctly.'}
                </p>
              </div>
              <button
                onClick={() => speakText(language === 'ml' ? 'ഓഡിയോ സിസ്റ്റം ശരിയായി പ്രവർത്തിക്കുന്നു.' : 'The audio system is working correctly.', language)}
                className="w-full md:w-auto px-10 py-4 bg-ink-light text-coral rounded-2xl border border-white/5 hover:bg-coral hover:text-ink transition-all font-black text-xs uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-coral/50"
              >
                {language === 'ml' ? 'ശബ്ദം പരിശോധിക്കുക' : 'Test Audio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Horizontal Scroll */}
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar" role="tablist" aria-label={language === 'ml' ? 'വിഭാഗങ്ങൾ' : 'Categories'}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            role="tab"
            aria-selected={selectedCategory === cat}
            className={`flex-shrink-0 px-10 py-5 rounded-[2rem] font-black text-sm transition-all flex items-center gap-4 focus:outline-none focus:ring-4 focus:ring-coral/50 ${
              selectedCategory === cat 
                ? 'bg-coral text-ink scale-105 shadow-2xl shadow-coral/20' 
                : 'bg-ink-light text-zinc-400 hover:bg-zinc-900 border border-white/5'
            }`}
          >
            {cat === 'All' ? <Zap className="w-5 h-5" aria-hidden="true" /> : getCategoryIcon(cat)}
            <span>{cat === 'All' ? (language === 'ml' ? 'എല്ലാ പാഠങ്ങളും' : 'All Modules') : cat}</span>
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <section aria-label={language === 'ml' ? 'പാഠങ്ങൾ' : 'Learning Modules'}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredModules.length === 0 ? (
            <div className="col-span-full py-40 text-center space-y-8" role="status">
              <div className="w-32 h-32 bg-ink-light rounded-full flex items-center justify-center mx-auto border border-white/5">
                <HelpCircle className="w-16 h-16 text-zinc-800" aria-hidden="true" />
              </div>
              <div className="space-y-4">
                <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-2xl">
                  {language === 'ml' ? 'മൊഡ്യൂളുകൾ ഒന്നും ലഭ്യമല്ല' : 'No modules found'}
                </p>
                <p className="text-zinc-600 text-lg max-w-md mx-auto">
                  {language === 'ml' 
                    ? 'ദയവായി പേജ് റിഫ്രഷ് ചെയ്യുക അല്ലെങ്കിൽ അഡ്മിൻ പാനൽ പരിശോധിക്കുക.' 
                    : 'Please refresh the page or check the Admin Panel.'}
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-12 py-4 bg-white/5 text-zinc-400 rounded-2xl font-black hover:text-coral transition-all border border-white/5 focus:outline-none focus:ring-4 focus:ring-coral"
              >
                {language === 'ml' ? 'പുതുക്കുക' : 'Refresh Page'}
              </button>
            </div>
          ) : (
            filteredModules.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                onMouseEnter={() => speakText(m.title[language] || m.title['en'] || '', language)}
                className="group relative flex flex-col text-left transition-all hover:-translate-y-4 active:scale-95 focus:outline-none focus:ring-4 focus:ring-coral rounded-[3.5rem]"
                aria-label={`${m.title[language] || m.title.en}. ${m.description ? (m.description[language] || m.description.en) : ''}`}
              >
                <div className="absolute inset-0 bg-coral opacity-0 blur-[100px] group-hover:opacity-10 transition-opacity rounded-[3.5rem]" aria-hidden="true" />
                
                  <div className="relative flex-1 bg-ink-light border border-white/5 rounded-[3.5rem] p-12 space-y-10 overflow-hidden group-hover:border-coral/40 transition-all duration-500">
                    {m.imageUrl && (
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={m.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-700"
                          referrerPolicy="no-referrer"
                          aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" aria-hidden="true" />
                      </div>
                    )}
                    
                    <div className="relative z-10 space-y-10">
                      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-coral shadow-2xl transform group-hover:rotate-12 group-hover:bg-coral group-hover:text-ink transition-all duration-500" aria-hidden="true">
                        {getCategoryIcon(m.category)}
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <span className="px-4 py-1.5 bg-coral/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-coral border border-coral/20">
                            {m.level}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                            {m.category}
                          </span>
                        </div>
                        <h3 className="text-4xl font-black text-white leading-none group-hover:text-coral transition-colors uppercase tracking-tighter">
                          {m.title[language] || m.title.en}
                        </h3>
                        {m.description && (
                          <p className="text-zinc-500 text-lg font-medium leading-tight line-clamp-3 group-hover:text-zinc-300 transition-colors">
                            {m.description[language] || m.description.en}
                          </p>
                        )}
                      </div>

                      <div className="pt-8 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-8 text-zinc-600">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" aria-hidden="true" />
                            <span className="text-sm font-black">{m.lessons.length}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5" aria-hidden="true" />
                            <span className="text-sm font-black">{m.quiz.length}</span>
                          </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-coral group-hover:text-ink transition-all duration-500 shadow-xl">
                          <ChevronRight className="w-8 h-8" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* About Section */}
      <section 
        className="mt-32 p-12 md:p-24 bg-ink-light rounded-[4rem] border border-white/5 space-y-12 relative overflow-hidden"
        aria-labelledby="about-title"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-coral to-transparent opacity-20" aria-hidden="true" />
        
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="flex-1 space-y-10">
            <div className="space-y-4">
              <span className="text-coral font-black text-xs uppercase tracking-[0.4em]">Organization</span>
              <h2 id="about-title" className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                {language === 'ml' ? 'എബിലിറ്റി ഫൗണ്ടേഷൻ പുളിക്കൽ' : 'Ability Foundation Pulikkal'}
              </h2>
            </div>
            <p className="text-zinc-400 text-xl md:text-2xl leading-tight font-medium tracking-tight">
              {language === 'ml' 
                ? 'മലപ്പുറം ജില്ലയിലെ പുളിക്കൽ ആസ്ഥാനമായി പ്രവർത്തിക്കുന്ന എബിലിറ്റി ഫൗണ്ടേഷൻ, ഭിന്നശേഷിക്കാരുടെ ഉന്നമനത്തിനായി പ്രവർത്തിക്കുന്ന ഒരു പ്രമുഖ സംഘടനയാണ്. പ്രത്യേകിച്ച് കാഴ്ചാപരിമിതിയുള്ളവർക്കായി വിവിധ തൊഴിലധിഷ്ഠിത പരിശീലനങ്ങളും വിദ്യാഭ്യാസ പദ്ധതികളും ഇവർ നടപ്പിലാക്കുന്നു.' 
                : 'Based in Pulikkal, Malappuram, Ability Foundation is a leading organization working for the empowerment of people with disabilities. They implement various vocational training and educational programs, especially for the visually impaired.'}
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-black rounded-3xl border border-white/5">
                <div className="text-coral font-black text-4xl mb-2">25+</div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Years of Service</div>
              </div>
              <div className="p-8 bg-black rounded-3xl border border-white/5">
                <div className="text-blue-500 font-black text-4xl mb-2">1000+</div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Students Empowered</div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-2/5 aspect-[4/5] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative group">
            <img 
              src="https://picsum.photos/seed/ability/800/1000" 
              alt="Ability Foundation Campus" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-coral/10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-1000" aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  );
}
