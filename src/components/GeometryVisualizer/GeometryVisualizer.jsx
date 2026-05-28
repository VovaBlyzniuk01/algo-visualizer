import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, StepForward } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const BASE_DELAY_MS = 600;
const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 10];

const GeometryVisualizer = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
  const [points, setPoints] = useState([]);
  const [hull, setHull] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeLine, setActiveLine] = useState(null);
  
  // Animation states
  const [currentPoint, setCurrentPoint] = useState(null);
  const [evaluatingLine, setEvaluatingLine] = useState(null); // {p1, p2, type: 'valid' | 'invalid' | 'checking'}
  const [p0Point, setP0Point] = useState(null);
  const [sortingLines, setSortingLines] = useState([]); // lines radiating from P0
  const [rejectedPoints, setRejectedPoints] = useState([]);

  const [comparisonsCount, setComparisonsCount] = useState(0);
  
  const abortRef = useRef(false);

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

  
  const [speedMultiplier, setSpeedMultiplierState] = useState(1);
  const speedRef = useRef(1);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const pauseResolver = useRef(null);
  const stepResolver = useRef(null);

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
      if (stepResolver.current) {
        stepResolver.current();
        stepResolver.current = null;
      }
    }
  };

  const stepForward = () => {
    if (isPausedRef.current && stepResolver.current) {
      stepResolver.current();
      stepResolver.current = null;
    }
  };

  const waitPause = async () => {
    while (isPausedRef.current) {
      await new Promise((resolve) => { 
        pauseResolver.current = resolve; 
        stepResolver.current = resolve;
      });
      // If we break out of promise but are still paused, it was a step Forward.
      if (isPausedRef.current) break; 
    }
  };

  const sleep = async (ms) => {
    const delay = Math.max(10, ms / speedRef.current);
    await new Promise((resolve) => setTimeout(resolve, delay));
    await waitPause();
  };


  const generatePoints = () => {
    abortRef.current = true;
    setIsProcessing(false);
    if(isPausedRef.current) togglePause();
    setActiveLine(null);
    setHull([]);
    setCurrentPoint(null);
    setEvaluatingLine(null);
    setP0Point(null);
    setSortingLines([]);
    setRejectedPoints([]);
    setComparisonsCount(0);
    
    const numPoints = 20;
    const newPoints = [];
    // Generate inside a centered box to prevent edges being too close
    for (let i = 0; i < numPoints; i++) {
      newPoints.push({
        id: i,
        x: Math.floor(Math.random() * 70) + 15,
        y: Math.floor(Math.random() * 70) + 15,
      });
    }
    setPoints(newPoints);
  };

  useEffect(() => {
    generatePoints();
    return () => {
      abortRef.current = true;
    };
  }, []);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space - Toggle Pause/Resume (only if processing)
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        if (isProcessing) {
          togglePause();
        } else if (points.length >= 3) {
          handleStart();
        }
      }
      
      // Arrow Down / Enter - Step forward when paused
      if ((e.code === 'ArrowDown' || e.code === 'Enter') && isProcessing && isPaused) {
        e.preventDefault();
        stepForward();
      }
      
      // Arrow Right / Arrow Left - Change speed
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = SPEED_OPTIONS.indexOf(speedMultiplier);
        if (e.code === 'ArrowRight' && currentIndex < SPEED_OPTIONS.length - 1) {
          setSpeedMultiplier(SPEED_OPTIONS[currentIndex + 1]);
        } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
          setSpeedMultiplier(SPEED_OPTIONS[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, points.length, speedMultiplier]);

  const crossProduct = (p1, p2, p3) => {
    return (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
  };

  const handleClearBoard = () => {
    if (isProcessing && !isPaused) togglePause();
    abortRef.current = true;
    setIsProcessing(false);
    setPoints([]);
    setHull([]);
    setRejectedPoints([]);
    setSortingLines([]);
    setEvaluatingLine(null);
    setCurrentPoint(null);
    setComparisonsCount(0);
    setActiveLine(null);
  };

  const handleSvgClick = (e) => {
    if (isProcessing) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (hull.length > 0) {
      setHull([]);
      setRejectedPoints([]);
      setSortingLines([]);
      setEvaluatingLine(null);
      setCurrentPoint(null);
      setComparisonsCount(0);
      setActiveLine(null);
    }
    
    setPoints(prev => [...prev, {
      id: Date.now() + Math.random(),
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2))
    }]);
  };

  const handleStart = async () => {
    if (isProcessing || points.length < 3) return;
    setIsProcessing(true);
    abortRef.current = false;
    initAudio();
    setHull([]);
    setRejectedPoints([]);
    setSortingLines([]);
    setEvaluatingLine(null);
    setCurrentPoint(null);
    setComparisonsCount(0);
    
    let pts = [...points];
    
    setActiveLine(0);
    playTone(400, 'sine', 0.2);
    await sleep(BASE_DELAY_MS);
    if (abortRef.current) return setIsProcessing(false);
    
    // 1. Find point with lowest Y (and then lowest X)
    let p0 = pts[0];
    let p0Idx = 0;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].y > p0.y || (pts[i].y === p0.y && pts[i].x < p0.x)) {
        p0 = pts[i];
        p0Idx = i;
      }
    }
    setP0Point(p0);
    
    // Swap p0 to first position
    [pts[0], pts[p0Idx]] = [pts[p0Idx], pts[0]];
    
    setActiveLine(1);
    await sleep(BASE_DELAY_MS);
    if (abortRef.current) return setIsProcessing(false);
    
    // 2. Sort by polar angle
    const sorted = pts.slice(1).sort((a, b) => {
      const cp = crossProduct(p0, a, b);
      if (cp === 0) {
        const distA = (a.x - p0.x)**2 + (a.y - p0.y)**2;
        const distB = (b.x - p0.x)**2 + (b.y - p0.y)**2;
        return distA - distB;
      }
      return cp > 0 ? -1 : 1;
    });
    
    pts = [p0, ...sorted];
    
    // Visual sweep of sorted points
    for (let i = 1; i < pts.length; i++) {
      if (abortRef.current) return setIsProcessing(false);
      setSortingLines([{ p1: p0, p2: pts[i] }]);
      playTone(200 + i * 20, 'triangle', 0.05, 0.05);
      await sleep(100);
    }
    setSortingLines([]);
    
    setActiveLine(2);
    let stack = [pts[0], pts[1], pts[2]];
    setHull([...stack]);
    await sleep(BASE_DELAY_MS);
    if (abortRef.current) return setIsProcessing(false);
    
    setActiveLine(3);
    for (let i = 3; i < pts.length; i++) {
      if (abortRef.current) return setIsProcessing(false);
      
      setCurrentPoint(pts[i]);
      setActiveLine(4);
      await sleep(BASE_DELAY_MS * 0.8);
      
      while (stack.length > 1) {
        if (abortRef.current) return setIsProcessing(false);
        const top = stack[stack.length - 1];
        const nextToTop = stack[stack.length - 2];
        
        setComparisonsCount(prev => prev + 1);
        
        // Visualizing the check
        setEvaluatingLine({ p1: top, p2: pts[i], type: 'checking' });
        playTone(300, 'square', 0.1, 0.05);
        await sleep(BASE_DELAY_MS);
        
        if (crossProduct(nextToTop, top, pts[i]) <= 0) {
          // Right turn (concave) -> Reject
          setEvaluatingLine({ p1: top, p2: pts[i], type: 'invalid' });
          playTone(150, 'sawtooth', 0.2, 0.1);
          setActiveLine(5);
          await sleep(BASE_DELAY_MS);
          
          if (abortRef.current) return setIsProcessing(false);
          const popped = stack.pop();
          setRejectedPoints(prev => [...prev, popped]);
          setHull([...stack]);
          setEvaluatingLine(null);
          
          setActiveLine(4);
        } else {
          // Left turn -> Accept
          setEvaluatingLine({ p1: top, p2: pts[i], type: 'valid' });
          playTone(600, 'sine', 0.1, 0.1);
          await sleep(BASE_DELAY_MS * 0.6);
          break;
        }
      }
      
      setActiveLine(6);
      stack.push(pts[i]);
      setHull([...stack]);
      setEvaluatingLine(null);
      await sleep(BASE_DELAY_MS * 0.6);
    }
    
    setActiveLine(7);
    playTone(800, 'sine', 0.4, 0.2); // finished
    setCurrentPoint(null);
    setEvaluatingLine(null);
    setIsProcessing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="min-h-screen bg-[#040914] text-white font-sans flex flex-col items-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.05),transparent_34%),linear-gradient(180deg,#040914,#071120_45%,#030611)]" />

      <header className="relative w-full py-4 lg:py-6 border-b border-white/10 shadow-lg z-20 flex items-center justify-between px-4 lg:px-12 bg-white/[0.02] backdrop-blur-md">
        <div className="flex-1 flex justify-start">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-yellow-200 hover:text-white transition-colors duration-300"
          >
             <ChevronLeft size={24} />
             <span className="hidden md:inline font-semibold">Hub</span>
          </button>
        </div>

        <motion.h1 className="flex-none text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider transition-colors text-center text-white drop-shadow-md">
           {t.geometryTitle || 'Computational Geometry'}
        </motion.h1>
        
        <div className="flex-1 flex justify-end">
          <div className="flex gap-1 bg-yellow-950/30 p-1 rounded-lg border border-white/10 hidden sm:flex shadow-inner">
            <button onClick={() => setLanguage('ua')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'ua' ? 'bg-yellow-500 shadow-md text-yellow-950' : 'text-yellow-200 hover:bg-white/10'}`}>UA</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'en' ? 'bg-yellow-500 shadow-md text-yellow-950' : 'text-yellow-200 hover:bg-white/10'}`}>EN</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-4 lg:space-y-6 z-10 min-h-0">
        
        {/* Dashboard */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="w-full flex justify-between items-center p-4 rounded-xl border shadow-sm text-sm transition-colors bg-yellow-950/30 border-white/10 backdrop-blur-sm"
        >
           <div className="flex gap-4">
              <div className="px-5 py-2.5 rounded-lg border flex flex-col items-center bg-yellow-950/40 border-white/5 shadow-inner">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-300/70">{t.points || 'Points'}</span>
                 <span className="text-2xl font-mono text-white mt-1 drop-shadow-md">{points.length}</span>
              </div>
              <div className="px-5 py-2.5 rounded-lg border flex flex-col items-center bg-yellow-950/40 border-white/5 shadow-inner">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-300/70">{t.hullPoints || 'Hull Points'}</span>
                 <span className="text-2xl font-mono text-yellow-400 mt-1 drop-shadow-md">{hull.length}</span>
              </div>
              <div className="px-5 py-2.5 rounded-lg border flex flex-col items-center bg-yellow-950/40 border-white/5 shadow-inner">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-300/70">{t.comparisons || 'Comparisons'}</span>
                 <span className="text-2xl font-mono text-emerald-400 mt-1 drop-shadow-md">{comparisonsCount}</span>
              </div>
           </div>
        </motion.div>

        {/* Controls block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 rounded-2xl shadow-lg border bg-yellow-900/20 border-white/10 backdrop-blur-md"
        >
          
          {/* Left Side: Random Button */}
          <div className="flex flex-col gap-2 w-full lg:w-3/5">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={generatePoints}
                disabled={isProcessing && !isPaused}
                className="w-full sm:w-auto shrink-0 px-5 py-2.5 bg-yellow-950/60 border border-yellow-700/50 text-yellow-200 text-sm font-semibold rounded-lg hover:bg-yellow-900/80 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
              >
                {t.randomBtn || 'Random Points'}
              </button>
              <button
                onClick={handleClearBoard}
                disabled={isProcessing && !isPaused}
                className="w-full sm:w-auto shrink-0 px-5 py-2.5 bg-red-950/40 border border-red-900/50 text-red-300 text-sm font-semibold rounded-lg hover:bg-red-900/60 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
              >
                {t.clearBoard || 'Clear Board'}
              </button>
              <span className="text-xs text-yellow-500/60 ml-2 hidden lg:block italic">
                {t.geometryHint || 'Click on the canvas to add custom points'}
              </span>
            </div>
          </div>

          {/* Right Side: Speed and Start/Pause */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-yellow-900/30 lg:pl-6 relative">
            
            <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
              <label className="text-xs text-yellow-300 font-semibold uppercase tracking-wider">
                {t.speed || 'Speed'} <span className="text-white font-mono">{speedMultiplier}x</span>
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-center">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSpeedMultiplier(option)}
                    disabled={isProcessing && isPaused}
                    className={`h-10 min-w-[3rem] px-3 text-base font-medium rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                      speedMultiplier === option
                        ? 'bg-yellow-500/70 border-yellow-300 text-white shadow-inner'
                        : 'bg-yellow-950/60 border-yellow-700/50 text-yellow-200 hover:bg-yellow-800/70'
                    }`}
                  >
                    {option}x
                  </button>
                ))}
              </div>
            </div>

            {!isProcessing ? (
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-8 py-3 bg-yellow-500 border border-yellow-400 text-yellow-950 font-bold tracking-wide uppercase rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] hover:-translate-y-0.5 transition-all focus:outline-none"
              >
                {t.startBtn || 'Start'}
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={togglePause}
                  className={`flex-1 sm:flex-none px-6 py-3 font-bold tracking-wide uppercase rounded-lg shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${isPaused ? 'bg-amber-400 text-yellow-950 hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'bg-red-500/90 text-white border border-red-400 hover:bg-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
                >
                  {isPaused ? (t.resumeBtn || 'Resume') : (t.pauseBtn || 'Pause')}
                </button>
                
                {isPaused && (
                  <button
                    onClick={stepForward}
                    className="flex-none px-4 py-3 bg-yellow-900/60 border border-yellow-500/50 text-yellow-300 flex items-center justify-center rounded-lg hover:bg-yellow-800/80 transition-all shadow-inner"
                    title="Next Step (Arrow Down or Enter)"
                  >
                    <StepForward size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}
            
          </div>
        </motion.div>

        {/* Dual Panel Layout */}
        <div className="w-full flex flex-col xl:flex-row gap-6 flex-1 min-h-0 max-h-[calc(100vh-280px)]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-[#0d1527] rounded-2xl shadow-xl border border-white/5 p-4 relative min-h-[250px] max-h-[calc(100vh-300px)] aspect-square overflow-hidden min-w-0"
          >
             <svg 
               width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
               onClick={handleSvgClick}
               className={isProcessing ? "cursor-default" : "cursor-crosshair"}
             >
               <defs>
                 <filter id="glow" x="-50" y="-50" width="200" height="200" filterUnits="userSpaceOnUse">
                   <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                   <feMerge>
                     <feMergeNode in="coloredBlur"/>
                     <feMergeNode in="SourceGraphic"/>
                   </feMerge>
                 </filter>
               </defs>

               {/* Sorting Lines */}
               {sortingLines && sortingLines.map((line, i) => (
                 <line 
                   key={`sort-${i}`}
                   x1={line.p1.x} y1={line.p1.y}
                   x2={line.p2.x} y2={line.p2.y}
                   stroke="rgba(59, 130, 246, 0.4)"
                   strokeWidth="0.3"
                   strokeDasharray="1,1"
                 />
               ))}

               {/* Connections for hull */}
               {hull.length > 1 && hull.map((p, i) => {
                 if (i === 0) return null;
                 const prev = hull[i - 1];
                 return (
                   <line 
                     key={`line-${i}`}
                     x1={prev.x} y1={prev.y}
                     x2={p.x} y2={p.y}
                     stroke="#facc15"
                     strokeWidth="0.8"
                     filter="url(#glow)"
                   />
                 )
               })}
               
               {/* Close hull if finished */}
               {hull.length > 2 && !isProcessing && (
                 <line 
                   x1={hull[hull.length - 1].x} y1={hull[hull.length - 1].y}
                   x2={hull[0].x} y2={hull[0].y}
                   stroke="#facc15"
                   strokeWidth="0.8"
                   filter="url(#glow)"
                 />
               )}
               
               {/* Evaluating Line (Green/Red) */}
               {evaluatingLine && (
                 <line 
                   x1={evaluatingLine.p1.x} y1={evaluatingLine.p1.y}
                   x2={evaluatingLine.p2.x} y2={evaluatingLine.p2.y}
                   stroke={(evaluatingLine.type === 'valid') ? "#10b981" : "#ef4444"}
                   strokeWidth="0.8"
                   strokeDasharray="1,1"
                 />
               )}

               {/* Points */}
               {points.map(p => {
                 const isHull = hull.some(hp => hp.id === p.id);
                 const isCurrent = currentPoint && currentPoint.id === p.id;
                 const isEvaluating = evaluatingLine && (evaluatingLine.p2?.id === p.id || evaluatingLine.p1?.id === p.id);
                 const isRejected = rejectedPoints.some(rp => rp.id === p.id);
                 return (
                   <circle
                     key={`pt-${p.id}`}
                     cx={p.x} cy={p.y} r={isCurrent ? "2" : "1.5"}
                     fill={isCurrent ? '#3b82f6' : isEvaluating ? '#f87171' : isHull ? '#facc15' : isRejected ? '#ef4444' : '#4b5563'}
                     opacity={isRejected ? "0.3" : "1"}
                     filter={isHull || isCurrent ? "url(#glow)" : ""}
                   />
                 )
               })}
             </svg>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full xl:w-[420px] rounded-2xl border shadow-2xl text-left overflow-hidden flex flex-col h-auto xl:h-[500px] bg-[#0d1527] border-white/5"
          >
             <div className="p-4 border-b flex items-center justify-between gap-2 bg-yellow-900/10 border-white/10">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                 <h3 className="font-semibold text-sm ml-2 text-white/90">{t.pseudoTitleGeometry || 'Pseudocode: Graham Scan'}</h3>
               </div>
               <span className="text-[11px] font-mono px-2 py-0.5 rounded border opacity-90 bg-yellow-950 border-yellow-700/50 text-yellow-300">
                 {t.complexityGeometry || 'Complexity: O(n log n)'}
               </span>
             </div>
             
             <div className="relative p-4 flex-1 overflow-visible bg-black/20">
               <pre className="font-mono text-[13px] md:text-[14px] leading-relaxed tracking-wide text-yellow-300/80 relative z-0">
                 {(t.geometryCodeLines || []).map((line, idx) => (
                   <div 
                     key={`code-${idx}`} 
                     className={`px-3 py-1.5 -mx-3 rounded-md transition-colors duration-[50ms] border-l-[3px] ${(activeLine === idx) ? 'bg-yellow-500/20 text-yellow-300 font-bold border-yellow-400 shadow-inner' : 'border-transparent'}`}
                   >
                      {line}
                   </div>
                 ))}
               </pre>
             </div>
          </motion.div>
        </div>
      </main>
      
      <footer className="py-6 text-sm w-full text-center transition-colors bg-yellow-900/10 text-white/50 border-t border-white/5">
        {t.footer}
      </footer>
    </motion.div>
  );
};

export default GeometryVisualizer;
