import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { ChevronLeft, StepForward, StepBack, Play, Square, RotateCcw } from 'lucide-react';

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 10];
const BASE_DP_DELAY_MS = 600;

// --- ENGINES --- //

const generateKnapsackSteps = (items) => {
    const steps = [];
    const dp = Array(6).fill(null).map(() => Array(6).fill(0));
    
    steps.push({
        grid: JSON.parse(JSON.stringify(dp)),
        activeCell: null,
        compareCells: [],
        statusMsg: "Ready to start 0/1 Knapsack calculation.",
        codeLine: null
    });

    for (let i = 1; i <= 5; i++) {
        steps.push({
            grid: JSON.parse(JSON.stringify(dp)),
            activeCell: null, compareCells: [],
            statusMsg: `Entering outer loop for item ${i}...`,
            codeLine: 0
        });

        for (let w = 1; w <= 5; w++) {
            const itemW = items[i].w;
            const itemV = items[i].v;
            
            steps.push({
                grid: JSON.parse(JSON.stringify(dp)),
                activeCell: [i, w], compareCells: [],
                statusMsg: `Entering inner loop for capacity ${w}...`,
                codeLine: 1
            });

            steps.push({
                grid: JSON.parse(JSON.stringify(dp)),
                activeCell: [i, w], compareCells: [],
                statusMsg: `Checking if item ${i} (w:${itemW}) fits in capacity ${w}...`,
                codeLine: 2
            });

            if (itemW <= w) {
                const prev1 = dp[i-1][w];
                const prev2Raw = dp[i-1][w - itemW];
                const prev2 = prev2Raw + itemV;
                
                steps.push({
                    grid: JSON.parse(JSON.stringify(dp)),
                    activeCell: [i, w],
                    compareCells: [[i-1, w], [i-1, w - itemW]],
                    statusMsg: `Comparing without item (${prev1}) and with item (${prev2Raw} + ${itemV} = ${prev2})...`,
                    codeLine: 3
                });

                dp[i][w] = Math.max(prev1, prev2);
                
                steps.push({
                    grid: JSON.parse(JSON.stringify(dp)),
                    activeCell: [i, w], compareCells: [],
                    statusMsg: dp[i][w] === prev2 ? `Item optimal! New value: ${dp[i][w]}` : `Item not optimal. Kept: ${dp[i][w]}`,
                    codeLine: 3
                });

            } else {
                steps.push({
                    grid: JSON.parse(JSON.stringify(dp)),
                    activeCell: [i, w], compareCells: [[i-1, w]],
                    statusMsg: `Item ${i} (w:${itemW}) is too heavy for capacity ${w}.`,
                    codeLine: 4
                });

                dp[i][w] = dp[i-1][w];
                
                steps.push({
                    grid: JSON.parse(JSON.stringify(dp)),
                    activeCell: [i, w], compareCells: [],
                    statusMsg: `Inherited value from above: ${dp[i][w]}`,
                    codeLine: 5
                });
            }
        }
    }
    return steps;
};


const generateFibonacciSteps = (n) => {
    const steps = [];
    const dp = Array(n + 1).fill('');
    
    steps.push({ dp: [...dp], activeCell: null, compareCells: [], msg: `Initializing array.`, codeLine: null });

    dp[0] = 0;
    steps.push({ dp: [...dp], activeCell: 0, compareCells: [], msg: `Base case F(0) = 0`, codeLine: 0 });
    
    if (n >= 1) {
        dp[1] = 1;
        steps.push({ dp: [...dp], activeCell: 1, compareCells: [], msg: `Base case F(1) = 1`, codeLine: 1 });
    }
    
    for (let i = 2; i <= n; i++) {
        steps.push({ dp: [...dp], activeCell: null, compareCells: [], msg: `Looping i = ${i}...`, codeLine: 2 });
        steps.push({ dp: [...dp], activeCell: i, compareCells: [i-1, i-2], msg: `Calculating F(${i}) = F(${i-1}) + F(${i-2})...`, codeLine: 3 });
        dp[i] = dp[i-1] + dp[i-2];
        steps.push({ dp: [...dp], activeCell: i, compareCells: [i-1, i-2], msg: `F(${i}) = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}`, codeLine: 3 });
    }
    steps.push({ dp: [...dp], activeCell: null, compareCells: [], msg: `Returning F(${n}) = ${dp[n]}`, codeLine: 4 });
    return steps;
};

