import React, { useState, useEffect } from 'react';
import { Module, Language, UserProfile } from '../types';
import { ChevronLeft, HelpCircle, CheckCircle2, XCircle, Volume2, RotateCcw, Loader2 } from 'lucide-react';
import { speakText } from '../services/geminiService';
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
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const question = module.quiz[currentQuestionIndex];
  const questionText = question.text[language] || question.text['en'] || '';
  const questionOptions = question.options[language] || question.options['en'] || [];
  const correctAnswer = questionOptions[question.correctIndex];

  useEffect(() => {
    const msg = language === 'ml' 
      ? 'ചോദ്യം ശ്രദ്ധിക്കുക. ഉത്തരം ടൈപ്പ് ചെയ്യുക. ചോദ്യം വീണ്ടും കേൾക്കാൻ ആൾട്ട് പ്ലസ് ആർ അമർത്തുക.' 
      : 'Listen to the question. Type your answer. Press Alt plus R to repeat the question.';
    speakText(`${msg} ${questionText}`, language);
    setUserAnswer('');
    
    // Focus input after a short delay to allow screen reader to start
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 1000);
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
    } catch (err) {
      console.error('Error saving quiz result:', err);
    } finally {
      setIsSaving(false);
      setShowResult(true);
    }
  };

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim()) return;

    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    // Simple matching logic
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsCorrect(correct);

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      const msg = language === 'ml' ? 'ശരിയായ ഉത്തരം! അഭിനന്ദനങ്ങൾ.' : 'Correct answer! Congratulations.';
      speakText(msg, language);
      setTimeout(() => {
        if (currentQuestionIndex < module.quiz.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setUserAnswer('');
          setIsCorrect(null);
          setAttempts(0);
        } else {
          saveResult(newScore);
        }
      }, 2000);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        const msg = language === 'ml' 
          ? `ക്ഷമിക്കണം, മൂന്ന് തവണയും തെറ്റായി. ശരിയായ ഉത്തരം ${correctAnswer} എന്നതാണ്.` 
          : `Sorry, three attempts failed. The correct answer is ${correctAnswer}.`;
        speakText(msg, language);
        
        setTimeout(() => {
          if (currentQuestionIndex < module.quiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setUserAnswer('');
            setIsCorrect(null);
            setAttempts(0);
          } else {
            saveResult(score);
          }
        }, 5000);
      } else {
        const msg = language === 'ml' 
          ? `തെറ്റായ ഉത്തരം. നിങ്ങൾക്ക് ${3 - newAttempts} അവസരങ്ങൾ കൂടി ബാക്കിയുണ്ട്. വീണ്ടും ശ്രമിക്കുക.` 
          : `Wrong answer. You have ${3 - newAttempts} more attempts. Try again.`;
        speakText(msg, language);
      }
    }
  };

  if (isSaving) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4" role="status" aria-live="polite">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        <p className="text-stone-500 font-black uppercase tracking-widest animate-pulse">
          {language === 'ml' ? 'ഫലം രേഖപ്പെടുത്തുന്നു...' : 'Recording Results...'}
        </p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="text-center space-y-12 py-20 animate-in zoom-in duration-1000" role="alert">
        <div className="w-32 h-32 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.4)]">
          <CheckCircle2 className="w-20 h-20" />
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl font-black text-white tracking-tighter">
            {language === 'ml' ? 'അഭിനന്ദനങ്ങൾ!' : 'MISSION COMPLETE'}
          </h2>
          <p className="text-2xl text-stone-500 font-medium">
            {language === 'ml' ? 'നിങ്ങൾ ഈ വിഷയം വിജയകരമായി പൂർത്തിയാക്കി.' : 'You have mastered this module with precision.'}
          </p>
        </div>
        <button
          onClick={onComplete}
          className="bg-white text-black font-black px-16 py-6 rounded-3xl hover:bg-emerald-500 transition-all text-2xl shadow-2xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500"
        >
          {language === 'ml' ? 'ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക' : 'Return to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-emerald-500 font-black uppercase tracking-widest transition-all group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
        aria-label={language === 'ml' ? 'തിരികെ പോവുക (Alt + B)' : 'Go back (Alt + B)'}
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>{language === 'ml' ? 'തിരികെ' : 'Back'}</span>
      </button>

      <div className="bg-stone-950 rounded-[2.5rem] border-2 border-stone-800 overflow-hidden shadow-2xl transition-all duration-500 hover:border-emerald-500/30">
        <div className="p-10 md:p-16 space-y-12">
          <div className="flex items-start justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">
                {language === 'ml' ? `ചോദ്യം ${currentQuestionIndex + 1}` : `Question ${currentQuestionIndex + 1}`} / {module.quiz.length}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight" id="quiz-question">
                {questionText}
              </h2>
            </div>
            <button
              onClick={() => speakText(questionText, language)}
              className="p-8 bg-stone-900 text-emerald-500 rounded-[2rem] border border-stone-800 hover:bg-emerald-500 hover:text-black transition-all duration-500 shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500 active:scale-95"
              aria-label={language === 'ml' ? 'ചോദ്യം വീണ്ടും കേൾക്കുക (Alt + R)' : 'Repeat Question (Alt + R)'}
            >
              <Volume2 className="w-12 h-12" />
            </button>
          </div>

          <form onSubmit={handleCheck} className="space-y-8">
            <div className="space-y-4">
              <label 
                htmlFor="user-answer" 
                className="block text-stone-500 font-black uppercase tracking-widest text-sm"
              >
                {language === 'ml' ? 'നിങ്ങളുടെ ഉത്തരം ഇവിടെ ടൈപ്പ് ചെയ്യുക' : 'Type your answer here'}
              </label>
              <input
                id="user-answer"
                ref={inputRef}
                type="text"
                autoFocus
                autoComplete="off"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className={`w-full bg-stone-900 border-4 rounded-3xl p-8 text-3xl font-black text-white focus:outline-none transition-all ${
                  isCorrect === true ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 
                  isCorrect === false ? 'border-red-500 ring-4 ring-red-500/20' : 
                  'border-stone-800 focus:border-emerald-500'
                }`}
                placeholder={language === 'ml' ? 'ഉത്തരം...' : 'Answer...'}
                aria-describedby="quiz-question"
              />
            </div>

            <div className="pt-8 border-t border-stone-900 space-y-6">
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className="w-full bg-emerald-500 text-black font-black py-8 rounded-[2rem] hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-3xl shadow-[0_0_50px_rgba(16,185,129,0.3)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500"
                aria-label={language === 'ml' ? 'ഉത്തരം പരിശോധിക്കുക (Alt + N)' : 'Submit Answer (Alt + N)'}
              >
                {language === 'ml' ? 'ഉത്തരം പരിശോധിക്കുക' : 'Submit Answer'}
              </button>
              
              <div className="flex items-center justify-center gap-4" aria-hidden="true">
                <div className="h-1 flex-1 bg-stone-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${(attempts / 3) * 100}%` }}
                  />
                </div>
                <p className="text-stone-600 font-black uppercase tracking-widest text-xs">
                  {language === 'ml' 
                    ? `ശ്രമങ്ങൾ: ${attempts}/3` 
                    : `Attempts: ${attempts}/3`}
                </p>
              </div>
              <p className="sr-only">
                {language === 'ml' 
                  ? `നിങ്ങൾ ${attempts} തവണ ശ്രമിച്ചു. 3 തവണ വരെ ശ്രമിക്കാം.` 
                  : `You have used ${attempts} out of 3 attempts.`}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
