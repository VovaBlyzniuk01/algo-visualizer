import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { TreesControls } from './TreesControls';
import { TreeCanvas } from './TreeCanvas';
import { runTreeAlgorithm } from '../../algorithms/treeAlgorithms';
import {
  SPEED_OPTIONS,
  BASE_DELAY_MS,
  TREE_ALGORITHMS,
  generateTree,
  getEdges,
  getNodesList,
  PSEUDOCODES,
  renderCode
} from './TreesVisualizerUtils';

const TreesVisualizer = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  
  const labels = {
    en: {
      title: 'Trees & Data Structures',
      searchPlaceholder: 'Value...',
      speed: 'Speed',
      clear: 'Clear',
      newTree: 'New BST',
      startBtn: 'Play',
      stopBtn: 'Stop'
    },
    ua: {
      title: 'Дерева та структури даних',
      searchPlaceholder: 'Число...',
      speed: 'Швидкість',
      clear: 'Очистити',
      newTree: 'Нове BST',
      startBtn: 'Почати',
      stopBtn: 'Зупинити'
    }
  };

  const [tree, setTree] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bst-search');
  const [speed, setSpeed] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const [activeNode, setActiveNode] = useState(null);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [finalPath, setFinalPath] = useState([]);
  const [targetValue, setTargetValue] = useState(42);
  const [activeLine, setActiveLine] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  
  const abortRef = useRef(false);
  const speedRef = useRef(speed);
  const audioCtxRef = useRef(null);
  const isPausedRef = useRef(false);
  const pauseResolverRef = useRef(null);
  const stepResolverRef = useRef(null);
  
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    generateNewTree();
  }, []);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space: toggle pause/play if animating
      if (e.code === 'Space') {
        e.preventDefault();
        if (isAnimatingRef.current) {
          togglePause();
        } else {
          // If not animating, start it
          if (!(selectedAlgorithm === 'bst-search' && targetValue === '')) {
            startAlgorithm();
          }
        }
      }
      
      // Arrows Left/Right: Speed
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = SPEED_OPTIONS.indexOf(speed);
        if (e.code === 'ArrowRight' && currentIndex < SPEED_OPTIONS.length - 1) {
          setSpeed(SPEED_OPTIONS[currentIndex + 1]);
        } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
          setSpeed(SPEED_OPTIONS[currentIndex - 1]);
        }
      }
      
      // Arrow Down / Enter: Step Forward
      if ((e.code === 'ArrowDown' || e.code === 'Enter') && isPausedRef.current) {
        e.preventDefault();
        stepForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speed, isAnimating, selectedAlgorithm, targetValue]);

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

  const generateNewTree = () => {
    abortRef.current = true;
    setIsAnimating(false);
    setActiveNode(null);
    setVisitedNodes([]);
    setFinalPath([]);
    setActiveLine(-1);
    
    const newTree = generateTree(4, 500, 50, 240, 15);
    setTree(newTree);
    
    if (newTree) {
      const nodes = getNodesList(newTree);
      if (nodes.length > 0) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        setTargetValue(randomNode.value);
      }
    }
    
    setTimeout(() => { abortRef.current = false; }, 100);
  };

  const resetVisualization = () => {
    abortRef.current = true;
    setIsAnimating(false);
    isAnimatingRef.current = false;
    setActiveNode(null);
    setVisitedNodes([]);
    setFinalPath([]);
    setActiveLine(-1);
    
    setIsPaused(false);
    isPausedRef.current = false;
    if (pauseResolverRef.current) pauseResolverRef.current();

    setTimeout(() => { abortRef.current = false; }, 100);
  };

  const stopAlgorithm = () => {
    abortRef.current = true;
    setIsAnimating(false);
    isAnimatingRef.current = false;
    
    setIsPaused(false);
    isPausedRef.current = false;
    if (pauseResolverRef.current) pauseResolverRef.current();
  };

  const togglePause = () => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    
    if (!next) {
      if (pauseResolverRef.current) {
        pauseResolverRef.current();
        pauseResolverRef.current = null;
      }
      if (stepResolverRef.current) {
        stepResolverRef.current();
        stepResolverRef.current = null;
      }
    }
  };

  const stepForward = () => {
    if (isPausedRef.current && stepResolverRef.current) {
      stepResolverRef.current();
      stepResolverRef.current = null;
    }
  };

  const waitPause = async () => {
    while (isPausedRef.current) {
      await new Promise(resolve => {
        pauseResolverRef.current = resolve;
        stepResolverRef.current = resolve;
      });
      if (isPausedRef.current) break;
    }
  };

  const sleep = async (ms) => {
    await waitPause();
    await new Promise(resolve => setTimeout(resolve, ms));
    await waitPause();
  };
  const getDelay = () => Math.max(10, BASE_DELAY_MS / speedRef.current);

  const startAlgorithm = async () => {
    if (isAnimating || !tree) return;
    initAudio();
    resetVisualization();
    await sleep(50);
    
    setIsAnimating(true);
    isAnimatingRef.current = true;
    abortRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);
    
    await runTreeAlgorithm({
      root: tree,
      algorithmId: selectedAlgorithm,
      setActiveNode,
      setVisitedNodes,
      setFinalPath,
      setActiveLine, // Now passing it
      sleep,
      getDelay,
      abortRef,
      targetValue,
      playTone
    });
    
    setIsAnimating(false);
    isAnimatingRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col relative overflow-hidden"
    >
      <header className="relative w-full py-4 lg:py-6 bg-neutral-900 border-b border-amber-900/30 shadow-lg z-20 flex items-center justify-between px-4 lg:px-12">
        <div className="flex-1 flex justify-start">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors duration-300">
                <ArrowLeft size={24} />
                <span className="hidden md:inline font-semibold">Hub</span>
            </button>
        <motion.h1 className="flex-none text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider transition-colors text-center text-amber-500 drop-shadow-md">
          {labels[language].title}
        </motion.h1>
        <div className="flex-1 flex justify-end">
          <ThemeToggle />
        </div>
        </div>
      </header>
      
      <main className="flex-1 min-h-0 flex flex-col items-center justify-start p-4 lg:p-6 w-full max-w-7xl mx-auto space-y-4 z-10 overflow-hidden">
        <TreesControls
          selectedAlgorithm={selectedAlgorithm}
          setSelectedAlgorithm={setSelectedAlgorithm}
          TREE_ALGORITHMS={TREE_ALGORITHMS}
          speed={speed}
          setSpeed={setSpeed}
          SPEED_OPTIONS={SPEED_OPTIONS}
          isAnimating={isAnimating}
          startAlgorithm={startAlgorithm}
          stopAlgorithm={stopAlgorithm}
          resetVisualization={resetVisualization}
          generateNewTree={generateNewTree}
          targetValue={targetValue}
          setTargetValue={setTargetValue}
          language={language}
          labels={labels}
          isPaused={isPaused}
          togglePause={togglePause}
          stepForward={stepForward}
        />

        <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-6 relative overflow-hidden">
            <div className="flex-1 bg-neutral-900/30 border border-neutral-800 rounded-xl relative overflow-hidden flex flex-col justify-center">
                <TreeCanvas
                  root={tree}
                  getEdges={getEdges}
                  getNodesList={getNodesList}
                  activeNode={activeNode}
                  visitedNodes={visitedNodes}
                  finalPath={finalPath}
                />
            </div>
            {/* Pseudocode Block placed as a separate object */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="w-full lg:w-[380px] shrink-0 bg-neutral-900/50 backdrop-blur-md p-5 rounded-xl border border-amber-500/20 shadow-xl text-xs sm:text-sm font-mono z-30 overflow-y-auto hidden sm:block"
            >
               <div className="text-amber-500/50 mb-3 font-bold uppercase tracking-wider text-[10px] sm:text-xs">Pseudocode</div>
               <div className="relative text-left m-0 overflow-visible font-mono">
                 {(PSEUDOCODES[selectedAlgorithm] || []).map((line, idx) => (
                     <div 
                       key={idx} 
                       id={`code-line-${idx}`} 
                       className={`py-1 -mx-3 px-3 rounded-md transition-colors duration-150 relative overflow-hidden whitespace-pre border-l-[2px] text-[13px] leading-relaxed list-none ${
                           activeLine === idx 
                             ? 'bg-amber-500/20 border-amber-400' 
                             : 'border-transparent'
                       }`}
                       style={{ listStyle: 'none' }}
                     >
                       {renderCode(line)}
                     </div>
                 ))}
               </div>
            </motion.div>
        </div>
      </main>
    </motion.div>
  );
};

export default TreesVisualizer;
