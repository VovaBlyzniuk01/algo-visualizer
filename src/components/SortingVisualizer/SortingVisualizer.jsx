import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { bubbleSort as bubbleSortAlgorithm } from "../../algorithms/bubbleSort";
import { quickSort as quickSortAlgorithm } from "../../algorithms/quickSort";
import { mergeSort as mergeSortAlgorithm } from "../../algorithms/mergeSort";
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, StepForward, StepBack } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 10];
const BASE_SORT_DELAY_MS = 500;

const SortingVisualizer = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
  const [selectedAlgo, setSelectedAlgo] = useState('bubble');
  const [array, setArray] = useState([]);
  const [isSorting, setIsSorting] = useState(false);
  const [comparing, setComparing] = useState([]);
  const [sorted, setSorted] = useState([]);
  const [activeLine, setActiveLine] = useState(null);
  
  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState('');

  // Playback states
  const framesRef = useRef([]);
  const currentFrameIndexRef = useRef(0);

  
  // Dashboard states
  const [comparisonsCount, setComparisonsCount] = useState(0);
  const [swapsCount, setSwapsCount] = useState(0);
  const initialArrayRef = useRef([]);

  // Easter Egg States
  const [isCrashed, setIsCrashed] = useState(false);
  const isCrashedRef = useRef(false);

  // Sync Logic flags
  const abortRef = useRef(false);
  
  // Pause Logic states
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const pauseResolver = useRef(null);
  const stepResolver = useRef(null);

  const [speedMultiplier, setSpeedMultiplierState] = useState(1);
  const speedRef = useRef(1);
  
  const audioCtxRef = useRef(null);

  const setSpeedMultiplier = (val) => {
    setSpeedMultiplierState(val);
    speedRef.current = val;
  };

  const togglePause = () => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    
    if (!next) {
      if (pauseResolver.current) {
        pauseResolver.current();
        pauseResolver.current = null;
      }
    }
  };

  const applyFrame = (frame) => {
      if (!frame) return;
      setArray([...frame.array]);
      setComparisonsCount(frame.comps);
      setSwapsCount(frame.swaps);
      setComparing([...frame.compElems]);
      setSorted([...frame.sortedElems]);
      setActiveLine(frame.line);
      if (frame.beep !== null) playBeep(frame.beep);
  };

  const stepForward = () => {
    if (isPausedRef.current && isSorting) {
      if (currentFrameIndexRef.current < framesRef.current.length - 1) {
         currentFrameIndexRef.current++;
         applyFrame(framesRef.current[currentFrameIndexRef.current]);
      }
    }
  };

  const stepBackward = () => {
    if (isPausedRef.current && isSorting) {
      if (currentFrameIndexRef.current > 0) {
         currentFrameIndexRef.current--;
         applyFrame(framesRef.current[currentFrameIndexRef.current]);
      }
    }
  };

  const waitPause = async () => {
    while (isPausedRef.current) {
      await new Promise((resolve) => { 
        pauseResolver.current = resolve; 
      });
      if (isPausedRef.current) break; 
    }
  };

  const playbackLoop = async () => {
      while (currentFrameIndexRef.current < framesRef.current.length) {
          if (abortRef.current) break;
          
          if (isPausedRef.current) {
             await waitPause();
          }
          if (abortRef.current) break;
          
          if (isCrashedRef.current) {
              break;
          }

          const frame = framesRef.current[currentFrameIndexRef.current];
          applyFrame(frame);

          const delayMult = frame.delayMult !== undefined ? frame.delayMult : 1;
          const delay = Math.max(8, BASE_SORT_DELAY_MS / speedRef.current) * delayMult;
          await new Promise(r => setTimeout(r, delay));

          if (!isPausedRef.current && !abortRef.current) { 
              currentFrameIndexRef.current++;
          }
      }
      if (!abortRef.current && currentFrameIndexRef.current >= framesRef.current.length) {
          setIsSorting(false);
          setIsPaused(false);
          isPausedRef.current = false;
      }
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isSorting) {
          togglePause();
        } else {
          handleStartSort();
        }
      }
      
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = SPEED_OPTIONS.indexOf(speedMultiplier);
        if (e.code === 'ArrowRight' && currentIndex < SPEED_OPTIONS.length - 1) {
          setSpeedMultiplier(SPEED_OPTIONS[currentIndex + 1]);
        } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
          setSpeedMultiplier(SPEED_OPTIONS[currentIndex - 1]);
        }
      }
      
      if ((e.code === 'ArrowUp' || e.code === 'Backspace') && isSorting && isPaused) {
        e.preventDefault();
        stepBackward();
      }
      if ((e.code === 'ArrowDown' || e.code === 'Enter') && isSorting && isPaused) {
        e.preventDefault();
        stepForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSorting, isPaused, speedMultiplier]);

  // Audio function for swapping
  const playBeep = (val) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + val * 6, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const generateNewArray = (isCustom = false, customArr = []) => {
    // Abort active sort cleanly
    abortRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    if (pauseResolver.current) pauseResolver.current();
    framesRef.current = [];
    currentFrameIndexRef.current = 0;
    
    let newArray = [];
    if (isCustom) {
      newArray = [...customArr];
    } else {
      const numBars = 15;
      for (let i = 0; i < numBars; i++) {
        newArray.push(Math.floor(Math.random() * 90) + 10);
      }
      setCustomInput('');
    }
    
    setArray([...newArray]);
    initialArrayRef.current = [...newArray];
    setComparing([]);
    setSorted([]);
    setActiveLine(null);
    setInputError('');
    setIsCrashed(false);
    isCrashedRef.current = false;
    setComparisonsCount(0);
    setSwapsCount(0);
    setIsSorting(false);
  };

  const handleApplyInput = () => {
    setInputError('');
    if (!customInput || customInput.trim() === '') {
        setInputError(t.errorEmpty);
        return;
    }

    const parts = customInput.split(',');
    if (parts.length > 20) {
        setInputError(t.errorLimit);
        return;
    }

    const newArr = [];
    for (let p of parts) {
        const val = parseInt(p.trim());
        if (isNaN(val)) {
            setInputError(t.errorInvalid);
            return;
        }
        newArr.push(val);
    }
    
    generateNewArray(true, newArr);
  };

  useEffect(() => {
    generateNewArray();
    return () => {
      abortRef.current = true;
    }
  }, []);

  const triggerCrash = () => {
    abortRef.current = true;
    isCrashedRef.current = true;
    setIsCrashed(true);
    setIsSorting(false);
    setIsPaused(false);
    isPausedRef.current = false;
    if (pauseResolver.current) pauseResolver.current();
    setComparing([]);
    setActiveLine(null);
  };

  const resetCrash = () => {
    setIsCrashed(false);
    isCrashedRef.current = false;
    abortRef.current = false;
    generateNewArray();
  };



  const handleStartSort = () => {
     try {
       if (!audioCtxRef.current) {
         const AudioContext = window.AudioContext || window.webkitAudioContext;
         if (AudioContext) audioCtxRef.current = new AudioContext();
       }
       if (audioCtxRef.current?.state === 'suspended') {
         audioCtxRef.current.resume();
       }
     } catch(e) {}
     
     if (sorted.length === array.length && array.length > 0) {
         setArray([...initialArrayRef.current]);
         setSorted([]);
         setComparisonsCount(0);
         setSwapsCount(0);
         setTimeout(() => startSortingAlgorithm(), 50);
     } else {
         startSortingAlgorithm();
     }
  };

  const cleanupSortExit = () => {
     setIsSorting(false);
     setIsPaused(false);
     isPausedRef.current = false;
  };

  const startSortingAlgorithm = async () => {
    if (isSorting || isCrashed) return;
    setIsSorting(true);
    setInputError('');
    abortRef.current = false;
    isCrashedRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;

    let curArr = [...array];
    let curComps = 0;
    let curSwaps = 0;
    let curCompElems = [];
    let curSortedElems = [];
    let curLine = null;
    let curBeep = null;
    let precalcFrames = [];
    let abortDummy = { current: false };

    const mockSetArray = (a) => { curArr = [...a]; };
    const mockSetComps = (c) => { curComps = c; };
    const mockSetSwaps = (s) => { curSwaps = s; };
    const mockSetComparing = (e) => { curCompElems = [...e]; };
    const mockSetSorted = (e) => { curSortedElems = [...e]; };
    const mockSetLine = (l) => { curLine = l; };
    const mockPlayBeep = (val) => { curBeep = val; };
    const mockSleep = async (delayMult) => {
        precalcFrames.push({
             array: [...curArr], 
             comps: curComps, 
             swaps: curSwaps,
             compElems: [...curCompElems], 
             sortedElems: [...curSortedElems], 
             line: curLine,
             beep: curBeep,
             delayMult: delayMult !== undefined ? delayMult : 1
        });
        curBeep = null;
    };

    let algoFn = bubbleSortAlgorithm;
    if (selectedAlgo === 'quick') algoFn = quickSortAlgorithm;
    if (selectedAlgo === 'merge') algoFn = mergeSortAlgorithm;

    await algoFn({
        array: curArr,
        setArray: mockSetArray,
        setComparisonsCount: mockSetComps,
        setSwapsCount: mockSetSwaps,
        setActiveElements: mockSetComparing,
        setSortedElements: mockSetSorted,
        setActiveLine: mockSetLine,
        sleep: mockSleep,
        getDelay: () => 1,
        abortRef: abortDummy,
        waitPause: async () => {},
        triggerCrash: () => {},
        playBeep: mockPlayBeep,
        cleanupSortExit: () => {},
        checkCrash: () => false
    });

    framesRef.current = precalcFrames;
    currentFrameIndexRef.current = 0;

    playbackLoop();
  };

  const maxVal = array.length > 0 ? Math.max(...array) : 1;

  const algoInfo = t[`${selectedAlgo}SortInfo`] || {
    descTitle: t.descTitle,
    descText: t.descText,
    pseudoTitle: t.pseudoTitle,
    complexity: t.complexity,
    codeLines: t.codeLines || []
  };


  return (
    <>
      <style>{`
        @keyframes falling {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(1000px) rotate(45deg); opacity: 0; }
        }
        .falling { 
          animation: falling 1s ease-in forwards; 
          position: relative;
        }
        
        @keyframes pulseRed {
          0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 40px rgba(239, 68, 68, 1); border-color: rgba(239, 68, 68, 1); }
        }
        .pulse-red-border { 
          animation: pulseRed 0.8s infinite alternate !important; 
          border-width: 2px !important;
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col items-center relative overflow-hidden"
      >
        <header className="relative w-full py-4 lg:py-6 bg-neutral-900 border-b border-blue-900/30 shadow-lg z-20 flex items-center justify-between px-4 lg:px-12">
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-blue-200 hover:text-white transition-colors duration-300"
            >
               <ChevronLeft size={24} />
               <span className="hidden md:inline font-semibold">Hub</span>
            </button>
          </div>

          <motion.h1 
             className={`flex-none text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider transition-colors text-center ${isCrashed ? 'text-red-500' : 'text-white'}`}
          >
             {t.sortTitle}
          </motion.h1>
          
          <div className="flex-1 flex justify-end">
            <div className="flex gap-1 bg-neutral-950/50 p-1 rounded-lg border border-blue-900/30 hidden sm:flex">
              <button onClick={() => setLanguage('ua')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'ua' ? 'bg-blue-600 shadow text-white' : 'text-blue-200 hover:bg-white/10'}`}>UA</button>
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'en' ? 'bg-blue-600 shadow text-white' : 'text-blue-200 hover:bg-white/10'}`}>EN</button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-start p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-4 lg:space-y-6 z-10">
          
          {/* Dashboard */}
          <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className={`w-full flex justify-between items-center p-4 rounded-xl border shadow-sm text-sm transition-colors ${isCrashed ? 'bg-red-900/10 border-red-500/20' : 'bg-neutral-900/30 border-blue-500/10'}`}
          >
             <div className="flex gap-4">
                <div className={`px-4 py-2 rounded-lg border flex flex-col items-center ${isCrashed ? 'bg-red-950 border-red-900' : 'bg-neutral-950 border-blue-500/10'}`}>
                   <span className={`text-[10px] uppercase font-bold tracking-wider ${isCrashed ? 'text-red-400' : 'text-blue-300/80'}`}>{t.comparisons}</span>
                   <span className="text-xl font-mono text-white mt-0.5">{comparisonsCount}</span>
                </div>
                <div className={`px-4 py-2 rounded-lg border flex flex-col items-center ${isCrashed ? 'bg-red-950 border-red-900' : 'bg-neutral-950 border-blue-500/10'}`}>
                   <span className={`text-[10px] uppercase font-bold tracking-wider ${isCrashed ? 'text-red-400' : 'text-blue-300/80'}`}>{t.swaps}</span>
                   <span className="text-xl font-mono text-emerald-400 mt-0.5">{swapsCount}</span>
                </div>
             </div>
             <div className="hidden md:block text-right">
                <span className={`text-xs ${isCrashed ? 'text-red-400' : 'text-blue-200/80'}`}>{algoInfo.descTitle}</span>
             </div>
          </motion.div>

          {/* Controls block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 rounded-2xl shadow-inner border transition-all ${isCrashed ? 'bg-red-950/20 border-red-500/30' : 'bg-neutral-900/40 border-blue-500/10'}`}
          >
            
            <div className="flex flex-col gap-2 w-full lg:w-3/5">
              <div className="flex flex-col sm:flex-row items-center gap-3">

                <select 
                  value={selectedAlgo} 
                  onChange={(e) => {
                    setSelectedAlgo(e.target.value);
                    if(!isSorting) generateNewArray();
                  }}
                  disabled={isSorting || isCrashed}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-neutral-950 border border-neutral-700 text-blue-200 text-sm font-semibold rounded-lg outline-none focus:border-blue-400 transition-all disabled:opacity-50"
                >
                  <option value="bubble">{t.algoBubbleSort || "Bubble Sort"}</option>
                  <option value="quick">{t.algoQuickSort || "Quick Sort"}</option>
                  <option value="merge">{t.algoMergeSort || "Merge Sort"}</option>
                </select>

                <button
                  onClick={() => generateNewArray(false)}
                  disabled={isCrashed}
                  className="w-full sm:w-auto shrink-0 px-5 py-2.5 bg-neutral-900 border-neutral-700 text-blue-300 text-sm font-semibold rounded-lg hover:bg-neutral-800 hover:text-blue-200 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.randomBtn}
                </button>

                <div className="w-full relative flex items-center">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    disabled={isCrashed}
                    placeholder={t.customInputPlaceholder}
                    className="w-full pl-4 pr-32 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-sm text-white placeholder-blue-300/40 disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyInput();
                    }}
                  />
                  <button
                    onClick={handleApplyInput}
                    disabled={isCrashed}
                    className="absolute right-1 top-1 bottom-1 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-md shadow hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.applyBtn}
                  </button>
                </div>
              </div>
              {inputError && <span className="text-red-400 text-xs px-1 font-medium select-none">{inputError}</span>}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-blue-900/30 lg:pl-6 relative">
              <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
                <label className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
                  {t.speed} <span className="text-white font-mono">{speedMultiplier}x</span>
                </label>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-center">
                  {SPEED_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSpeedMultiplier(option)}
                      disabled={isCrashed || isPaused}
                      className={`h-10 min-w-[3rem] px-3 text-base font-medium rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                        speedMultiplier === option
                          ? 'bg-blue-500/70 border-blue-300 text-white'
                          : 'bg-neutral-950/60 border-blue-700 text-blue-200 hover:bg-blue-800/70'
                      }`}
                    >
                      {option}x
                    </button>
                  ))}
                </div>
              </div>

              {!isCrashed ? (
                <>
                  {!isSorting ? (
                    <button
                      onClick={handleStartSort}
                      className="w-full sm:w-auto px-8 py-3 bg-blue-600 border-blue-500 text-white font-bold tracking-wide uppercase rounded-lg shadow hover:bg-blue-500 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {t.startBtn}
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={togglePause}
                        className={`flex-1 min-w-[9rem] sm:flex-none px-6 py-3 font-bold tracking-wide uppercase rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 ${isPaused ? 'bg-amber-400 text-blue-950 hover:bg-amber-300 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]' : 'bg-red-500/90 text-white hover:bg-red-400'}`}
                      >
                        {isPaused ? t.resumeBtn : t.pauseBtn}
                      </button>
                      
                      {isPaused && (
                        <div className="flex gap-2 shrink-0">
                            <button
                              onClick={stepBackward}
                              className="flex-none px-4 py-3 bg-blue-900/60 border border-blue-500/50 text-blue-300 flex items-center justify-center rounded-lg hover:bg-blue-800/80 transition-all shadow-inner"
                              title="Previous Step (Arrow Up or Backspace)"
                            >
                              <StepBack size={20} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={stepForward}
                              className="flex-none px-4 py-3 bg-blue-900/60 border border-blue-500/50 text-blue-300 flex items-center justify-center rounded-lg hover:bg-blue-800/80 transition-all shadow-inner"
                              title="Next Step (Arrow Down or Enter)"
                            >
                              <StepForward size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={resetCrash}
                  className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-bold tracking-wide uppercase rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:bg-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] transition-all duration-300"
                >
                  {t.resetBtn}
                </button>
              )}
               
               {/* Danger Button inside controls area */}
               {!isCrashed && (
                  <button 
                    onClick={triggerCrash}
                    className="hidden absolute -bottom-4 lg:-bottom-2 -right-4 lg:-right-0 xl:-right-10 px-2 py-1 bg-red-900 border border-red-500/50 text-[10px] text-red-200 font-bold rounded shadow-[0_0_10px_rgba(239,68,68,0.4)] hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,1)] transition-all"
                  >
                    {t.dangerBtn}
                  </button>
               )}
            </div>
          </motion.div>

          {/* Dual Panel Layout */}
          <div className="flex flex-col xl:flex-row gap-6 w-full items-stretch flex-1 min-h-[450px]">
            
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5 }}
               className={`flex-1 flex items-end justify-center h-[400px] xl:h-[500px] w-full rounded-2xl p-6 md:p-10 border shadow-2xl backdrop-blur-sm relative pt-16 transition-all ${isCrashed ? 'bg-red-950/20 border-red-500/20' : 'bg-neutral-900/50 border-blue-500/10'}`}
            >
              {array.map((value, idx) => {
                let bgColor = isCrashed ? "bg-red-900/50 border-red-800" : "bg-blue-200 border-blue-100";
                
                if (comparing.includes(idx) && !isCrashed) {
                  bgColor = "bg-yellow-400 border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.6)] z-10"; 
                } else if (sorted.includes(idx) && !isCrashed) {
                  bgColor = "bg-emerald-400 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"; 
                }

                const heightPercent = Math.max(5, (value / maxVal) * 90); 

                return (
                  <div
                    key={idx}
                    className={`${bgColor} border-t-2 mx-[2px] sm:mx-[4px] rounded-t-md flex-1 transition-all duration-150 relative flex justify-center group`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    <span className={`absolute -top-7 text-xs sm:text-sm font-bold font-mono transition-opacity ${isCrashed ? 'text-red-500' : comparing.includes(idx) ? 'text-yellow-400' : sorted.includes(idx) ? 'text-emerald-400' : 'text-blue-100'}`}>
                        {value}
                    </span>
                  </div>
                );
              })}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              onClick={isCrashed ? resetCrash : undefined}
              className={`w-full xl:w-[420px] rounded-2xl border shadow-2xl text-left overflow-hidden flex flex-col h-auto xl:h-[500px] transition-colors relative ${isCrashed ? 'pulse-red-border bg-[#1a0505] cursor-pointer' : 'bg-[#0d1527] border-blue-500/10'}`}
            >
               <div className={`p-4 border-b flex items-center justify-between gap-2 ${isCrashed ? 'bg-red-900/40 border-red-500/30' : 'bg-neutral-900/40 border-blue-900/30'}`}>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                   <h3 className={`font-semibold text-sm ml-2 ${isCrashed ? 'text-red-400' : 'text-white/90'}`}>{algoInfo.pseudoTitle}</h3>
                 </div>
                 <span className={`text-[11px] font-mono px-2 py-0.5 rounded border opacity-90 ${isCrashed ? 'bg-red-950 border-red-500/40 text-red-300' : 'bg-neutral-950 border-blue-700/50 text-blue-300'}`}>
                   {algoInfo.complexity}
                 </span>
               </div>
               
               <div className="relative p-4 flex-1 overflow-visible bg-black/20">
                 
                 {isCrashed && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-red-950/30">
                        <h2 className="text-center font-bold text-red-500 text-xl md:text-2xl px-6 leading-relaxed animate-pulse">
                            {t.crashMsg}
                        </h2>
                    </div>
                 )}

                 <pre className="font-mono text-[13px] md:text-[14px] leading-relaxed tracking-wide text-blue-300/80 relative z-0">
                   {algoInfo.codeLines.map((line, idx) => (
                     <div 
                       key={idx} 
                       className={`px-3 py-1.5 -mx-3 rounded-md transition-colors duration-[50ms] 
                         ${isCrashed ? 'falling' : ''} 
                         ${(activeLine === idx && !isCrashed) ? 'bg-yellow-500/20 text-yellow-300 font-bold border-l-[3px] border-yellow-400 shadow-inner' : 'border-l-[3px] border-transparent'}
                       `}
                       style={isCrashed ? { animationDelay: `${idx * 0.05}s` } : {}}
                     >
                        {line}
                     </div>
                   ))}
                 </pre>
               </div>
            </motion.div>

          </div>

        </main>
        
        <footer className={`py-6 text-sm w-full text-center transition-colors ${isCrashed ? 'bg-red-950/30 text-red-500/50' : 'bg-neutral-900/20 text-white/50 border-t border-blue-500/10'}`}>
          {t.footer}
        </footer>
      </motion.div>
    </>
  );
};

export default SortingVisualizer;
