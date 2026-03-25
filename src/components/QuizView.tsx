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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [score, setScore] = useState(0);

  const question = module.quiz[currentQuestionIndex];
  const questionText = question.text[language] || question.text['en'] || '';
  const questionOptions = question.options[language] || question.options['en'] || [];

  useEffect(() => {
    const msg = language === 'ml' ? 'ചോദ്യം ശ്രദ്ധിക്കുക.' : 'Listen to the question.';
    speakText(`${msg} ${questionText}`, language);
  }, [currentQuestionIndex, language]);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    speakText(questionOptions[index], language);
  };

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

  const handleCheck = () => {
    if (selectedOption === null) return;

    const correct = selectedOption === question.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      const msg = language === 'ml' ? 'ശരിയായ ഉത്തരം! അഭിനന്ദനങ്ങൾ.' : 'Correct answer! Congratulations.';
      speakText(msg, language);
      setTimeout(() => {
        if (currentQuestionIndex < module.quiz.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedOption(null);
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
        const correctText = questionOptions[question.correctIndex];
        const msg = language === 'ml' 
          ? `ക്ഷമിക്കണം, മൂന്ന് തവണയും തെറ്റായി. ശരിയായ ഉത്തരം ${correctText} എന്നതാണ്.` 
          : `Sorry, three attempts failed. The correct answer is ${correctText}.`;
        speakText(msg, language);
        
        setTimeout(() => {
          if (currentQuestionIndex < module.quiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        <p className="text-stone-500 font-black uppercase tracking-widest animate-pulse">
          {language === 'ml' ? 'ഫലം രേഖപ്പെടുത്തുന്നു...' : 'Recording Results...'}
        </p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="text-center space-y-12 py-20 animate-in zoom-in duration-1000">
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
          className="bg-white text-black font-black px-16 py-6 rounded-3xl hover:bg-emerald-500 transition-all text-2xl shadow-2xl active:scale-95"
        >
          {language === 'ml' ? 'ഡാഷ്ബോർഡിലേക്ക് മടങ്ങുക' : 'Return to Command Center'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-emerald-500 font-black uppercase tracking-widest transition-all group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>{language === 'ml' ? 'തിരികെ പോവുക' : 'Abort Mission'}</span>
      </button>

      <div className="bg-stone-950 rounded-[2.5rem] border-2 border-stone-800 overflow-hidden shadow-2xl">
        <div className="p-10 md:p-16 space-y-12">
          <div className="flex items-start justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-[0.2em]">
                {language === 'ml' ? `ചോദ്യം ${currentQuestionIndex + 1}` : `Challenge ${currentQuestionIndex + 1}`}
              </div>
              <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
                {questionText}
              </h2>
            </div>
            <button
              onClick={() => speakText(questionText, language)}
              className="p-6 bg-stone-900 text-emerald-500 rounded-3xl border border-stone-800 hover:bg-emerald-500 hover:text-black transition-all duration-500 shadow-xl"
              aria-label={language === 'ml' ? 'ചോദ്യം വീണ്ടും കേൾക്കുക' : 'Repeat Challenge'}
            >
              <Volume2 className="w-10 h-10" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {questionOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`p-8 rounded-3xl border-4 text-left text-2xl font-black transition-all flex items-center justify-between group ${
                  selectedOption === index
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                    : 'border-stone-800 bg-stone-900 text-stone-200 hover:border-stone-600 hover:text-white'
                }`}
                aria-label={`${language === 'ml' ? 'ഓപ്ഷൻ' : 'Option'} ${index + 1}: ${option}`}
              >
                <span>{option}</span>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedOption === index ? 'border-emerald-500 bg-emerald-500' : 'border-stone-700'
                }`}>
                  {selectedOption === index && <div className="w-3 h-3 bg-black rounded-full" />}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-12 border-t border-stone-900 space-y-6">
            <button
              onClick={handleCheck}
              disabled={selectedOption === null}
              className="w-full bg-emerald-500 text-black font-black py-6 rounded-3xl hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] active:scale-95"
            >
              {language === 'ml' ? 'ഉത്തരം ശരിയാണോ എന്ന് നോക്കാം' : 'Verify Response'}
            </button>
            
            <div className="flex items-center justify-center gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