// --- COMPONENTS --- //

const DPWorkbench = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
  // States
  const [activeTab, setActiveTab] = useState('knapsack'); 
  const [fibN, setFibN] = useState(8);
  const [knapsackItems, setKnapsackItems] = useState([
    { w: 0, v: 0 }, 
    { w: 1, v: 10 },
    { w: 2, v: 20 },
    { w: 3, v: 30 },
    { w: 2, v: 15 },
    { w: 1, v: 10 }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const timerRef = useRef(null);

  // Generate Steps
  const stepsData = useMemo(() => {
      if (activeTab === 'knapsack') return generateKnapsackSteps(knapsackItems);
      return generateFibonacciSteps(fibN);
  }, [activeTab, fibN, knapsackItems]);

  // Controls
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, stepsData.length - 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const handleReset = () => { setIsPlaying(false); setCurrentStep(0); };
  const togglePlay = () => setIsPlaying(!isPlaying);

  // Reset steps on data change
  useEffect(() => { handleReset(); }, [activeTab, fibN, knapsackItems]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Arrows Left/Right: Speed
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = SPEED_OPTIONS.indexOf(speedMultiplier);
        if (e.code === 'ArrowRight' && currentIndex < SPEED_OPTIONS.length - 1) {
          setSpeedMultiplier(SPEED_OPTIONS[currentIndex + 1]);
        } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
          setSpeedMultiplier(SPEED_OPTIONS[currentIndex - 1]);
        }
      }
      
      // Arrow Down / Enter: Step Forward
      if ((e.code === 'ArrowDown' || e.code === 'Enter') && !isPlaying) {
        e.preventDefault();
        handleNext();
      }

      // Arrow Up: Step Back
      if (e.code === 'ArrowUp' && !isPlaying) {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, speedMultiplier, currentStep, stepsData.length]);

  // Playback Loop
  useEffect(() => {
      if (isPlaying) {
          const delay = Math.max(60, BASE_DP_DELAY_MS / speedMultiplier);
          timerRef.current = setTimeout(() => {
              if (currentStep < stepsData.length - 1) {
                  setCurrentStep(prev => prev + 1);
              } else {
                  setIsPlaying(false);
              }
          }, delay);
      }
      return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentStep, speedMultiplier, stepsData.length]);


  // Randomizer Logic
  const handleRandomize = () => {
      const fresh = [{w:0, v:0}];
      for(let i=0; i<5; i++){
          fresh.push({
              w: Math.floor(Math.random() * 5) + 1,
              v: Math.floor(Math.random() * 91) + 10 // 10-100
          });
      }
      setKnapsackItems(fresh);
  };
  
  // Custom Data Change
  const updateItem = (index, field, value) => {
      const newItems = [...knapsackItems];
      let parsed = parseInt(value) || 0;
      if (field === 'w' && parsed > 5) parsed = 5;
      if (field === 'w' && parsed < 1) parsed = 1;
      newItems[index][field] = parsed;
      setKnapsackItems(newItems);
  };

  // --- SVG ARROW LOGIC (KNAPSACK) ---
  const containerRef = useRef(null);
  const cellRefs = useRef({});
  const [arrowLines, setArrowLines] = useState([]);

  useLayoutEffect(() => {
      if (activeTab !== 'knapsack') return;
      const frame = stepsData[currentStep];
      if (!frame.activeCell || !frame.compareCells || frame.compareCells.length === 0 || !containerRef.current) {
          setArrowLines([]);
          return;
      }
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetId = `cell-${frame.activeCell[0]}-${frame.activeCell[1]}`;
      const targetDom = cellRefs.current[targetId];

      if (!targetDom) return;

      const tx = targetDom.getBoundingClientRect().left - containerRect.left + targetDom.offsetWidth / 2;
      const ty = targetDom.getBoundingClientRect().top - containerRect.top + targetDom.offsetHeight / 2;

      const lines = frame.compareCells.map(comp => {
          const sourceId = `cell-${comp[0]}-${comp[1]}`;
          const sourceDom = cellRefs.current[sourceId];
          if (!sourceDom) return null;
          
          const sx = sourceDom.getBoundingClientRect().left - containerRect.left + sourceDom.offsetWidth / 2;
          const sy = sourceDom.getBoundingClientRect().top - containerRect.top + sourceDom.offsetHeight / 2;
          
          return { x1: sx, y1: sy, x2: tx, y2: ty, id: `${sourceId}->${targetId}` };
      }).filter(Boolean);

      setArrowLines(lines);

  }, [currentStep, activeTab, stepsData]);


  const frame = stepsData[currentStep] || stepsData[0];
  const activeCodeLines = activeTab === 'knapsack' ? t.dpCodeLines : t.fibCodeLines;
  const pseudoTitle = activeTab === 'knapsack' ? t.dpPseudoTitle : t.fibPseudoTitle;

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex flex-col font-sans relative overflow-hidden">
        
        {/* Header (Matching Style Specification) */}
        <header className="w-full py-6 flex flex-col justify-between md:flex-row items-center px-6 lg:px-12 z-50 bg-[#0B0B0F]/80 backdrop-blur-md border-b border-white/5 gap-4">
            <div className="flex items-center gap-4">
                {/* Specific light blue 'Hub' navigation button */}
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-1 text-purple-300 hover:text-white transition-colors duration-300"
                >
                    <ChevronLeft size={24} />
                    <span className="hidden md:inline font-semibold">Hub</span>
                </button>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10 shadow-lg shrink-0">
                  <button onClick={() => setLanguage('ua')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'ua' ? 'bg-purple-600 shadow text-white' : 'text-purple-200 hover:bg-white/10'}`}>UA</button>
                  <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'en' ? 'bg-purple-600 shadow text-white' : 'text-purple-200 hover:bg-white/10'}`}>EN</button>
              </div>
            </div>
        </header>

        {/* Tab Switcher */}
        <div className="w-full flex justify-center py-6 z-40 relative">
             <div className="inline-flex bg-white/[0.02] border border-white/10 rounded-full p-1 shadow-xl backdrop-blur-md">
                 <button 
                    onClick={() => setActiveTab('knapsack')}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'knapsack' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-white/40 hover:text-white/80'} `}
                 >
                     {t.knapsackTitle || 'Knapsack Visualizer'}
                 </button>
                 <button 
                    onClick={() => setActiveTab('fibonacci')}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'fibonacci' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-white/40 hover:text-white/80'} `}
                 >
                     {t.fibonacciTitle || 'Fibonacci Memoization'}
                 </button>
             </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="flex-1 flex flex-col xl:flex-row w-full max-w-[1600px] mx-auto p-4 lg:p-8 gap-8 z-10 overflow-hidden">
            
            {/* --- LEFT PANEL: Visualization --- */}
            <div className="flex-[2] flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-xl relative min-h-[500px]">
                
                {/* KNAPSACK VISUALIZATION */}
                {activeTab === 'knapsack' && (
                    <div className="flex-1 flex items-center justify-center relative w-full h-full" ref={containerRef}>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#d8b4fe" />
                                </marker>
                            </defs>
                            <AnimatePresence>
                                {arrowLines.map(line => (
                                    <motion.line
                                        key={line.id}
                                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                                        stroke="#d8b4fe" strokeWidth="3" strokeDasharray="6,4" markerEnd="url(#arrowhead)"
                                        style={{ filter: "drop-shadow(0 0 8px rgba(216,180,254,0.8))" }}
                                    />
                                ))}
                            </AnimatePresence>
                        </svg>

                        <div className="flex flex-col gap-2 relative z-10 w-full max-w-2xl mx-auto overflow-x-auto p-4 pb-8">
                            <div className="flex gap-2">
                                <div className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0"></div>
                                {[0, 1, 2, 3, 4, 5].map(col => (
                                    <div key={`header-${col}`} className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 flex items-center justify-center text-purple-300/50 font-mono text-xs">
                                        c={col}
                                    </div>
                                ))}
                            </div>
                            {[0, 1, 2, 3, 4, 5].map(row => (
                                <div key={`row-${row}`} className="flex gap-2 items-center">
                                    <div className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 flex flex-col items-center justify-center text-white/40 font-mono text-[9px]">
                                        {row === 0 ? 'Base' : (
                                            <>
                                                <span className="text-purple-300/80">i={row}</span>
                                                <span className="text-emerald-400/80">{t.dpWeight || 'W:'}{knapsackItems[row].w}</span>
                                                <span className="text-amber-400/80">{t.dpValue || 'V:'}{knapsackItems[row].v}</span>
                                            </>
                                        )}
                                    </div>
                                    {[0, 1, 2, 3, 4, 5].map(col => {
                                        const cellId = `cell-${row}-${col}`;
                                        const val = frame.grid[row][col];
                                        const isActive = frame.activeCell?.[0] === row && frame.activeCell?.[1] === col;
                                        const isCompare = frame.compareCells.some(c => c[0] === row && c[1] === col);
                                        const isFilled = val > 0 && !isActive && !isCompare;

                                        return (
                                            <motion.div
                                                key={cellId} ref={el => cellRefs.current[cellId] = el}
                                                animate={{
                                                    backgroundColor: isActive ? 'rgba(168, 85, 247, 0.4)' : isFilled ? 'rgba(147, 51, 234, 0.4)' : isCompare ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
                                                    borderColor: isActive ? 'rgba(255, 255, 255, 0.9)' : isFilled ? 'rgba(168, 85, 247, 0.5)' : isCompare ? 'rgba(96, 165, 250, 0.6)' : 'rgba(88, 28, 135, 0.5)',
                                                    scale: isActive ? 1.05 : 1
                                                }}
                                                transition={{ duration: 0.3 }}
                                                className="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 rounded-xl border-2 flex items-center justify-center font-mono text-base lg:text-lg font-semibold relative"
                                                style={{ boxShadow: isActive ? '0 0 20px rgba(168, 85, 247, 0.9)' : isCompare ? 'inset 0 0 15px rgba(96, 165, 250, 0.4)' : 'none' }}
                                            >
                                                <span className="relative z-10 text-white drop-shadow-md">{val}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* FIBONACCI VISUALIZATION */}
                {activeTab === 'fibonacci' && (
                    <div className="flex-1 flex flex-col justify-center gap-12 w-full p-4 relative h-full">
                        <div className="flex flex-col items-center gap-4 max-w-sm mx-auto w-full bg-black/20 p-6 rounded-2xl border border-white/5">
                            <span className="text-white/60 font-semibold uppercase tracking-wider text-sm">Target Fibonacci N</span>
                            <div className="text-4xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-bold">N = {fibN}</div>
                            <input 
                                type="range" min="3" max="15" step="1"
                                value={fibN} onChange={(e) => setFibN(Number(e.target.value))}
                                className="w-full accent-purple-500 mt-2"
                            />
                        </div>

                        <div className="w-full flex justify-center items-center gap-2 overflow-x-auto pb-8">
                            {frame.dp.map((val, idx) => {
                                const isActive = frame.activeCell === idx;
                                const isCompare = frame.compareCells.includes(idx);
                                const isFilled = val !== '' && !isActive && !isCompare;

                                return (
                                    <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
                                        <motion.div
                                            animate={{
                                                backgroundColor: isActive ? 'rgba(168, 85, 247, 0.4)' : isFilled ? 'rgba(147, 51, 234, 0.4)' : isCompare ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
                                                borderColor: isActive ? 'rgba(255, 255, 255, 0.9)' : isFilled ? 'rgba(168, 85, 247, 0.5)' : isCompare ? 'rgba(96, 165, 250, 0.6)' : 'rgba(88, 28, 135, 0.5)',
                                                scale: isActive ? 1.05 : 1
                                            }}
                                            transition={{ duration: 0.3 }}
                                            className="w-12 h-16 md:w-16 md:h-20 rounded-xl border-2 flex items-center justify-center font-mono text-xl font-bold relative"
                                            style={{ boxShadow: isActive ? '0 0 20px rgba(168, 85, 247, 0.9)' : 'none' }}
                                        >
                                            <span className="text-white drop-shadow-md">{val}</span>
                                        </motion.div>
                                        <span className="text-purple-300/40 font-mono text-xs font-semibold">[{idx}]</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Status Descriptions */}
                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 flex flex-col md:flex-row items-center gap-4 min-h-[5rem]">
                        <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shrink-0" style={{ boxShadow: '0 0 10px rgba(168,85,247,0.8)' }}/>
                        <div className="flex flex-col">
                            <span className="text-purple-300/50 text-xs font-bold uppercase tracking-widest mb-1">Step {currentStep}</span>
                            <span className="text-purple-100 font-medium tracking-wide text-sm md:text-base">
                               {frame.msg || frame.statusMsg}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: Pseudocode & Controls & Data --- */}
            <div className="flex-1 flex flex-col gap-6 shrink-0 w-full xl:w-[400px]">
                
                {/* Control Panel Box */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                    <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Controls</h2>
                    
                    <div className="flex flex-col gap-2 mb-5">
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePrev} disabled={currentStep === 0 || isPlaying}
                                className="flex-none px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Previous Step (Arrow Up)"
                            >
                                <StepBack size={16} strokeWidth={2.5} />
                            </button>
                            {isPlaying ? (
                                <button 
                                    onClick={togglePlay}
                                    className="flex-1 px-3 py-2 rounded-lg border text-sm font-bold transition-all flex items-center justify-center gap-2 bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                                >
                                    <Square size={16} fill="currentColor" /> {t.pauseBtn || 'Pause'}
                                </button>
                            ) : (
                                <button 
                                    onClick={togglePlay}
                                    className="flex-1 px-3 py-2 rounded-lg border text-sm font-bold transition-all flex items-center justify-center gap-2 bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30"
                                >
                                    <Play size={16} fill="currentColor" /> {currentStep > 0 ? (t.resumeBtn || 'Resume') : (t.startBtn || 'Start')}
                                </button>
                            )}
                            <button 
                                onClick={handleNext} disabled={currentStep === stepsData.length - 1 || isPlaying}
                                className="flex-none px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Next Step (Arrow Down / Enter)"
                            >
                                <StepForward size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                        <button 
                            onClick={handleReset}
                            className="w-full px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={16} /> {t.dpReset || 'Reset'}
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm text-white/50 uppercase tracking-wider font-semibold">
                            <span>{t.dpSpeed || 'Speed:'}</span>
                            <span>{speedMultiplier}x</span>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-center">
                          {SPEED_OPTIONS.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setSpeedMultiplier(option)}
                              className={`h-10 min-w-[3rem] px-3 text-base font-medium rounded-md border transition-all flex items-center justify-center ${
                                speedMultiplier === option
                                  ? 'bg-purple-500/70 border-purple-300 text-white'
                                  : 'bg-black/30 border-white/20 text-white/80 hover:bg-white/10'
                              }`}
                            >
                              {option}x
                            </button>
                          ))}
                        </div>
                    </div>
                </div>

                {/* Pseudocode Box */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl flex-1 flex flex-col min-h-[250px]">
                    <h2 className="text-lg font-semibold mb-4 text-purple-300/80">{pseudoTitle}</h2>
                    <div className="flex-1 bg-black/40 rounded-xl p-4 overflow-auto border border-white/5 font-mono text-xs md:text-sm text-white/60 leading-relaxed">
                        {activeCodeLines?.map((line, idx) => (
                            <div 
                                key={idx} 
                                className={`px-2 py-1 rounded transition-colors whitespace-pre-wrap 
                                  ${frame.codeLine === idx ? 'bg-purple-600/40 text-white font-bold border-l-2 border-purple-400' : 'hover:bg-white/5'}
                                `}
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Input Data (Only Knapsack) */}
                {activeTab === 'knapsack' && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">{t.dpCustomDataTitle || 'Custom Data'}</h2>
                             <button onClick={handleRandomize} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-emerald-300 text-xs font-bold rounded shadow border border-emerald-500/20 transition-all uppercase tracking-wider">
                                 {t.dpRandomBtn || 'Randomize'}
                             </button>
                        </div>
                        <div className="flex flex-col gap-2">
                             {knapsackItems.map((item, idx) => {
                                 if (idx === 0) return null; // Base case disabled
                                 return (
                                    <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs text-white/50 w-12 font-mono">i={idx}</span>
                                        <label className="flex items-center gap-1 text-xs text-emerald-400">
                                            {t.dpWeight || 'W:'}
                                            <input type="number" min="1" max="5" value={item.w} onChange={(e) => updateItem(idx, 'w', e.target.value)} className="w-12 bg-black/40 rounded p-1 outline-none text-white border border-white/10" />
                                        </label>
                                        <label className="flex items-center gap-1 text-xs text-amber-400">
                                            {t.dpValue || 'V:'}
                                            <input type="number" min="1" max="100" value={item.v} onChange={(e) => updateItem(idx, 'v', e.target.value)} className="w-12 bg-black/40 rounded p-1 outline-none text-white border border-white/10" />
                                        </label>
                                    </div>
                                 )
                             })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default DPWorkbench;
