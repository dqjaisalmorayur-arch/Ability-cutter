import React, { useState, useEffect } from 'react';
import { Module, Language, UserProfile } from '../types';
import { ChevronLeft, HelpCircle, CheckCircle2, XCircle, Volume2, RotateCcw, Loader2, ArrowRight } from 'lucide-react';
import { speakText, validateAnswer } from '../services/geminiService';
import { moduleService } from '../services/moduleService';

interface QuizViewProps {
  module: Module;
  language: Language;
  profile: UserProfile;
  onComplete: () => void;
  onBack: () => void;
}

export default function QuizView({ module, language, profile, onComplete, onBack }: QuizViewProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const question = module.quiz[currentQuestionIndex];
  const questionText = question.text[language] || question.text['en'] || '';
  const questionOptions = question.options[language] || question.options['en'] || [];
  const correctAnswer = questionOptions[question.correctIndex];

  useEffect(() => {
    setUserAnswer('');
    
    // Focus input after a short delay
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, language]);

  const saveResult = async (finalScore: number) => {
    setIsSaving(true);
    try {
      await moduleService.saveQuizResult({
        studentName: profile.fullName,
        studentEmail: profile.email,
        moduleTitle: module.title.en || 'Untitled Module',
        score: finalScore,
        total: module.quiz.length,
        timestamp: new Date().toISOString()
      });
      // Update user progress
      await moduleService.updateUserProgress(profile.uid, module.id, undefined, finalScore);
    } catch (err) {
      console.error('Error saving quiz result:', err);
    } finally {
      setIsSaving(false);
      setShowResult(true);
    }
  };

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim() || isValidating) return;

    setIsValidating(true);
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    // First try direct matching
    let correct = normalizedUserAnswer === normalizedCorrectAnswer;
    
    // If direct match fails, try smart validation with Gemini
    if (!correct) {
      correct = await validateAnswer(userAnswer, correctAnswer);
    }
    
    setIsValidating(false);
    setIsCorrect(correct);

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        if (currentQuestionIndex < module.quiz.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setUserAnswer('');
          setIsCorrect(null);
          setAttempts(0);
        } else {
          saveResult(newScore);
        }
      }, 1500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setTimeout(() => {
          if (currentQuestionIndex < module.quiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setUserAnswer('');
            setIsCorrect(null);
            setAttempts(0);
          } else {
            saveResult(score);
          }
        }, 3000);
      }
    }
  };

  if (isSaving) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4" role="status" aria-live="polite">
        <Loader2 className="w-12 h-12 animate-spin text-ability-blue" />
        <p className="text-zinc-400 font-bold uppercase tracking-widest animate-pulse">
          {language === 'ml' ? 'ഫലം രേഖപ്പെടുത്തുന്നു...' : 'Recording Results...'}
        </p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="text-center space-y-12 py-20 animate-in zoom-in duration-1000" role="alert">
        <div className="w-32 h-32 bg-ability-blue text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-20 h-20" />
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl font-serif font-bold text-ink tracking-tight">
            {language === 'ml' ? 'അഭിനന്ദനങ്ങൾ!' : 'MISSION COMPLETE'}
          </h2>
          <p className="text-2xl text-zinc-500 font-medium">
            {language === 'ml' ? 'നിങ്ങൾ ഈ വിഷയം വിജയകരമായി പൂർത്തിയാക്കി.' : 'You have mastered this module with precision.'}
          </p>
        </div>
        <button
          onClick={onComplete}
          className="bg-ink text-white font-bold px-16 py-6 rounded-3xl hover:bg-ability-blue transition-all text-2xl shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-ability-blue/20"
        >
          {language === 'ml' ? 'ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക' : 'Return to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-3 text-zinc-400 hover:text-ability-blue font-bold uppercase tracking-[0.2em] text-[10px] transition-all group focus:outline-none focus:ring-2 focus:ring-ability-blue rounded-lg p-2"
          aria-label={language === 'ml' ? 'തിരികെ പോവുക' : 'Go back'}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'ml' ? 'തിരികെ' : 'Exit Quiz'}</span>
        </button>
      </div>

      <div className="relative group">
        {/* Decorative Quiz Spine Effect */}
        <div className="absolute -left-4 top-10 bottom-10 w-8 bg-ability-blue/10 rounded-l-3xl blur-xl -z-10" aria-hidden="true" />
        
        <div className="relative bg-white rounded-[3rem] border border-black/5 overflow-hidden shadow-2xl transition-all duration-500 hover:border-ability-blue/20">
          <div className="p-12 md:p-24 space-y-16">
            <div className="space-y-8 border-b border-black/5 pb-12">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ability-blue/5 border border-ability-blue/10 text-ability-blue text-[10px] font-bold uppercase tracking-[0.3em]">
                  {language === 'ml' ? `ചോദ്യം ${currentQuestionIndex + 1}` : `Question ${currentQuestionIndex + 1}`} / {module.quiz.length}
                </div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Score: {score}
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-ink leading-[1.2]" id="quiz-question">
                {questionText}
              </h2>
            </div>

            <form onSubmit={handleCheck} className="space-y-12">
              <div className="space-y-6">
                <label 
                  htmlFor="user-answer" 
                  className="block text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]"
                >
                  {language === 'ml' ? 'നിങ്ങളുടെ ഉത്തരം ഇവിടെ ടൈപ്പ് ചെയ്യുക' : 'Type your answer here'}
                </label>
                <div className="relative group">
                  <input
                    id="user-answer"
                    ref={inputRef}
                    type="text"
                    autoFocus
                    autoComplete="off"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className={`w-full bg-paper border-2 rounded-[2rem] p-10 text-4xl font-bold text-ink focus:outline-none transition-all shadow-inner ${
                      isCorrect === true ? 'border-emerald-500 ring-8 ring-emerald-500/10' : 
                      isCorrect === false ? 'border-red-500 ring-8 ring-red-500/10' : 
                      'border-black/5 focus:border-ability-blue focus:ring-8 focus:ring-ability-blue/5'
                    }`}
                    placeholder={language === 'ml' ? 'ഉത്തരം...' : 'Answer...'}
                    aria-describedby="quiz-question"
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                    {isValidating && <Loader2 className="w-8 h-8 animate-spin text-ability-blue" />}
                    {isCorrect === true && <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-in zoom-in" />}
                    {isCorrect === false && <XCircle className="w-10 h-10 text-red-500 animate-in shake" />}
                  </div>
                </div>
              </div>

              <div className="pt-12 space-y-8">
                <button
                  type="submit"
                  disabled={!userAnswer.trim() || isValidating || isCorrect === true}
                  className="w-full bg-ink text-white font-bold py-10 rounded-[2.5rem] hover:bg-ability-blue disabled:opacity-20 disabled:cursor-not-allowed transition-all text-4xl shadow-2xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-ability-blue/20 flex items-center justify-center gap-6"
                  aria-label={language === 'ml' ? 'ഉത്തരം പരിശോധിക്കുക' : 'Submit Answer'}
                >
                  {language === 'ml' ? 'ഉത്തരം പരിശോധിക്കുക' : 'Submit Answer'}
                  <ArrowRight className="w-10 h-10" />
                </button>
                
                <div className="flex flex-col items-center gap-4" aria-hidden="true">
                  <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${attempts >= 2 ? 'bg-red-500' : 'bg-ability-blue'}`} 
                      style={{ width: `${(attempts / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                    {language === 'ml' 
                      ? `ശ്രമങ്ങൾ: ${attempts}/3` 
                      : `Attempt ${attempts} of 3`}
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
