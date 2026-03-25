import React, { useState, useMemo } from 'react';
import { Module, Language, ScreenReader } from '../types';
import { BookOpen, PlayCircle, Filter, Monitor, Globe } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'basic' | 'internet' | 'office' | 'advanced'>('all');

  const filteredModules = useMemo(() => {
    if (selectedCategory === 'all') return modules;
    return modules.filter(m => m.category === selectedCategory);
  }, [selectedCategory, modules]);

  const welcomeMsg = language === 'ml' 
    ? 'എബിലിറ്റി ലേണിംഗിലേക്ക് സ്വാഗതം. ഒരു വിഷയം തിരഞ്ഞെടുക്കുക.' 
    : 'Welcome to Ability Learning. Please select a topic.';

  React.useEffect(() => {
    speakText(welcomeMsg, language);
  }, [language]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="space-y-4">
        <h2 className="text-5xl font-black tracking-tighter text-white">
          {language === 'ml' ? 'പഠനം തുടങ്ങാം' : "Let's Start Learning"}
        </h2>
        <p className="text-stone-500 text-xl font-medium max-w-2xl">
          {language === 'ml' ? 'താഴെ പറയുന്നവയിൽ നിന്ന് ഒന്ന് തിരഞ്ഞെടുക്കുക' : 'Select a specialized module designed for your learning journey.'}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-stone-950 p-8 rounded-[2rem] border border-stone-800 shadow-2xl space-y-8" role="search" aria-label={language === 'ml' ? 'ഫിൽട്ടറുകൾ' : 'Filters'}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Screen Reader Filter */}
          <div className="space-y-3">
            <label htmlFor="sr-select" className="flex items-center gap-2 text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">
              <Monitor className="w-3 h-3" />
              {language === 'ml' ? 'സ്ക്രീൻ റീഡർ' : 'Screen Reader'}
            </label>
            <select
              id="sr-select"
              value={screenReader}
              onChange={(e) => {
                const val = e.target.value as ScreenReader;
                onUpdateScreenReader(val);
                speakText(val.toUpperCase(), language);
              }}
              className="w-full bg-white text-black border-4 border-stone-200 rounded-2xl py-5 px-6 font-black text-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer appearance-none shadow-sm"
              aria-label={language === 'ml' ? 'സ്ക്രീൻ റീഡർ തിരഞ്ഞെടുക്കുക' : 'Select Screen Reader'}
            >
              {SCREEN_READERS.map((sr) => (
                <option key={sr.id} value={sr.id}>{sr.name}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="space-y-3">
            <label htmlFor="lang-select" className="flex items-center gap-2 text-xs font-black text-stone-400 uppercase tracking-[0.2em]">
              <Globe className="w-4 h-4" />
              {language === 'ml' ? 'ഭാഷ' : 'Language'}
            </label>
            <select
              id="lang-select"
              value={language}
              onChange={(e) => {
                const val = e.target.value as Language;
                onUpdateLanguage(val);
                const langName = LANGUAGES.find(l => l.code === val)?.name || val;
                speakText(langName, val);
              }}
              className="w-full bg-white text-black border-4 border-stone-200 rounded-2xl py-5 px-6 font-black text-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer appearance-none shadow-sm"
              aria-label={language === 'ml' ? 'ഭാഷ തിരഞ്ഞെടുക്കുക' : 'Select Language'}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <label htmlFor="cat-select" className="flex items-center gap-2 text-xs font-black text-stone-400 uppercase tracking-[0.2em]">
              <Filter className="w-4 h-4" />
              {language === 'ml' ? 'വിഭാഗം' : 'Category'}
            </label>
            <select
              id="cat-select"
              value={selectedCategory}
              onChange={(e) => {
                const val = e.target.value as any;
                setSelectedCategory(val);
                speakText(val, language);
              }}
              className="w-full bg-white text-black border-4 border-stone-200 rounded-2xl py-5 px-6 font-black text-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer appearance-none shadow-sm"
              aria-label={language === 'ml' ? 'വിഭാഗം തിരഞ്ഞെടുക്കുക' : 'Select Category'}
            >
              <option value="all">{language === 'ml' ? 'എല്ലാം' : 'All Categories'}</option>
              <option value="basic">{language === 'ml' ? 'അടിസ്ഥാനം' : 'Basic'}</option>
              <option value="internet">{language === 'ml' ? 'ഇന്റർനെറ്റ്' : 'Internet'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredModules.map((module) => (
          <button
            key={module.id}
            onClick={() => onSelectModule(module.id)}
            onMouseEnter={() => speakText(module.title[language] || module.title['en'] || '', language)}
            className="group relative bg-stone-950 p-10 rounded-[2.5rem] border-2 border-stone-800 hover:border-emerald-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-all text-left flex flex-col gap-6 active:scale-[0.98] overflow-hidden"
            aria-label={module.title[language]}
          >
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <BookOpen className="w-48 h-48" />
            </div>

            <div className="w-20 h-20 bg-stone-900 rounded-3xl flex items-center justify-center text-emerald-500 border border-stone-800 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
              <BookOpen className="w-10 h-10" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-white leading-tight group-hover:text-emerald-500 transition-colors">
                {module.title[language] || module.title['en']}
              </h3>
              <p className="text-stone-500 font-medium text-lg">
                {language === 'ml' ? 'ഈ പാഠഭാഗം പഠിക്കാൻ ഇവിടെ അമർത്തുക' : 'Start your classroom journey here.'}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3 text-emerald-500 font-black text-sm uppercase tracking-[0.2em]">
              <PlayCircle className="w-6 h-6" />
              <span>{language === 'ml' ? 'തുടങ്ങുക' : 'Enter Classroom'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
