import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { getNaiveSteps, getKMPSteps } from './algorithms/stringAlgorithms';

const ALGORITHMS = {
  naive: {
    en: 'Naive Search',
    ua: 'Простий пошук',
    fn: getNaiveSteps
  },
  kmp: {
    en: 'Knuth-Morris-Pratt',
    ua: 'Кнута-Морріса-Пратта',
    fn: getKMPSteps
  }
};

const StringVisualizer = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const labels = {
    en: { 
      back: 'Back to Hub', 
      title: 'String Algorithms', 
      text: 'Text', 
      pattern: 'Pattern', 
      algo: 'Algorithm', 
      speed: 'Speed',
      startBtn: 'Play',
      pauseBtn: 'Pause',
      resumeBtn: 'Resume',
      matches: 'Matches'
    },
    ua: { 
      back: 'На головну', 
      title: 'Рядкові алгоритми', 
      text: 'Текст', 
      pattern: 'Шаблон', 
      algo: 'Алгоритм', 
      speed: 'Швидкість',
      startBtn: 'Почати',
      pauseBtn: 'Пауза',
      resumeBtn: 'Продовжити',
      matches: 'Збіги'
    }
  };

  const [text, setText] = useState('ABABDABACDABABCABAB');
  const [pattern, setPattern] = useState('ABABCABAB');
  const [selectedAlgo, setSelectedAlgo] = useState('kmp');
  
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplierState] = useState(1);
  const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 10];
  const timerRef = useRef(null);

  const audioCtxRef = useRef(null);
  
  const initAudio = () => {
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
    }
  };

  const playTone = (freq, type = 'sine', duration = 0.1, vol = 0.1) => {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
  };

  useEffect(() => {
    generateSteps();
  }, [text, pattern, selectedAlgo]);

  // Play sounds when step changes
  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      if (step.type === 'compare') {
         if (step.match) playTone(600, 'triangle', 0.1, 0.05); 
         else playTone(200, 'sawtooth', 0.1, 0.05); 
      } else if (step.type === 'found') {
         playTone(800, 'sine', 0.3, 0.1); 
      }
    }
  }, [currentStepIndex, steps]);

  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 500 / speedMultiplier);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentStepIndex, steps, speedMultiplier]);

  const generateSteps = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    if (text && pattern) {
      const newSteps = ALGORITHMS[selectedAlgo].fn(text, pattern);
      setSteps(newSteps);
    } else {
      setSteps([]);
    }
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  };

  const stepBack = () => {
    setIsPlaying(false);
    if (currentStepIndex > -1) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const stepForward = () => {
    setIsPlaying(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        initAudio(); setIsPlaying(prev => !prev);
      }
      
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = SPEED_OPTIONS.indexOf(speedMultiplier);
        if (e.code === 'ArrowRight' && currentIndex < SPEED_OPTIONS.length - 1) {
          setSpeedMultiplierState(SPEED_OPTIONS[currentIndex + 1]);
        } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
          setSpeedMultiplierState(SPEED_OPTIONS[currentIndex - 1]);
        }
      }
      
      if ((e.code === 'ArrowDown' || e.code === 'Enter') && !isPlaying) {
        e.preventDefault();
        initAudio(); stepForward();
      }

      if (e.code === 'ArrowUp' && !isPlaying) {
        e.preventDefault();
        initAudio(); stepBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, speedMultiplier, currentStepIndex, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col items-center relative overflow-hidden"
    >
      <header className="relative w-full py-4 lg:py-6 bg-neutral-900 border-b border-rose-900/30 shadow-lg z-20 flex items-center justify-between px-4 lg:px-12">
        <div className="flex-1 flex justify-start">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-rose-300 hover:text-white transition-colors duration-300"
          >
             <ArrowLeft size={24} />
             <span className="hidden md:inline font-semibold">Hub</span>
          </button>
        </div>

        <motion.h1 
           className="flex-none text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider transition-colors text-center text-rose-500 drop-shadow-md"
        >
           {labels[language].title}
        </motion.h1>
        
        <div className="flex-1 flex justify-end"></div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col items-center justify-start p-4 lg:p-6 w-full max-w-7xl mx-auto space-y-4 z-10 overflow-hidden">
        
        <div className="w-full flex justify-between items-center p-4 rounded-xl border shadow-sm text-sm transition-colors bg-neutral-900/30 border-rose-500/10">
           <div className="flex gap-4">
              <div className="px-4 py-2 rounded-lg border flex flex-col items-center bg-neutral-950 border-rose-900/30">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300/80">КРОК</span>
                 <span className="text-xl font-mono text-white mt-0.5">{currentStepIndex >= 0 ? currentStepIndex + 1 : 0} / {steps.length}</span>
              </div>
              <div className="px-4 py-2 rounded-lg border flex flex-col items-center bg-neutral-950 border-rose-900/30">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300/80">{labels[language].matches}</span>
                 <span className="text-xl font-mono text-emerald-400 mt-0.5">
                   {steps.slice(0, currentStepIndex + 1).filter(s => s.type === 'found').length}
                 </span>
              </div>
           </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 rounded-2xl shadow-inner border transition-all bg-neutral-900/40 border-rose-500/20">
          
          <div className="flex flex-col gap-2 w-full lg:w-1/2">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="flex flex-col gap-1 w-full">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value.toUpperCase())}
                  placeholder={labels[language].text}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all text-sm text-rose-100 placeholder-neutral-600"
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value.toUpperCase())}
                  placeholder={labels[language].pattern}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all text-sm text-rose-100 placeholder-neutral-600"
                />
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <select
                  value={selectedAlgo}
                  onChange={(e) => setSelectedAlgo(e.target.value)}
                  className="px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all text-sm text-rose-100 cursor-pointer"
                >
                  {Object.entries(ALGORITHMS).map(([key, algo]) => (
                    <option key={key} value={key}>{algo[language]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-neutral-800 lg:pl-6 relative">
            <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
              <label className="text-xs text-rose-300 font-semibold uppercase tracking-wider">
                {labels[language].speed} <span className="text-white font-mono">{speedMultiplier}x</span>
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-center">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSpeedMultiplierState(option)}
                    className={`h-10 min-w-[3rem] px-3 text-base font-medium rounded-md border transition-all flex items-center justify-center ${
                      speedMultiplier === option
                        ? 'bg-rose-500/70 border-rose-300 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-rose-200 hover:bg-neutral-800'
                    }`}
                  >
                    {option}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { initAudio(); stepBack(); }}
                disabled={currentStepIndex <= -1 || isPlaying}
                className="flex-none px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-rose-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Step Back"
              >
                <SkipBack size={16} strokeWidth={2.5} />
              </button>
              {isPlaying ? (
                <button
                  onClick={() => (() => { initAudio(); setIsPlaying(!isPlaying); })()}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm font-bold transition-all flex items-center justify-center gap-2 bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                  title="Pause"
                >
                  <Pause size={16} fill="currentColor" /> {labels[language].pauseBtn || 'Пауза'}
                </button>
              ) : (
                <button
                  onClick={() => (() => { initAudio(); setIsPlaying(!isPlaying); })()}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm font-bold transition-all flex items-center justify-center gap-2 bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30"
                  title="Play"
                >
                  <Play size={16} fill="currentColor" /> {currentStepIndex > -1 ? (labels[language].resumeBtn || 'Продовжити') : (labels[language].startBtn || 'Почати')}
                </button>
              )}
              <button
                onClick={() => { initAudio(); stepForward(); }}
                disabled={currentStepIndex >= steps.length - 1 || isPlaying}
                className="flex-none px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-rose-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Step Forward (Arrow Down / Enter)"
              >
                <SkipForward size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={reset}
                className="flex-none px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm font-bold transition-all flex items-center justify-center gap-2"
                title="Reset"
              >
                <RotateCcw size={16} /> {labels[language].resetBtn || 'Скинути'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full bg-neutral-900/30 border border-neutral-800 rounded-xl p-4 lg:p-8 relative overflow-hidden flex flex-col justify-center">
          <div className="w-full overflow-x-auto overflow-y-hidden pb-8 custom-scrollbar">
            <div className="flex flex-col gap-12 w-max px-4">
              <div className="relative z-10">
                <div className="text-xs text-neutral-500 mb-2 uppercase tracking-widest">{labels[language].text}</div>
                <div className="flex gap-1 flex-nowrap">
                  {text.split('').map((char, idx) => {
                    let stateClass = 'bg-neutral-950 border-neutral-800 text-neutral-500';
                    let isMatchTarget = false;
                    
                    if (currentStep) {
                      if (currentStep.type === 'found' && idx >= currentStep.matchIndex && idx < currentStep.matchIndex + pattern.length) {
                        stateClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10 relative';
                      } 
                      else if (currentStep.type === 'compare' && idx === currentStep.textIndex) {
                        isMatchTarget = true;
                        if (currentStep.match) {
                          stateClass = 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] z-20 relative';
                        } else {
                          stateClass = 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] z-20 relative';
                        }
                      }
                      else if (currentStep.type === 'compare' && idx >= currentStep.windowStart && idx < currentStep.textIndex) {
                        stateClass = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
                      }
                    }

                    return (
                      <motion.div
                        key={`text-${idx}`}
                        layout
                        initial={false}
                        animate={{ 
                          scale: isMatchTarget ? 1.1 : 1,
                          y: isMatchTarget ? -4 : 0
                        }}
                        className={`w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center border rounded font-bold text-lg transition-colors duration-200 ${stateClass}`}
                      >
                        {char}
                        <div className="absolute -bottom-5 text-[10px] text-neutral-600">{idx}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="relative h-20">
                <div className="text-xs text-neutral-500 mb-2 uppercase tracking-widest">{labels[language].pattern}</div>
                
                <motion.div 
                  className="flex gap-1 flex-nowrap absolute"
                  initial={false}
                  animate={{ 
                    x: currentStep ? (currentStep.windowStart || currentStep.matchIndex || 0) * (window.innerWidth < 768 ? 44 : 52) : 0 
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {pattern.split('').map((char, idx) => {
                    let stateClass = 'bg-neutral-900 border-neutral-700 text-neutral-300';
                    let isTarget = false;

                    if (currentStep) {
                      if (currentStep.type === 'found') {
                        stateClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
                      }
                      else if (currentStep.type === 'compare') {
                        if (idx === currentStep.patternIndex) {
                          isTarget = true;
                          stateClass = currentStep.match 
                            ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg' 
                            : 'bg-red-500/20 border-red-500 text-red-400 shadow-lg';
                        } else if (idx < currentStep.patternIndex) {
                          stateClass = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
                        }
                      }
                    }

                    return (
                      <motion.div
                        key={`pat-${idx}`}
                        animate={{ 
                          scale: isTarget ? 1.1 : 1,
                          y: isTarget ? -4 : 0
                        }}
                        className={`w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center border border-dashed rounded font-bold text-lg transition-colors duration-200 ${stateClass}`}
                      >
                        {char}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default StringVisualizer;
