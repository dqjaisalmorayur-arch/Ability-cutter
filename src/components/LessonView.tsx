import React, { useState } from 'react';
import { Module, Language } from '../types';
import { ChevronLeft, Play, Volume2, ArrowRight } from 'lucide-react';
import { speakText } from '../services/geminiService';

interface LessonViewProps {
  module: Module;
  language: Language;
  onStartQuiz: () => void;
  onBack: () => void;
}

export default function LessonView({ module, language, onStartQuiz, onBack }: LessonViewProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const lesson = module.lessons[currentLessonIndex];
  const lessonTitle = lesson.title[language] || lesson.title['en'] || '';
  const lessonContent = lesson.content[language] || lesson.content['en'] || '';

  const handleSpeak = () => {
    speakText(`${lessonTitle}. ${lessonContent}`, language);
  };

  React.useEffect(() => {
    handleSpeak();
  }, [currentLessonIndex, language]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-emerald-500 font-black uppercase tracking-widest transition-all group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>{language === 'ml' ? 'തിരികെ പോവുക' : 'Back to Desktop'}</span>
      </button>

      <div className="bg-stone-950 rounded-[2.5rem] border-2 border-stone-800 overflow-hidden shadow-2xl">
        <div className="p-10 md:p-16 space-y-12">
          <div className="flex items-start justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">
                {module.title[language] || module.title['en']}
              </div>
              <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">
                {lessonTitle}
              </h2>
            </div>
            <button
              onClick={handleSpeak}
              className="p-6 bg-stone-900 text-emerald-500 rounded-3xl border border-stone-800 hover:bg-emerald-500 hover:text-black transition-all duration-500 shadow-xl"
              aria-label={language === 'ml' ? 'വായിക്കുക' : 'Read Aloud'}
            >
              <Volume2 className="w-10 h-10" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
            <div className="prose prose-invert max-w-none">
              <p className="text-3xl text-white leading-relaxed font-bold">
                {lessonContent}
              </p>
            </div>
          </div>

          {lesson.videoUrl && (
            <div className="aspect-video bg-stone-900 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-stone-800 group cursor-pointer hover:border-emerald-500 transition-colors">
              <div className="w-20 h-20 bg-stone-950 rounded-full flex items-center justify-center text-stone-700 group-hover:text-emerald-500 transition-colors">
                <Play className="w-10 h-10 fill-current" />
              </div>
              <span className="mt-4 text-stone-600 font-black uppercase tracking-widest text-xs">Video Content Available</span>
            </div>
          )}

          <div className="pt-12 border-t border-stone-900 flex flex-col sm:flex-row gap-6">
            {currentLessonIndex < module.lessons.length - 1 ? (
              <button
                onClick={() => setCurrentLessonIndex(prev => prev + 1)}
                className="flex-1 bg-white text-black font-black py-6 rounded-3xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 text-2xl shadow-2xl active:scale-95"
              >
                <span>{language === 'ml' ? 'അടുത്ത പാഠം' : 'Next Lesson'}</span>
                <ArrowRight className="w-8 h-8" />
              </button>
            ) : (
              <button
                onClick={onStartQuiz}
                className="flex-1 bg-emerald-500 text-black font-black py-6 rounded-3xl hover:bg-white transition-all flex items-center justify-center gap-3 text-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] active:scale-95"
              >
                <span>{language === 'ml' ? 'പരീക്ഷ തുടങ്ങാം' : 'Start Final Quiz'}</span>
                <CheckCircle className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
