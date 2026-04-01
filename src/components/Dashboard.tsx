import React, { useState, useMemo, useEffect } from 'react';
import { Module, Language, ScreenReader, UserProgress } from '../types';
import { BookOpen, PlayCircle, Filter, Monitor, Globe, HelpCircle, ChevronRight, Star, Zap, Layout, Terminal, Cpu, Settings2, Headphones, Languages, LineChart } from 'lucide-react';
import { speakText } from '../services/geminiService';

interface DashboardProps {
  modules: Module[];
  userProgress: UserProgress[];
  language: Language;
  screenReader: ScreenReader;
  onSelectModule: (id: string) => void;
  onUpdateLanguage: (lang: Language) => void;
  onUpdateScreenReader: (sr: ScreenReader) => void;
}

const SCREEN_READERS: { id: ScreenReader; name: string }[] = [
  { id: 'nvda', name: 'NVDA' },
  { id: 'jaws', name: 'JAWS' },
  { id: 'narrator', name: 'Narrator' }
];

const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'te', name: 'తెలుగు' }
];

export default function Dashboard({ 
  modules,
  userProgress,
  language, 
  screenReader, 
  onSelectModule, 
  onUpdateLanguage, 
  onUpdateScreenReader 
}: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
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
    const filtered = modules.filter(m => {
      const catMatch = selectedCategory === 'All' || m.category === selectedCategory;
      const levelMatch = selectedLevel === 'All' || m.level === selectedLevel;
      const searchMatch = searchQuery === '' || 
        (m.title[language] || m.title.en).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description[language] || m.description.en).toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && levelMatch && searchMatch;
    });

    const orderKeywords = [
      'introduction', 'basic', 'desktop', 'taskbar', 'start', 'keyboard', 'typing', 'word', 'excel', 'powerpoint', 'internet'
    ];

    return filtered.sort((a, b) => {
      const aTitle = a.title.en.toLowerCase();
      const bTitle = b.title.en.toLowerCase();
      
      let aIndex = orderKeywords.findIndex(kw => aTitle.includes(kw));
      let bIndex = orderKeywords.findIndex(kw => bTitle.includes(kw));
      
      if (aIndex === -1) aIndex = 999;
      if (bIndex === -1) bIndex = 999;
      
      if (aIndex !== bIndex) return aIndex - bIndex;
      return aTitle.localeCompare(bTitle);
    });
  }, [modules, selectedCategory, selectedLevel, searchQuery, language]);

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

  const getModuleProgress = (moduleId: string) => {
    const progress = userProgress.find(p => p.moduleId === moduleId);
    if (!progress) return 0;
    
    const module = modules.find(m => m.id === moduleId);
    if (!module) return 0;
    
    const totalItems = module.lessons.length + 1; // Lessons + Quiz
    const completedItems = progress.completedLessons.length + (progress.quizCompleted ? 1 : 0);
    
    return Math.round((completedItems / totalItems) * 100);
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700" role="main">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden rounded-[2.5rem] bg-white border border-black/5 p-12 md:p-24 shadow-sm"
        aria-labelledby="hero-title"
      >
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-[32rem] h-[32rem] bg-ability-blue/5 blur-[140px] rounded-full animate-pulse" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-[32rem] h-[32rem] bg-blue-500/5 blur-[140px] rounded-full" aria-hidden="true" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-ability-blue/5 rounded-full border border-ability-blue/10">
              <Star className="w-4 h-4 text-ability-blue fill-ability-blue" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ability-blue">
                {language === 'ml' ? 'മികച്ച പഠനാനുഭവം' : 'Premium Learning Experience'}
              </span>
            </div>
            <h1 id="hero-title" className="text-4xl md:text-7xl font-sans font-bold tracking-tight text-ink leading-tight">
              {language === 'ml' ? 'പഠനം തുടങ്ങാം' : "Let's Start Learning"}
            </h1>
            <p className="text-zinc-500 text-xl md:text-3xl max-w-3xl font-medium leading-relaxed">
              {language === 'ml' 
                ? 'ഏറ്റവും മികച്ച രീതിയിൽ കമ്പ്യൂട്ടർ പഠിക്കൂ. ലളിതമായ പാഠങ്ങളും ക്വിസ്സുകളും നിങ്ങളെ സഹായിക്കും.' 
                : 'Master computer skills with ease. Simple lessons and interactive quizzes designed for everyone.'}
            </p>
          </div>
          <div className="hidden lg:flex w-1/3 aspect-square bg-ability-blue/5 rounded-[3rem] border border-ability-blue/10 items-center justify-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ability-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <BookOpen className="w-32 h-32 text-ability-blue/20 group-hover:text-ability-blue/40 transition-all duration-700 group-hover:scale-110" />
          </div>
        </div>
      </section>

      {/* Settings & Filters Toggle */}
      <nav className="flex flex-col lg:flex-row items-center justify-between gap-10" aria-label={language === 'ml' ? 'ക്രമീകരണങ്ങളും ഫിൽട്ടറുകളും' : 'Settings and Filters'}>
        <div className="flex flex-col md:flex-row items-center gap-8 w-full lg:w-auto">
          <div className="relative w-full md:w-[28rem] group">
            <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
              <Filter className="w-5 h-5 text-zinc-400 group-focus-within:text-ability-blue transition-colors" />
            </div>
            <input 
              type="text"
              aria-label={language === 'ml' ? 'പാഠങ്ങൾ തിരയുക' : 'Search modules'}
              placeholder={language === 'ml' ? 'പാഠങ്ങൾ തിരയുക...' : 'Search modules...'}
              className="w-full bg-white border border-black/5 rounded-3xl py-6 pl-16 pr-8 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-ability-blue/10 focus:border-ability-blue/30 transition-all placeholder:text-zinc-400 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="settings-panel"
            className={`flex items-center gap-4 px-12 py-6 rounded-3xl font-bold text-sm uppercase tracking-widest transition-all focus:outline-none focus:ring-4 focus:ring-ability-blue/20 shadow-sm w-full md:w-auto justify-center border ${
              showFilters ? 'bg-ability-blue text-white border-ability-blue scale-105' : 'bg-white text-zinc-500 border-black/5 hover:border-ability-blue/30'
            }`}
          >
            <Settings2 className="w-5 h-5" aria-hidden="true" />
            <span>{language === 'ml' ? 'ക്രമീകരണങ്ങൾ' : 'Settings'}</span>
          </button>
        </div>

        <div className="flex overflow-x-auto pb-2 gap-4 no-scrollbar w-full lg:w-auto justify-start lg:justify-end" role="group" aria-label={language === 'ml' ? 'ലെവൽ തിരഞ്ഞെടുക്കുക' : 'Select Level'}>
          {['All', 'basic', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              aria-pressed={selectedLevel === lvl}
              className={`flex-shrink-0 px-10 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-widest transition-all focus:outline-none focus:ring-4 focus:ring-ability-blue/10 border ${
                selectedLevel === lvl 
                  ? 'bg-ability-blue text-white border-ability-blue scale-105 shadow-xl shadow-ability-blue/20' 
                  : 'bg-white text-zinc-500 hover:text-ability-blue border-black/5'
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
          className="bg-white p-10 rounded-[2rem] border border-black/5 shadow-xl animate-in zoom-in-95 duration-300"
          role="region"
          aria-label={language === 'ml' ? 'ക്രമീകരണ പാനൽ' : 'Settings Panel'}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Screen Reader Filter */}
            <div className="space-y-4">
              <label id="sr-label" className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
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
                    className={`py-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus:ring-4 focus:ring-ability-blue/10 ${
                      screenReader === sr.id ? 'bg-ability-blue text-white' : 'bg-paper text-zinc-500 border border-black/5'
                    }`}
                  >
                    {sr.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="space-y-4">
              <label id="lang-label" className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
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
                    className={`py-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus:ring-4 focus:ring-ability-blue/10 ${
                      language === lang.code ? 'bg-ability-blue text-white' : 'bg-paper text-zinc-500 border border-black/5'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
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
            className={`flex-shrink-0 px-10 py-5 rounded-[2rem] font-bold text-sm transition-all flex items-center gap-4 focus:outline-none focus:ring-4 focus:ring-ability-blue/10 ${
              selectedCategory === cat 
                ? 'bg-ability-blue text-white scale-105 shadow-lg shadow-ability-blue/20' 
                : 'bg-white text-zinc-500 hover:bg-paper border border-black/5'
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
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto border border-black/5">
                <HelpCircle className="w-16 h-16 text-zinc-200" aria-hidden="true" />
              </div>
              <div className="space-y-4">
                <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-2xl">
                  {language === 'ml' ? 'മൊഡ്യൂളുകൾ ഒന്നും ലഭ്യമല്ല' : 'No modules found'}
                </p>
                <p className="text-zinc-500 text-lg max-w-md mx-auto">
                  {language === 'ml' 
                    ? 'ദയവായി പേജ് റിഫ്രഷ് ചെയ്യുക അല്ലെങ്കിൽ അഡ്മിൻ പാനൽ പരിശോധിക്കുക.' 
                    : 'Please refresh the page or check the Admin Panel.'}
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-12 py-4 bg-white text-zinc-500 rounded-2xl font-bold hover:text-ability-blue transition-all border border-black/5 focus:outline-none focus:ring-4 focus:ring-ability-blue/10"
              >
                {language === 'ml' ? 'പുതുക്കുക' : 'Refresh Page'}
              </button>
            </div>
          ) : (
            filteredModules.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className="group relative flex flex-col text-left transition-all hover:-translate-y-2 active:scale-95 focus:outline-none focus:ring-4 focus:ring-ability-blue/20 rounded-[2.5rem] bg-white border border-black/5 overflow-hidden hover:border-ability-blue/30 shadow-sm hover:shadow-xl"
                aria-label={`${m.title[language] || m.title.en}. ${m.description ? (m.description[language] || m.description.en) : ''}`}
              >
                {/* Content Section */}
                <div className="p-10 space-y-8 flex-1 flex flex-col bg-white">
                  <div className="space-y-6 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="p-4 bg-ability-blue/5 rounded-2xl text-ability-blue border border-ability-blue/10 group-hover:bg-ability-blue group-hover:text-white transition-all duration-500">
                        {getCategoryIcon(m.category)}
                      </div>
                      <span className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] border ${
                        m.level === 'basic' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-ability-blue/5 text-ability-blue border-ability-blue/10'
                      }`}>
                        {m.level}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-3xl font-sans font-bold text-ink leading-tight group-hover:text-ability-blue transition-colors">
                          {m.title[language] || m.title.en}
                        </h3>
                        {getModuleProgress(m.id) > 0 && (
                          <span className="flex-shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            {getModuleProgress(m.id)}%
                          </span>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      {getModuleProgress(m.id) > 0 && (
                        <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${getModuleProgress(m.id)}%` }}
                          />
                        </div>
                      )}

                      {m.description && (
                        <p className="text-zinc-500 text-lg font-medium leading-relaxed line-clamp-3">
                          {m.description[language] || m.description.en}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="pt-8 flex items-center justify-between border-t border-black/5">
                    <div className="flex items-center gap-8 text-zinc-400">
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5" aria-hidden="true" />
                        <span className="text-xs font-bold tracking-tight">{m.lessons.length} Lessons</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Star className="w-5 h-5" aria-hidden="true" />
                        <span className="text-xs font-bold tracking-tight">{m.quiz.length} Questions</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center group-hover:bg-ability-blue group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
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
        className="mt-32 p-12 md:p-24 bg-white rounded-[3rem] border border-black/5 space-y-16 relative overflow-hidden shadow-sm"
        aria-labelledby="about-title"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ability-blue to-transparent opacity-20" aria-hidden="true" />
        
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="flex-1 space-y-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-ability-blue/10 rounded-2xl flex items-center justify-center">
                <Star className="w-10 h-10 text-ability-blue" />
              </div>
              <div className="space-y-2">
                <span className="text-ability-blue font-bold text-xs uppercase tracking-[0.4em]">Organization</span>
                <h2 id="about-title" className="text-3xl md:text-4xl font-sans font-bold tracking-tight leading-tight">
                  {language === 'ml' ? 'ആക്സസിബിൾ ലേണിംഗിലൂടെ കാഴ്ചപരിമിതിയുള്ളവരെ ശാക്തീകരിക്കുന്നു' : 'Empowering Visually Impaired through Accessible Learning'}
                </h2>
              </div>
            </div>
            <p className="text-zinc-500 text-xl leading-relaxed font-medium">
              {language === 'ml' 
                ? 'കാഴ്ചപരിമിതിയുള്ളവർക്ക് കമ്പ്യൂട്ടർ പരിശീലനം നൽകി അവരെ സ്വയംപര്യാപ്തരാക്കാൻ ലക്ഷ്യമിടുന്ന പുളിക്കൽ എബിലിറ്റി ഫൗണ്ടേഷന്റെ പ്രത്യേക പഠന പ്ലാറ്റ്‌ഫോം.' 
                : 'Empowering the visually impaired through accessible computer education. Based in Pulikkal, Ability Foundation provides specialized training to foster self-reliance and professional growth.'}
            </p>
            
            {/* Benefits Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-sans font-bold text-ink">
                {language === 'ml' ? 'ഈ പ്ലാറ്റ്‌ഫോമിന്റെ ഗുണങ്ങൾ' : 'Benefits of this Platform'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { 
                    icon: <Headphones className="w-6 h-6 text-ability-blue mb-2" />,
                    en: 'Screen Reader Optimized', 
                    ml: 'സ്ക്രീൻ റീഡർ സൗഹൃദം',
                    desc: { en: 'Fully compatible with NVDA, JAWS, and Narrator.', ml: 'NVDA, JAWS, Narrator എന്നിവയുമായി പൂർണ്ണമായും പൊരുത്തപ്പെടുന്നു.' }
                  },
                  { 
                    icon: <BookOpen className="w-6 h-6 text-ability-blue mb-2" />,
                    en: 'Descriptive Content', 
                    ml: 'വിശദമായ പാഠങ്ങൾ',
                    desc: { en: 'Lessons designed to be easily visualized through audio.', ml: 'ശബ്ദത്തിലൂടെ എളുപ്പത്തിൽ മനസ്സിലാക്കാവുന്ന രീതിയിലുള്ള പാഠങ്ങൾ.' }
                  },
                  { 
                    icon: <Languages className="w-6 h-6 text-ability-blue mb-2" />,
                    en: 'Bilingual Support', 
                    ml: 'ദ്വിഭാഷാ പിന്തുണ',
                    desc: { en: 'Learn in both English and Malayalam seamlessly.', ml: 'ഇംഗ്ലീഷിലും മലയാളത്തിലും ഒരേപോലെ പഠിക്കാം.' }
                  },
                  { 
                    icon: <LineChart className="w-6 h-6 text-ability-blue mb-2" />,
                    en: 'Progress Tracking', 
                    ml: 'പഠന പുരോഗതി',
                    desc: { en: 'Monitor your learning journey with detailed stats.', ml: 'നിങ്ങളുടെ പഠന പുരോഗതി കൃത്യമായി മനസ്സിലാക്കാം.' }
                  }
                ].map((benefit, i) => (
                  <div key={i} className="p-6 bg-paper rounded-2xl border border-black/5 space-y-2 hover:shadow-md transition-shadow">
                    {benefit.icon}
                    <div className="text-ability-blue font-bold text-sm uppercase tracking-widest">{benefit[language]}</div>
                    <div className="text-zinc-500 text-xs leading-relaxed">{benefit.desc[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-paper rounded-3xl border border-black/5">
                <div className="text-ability-blue font-bold text-4xl mb-2">25+</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Years of Service</div>
              </div>
              <div className="p-8 bg-paper rounded-3xl border border-black/5">
                <div className="text-ability-blue font-bold text-4xl mb-2">1000+</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Students Empowered</div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-2/5 aspect-square rounded-[3rem] bg-ability-blue/5 border border-ability-blue/10 flex items-center justify-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ability-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Zap className="w-32 h-32 text-ability-blue/20 group-hover:text-ability-blue/40 transition-all duration-700 group-hover:scale-110" />
          </div>
        </div>
      </section>
    </div>
  );
}
