import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { speakText, stopSpeaking } from '../services/geminiService';
import { Keyboard, Trophy, RotateCcw, Volume2, CheckCircle2, XCircle, Brain, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveGameProps {
  type: 'typing' | 'concept' | 'quiz';
  content: string;
  language: Language;
  onComplete: (score: number) => void;
}

export default function InteractiveGame({ type, content, language, onComplete }: InteractiveGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [score, setScore] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Game Data
  const typingTargets = ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'home', 'row'];
  const [targetChar, setTargetChar] = useState('');
  
  // Concept/Quiz Data
  const [quizQuestion, setQuizQuestion] = useState<{ q: string, a: boolean } | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<{ left: string, right: string }[]>([]);
  const [selectedPair, setSelectedPair] = useState<number | null>(null);

  useEffect(() => {
    if (gameState === 'intro') {
      const msg = language === 'ml' 
        ? 'പരിശീലനത്തിലേക്ക് സ്വാഗതം. തുടങ്ങാൻ എന്റർ അമർത്തുക.' 
        : 'Welcome to the interactive exercise. Press Enter to start.';
      speakText(msg, language);
    }
  }, [gameState, language]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCurrentStep(0);
    setFeedback(null);
    if (type === 'typing') {
      nextTypingStep();
    } else {
      nextConceptStep();
    }
  };

  const nextTypingStep = () => {
    const next = typingTargets[Math.floor(Math.random() * typingTargets.length)];
    setTargetChar(next);
    const msg = language === 'ml' 
      ? `${next} അമർത്തുക.` 
      : `Press the key ${next}.`;
    speakText(msg, language);
    setUserInput('');
  };

  const nextConceptStep = () => {
    // Simple True/False for concepts based on content
    const questions = [
      { q: language === 'ml' ? 'കീബോർഡ് ഒരു ഇൻപുട്ട് ഉപകരണമാണോ?' : 'Is the keyboard an input device?', a: true },
      { q: language === 'ml' ? 'സ്ക്രീൻ റീഡർ നമുക്ക് കാര്യങ്ങൾ വായിച്ചുതരുമോ?' : 'Does a screen reader read things for us?', a: true },
      { q: language === 'ml' ? 'മൗസ് ഉപയോഗിക്കാതെ കമ്പ്യൂട്ടർ പ്രവർത്തിപ്പിക്കാൻ കഴിയില്ലേ?' : 'Can we not use a computer without a mouse?', a: false },
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    setQuizQuestion(q);
    const msg = language === 'ml' 
      ? `${q.q}. ശരിയാണെങ്കിൽ വൈ (Y) അമർത്തുക, തെറ്റാണെങ്കിൽ എൻ (N) അമർത്തുക.` 
      : `${q.q}. Press Y for True, N for False.`;
    speakText(msg, language);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (gameState === 'intro' && e.key === 'Enter') {
      startGame();
      return;
    }

    if (gameState === 'playing') {
      if (type === 'typing') {
        const key = e.key.toLowerCase();
        if (key === targetChar.toLowerCase()) {
          handleCorrect();
          if (currentStep < 5) {
            setCurrentStep(s => s + 1);
            setTimeout(nextTypingStep, 1000);
          } else {
            finishGame();
          }
        } else {
          handleWrong();
        }
      } else {
        // Concept/Quiz: Y for True, N for False
        const key = e.key.toLowerCase();
        if (quizQuestion) {
          if ((key === 'y' && quizQuestion.a) || (key === 'n' && !quizQuestion.a)) {
            handleCorrect();
            if (currentStep < 3) {
              setCurrentStep(s => s + 1);
              setTimeout(nextConceptStep, 1500);
            } else {
              finishGame();
            }
          } else if (key === 'y' || key === 'n') {
            handleWrong();
          }
        }
      }
    }
  };

  const handleCorrect = () => {
    setScore(s => s + 10);
    setFeedback('correct');
    speakText(language === 'ml' ? 'ശരിയാണ്!' : 'Correct!', language);
  };

  const handleWrong = () => {
    setFeedback('wrong');
    speakText(language === 'ml' ? 'തെറ്റാണ്, വീണ്ടും ശ്രമിക്കൂ.' : 'Wrong, try again.', language);
  };

  const finishGame = () => {
    setGameState('finished');
    const msg = language === 'ml' 
      ? `അഭിനന്ദനങ്ങൾ! നിങ്ങൾ ${score} പോയിന്റുകൾ നേടി.` 
      : `Congratulations! You scored ${score} points.`;
    speakText(msg, language);
    onComplete(score);
  };

  return (
    <div 
      className="w-full bg-white rounded-[2.5rem] border border-black/5 shadow-2xl overflow-hidden min-h-[400px] flex flex-col"
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="application"
      aria-label={language === 'ml' ? 'ഇന്ററാക്ടീവ് ഗെയിം' : 'Interactive Game'}
    >
      <div className="bg-ability-blue/5 p-6 border-b border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-ability-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ability-blue">
            {type === 'typing' ? (language === 'ml' ? 'ടൈപ്പിംഗ് ചലഞ്ച്' : 'Typing Challenge') : (language === 'ml' ? 'നോളജ് ചലഞ്ച്' : 'Knowledge Challenge')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-1 bg-white rounded-full border border-black/5 text-[10px] font-bold text-zinc-400">
            SCORE: {score}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 bg-ability-blue/10 rounded-[2rem] flex items-center justify-center mx-auto">
                <Keyboard className="w-12 h-12 text-ability-blue" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-ink">
                  {language === 'ml' ? 'കളിച്ചു പഠിക്കാം!' : 'Let\'s Play and Learn!'}
                </h3>
                <p className="text-zinc-500 max-w-md mx-auto text-lg">
                  {language === 'ml' 
                    ? 'ഈ പാഠഭാഗത്തെ അടിസ്ഥാനമാക്കിയുള്ള ഒരു ചെറിയ ഗെയിം. തുടങ്ങാൻ എന്റർ അമർത്തുക.' 
                    : 'A small game based on this lesson. Press Enter to start.'}
                </p>
              </div>
              <button 
                onClick={startGame}
                className="px-12 py-4 bg-ability-blue text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl shadow-ability-blue/20"
              >
                {language === 'ml' ? 'തുടങ്ങാം' : 'Start Game'}
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12 w-full max-w-lg"
            >
              <div className="space-y-4">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
                  {language === 'ml' ? 'നിങ്ങളുടെ ടാസ്ക്' : 'Your Task'}
                </p>
                <div className="text-4xl font-bold text-ink leading-tight">
                  {type === 'typing' ? (
                    <span className="text-7xl animate-bounce inline-block">{targetChar.toUpperCase()}</span>
                  ) : (
                    quizQuestion?.q
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-4 h-8">
                {feedback === 'correct' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                    {language === 'ml' ? 'ശരി!' : 'Correct!'}
                  </motion.div>
                )}
                {feedback === 'wrong' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500 flex items-center gap-2 font-bold">
                    <XCircle className="w-6 h-6" />
                    {language === 'ml' ? 'തെറ്റ്!' : 'Wrong!'}
                  </motion.div>
                )}
              </div>

              <div className="p-8 bg-paper rounded-3xl border border-black/5 text-zinc-500 font-medium">
                {type === 'typing' ? (
                  language === 'ml' ? 'കീബോർഡിൽ ഈ അക്ഷരം അമർത്തുക.' : 'Press this key on your keyboard.'
                ) : (
                  <div className="flex justify-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                      <kbd className="px-4 py-2 bg-white border-2 border-black/10 rounded-xl text-xl font-bold text-ink shadow-sm">Y</kbd>
                      <span className="text-xs uppercase tracking-widest">{language === 'ml' ? 'ശരി' : 'True'}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <kbd className="px-4 py-2 bg-white border-2 border-black/10 rounded-xl text-xl font-bold text-ink shadow-sm">N</kbd>
                      <span className="text-xs uppercase tracking-widest">{language === 'ml' ? 'തെറ്റ്' : 'False'}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {gameState === 'finished' && (
            <motion.div 
              key="finished"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto">
                <Trophy className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-ink">
                  {language === 'ml' ? 'അതിശയകരം!' : 'Amazing Work!'}
                </h3>
                <p className="text-zinc-500 text-xl">
                  {language === 'ml' ? `നിങ്ങളുടെ സ്കോർ: ${score}` : `Your Final Score: ${score}`}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-white border border-black/5 text-zinc-500 rounded-2xl font-bold hover:text-ability-blue transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {language === 'ml' ? 'വീണ്ടും കളിക്കാം' : 'Play Again'}
                </button>
                <button 
                  onClick={() => onComplete(score)}
                  className="flex items-center gap-2 px-8 py-4 bg-ability-blue text-white rounded-2xl font-bold hover:opacity-90 transition-all"
                >
                  {language === 'ml' ? 'തുടരുക' : 'Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-paper border-t border-black/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2">
        <Volume2 className="w-3 h-3" />
        {language === 'ml' ? 'ശബ്ദ നിർദ്ദേശങ്ങൾ ശ്രദ്ധിക്കുക' : 'Listen to voice instructions'}
      </div>
    </div>
  );
}
