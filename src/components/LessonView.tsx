import React, { useState, useRef, useEffect } from 'react';
import { Module, Language } from '../types';
import { ChevronLeft, Play, Volume2, ArrowRight, Pause, Music, CheckCircle, BrainCircuit, Loader2 } from 'lucide-react';
import { speakText, stopSpeaking, generateInteractiveExercise } from '../services/geminiService';
import { moduleService } from '../services/moduleService';

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

  const [exercise, setExercise] = useState<any>(null);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<number, string>>({});
  const [exerciseFeedback, setExerciseFeedback] = useState<string>('');

  const lesson = module.lessons[currentLessonIndex];

  useEffect(() => {
    // Mark current lesson as completed
    if (userId && module.id && lesson.id) {
      moduleService.updateUserProgress(userId, module.id, lesson.id);
    }
  }, [currentLessonIndex, module.id, lesson.id, userId]);

  const lessonTitle = lesson.title[language] || lesson.title['en'] || '';
  const lessonContent = lesson.content[language] || lesson.content['en'] || '';

  const handleGenerateExercise = async () => {
    setIsGeneratingExercise(true);
    setExercise(null);
    setExerciseAnswers({});
    setExerciseFeedback('');
    try {
      const generated = await generateInteractiveExercise(lessonContent, language);
      if (generated) {
        setExercise(generated);
      } else {
        setExerciseFeedback(language === 'ml' ? 'പരിശീലനം സൃഷ്ടിക്കാൻ കഴിഞ്ഞില്ല.' : 'Failed to generate exercise.');
      }
    } catch (error) {
      setExerciseFeedback(language === 'ml' ? 'ഒരു പിശക് സംഭവിച്ചു.' : 'An error occurred.');
    } finally {
      setIsGeneratingExercise(false);
    }
  };

  const checkExerciseAnswers = () => {
    if (!exercise) return;
    
    let correctCount = 0;
    if (exercise.type === 'fill-in-the-blanks') {
      exercise.items.forEach((item: any, index: number) => {
        if (exerciseAnswers[index] === item.answer) {
          correctCount++;
        }
      });
    } else if (exercise.type === 'matching-pairs') {
      exercise.items.forEach((item: any, index: number) => {
        if (exerciseAnswers[index] === item.right) {
          correctCount++;
        }
      });
    }

    if (correctCount === exercise.items.length) {
      setExerciseFeedback(language === 'ml' ? 'അഭിനന്ദനങ്ങൾ! എല്ലാ ഉത്തരങ്ങളും ശരിയാണ്.' : 'Congratulations! All answers are correct.');
    } else {
      setExerciseFeedback(language === 'ml' ? `${correctCount}/${exercise.items.length} ശരിയാണ്. വീണ്ടും ശ്രമിക്കുക.` : `${correctCount}/${exercise.items.length} correct. Try again.`);
    }
  };

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
    setExercise(null);
    setExerciseAnswers({});
    setExerciseFeedback('');

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
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-ink leading-[1.1]" id="lesson-title">
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

            {/* Interactive Exercise Section */}
            <div className="pt-12 border-t border-black/5">
              {!exercise && !isGeneratingExercise && (
                <button
                  onClick={handleGenerateExercise}
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-ability-blue/30 text-ability-blue font-bold flex items-center justify-center gap-3 hover:bg-ability-blue/5 transition-colors focus:outline-none focus:ring-4 focus:ring-ability-blue/20"
                  aria-label={language === 'ml' ? 'ഒരു പരിശീലനം സൃഷ്ടിക്കുക' : 'Generate an interactive exercise'}
                >
                  <BrainCircuit className="w-6 h-6" />
                  {language === 'ml' ? 'ഒരു പരിശീലനം സൃഷ്ടിക്കുക' : 'Generate Interactive Exercise'}
                </button>
              )}

              {isGeneratingExercise && (
                <div className="w-full py-12 flex flex-col items-center justify-center gap-4 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-ability-blue" />
                  <p className="font-medium">{language === 'ml' ? 'പരിശീലനം തയ്യാറാക്കുന്നു...' : 'Generating exercise...'}</p>
                </div>
              )}

              {exercise && (
                <div className="space-y-8 bg-paper p-8 rounded-[2rem] border border-black/5">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-ink">{exercise.question}</h3>
                    <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest">
                      {exercise.type === 'fill-in-the-blanks' 
                        ? (language === 'ml' ? 'വിട്ട ഭാഗം പൂരിപ്പിക്കുക' : 'Fill in the blanks') 
                        : (language === 'ml' ? 'ചേരുംപടി ചേർക്കുക' : 'Matching Pairs')}
                    </p>
                  </div>

                  {exercise.type === 'fill-in-the-blanks' && (
                    <div className="space-y-6">
                      {exercise.items.map((item: any, index: number) => {
                        const parts = item.text.split('___');
                        return (
                          <div key={index} className="space-y-3 p-6 bg-white rounded-2xl border border-black/5 shadow-sm">
                            <p className="text-lg font-medium text-zinc-700 leading-relaxed">
                              {parts[0]}
                              <select
                                value={exerciseAnswers[index] || ''}
                                onChange={(e) => setExerciseAnswers({ ...exerciseAnswers, [index]: e.target.value })}
                                className="mx-2 px-4 py-2 bg-paper border border-black/10 rounded-xl font-bold text-ability-blue focus:outline-none focus:ring-2 focus:ring-ability-blue"
                                aria-label={language === 'ml' ? 'ഉത്തരം തിരഞ്ഞെടുക്കുക' : 'Select answer'}
                              >
                                <option value="" disabled>---</option>
                                {item.options.map((opt: string, i: number) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                              {parts[1]}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {exercise.type === 'matching-pairs' && (
                    <div className="space-y-6">
                      {exercise.items.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-white rounded-2xl border border-black/5 shadow-sm">
                          <div className="flex-1 text-lg font-medium text-zinc-700 text-center sm:text-left">
                            {item.left}
                          </div>
                          <select
                            value={exerciseAnswers[index] || ''}
                            onChange={(e) => setExerciseAnswers({ ...exerciseAnswers, [index]: e.target.value })}
                            className="w-full sm:w-1/2 px-4 py-3 bg-paper border border-black/10 rounded-xl font-bold text-ability-blue focus:outline-none focus:ring-2 focus:ring-ability-blue"
                            aria-label={language === 'ml' ? 'ശരിയായ ജോഡി തിരഞ്ഞെടുക്കുക' : 'Select matching pair'}
                          >
                            <option value="" disabled>---</option>
                            {/* Shuffle options for matching pairs */}
                            {[...exercise.items].sort(() => Math.random() - 0.5).map((opt: any, i: number) => (
                              <option key={i} value={opt.right}>{opt.right}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5">
                    <button
                      onClick={checkExerciseAnswers}
                      className="w-full sm:w-auto px-8 py-4 bg-ability-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-colors focus:outline-none focus:ring-4 focus:ring-ability-blue/30"
                    >
                      {language === 'ml' ? 'ഉത്തരങ്ങൾ പരിശോധിക്കുക' : 'Check Answers'}
                    </button>
                    {exerciseFeedback && (
                      <p className={`font-bold ${exerciseFeedback.includes('Congratulations') || exerciseFeedback.includes('അഭിനന്ദനങ്ങൾ') ? 'text-emerald-600' : 'text-amber-600'}`} role="alert">
                        {exerciseFeedback}
                      </p>
                    )}
                  </div>
                </div>
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
