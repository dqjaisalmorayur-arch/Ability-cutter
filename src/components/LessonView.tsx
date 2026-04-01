import React, { useState, useRef, useEffect } from 'react';
import { Module, Language } from '../types';
import { ChevronLeft, Play, Volume2, ArrowRight, Pause, Music, CheckCircle, BrainCircuit, Loader2, Gamepad2 } from 'lucide-react';
import { speakText, stopSpeaking, generateInteractiveExercise } from '../services/geminiService';
import { moduleService } from '../services/moduleService';
import InteractiveGame from './InteractiveGame';

interface LessonViewProps {
  module: Module;
  userId: string;
  language: Language;
  onStartQuiz: () => void;
  onBack: () => void;
}

export default function LessonView({ module, userId, language, onStartQuiz, onBack }: LessonViewProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showGame, setShowGame] = useState(false);
  const [gameType, setGameType] = useState<'typing' | 'concept' | 'quiz'>('concept');

  const lesson = module.lessons[currentLessonIndex];

  useEffect(() => {
    // Determine game type based on module title
    const title = (module.title.en || module.title.ml || '').toLowerCase();
    if (title.includes('keyboard') || title.includes('typing') || title.includes('keys')) {
      setGameType('typing');
    } else {
      setGameType('concept');
    }
  }, [module.id, module.title]);

  useEffect(() => {
    // Mark current lesson as completed
    if (userId && module.id && lesson?.id) {
      moduleService.updateUserProgress(userId, module.id, lesson.id);
    }
  }, [currentLessonIndex, module.id, lesson?.id, userId]);

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto">
          <BrainCircuit className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-ink">
            {language === 'ml' ? 'പാഠങ്ങൾ ലഭ്യമല്ല' : 'No Lessons Found'}
          </h2>
          <p className="text-zinc-500 text-lg">
            {language === 'ml' 
              ? 'ഈ മോഡ്യൂളിൽ പാഠങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല. അഡ്മിൻ പാനലിൽ പോയി പാഠങ്ങൾ ചേർക്കുക.' 
              : 'This module has no lessons yet. Please add lessons in the Admin Panel.'}
          </p>
        </div>
        <button onClick={onBack} className="px-8 py-3 bg-ability-blue text-white rounded-xl font-bold">
          {language === 'ml' ? 'തിരികെ പോവുക' : 'Go Back'}
        </button>
      </div>
    );
  }

  const lessonTitle = lesson.title[language] || lesson.title['en'] || '';
  const lessonContent = lesson.content[language] || lesson.content['en'] || '';

  const toggleAudio = () => {
    if (!lesson.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(lesson.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
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
    setShowGame(false);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentLessonIndex, language]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-8 duration-700" role="main">
      <div className="flex items-center justify-between px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-zinc-400 hover:text-ability-blue font-bold uppercase tracking-[0.2em] text-[10px] transition-all group focus:outline-none focus:ring-2 focus:ring-ability-blue rounded-lg p-2"
          aria-label={language === 'ml' ? 'തിരികെ പോവുക' : 'Go back'}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'ml' ? 'തിരികെ' : 'Back to Library'}</span>
        </button>

        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          <span className="px-5 py-2 bg-white rounded-full border border-black/5 shadow-sm">
            {language === 'ml' ? 'പാഠം' : 'Chapter'} {currentLessonIndex + 1} / {module.lessons.length}
          </span>
        </div>
      </div>

      <div className="relative group">
        {/* Decorative Book Spine Effect */}
        <div className="absolute -left-4 top-10 bottom-10 w-8 bg-ability-blue/10 rounded-l-3xl blur-xl -z-10" aria-hidden="true" />
        
        <div className="relative bg-white rounded-[3rem] border border-black/5 overflow-hidden shadow-2xl transition-all duration-500 hover:border-ability-blue/20">
          <article className="p-12 md:p-24 space-y-16">
            <header className="space-y-6 border-b border-black/5 pb-12">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ability-blue/5 border border-ability-blue/10 text-ability-blue text-[10px] font-bold uppercase tracking-[0.3em]">
                {module.title[language] || module.title['en']}
              </div>
              <h2 className="text-3xl md:text-5xl font-sans font-bold text-ink leading-[1.1]" id="lesson-title">
                {lessonTitle}
              </h2>
            </header>

            <div className="relative">
              <div className="prose prose-zinc max-w-none space-y-10">
                <div className="text-xl md:text-2xl text-zinc-600 leading-[1.6] font-medium space-y-8" aria-labelledby="lesson-title">
                  {lessonContent.split('\n').map((para, i) => (
                    para.trim() && <p key={i}>{para}</p>
                  ))}
                </div>
                
                {/* Integrated Audio Player */}
                {lesson.audioUrl && (
                  <div className="mt-12 p-8 bg-paper rounded-[2rem] border border-black/5 shadow-inner" role="toolbar" aria-label={language === 'ml' ? 'ഓഡിയോ നിയന്ത്രണങ്ങൾ' : 'Audio Controls'}>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <button
                        onClick={toggleAudio}
                        aria-pressed={isPlaying}
                        aria-label={isPlaying ? (language === 'ml' ? 'ഓഡിയോ നിർത്തുക' : 'Pause audio') : (language === 'ml' ? 'ഓഡിയോ പ്ലേ ചെയ്യുക' : 'Play audio')}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-ability-blue/30 shadow-xl active:scale-95 ${
                          isPlaying 
                            ? 'bg-ability-blue text-white' 
                            : 'bg-white text-ability-blue border border-black/5 hover:bg-ability-blue hover:text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-8 h-8" aria-hidden="true" /> : <Play className="w-8 h-8 ml-1" aria-hidden="true" />}
                      </button>
                      
                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          <span>{isPlaying ? (language === 'ml' ? 'പ്ലേ ചെയ്യുന്നു' : 'Playing Audio') : (language === 'ml' ? 'ഓഡിയോ ലഭ്യമാണ്' : 'Audio Available')}</span>
                          <span>{isPlaying ? 'Live' : 'Ready'}</span>
                        </div>
                        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-ability-blue transition-all duration-500 ${isPlaying ? 'animate-pulse w-full' : 'w-0'}`} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {lesson.videoUrl && (
              <div 
                className="aspect-video bg-paper rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-black/5 group cursor-pointer hover:border-ability-blue transition-all focus:outline-none focus:ring-4 focus:ring-ability-blue/20 shadow-inner overflow-hidden relative"
                role="button"
                tabIndex={0}
                aria-label={language === 'ml' ? 'വീഡിയോ കാണുക' : 'Watch video'}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-ability-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-zinc-200 group-hover:text-ability-blue transition-all shadow-xl group-hover:scale-110 relative z-10">
                  <Play className="w-10 h-10 fill-current ml-1" aria-hidden="true" />
                </div>
                <span className="mt-6 text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px] relative z-10">Watch Educational Video</span>
              </div>
            )}

            {/* Interactive Game Section */}
            <div className="pt-12 border-t border-black/5">
              {!showGame ? (
                <button
                  onClick={() => setShowGame(true)}
                  className="w-full py-10 rounded-[2rem] border-2 border-dashed border-ability-blue/30 text-ability-blue font-bold flex flex-col items-center justify-center gap-4 hover:bg-ability-blue/5 transition-all focus:outline-none focus:ring-4 focus:ring-ability-blue/20 group"
                  aria-label={language === 'ml' ? 'പരിശീലന ഗെയിം തുടങ്ങുക' : 'Start interactive practice game'}
                >
                  <div className="w-16 h-16 bg-ability-blue/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xl">{language === 'ml' ? 'പരിശീലന ഗെയിം തുടങ്ങാം' : 'Start Practice Game'}</span>
                    <p className="text-[10px] uppercase tracking-widest opacity-60">
                      {gameType === 'typing' ? (language === 'ml' ? 'ടൈപ്പിംഗ് പരിശീലനം' : 'Keyboard Practice') : (language === 'ml' ? 'വിവരങ്ങൾ ഉറപ്പിക്കാം' : 'Reinforce Knowledge')}
                    </p>
                  </div>
                </button>
              ) : (
                <InteractiveGame 
                  type={gameType}
                  content={lessonContent}
                  language={language}
                  onComplete={(score) => {
                    // Handle game completion if needed
                  }}
                />
              )}
            </div>

            <footer className="pt-16 border-t border-black/5 flex flex-col sm:flex-row gap-8">
              {currentLessonIndex < module.lessons.length - 1 ? (
                <button
                  onClick={() => setCurrentLessonIndex(prev => prev + 1)}
                  className="flex-1 bg-white text-ink font-bold py-10 rounded-[2.5rem] border border-black/5 hover:bg-ability-blue hover:text-white transition-all flex items-center justify-center gap-6 text-4xl shadow-sm hover:shadow-2xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-ability-blue/20 group"
                >
                  <span>{language === 'ml' ? 'അടുത്ത പാഠം' : 'Next Chapter'}</span>
                  <ArrowRight className="w-12 h-12 group-hover:translate-x-2 transition-transform" aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={onStartQuiz}
                  className="flex-1 bg-ability-blue text-white font-bold py-10 rounded-[2.5rem] hover:opacity-95 transition-all flex items-center justify-center gap-6 text-4xl shadow-2xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-ability-blue/30"
                >
                  <span>{language === 'ml' ? 'പരീക്ഷ തുടങ്ങാം' : 'Take Final Quiz'}</span>
                  <CheckCircle className="w-12 h-12" aria-hidden="true" />
                </button>
              )}
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}

