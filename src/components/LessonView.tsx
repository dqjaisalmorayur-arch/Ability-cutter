import React, { useState, useRef, useEffect } from 'react';
import { Module, Language } from '../types';
import { ChevronLeft, Play, Volume2, ArrowRight, Pause, Music, CheckCircle } from 'lucide-react';
import { speakText, stopSpeaking } from '../services/geminiService';

interface LessonViewProps {
  module: Module;
  language: Language;
  onStartQuiz: () => void;
  onBack: () => void;
}

export default function LessonView({ module, language, onStartQuiz, onBack }: LessonViewProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lesson = module.lessons[currentLessonIndex];
  const lessonTitle = lesson.title[language] || lesson.title['en'] || '';
  const lessonContent = lesson.content[language] || lesson.content['en'] || '';

  const handleSpeak = () => {
    speakText(`${lessonTitle}. ${lessonContent}`, language);
  };

  const toggleAudio = () => {
    if (!lesson.audioUrl) {
      handleSpeak();
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(lesson.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      stopSpeaking(); // Stop any TTS before playing audio file
      audioRef.current.src = lesson.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    // Stop any existing audio when lesson changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    stopSpeaking();

    // Automatically read title when lesson loads
    speakText(lessonTitle, language);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopSpeaking();
    };
  }, [currentLessonIndex, language]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700" role="main">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-coral font-black uppercase tracking-widest transition-all group focus:outline-none focus:ring-2 focus:ring-coral rounded-lg p-1"
          aria-label={language === 'ml' ? 'തിരികെ പോവുക' : 'Go back'}
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'ml' ? 'തിരികെ' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
          <span className="px-3 py-1 bg-ink-light rounded-full border border-white/5">
            {language === 'ml' ? 'പാഠം' : 'Lesson'} {currentLessonIndex + 1} / {module.lessons.length}
          </span>
        </div>
      </div>

      <div className="relative group">
        {/* Atmospheric Glow */}
        <div className="absolute -inset-4 bg-coral/5 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" aria-hidden="true" />
        
        <div className="relative bg-ink-light rounded-[2.5rem] border-2 border-white/5 overflow-hidden shadow-2xl transition-all duration-500 hover:border-coral/30">
          <article className="p-10 md:p-16 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 border border-coral/20 text-coral text-xs font-black uppercase tracking-[0.2em]">
                  {module.title[language] || module.title['en']}
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter" id="lesson-title">
                  {lessonTitle}
                </h2>
              </div>
            </header>

            <div className="relative">
              <div className="absolute -left-8 top-0 bottom-0 w-1.5 bg-gradient-to-b from-coral to-transparent rounded-full opacity-50" aria-hidden="true" />
              <div className="prose prose-invert max-w-none space-y-10">
                <p className="text-3xl md:text-4xl text-white leading-relaxed font-bold tracking-tight" aria-labelledby="lesson-title">
                  {lessonContent}
                </p>
                
                {/* Integrated Audio Player */}
                <div className="flex flex-wrap items-center gap-6 p-8 bg-black/40 backdrop-blur-sm rounded-[2rem] border border-white/5" role="toolbar" aria-label={language === 'ml' ? 'ഓഡിയോ നിയന്ത്രണങ്ങൾ' : 'Audio Controls'}>
                  <button
                    onClick={toggleAudio}
                    aria-pressed={isPlaying}
                    className={`flex items-center gap-4 px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-4 focus:ring-coral/50 shadow-xl active:scale-95 ${
                      isPlaying 
                        ? 'bg-coral text-ink ring-4 ring-coral/20' 
                        : 'bg-white/10 text-white hover:bg-coral hover:text-ink hover:shadow-coral/20'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" aria-hidden="true" /> : <Play className="w-8 h-8" aria-hidden="true" />}
                    <span className="text-xl">{isPlaying ? (language === 'ml' ? 'നിർത്തുക' : 'Stop') : (language === 'ml' ? 'കേൾക്കാം' : 'Listen')}</span>
                  </button>
                  
                  <button
                    onClick={handleSpeak}
                    className="flex items-center gap-4 px-10 py-5 bg-white/5 text-coral rounded-2xl font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-coral-dark transition-all focus:outline-none focus:ring-4 focus:ring-coral/50 shadow-xl active:scale-95"
                  >
                    <Volume2 className="w-8 h-8" aria-hidden="true" />
                    <span className="text-xl">{language === 'ml' ? 'വായിക്കുക' : 'Read Aloud'}</span>
                  </button>
                </div>
              </div>
            </div>

            {lesson.videoUrl && (
              <div 
                className="aspect-video bg-black rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-white/10 group cursor-pointer hover:border-coral transition-colors focus:outline-none focus:ring-4 focus:ring-coral"
                role="button"
                tabIndex={0}
                aria-label={language === 'ml' ? 'വീഡിയോ കാണുക' : 'Watch video'}
              >
                <div className="w-20 h-20 bg-ink-light rounded-full flex items-center justify-center text-zinc-700 group-hover:text-coral transition-colors">
                  <Play className="w-10 h-10 fill-current" aria-hidden="true" />
                </div>
                <span className="mt-4 text-zinc-600 font-black uppercase tracking-widest text-xs">Video Content Available</span>
              </div>
            )}

            <footer className="pt-12 border-t border-white/5 flex flex-col sm:flex-row gap-6">
              {currentLessonIndex < module.lessons.length - 1 ? (
                <button
                  onClick={() => setCurrentLessonIndex(prev => prev + 1)}
                  className="flex-1 bg-white text-ink font-black py-8 rounded-[2rem] hover:bg-coral transition-all flex items-center justify-center gap-4 text-3xl shadow-2xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-coral"
                >
                  <span>{language === 'ml' ? 'അടുത്ത പാഠം' : 'Next Lesson'}</span>
                  <ArrowRight className="w-10 h-10" aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={onStartQuiz}
                  className="flex-1 bg-coral text-ink font-black py-8 rounded-[2rem] hover:bg-white transition-all flex items-center justify-center gap-4 text-3xl shadow-[0_0_50px_rgba(255,107,107,0.3)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-coral"
                >
                  <span>{language === 'ml' ? 'പരീക്ഷ തുടങ്ങാം' : 'Start Final Quiz'}</span>
                  <CheckCircle className="w-10 h-10" aria-hidden="true" />
                </button>
              )}
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
