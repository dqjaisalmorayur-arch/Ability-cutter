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

  const getGradient = (idx: number) => {
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-emerald-500 to-teal-700',
      'from-orange-500 to-red-600',
      'from-purple-600 to-pink-700',
      'from-amber-500 to-orange-700',
      'from-cyan-500 to-blue-700'
    ];
    return gradients[idx % gradients.length];
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 p-8 md:p-16">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
              {language === 'ml' ? 'മികച്ച പഠനാനുഭവം' : 'Premium Learning Experience'}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
            {language === 'ml' ? 'പഠനം തുടങ്ങാം' : "Let's Start Learning"}
          </h1>
          <p className="text-stone-400 text-xl md:text-2xl max-w-2xl font-medium leading-relaxed">
            {language === 'ml' 
              ? 'ഏറ്റവും മികച്ച രീതിയിൽ കമ്പ്യൂട്ടർ പഠിക്കൂ. ലളിതമായ പാഠങ്ങളും ക്വിസ്സുകളും നിങ്ങളെ സഹായിക്കും.' 
              : 'Master computer skills with ease. Simple lessons and interactive quizzes designed for everyone.'}
          </p>
        </div>
      </div>

      {/* Settings & Filters Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              showFilters ? 'bg-emerald-500 text-black' : 'bg-stone-900 text-stone-400 border border-stone-800'
            }`}
          >
            <Settings2 className="w-5 h-5" />
            <span>{language === 'ml' ? 'ക്രമീകരണങ്ങൾ' : 'Settings'}</span>
          </button>
        </div>

        <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar max-w-full md:max-w-none">
          {['All', 'basic', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                selectedLevel === lvl 
                  ? 'bg-white text-black scale-105 shadow-xl shadow-white/10' 
                  : 'bg-stone-900 text-stone-500 hover:text-white border border-stone-800'
              }`}
            >
              {lvl === 'All' ? (language === 'ml' ? 'എല്ലാം' : 'All Levels') : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Settings Panel */}
      {showFilters && (
        <div className="bg-stone-950 p-8 rounded-[2.5rem] border border-stone-800 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Screen Reader Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">
                <Monitor className="w-3 h-3" />
                {language === 'ml' ? 'സ്ക്രീൻ റീഡർ' : 'Screen Reader'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SCREEN_READERS.map((sr) => (
                  <button
                    key={sr.id}
                    onClick={() => onUpdateScreenReader(sr.id)}
                    className={`py-3 rounded-xl font-black text-xs transition-all ${
                      screenReader === sr.id ? 'bg-emerald-500 text-black' : 'bg-stone-900 text-stone-500 border border-stone-800'
                    }`}
                  >
                    {sr.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black text-stone-400 uppercase tracking-[0.2em]">
                <Globe className="w-4 h-4" />
                {language === 'ml' ? 'ഭാഷ' : 'Language'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.slice(0, 6).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onUpdateLanguage(lang.code)}
                    className={`py-3 rounded-xl font-black text-[10px] transition-all ${
                      language === lang.code ? 'bg-blue-500 text-white' : 'bg-stone-900 text-stone-500 border border-stone-800'
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
      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-3 ${
              selectedCategory === cat 
                ? 'bg-emerald-500 text-black scale-105 shadow-2xl shadow-emerald-500/20' 
                : 'bg-stone-900 text-stone-400 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            {cat === 'All' ? <Zap className="w-5 h-5" /> : getCategoryIcon(cat)}
            <span>{cat === 'All' ? (language === 'ml' ? 'എല്ലാ പാഠങ്ങളും' : 'All Modules') : cat}</span>
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredModules.length === 0 ? (
          <div className="col-span-full py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center mx-auto border border-stone-800">
              <HelpCircle className="w-12 h-12 text-stone-700" />
            </div>
            <p className="text-stone-500 font-black uppercase tracking-widest text-xl">
              {language === 'ml' ? 'മൊഡ്യൂളുകൾ ഒന്നും ലഭ്യമല്ല' : 'No modules found'}
            </p>
          </div>
        ) : (
          filteredModules.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => onSelectModule(m.id)}
              onMouseEnter={() => speakText(m.title[language] || m.title['en'] || '', language)}
              className="group relative flex flex-col text-left transition-all hover:-translate-y-3 active:scale-95"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(idx)} opacity-10 blur-[80px] group-hover:opacity-30 transition-opacity rounded-[3rem]`} />
              
              <div className="relative flex-1 bg-stone-900/40 backdrop-blur-xl border border-stone-800 rounded-[3rem] p-10 space-y-8 overflow-hidden group-hover:border-emerald-500/40 transition-all duration-500">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getGradient(idx)} flex items-center justify-center text-white shadow-2xl transform group-hover:rotate-12 transition-transform duration-500`}>
                  {getCategoryIcon(m.category)}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/20">
                      {m.level}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                      {m.category}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">
                    {m.title[language] || m.title.en}
                  </h3>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-stone-800/50">
                  <div className="flex items-center gap-6 text-stone-500">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-sm font-bold">{m.lessons.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      <span className="text-sm font-bold">{m.quiz.length}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500 shadow-lg">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
