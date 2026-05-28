import { Header } from "./Header";
import { ControlsPanel } from "./ControlsPanel";
import { GridCanvas } from "./GridCanvas";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, RotateCcw, Trash2, Square, ChevronDown, Settings, StepForward, StepBack } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GraphVisualizer.css';
import { dijkstra, getNodesInShortestPathOrder } from './dijkstra';
import { astar } from './astar';
import { bfs } from './bfs';
import { bellmanFord } from './bellmanFord';
import { dfs } from './dfs';
import { topologicalSort } from './topologicalSort';
import { kruskal } from './kruskal';
import { prim } from './prim';
import NodeLinkGraph from './NodeLinkGraph';
import GraphEditorModal from './GraphEditorModal';
import { useLanguage } from '../../context/LanguageContext';
import Node from './Node';
import { TOOLS, SPEED_OPTIONS, BASE_GRAPH_DELAY_MS, createNode, PSEUDOCODES, renderCode } from "./GraphVisualizerUtils";

const GraphVisualizer = () => {
  const [grid, setGrid] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const [isError, setIsError] = useState(false);

  // Pause Logic states
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const pauseResolver = useRef(null);
  const stepResolver = useRef(null);

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

      const n = frame.node;
      const getDomNode = () => {
          if (n.row !== undefined) return document.getElementById(`node-${n.row}-${n.col}`);
          if (n.type === 'node') return document.getElementById(`node-svg-${n.id}`);
          if (n.type === 'edge') return document.getElementById(`edge-svg-${n.from}-${n.to}`);
          return null;
      };

      if (frame.type === 'visit') {
          const domNode = getDomNode();
          if (domNode) {
             if (n.row !== undefined) {
                 domNode.classList.add(n.isWeight ? (n.weight === 10 ? 'node-weight-visited-10' : 'node-weight-visited-5') : 'node-visited');
             } else {
                 if (frame.phase === 'backtrack') domNode.classList.add('backtrack');
                 else domNode.classList.add('visited');
             }
          }
          if (frame.nodesVisited !== undefined) setNodesVisitedCount(frame.nodesVisited);
          
          if (n.row !== undefined && frame.distance !== undefined && showScores) {
              setGrid(prev => {
                  const newG = prev.map(r => r.map(cell => ({...cell})));
                  newG[n.row][n.col].distance = frame.distance;
                  return newG;
              });
          }
          if (frame.audio) playPop(frame.audio.distance);
      } else if (frame.type === 'unvisit') {
          const domNode = getDomNode();
          if (domNode) {
              if (n.row !== undefined) {
                  domNode.classList.remove('node-visited', 'node-weight-visited-5', 'node-weight-visited-10');
              } else {
                  if (frame.phase === 'backtrack') domNode.classList.remove('backtrack');
                  else domNode.classList.remove('visited');
              }
          }
          if (frame.nodesVisited !== undefined) setNodesVisitedCount(frame.nodesVisited);
      } else if (frame.type === 'path') {
          const domNode = getDomNode();
          if (domNode) {
              if (n.row !== undefined) domNode.classList.add('node-shortest-path');
              else domNode.classList.add('shortest-path');
          }
          if (frame.pathLength !== undefined) setPathLengthCount(frame.pathLength);
          if (frame.audio) playPathChime(frame.audio.index);
      } else if (frame.type === 'unpath') {
          const domNode = getDomNode();
          if (domNode) {
              if (n.row !== undefined) domNode.classList.remove('node-shortest-path');
              else domNode.classList.remove('shortest-path');
          }
          if (frame.pathLength !== undefined) setPathLengthCount(frame.pathLength);
      }
  };

  const stepForward = () => {
    if (isPausedRef.current && isAnimatingRef.current) {
      if (currentFrameIndexRef.current < framesRef.current.length) {
         applyFrame(framesRef.current[currentFrameIndexRef.current]);
         currentFrameIndexRef.current++;
      }
    }
  };

  const stepBackward = () => {
    if (isPausedRef.current && isAnimatingRef.current) {
      if (currentFrameIndexRef.current > 0) {
         currentFrameIndexRef.current--;
         const frame = framesRef.current[currentFrameIndexRef.current];
         // Inverse apply
         if (frame.type === 'visit') {
             applyFrame({ ...frame, type: 'unvisit' });
         } else if (frame.type === 'path') {
             applyFrame({ ...frame, type: 'unpath' });
         }
      }
    }
  };

  const playbackLoop = async () => {
      while (currentFrameIndexRef.current < framesRef.current.length) {
          if (!isAnimatingRef.current) break;
          
          if (isPausedRef.current) {
             await waitPause();
          }
          if (!isAnimatingRef.current) break;

          const frame = framesRef.current[currentFrameIndexRef.current];
          applyFrame(frame);

          const delayMult = frame.delayMult || 1;
          const delay = Math.max(4, BASE_GRAPH_DELAY_MS / speedRef.current) * delayMult;
          await new Promise(r => setTimeout(r, delay));

          if (!isPausedRef.current && isAnimatingRef.current) { 
              currentFrameIndexRef.current++;
          }
      }
      if (isAnimatingRef.current && currentFrameIndexRef.current >= framesRef.current.length) {
          setIsAnimating(false);
          isAnimatingRef.current = false;
          setIsPaused(false);
          isPausedRef.current = false;
          updateActiveLine(null);
      }
  };

  
  const [speed, setSpeedState] = useState(1);
  const speedRef = useRef(1);
  
  const [nodesVisitedCount, setNodesVisitedCount] = useState(0);
  const [pathLengthCount, setPathLengthCount] = useState(0);

  // COORDINATE STATE POSITIONS (Plan B)
  const [startPos, setStartPos] = useState({ row: 10, col: 5 });
  const [finishPos, setFinishPos] = useState({ row: 10, col: 35 });
  
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
  const audioCtxRef = useRef(null);
  
  // Dragging tracking
  const draggingType = useRef(null); 
  const drawingType = useRef(null); 
  
  const timeoutsRef = useRef([]);

  // Playback states
  const framesRef = useRef([]);
  const currentFrameIndexRef = useRef(0);

  const [showScores, setShowScores] = useState(false);

  const [rowCount, setRowCount] = useState(20);
  const [colCount, setColCount] = useState(50);
  const [activeBrush, setActiveBrush] = useState(TOOLS.WALL);
  const activeBrushRef = useRef(TOOLS.WALL);
  const [inputRows, setInputRows] = useState(20);
  const [inputCols, setInputCols] = useState(50);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState('dijkstra');
  const selectedAlgorithmRef = useRef('dijkstra');
  useEffect(() => { selectedAlgorithmRef.current = selectedAlgorithm; }, [selectedAlgorithm]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const svgGraphRef = useRef(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [bellmanError, setBellmanError] = useState('');
  const [topologicalError, setTopologicalError] = useState('');

  useEffect(() => {
     const handleClickOutside = (e) => {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsDropdownOpen(false);
         }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedAlgorithm !== 'bellmanFord') return;
    const timeoutId = setTimeout(() => {
      svgGraphRef.current?.loadBellmanFordExample();
      const nodes = svgGraphRef.current?.getBellmanFordExample?.() || [];
      const initialDist = {};
      nodes.forEach((node) => { initialDist[node.id] = node.id === 's' ? 0 : Infinity; });
      updateBellmanDistanceLabels(initialDist);
      const iterationEl = document.getElementById('bellman-iteration-count');
      if (iterationEl) iterationEl.innerText = '0';
    }, 0);
    timeoutsRef.current.push(timeoutId);
  }, [selectedAlgorithm]);

  useEffect(() => {
    if (selectedAlgorithm !== 'dfs') return;
    const timeoutId = setTimeout(() => {
      svgGraphRef.current?.loadDfsExample();
    }, 0);
    timeoutsRef.current.push(timeoutId);
  }, [selectedAlgorithm]);

  useEffect(() => {
    if (selectedAlgorithm !== 'topological') return;
    const timeoutId = setTimeout(() => {
      svgGraphRef.current?.clearVisuals();
      svgGraphRef.current?.randomizeGraph();
    }, 0);
    timeoutsRef.current.push(timeoutId);
  }, [selectedAlgorithm]);

  useEffect(() => {
    if (selectedAlgorithm !== 'kruskal') return;
    const timeoutId = setTimeout(() => {
      svgGraphRef.current?.clearVisuals();
      svgGraphRef.current?.loadKruskalExample();
      const totalEl = document.getElementById('mst-total-weight-count');
      if (totalEl) totalEl.innerText = '0';
    }, 0);
    timeoutsRef.current.push(timeoutId);
  }, [selectedAlgorithm]);

  useEffect(() => {
    if (selectedAlgorithm !== 'prim') return;
    const timeoutId = setTimeout(() => {
      svgGraphRef.current?.clearVisuals();
      svgGraphRef.current?.loadPrimExample();
      const totalEl = document.getElementById('mst-total-weight-count');
      if (totalEl) totalEl.innerText = '0';
      const progressEl = document.getElementById('prim-progress-fill');
      if (progressEl) progressEl.style.width = '0%';
      const progressTextEl = document.getElementById('prim-progress-text');
      if (progressTextEl) progressTextEl.innerText = '0 / 0';
    }, 0);
    timeoutsRef.current.push(timeoutId);
  }, [selectedAlgorithm]);

  const algorithmCategories = [
      {
          id: 'pathfinding',
          key: 'catPathfinding',
          items: [
              { id: 'dijkstra', key: 'algoDijkstra' },
              { id: 'astar', key: 'algoAStar' },
              { id: 'bfs', key: 'algoBFS' },
              { id: 'bellmanFord', key: 'algoBellmanFord' }
          ]
      },
      {
          id: 'traversal',
          key: 'catTraversal',
          items: [
              { id: 'dfs', key: 'algoDFS' },
              { id: 'topological', key: 'algoTopologicalSort' }
          ]
      },
      {
          id: 'mst',
          key: 'catMST',
          items: [
              { id: 'kruskal', key: 'algoKruskal' },
              { id: 'prim', key: 'algoPrim' }
          ]
      }
  ];
  const flatAlgorithms = algorithmCategories.flatMap(c => c.items);

  const setSpeed = (val) => {
      setSpeedState(val);
      speedRef.current = val;
  };

  const handleGenerateGrid = () => {
      if (isAnimating) return;
      const parsedRows = parseInt(inputRows, 10) || 20;
      const parsedCols = parseInt(inputCols, 10) || 50;
      const newRows = Math.max(5, Math.min(40, parsedRows));
      const newCols = Math.max(10, Math.min(80, parsedCols));
      
      let sR = startPos.row;
      let sC = startPos.col;
      let fR = finishPos.row;
      let fC = finishPos.col;
      
      if (sR >= newRows) sR = Math.max(0, newRows - 1);
      if (sC >= newCols) sC = 0;
      if (fR >= newRows) fR = Math.max(0, newRows - 1);
      if (fC >= newCols) fC = Math.max(0, newCols - 1);
      
      // Ensure start and finish don't overlap if possible
      if (sR === fR && sC === fC) {
          if (sC > 0) sC -= 1;
          else if (fC < newCols - 1) fC += 1;
      }
      
      setStartPos({ row: sR, col: sC });
      setFinishPos({ row: fR, col: fC });
      
      setRowCount(newRows);
      setColCount(newCols);
      setInputRows(newRows);
      setInputCols(newCols);
  };

  const handleResetSettings = () => {
      if (isAnimating) return;
      setInputRows(20);
      setInputCols(50);
      setRowCount(20);
      setColCount(50);
      setStartPos({ row: 10, col: 5 });
      setFinishPos({ row: 10, col: 35 });
  };

  const getDelay = () => {
     return Math.max(4, BASE_GRAPH_DELAY_MS / speedRef.current);
  };

  const getInitialGrid = useCallback(() => {
    const newGrid = [];
    for (let row = 0; row < rowCount; row++) {
      const currentRow = [];
      for (let col = 0; col < colCount; col++) {
        currentRow.push(createNode(col, row));
      }
      newGrid.push(currentRow);
    }
    return newGrid;
  }, [rowCount, colCount]);

  useEffect(() => {
    setGrid(getInitialGrid());

    const handleGlobalMouseUp = () => {
        draggingType.current = null;
        drawingType.current = null;
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        stopAnimation(); 
    };
  }, [getInitialGrid]);

  const stopAnimation = () => {
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current = [];
      framesRef.current = [];
      currentFrameIndexRef.current = 0;
      setIsAnimating(false);
      isAnimatingRef.current = false;
      updateActiveLine(null);
      
      setIsPaused(false);
      isPausedRef.current = false;
      if (pauseResolver.current) pauseResolver.current();
  };

  const playPop = (distance) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      // Throttle audio slightly if speed is maxed out to avoid deafening distortion
      if (getDelay() < 15 && Math.random() > 0.3) return; 

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      
      // Soft, pleasant bubbly pitch incrementing gracefully
      const freq = 261.63 + (Math.min(distance, 50) * 15);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.02, ctx.currentTime); // Soft volume
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  };

  const playPathChime = (index) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle'; // Warmer tone for the final path
      osc.frequency.setValueAtTime(440 + (index * 25), ctx.currentTime); // Rising pitch
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const playBellmanRelax = (weight) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      const base = weight < 0 ? 220 : 300;
      osc.frequency.setValueAtTime(base + Math.min(Math.abs(weight), 15) * 12, ctx.currentTime);
      gain.gain.setValueAtTime(0.018, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  };

  const playBellmanUpdate = (distance) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      const safeDistance = Number.isFinite(distance) ? distance : 0;
      const freq = 340 + Math.max(-10, Math.min(25, safeDistance)) * 8;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const playNegativeCycleAlert = () => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {}
  };

  const toggleNode = (row, col) => {
      // COORDINATE MOVEMENT (Plan B)
      if (draggingType.current === 'start') {
          if (row === finishPos.row && col === finishPos.col) return;
          if (grid[row][col].isWall) return;
          setStartPos({ row, col });
          return;
      }
      
      if (draggingType.current === 'finish') {
          if (row === startPos.row && col === startPos.col) return;
          if (grid[row][col].isWall) return;
          setFinishPos({ row, col });
          return;
      }

      setGrid(prevGrid => {
          const node = prevGrid[row][col];
          // Determine if it's a special node based on current state coordinates
          const isStartNode = row === startPos.row && col === startPos.col;
          const isFinishNode = row === finishPos.row && col === finishPos.col;
          if (isStartNode || isFinishNode) return prevGrid;
    
          const newGrid = [...prevGrid];
          const newNode = { ...node };

          if (drawingType.current === 'addWeight5') { newNode.isWeight = true; newNode.weight = 5; newNode.isWall = false; }
          else if (drawingType.current === 'addWeight10') { newNode.isWeight = true; newNode.weight = 10; newNode.isWall = false; }
          else if (drawingType.current === 'addWall') { newNode.isWall = true; newNode.isWeight = false; newNode.weight = 1; }
          else if (drawingType.current === 'eraser') { newNode.isWall = false; newNode.isWeight = false; newNode.weight = 1; }
    
          if (newNode.isWall === node.isWall && newNode.isWeight === node.isWeight && newNode.weight === node.weight) return prevGrid;
    
          newGrid[row] = [...prevGrid[row]];
          newGrid[row][col] = newNode;
          return newGrid;
      });
  };
      
  const handleMouseDown = (e, row, col) => {
    e.preventDefault();
    if (isAnimating) return;
    
    const node = grid[row][col];
    const isStartNode = row === startPos.row && col === startPos.col;
    const isFinishNode = row === finishPos.row && col === finishPos.col;
    
    console.log("Mouse Down at:", row, col, "Tool:", activeBrush, "isStart:", isStartNode);

    if (isStartNode) {
        draggingType.current = 'start';
    } else if (isFinishNode) {
        draggingType.current = 'finish';
    } else {
        if (activeBrushRef.current === TOOLS.WALL) drawingType.current = node.isWall ? 'eraser' : 'addWall';
        else if (activeBrushRef.current === TOOLS.WEIGHT_5) drawingType.current = (node.weight === 5) ? 'eraser' : 'addWeight5';
        else if (activeBrushRef.current === TOOLS.WEIGHT_10) drawingType.current = (node.weight === 10) ? 'eraser' : 'addWeight10';
        else if (activeBrushRef.current === TOOLS.ERASER) drawingType.current = 'eraser';
        
        toggleNode(row, col);
    }
  };

  const handleMouseEnter = (e, row, col) => {
    if (isAnimating) return;
    if (e.buttons !== 1) return;
    
    console.log("Dragging/Drawing:", draggingType.current || drawingType.current, "At:", row, col);

    if (draggingType.current === 'start') {
        if (row === finishPos.row && col === finishPos.col) return;
        if (grid[row][col].isWall) return;
        setStartPos({ row, col });
    } else if (draggingType.current === 'finish') {
        if (row === startPos.row && col === startPos.col) return;
        if (grid[row][col].isWall) return;
        setFinishPos({ row, col });
    } else if (drawingType.current) {
        toggleNode(row, col);
    }
  };

  const waitPause = async () => {
      if (isPausedRef.current) {
          await new Promise(resolve => {
              pauseResolver.current = resolve;
          });
      }
  };

  const wait = async (ms) => {
      await waitPause();
      await new Promise(resolve => {
          const delay = (typeof ms === 'number' && ms >= 0 && !isNaN(ms)) ? ms : 10;
          requestAnimationFrame(() => {
              const timeoutId = setTimeout(resolve, delay);
              timeoutsRef.current.push(timeoutId);
          });
      });
      await waitPause();
  };

  const animateStep = (node, type) => {
      if (selectedAlgorithmRef.current === 'bfs' || selectedAlgorithmRef.current === 'dfs') {
          if (node.type === 'node') {
              const domNode = document.getElementById(`node-svg-${node.id}`);
              if (domNode) {
                if (type === 'visited') domNode.classList.add('visited');
                else if (type === 'path') domNode.classList.add('shortest-path');
                else if (type === 'backtrack') domNode.classList.add('backtrack');
              }
          } else if (node.type === 'edge') {
              const domNode = document.getElementById(`edge-svg-${node.from}-${node.to}`);
              if (domNode) {
                if (type === 'visited') domNode.classList.add('visited');
                else if (type === 'path') domNode.classList.add('shortest-path');
                else if (type === 'backtrack') domNode.classList.add('backtrack');
              }
          }
          return;
      }

      const domNode = document.getElementById(`node-${node.row}-${node.col}`);
      if (!domNode) return;

      if (!domNode.className.includes('node-start') && !domNode.className.includes('node-finish')) {
          if (type === 'visited' && !domNode.className.includes('node-visited')) {
              let extraClass = 'node-visited';
              if (node.isWeight) extraClass = node.weight === 10 ? 'node-weight-visited-10' : 'node-weight-visited-5';
              void domNode.offsetWidth;
              domNode.classList.add(extraClass);
          } else if (type === 'path') {
              void domNode.offsetWidth;
              domNode.classList.add('node-shortest-path');
          }
      }
  };

  const updateActiveLine = (lineIdx) => {
      for (let i = 0; i < 20; i++) {
          const el = document.getElementById(`code-line-${i}`);
          if (el) {
              if (i === lineIdx) {
                  el.className = "py-1.5 -mx-3 px-3 rounded-md transition-colors duration-150 relative overflow-hidden whitespace-pre bg-yellow-500/10 text-yellow-100 font-bold shadow-[inset_2px_0_0_rgba(250,204,21,1)]";
              } else {
                  el.className = "py-1.5 -mx-3 px-3 rounded-md transition-colors duration-150 relative overflow-hidden whitespace-pre border-l-[2px] border-transparent";
              }
          }
      }
  };

  const updateBellmanDistanceLabels = (distances) => {
    Object.entries(distances || {}).forEach(([id, value]) => {
      const labelEl = document.getElementById(`node-distance-label-${id}`);
      if (labelEl) {
        labelEl.innerText = value === Infinity ? '∞' : String(value);
      }
    });
  };

  const updateTopologicalInDegrees = (inDegrees) => {
    Object.entries(inDegrees || {}).forEach(([id, value]) => {
      const labelEl = document.getElementById(`node-indegree-label-${id}`);
      if (labelEl) labelEl.innerText = `in: ${value}`;
    });
  };

  const updateTopologicalQueueClasses = (nodeIds, activeQueue) => {
    const queueSet = new Set(activeQueue || []);
    nodeIds.forEach((id) => {
      const nodeEl = document.getElementById(`node-svg-${id}`);
      if (!nodeEl || nodeEl.classList.contains('processed')) return;
      nodeEl.classList.toggle('queue-ready', queueSet.has(id));
    });
  };

  const animateTopologicalSort = async (topologicalResult, nodeIds) => {
    setIsAnimating(true);
    isAnimatingRef.current = true;
    setTopologicalError('');
    updateActiveLine(0);

    const steps = topologicalResult.steps || [];
    for (let i = 0; i < steps.length; i++) {
      if (!isAnimatingRef.current) return;

      const step = steps[i];
      updateTopologicalInDegrees(step.currentInDegrees);
      updateTopologicalQueueClasses(nodeIds, step.activeQueue);
      svgGraphRef.current?.setTopologicalOrder(step.sortedSoFar);

      if (step.phase === 'init') {
        updateActiveLine(2);
      } else if (step.phase === 'process') {
        updateActiveLine(4);
        const nodeEl = document.getElementById(`node-svg-${step.nodeId}`);
        if (nodeEl) {
          nodeEl.classList.remove('queue-ready');
          nodeEl.classList.add('processing');
        }
        playPop(step.sortedSoFar.length);
        await wait(Math.max(10, getDelay() * 0.65));
        if (!isAnimatingRef.current) return;
        if (nodeEl) {
          nodeEl.classList.remove('processing');
          nodeEl.classList.add('processed');
        }
        svgGraphRef.current?.setTopologicalOrder(step.sortedSoFar);
      } else if (step.phase === 'relax') {
        updateActiveLine(7);
        const edge = step.relaxedEdge;
        const edgeEl = edge ? document.getElementById(`edge-svg-${edge.from}-${edge.to}`) : null;
        if (edgeEl) edgeEl.classList.add('topo-relaxed');
        playBellmanRelax(1);
        await wait(Math.max(8, getDelay() * 0.45));
        if (!isAnimatingRef.current) return;
        if (edgeEl) edgeEl.classList.remove('topo-relaxed');
        updateActiveLine(8);
      }

      await wait(Math.max(8, getDelay() * 0.4));
    }

    if (topologicalResult.hasCycle) {
      playNegativeCycleAlert();
      setTopologicalError('Граф містить цикл! Топологічне сортування неможливе.');
      setIsError(true);
      alert('Граф містить цикл! Топологічне сортування неможливе.');
    }

    setIsAnimating(false);
    isAnimatingRef.current = false;
    updateActiveLine(null);
  };

  const setMstEdgeStyle = (edge, variant) => {
    const edgeEl = document.getElementById(`edge-svg-${edge.from}-${edge.to}`);
    if (!edgeEl) return;

    edgeEl.classList.remove('mst-candidate', 'mst-accepted', 'mst-rejected');

    if (variant === 'candidate') {
      edgeEl.classList.add('mst-candidate');
      edgeEl.setAttribute('stroke', '#facc15');
      edgeEl.setAttribute('stroke-width', '5');
      edgeEl.setAttribute('stroke-opacity', '1');
    } else if (variant === 'accepted') {
      edgeEl.classList.add('mst-accepted');
      edgeEl.setAttribute('stroke', '#34d399');
      edgeEl.setAttribute('stroke-width', '6');
      edgeEl.setAttribute('stroke-opacity', '1');
    } else if (variant === 'rejected') {
      edgeEl.classList.add('mst-rejected');
      edgeEl.setAttribute('stroke', '#ef4444');
      edgeEl.setAttribute('stroke-width', '2');
      edgeEl.setAttribute('stroke-opacity', '0.18');
    } else if (variant === 'cycle') {
      edgeEl.setAttribute('stroke', '#ef4444');
      edgeEl.setAttribute('stroke-width', '5');
      edgeEl.setAttribute('stroke-opacity', '1');
    }
  };

  const setPrimEdgeStyle = (edge, variant) => {
    const edgeEl = document.getElementById(`edge-svg-${edge.from}-${edge.to}`);
    if (!edgeEl) return;

    edgeEl.classList.remove('prim-fringe', 'prim-selected', 'prim-tree');

    if (variant === 'fringe') {
      edgeEl.classList.add('prim-fringe');
      edgeEl.setAttribute('stroke', '#facc15');
      edgeEl.setAttribute('stroke-width', '4');
      edgeEl.setAttribute('stroke-opacity', '0.55');
    } else if (variant === 'selected') {
      edgeEl.classList.add('prim-selected');
      edgeEl.setAttribute('stroke', '#f8fafc');
      edgeEl.setAttribute('stroke-width', '7');
      edgeEl.setAttribute('stroke-opacity', '1');
    } else if (variant === 'tree') {
      edgeEl.classList.add('prim-tree');
      edgeEl.setAttribute('stroke', '#34d399');
      edgeEl.setAttribute('stroke-width', '6');
      edgeEl.setAttribute('stroke-opacity', '1');
    } else {
      edgeEl.setAttribute('stroke', '#10b981');
      edgeEl.setAttribute('stroke-width', '3');
      edgeEl.setAttribute('stroke-opacity', '0.3');
    }
  };

  const clearPrimFringe = () => {
    document.querySelectorAll('.svg-edge.prim-fringe').forEach((edgeEl) => {
      edgeEl.classList.remove('prim-fringe');
      if (!edgeEl.classList.contains('prim-tree')) {
        edgeEl.setAttribute('stroke', '#10b981');
        edgeEl.setAttribute('stroke-width', '3');
        edgeEl.setAttribute('stroke-opacity', '0.3');
      }
    });
  };

  const updatePrimStats = (visitedCount, totalNodes, totalWeight) => {
    const totalEl = document.getElementById('mst-total-weight-count');
    if (totalEl) totalEl.innerText = String(totalWeight);

    const progressTextEl = document.getElementById('prim-progress-text');
    if (progressTextEl) progressTextEl.innerText = `${visitedCount} / ${totalNodes}`;

    const progressEl = document.getElementById('prim-progress-fill');
    if (progressEl) {
      const width = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;
      progressEl.style.width = `${width}%`;
    }
  };

  const animateKruskal = async (steps) => {
    setIsAnimating(true);
    isAnimatingRef.current = true;
    updateActiveLine(0);

    const sortedEdges = steps.sortedEdges || steps.map((step) => step.currentEdge);
    svgGraphRef.current?.setSortedEdges(sortedEdges);
    const totalEl = document.getElementById('mst-total-weight-count');
    if (totalEl) totalEl.innerText = '0';

    await wait(getDelay() * 2);

    let totalWeight = 0;
    for (let i = 0; i < steps.length; i++) {
      if (!isAnimatingRef.current) return;

      const step = steps[i];
      const edge = step.currentEdge;
      updateActiveLine(3);
      setMstEdgeStyle(edge, 'candidate');
      playBellmanRelax(edge.weight);

      await wait(Math.max(10, getDelay() * 0.9));
      if (!isAnimatingRef.current) return;

      if (step.isAccepted) {
        updateActiveLine(5);
        totalWeight += Number(edge.weight ?? 0);
        setMstEdgeStyle(edge, 'accepted');
        if (totalEl) totalEl.innerText = String(totalWeight);
        playBellmanUpdate(totalWeight);
      } else {
        updateActiveLine(8);
        setMstEdgeStyle(edge, 'cycle');
        playNegativeCycleAlert();
        await wait(Math.max(10, getDelay() * 0.6));
        if (!isAnimatingRef.current) return;
        setMstEdgeStyle(edge, 'rejected');
      }

      await wait(getDelay());
    }

    setIsAnimating(false);
    isAnimatingRef.current = false;
    updateActiveLine(null);
  };

  const animatePrim = async (steps, totalNodes) => {
    setIsAnimating(true);
    isAnimatingRef.current = true;
    updateActiveLine(0);

    let totalWeight = 0;
    const initialStep = steps[0];
    if (initialStep) {
      const rootEl = document.getElementById(`node-svg-${initialStep.activeNode}`);
      if (rootEl) rootEl.classList.add('prim-root', 'prim-visited');
      clearPrimFringe();
      initialStep.fringeEdges.forEach((edge) => setPrimEdgeStyle(edge, 'fringe'));
      updatePrimStats(initialStep.visitedNodes.length, totalNodes, totalWeight);
    }

    await wait(getDelay() * 2);

    for (let i = 1; i < steps.length; i++) {
      if (!isAnimatingRef.current) return;

      const step = steps[i];
      const selectedEdge = step.selectedEdge;

      updateActiveLine(4);
      clearPrimFringe();
      step.fringeEdges.forEach((edge) => setPrimEdgeStyle(edge, 'fringe'));
      if (selectedEdge) setPrimEdgeStyle(selectedEdge, 'selected');
      playBellmanRelax(selectedEdge?.weight ?? 1);

      await wait(Math.max(10, getDelay() * 0.75));
      if (!isAnimatingRef.current) return;

      updateActiveLine(6);
      if (selectedEdge) {
        totalWeight += Number(selectedEdge.weight ?? 0);
        setPrimEdgeStyle(selectedEdge, 'tree');
      }

      step.visitedNodes.forEach((nodeId) => {
        const nodeEl = document.getElementById(`node-svg-${nodeId}`);
        if (nodeEl) nodeEl.classList.add('prim-visited');
      });

      const activeNodeEl = document.getElementById(`node-svg-${step.activeNode}`);
      if (activeNodeEl) {
        activeNodeEl.classList.add('prim-active');
        const timeoutId = setTimeout(() => activeNodeEl.classList.remove('prim-active'), 260);
        timeoutsRef.current.push(timeoutId);
      }

      updatePrimStats(step.visitedNodes.length, totalNodes, totalWeight);
      playBellmanUpdate(totalWeight);

      await wait(getDelay());
    }

    clearPrimFringe();
    setIsAnimating(false);
    isAnimatingRef.current = false;
    updateActiveLine(null);
  };

  const animateBellmanFord = async (bellmanResult) => {
    const { iterations, relaxationSteps, negativeCycle, error } = bellmanResult;
    setIsAnimating(true);
    isAnimatingRef.current = true;
    setBellmanError('');
    updateActiveLine(0);

    const iterationEl = document.getElementById('bellman-iteration-count');
    if (iterationEl) iterationEl.innerText = '0';

    if (iterations[0]) updateBellmanDistanceLabels(iterations[0].distances);

    for (let i = 0; i < relaxationSteps.length; i++) {
      if (!isAnimatingRef.current) return;
      const step = relaxationSteps[i];

      updateActiveLine(2);
      const edgeEl = document.getElementById(`edge-svg-${step.from}-${step.to}`);
      if (edgeEl) edgeEl.classList.add('relaxing');
      playBellmanRelax(step.weight);

      await wait(Math.max(8, getDelay() * 0.55));
      if (!isAnimatingRef.current) return;

      updateBellmanDistanceLabels(step.distances);
      if (step.updated) {
        playBellmanUpdate(step.distances[step.to]);
        const nodeEl = document.getElementById(`node-svg-${step.to}`);
        if (nodeEl) {
          nodeEl.classList.add('distance-updated');
          const timeoutId = setTimeout(() => nodeEl.classList.remove('distance-updated'), 180);
          timeoutsRef.current.push(timeoutId);
        }
      }

      if (edgeEl) edgeEl.classList.remove('relaxing');
      const iterationCount = document.getElementById('bellman-iteration-count');
      if (iterationCount) iterationCount.innerText = String(step.iteration);
      updateActiveLine(step.updated ? 3 : 2);
      await wait(Math.max(6, getDelay() * 0.35));
    }

    if (negativeCycle) {
      playNegativeCycleAlert();
      setBellmanError(error || 'Negative Cycle Detected');
      setIsError(true);
      alert(error || 'Negative Cycle Detected');
    }

    const finalIteration = iterations[iterations.length - 1];
    if (finalIteration) updateBellmanDistanceLabels(finalIteration.distances);

    setIsAnimating(false);
    isAnimatingRef.current = false;
    updateActiveLine(null);
  };

  const animateAlgorithm = async (visitedNodesInOrder, nodesInShortestPathOrder, hasFailed) => {
    setIsAnimating(true);
    isAnimatingRef.current = true;
    updateActiveLine(0);
    
    let precalcFrames = [];
    let count = 0;
    
    for (let i = 0; i < visitedNodesInOrder.length; i++) {
        const node = visitedNodesInOrder[i];
        if (node.row !== undefined) {
             count = i + 1;
        } else if (node.type === 'node' && node.countAsVisit !== false) {
             count += 1;
        }
        
        precalcFrames.push({
            type: 'visit',
            node: node,
            nodesVisited: count,
            distance: node.distance,
            audio: { distance: node.distance || i },
            delayMult: node.phase === 'backtrack' ? 0.6 : 1,
            phase: node.phase
        });
    }

    if (!hasFailed) {
        let pCount = 0;
        for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
            const node = nodesInShortestPathOrder[i];
            if (node.row !== undefined) {
                pCount += node.weight || 1;
            } else if (node.type === 'node') {
                pCount += 1;
            }
            precalcFrames.push({
                type: 'path',
                node: node,
                pathLength: pCount,
                audio: { index: i },
                delayMult: 2
            });
        }
    } else {
        setIsError(true);
    }
    
    framesRef.current = precalcFrames;
    currentFrameIndexRef.current = 0;
    
    await wait(getDelay() * 2);
    playbackLoop();
  };

  const visualizeAlgorithm = async () => {
    if (isAnimatingRef.current) return;
    setIsError(false);
    setBellmanError('');
    setTopologicalError('');
    stopAnimation(); 
    try {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
    } catch(e) {}

    const cleanGrid = grid.map(row => row.map(n => ({...n, isVisited: false, isShortestPath: false, distance: Infinity, previousNode: null})));
    setGrid(cleanGrid); // 1. Render clean grid immediately

    // 2. Clone strict offline copy for the algorithms (Prevents React from instantly rendering the final result due to reference mutation)
    const offlineGrid = cleanGrid.map(row => row.map(n => ({...n})));

    const startNode = offlineGrid[startPos.row][startPos.col];
    const finishNode = offlineGrid[finishPos.row][finishPos.col];
    
    let hasFailed = false;
    const handleFailure = () => {
        hasFailed = true;
    };
    
    let visited, path;
    if (selectedAlgorithm === 'dijkstra') {
        visited = dijkstra(offlineGrid, startNode, finishNode, handleFailure);
        path = getNodesInShortestPathOrder(finishNode);
    } else if (selectedAlgorithm === 'astar') {
        visited = astar(offlineGrid, startNode, finishNode, handleFailure);
        path = getNodesInShortestPathOrder(finishNode);
    } else if (selectedAlgorithm === 'bfs') {
        if (!svgGraphRef.current) return;
        const currentGraph = svgGraphRef.current.getGraph();
        const bfsStartId = svgGraphRef.current.getStartNodeId();
        const bfsFinishId = svgGraphRef.current.getFinishNodeId();
        
        const bfsResult = bfs(currentGraph, bfsStartId, bfsFinishId, handleFailure);
        visited = bfsResult.visitedSteps;
        path = bfsResult.pathSteps;
    } else if (selectedAlgorithm === 'dfs') {
        if (!svgGraphRef.current) return;
        const currentGraph = svgGraphRef.current.getGraph();
        const currentEdges = svgGraphRef.current.getEdges();
        const dfsStartId = svgGraphRef.current.getStartNodeId();
        const dfsFinishId = svgGraphRef.current.getFinishNodeId();
        const dfsResult = dfs(currentGraph, currentEdges, dfsStartId, dfsFinishId, handleFailure);
        visited = dfsResult.visitedSteps;
        path = dfsResult.pathSteps;
    } else if (selectedAlgorithm === 'bellmanFord') {
        if (!svgGraphRef.current) return;
        const currentGraph = svgGraphRef.current.getGraph();
        const currentEdges = svgGraphRef.current.getEdges();
        const bfStartId = svgGraphRef.current.getStartNodeId();
        const bfResult = bellmanFord(currentGraph, currentEdges, bfStartId);
        svgGraphRef.current.clearVisuals();
        await animateBellmanFord(bfResult);
        return;
    } else if (selectedAlgorithm === 'topological') {
        if (!svgGraphRef.current) return;
        const currentGraph = svgGraphRef.current.getGraph();
        const currentEdges = svgGraphRef.current.getEdges();
        const topoResult = topologicalSort(currentGraph, currentEdges);
        svgGraphRef.current.clearVisuals();
        await wait(0);
        if (topoResult.steps[0]) updateTopologicalInDegrees(topoResult.steps[0].currentInDegrees);
        await animateTopologicalSort(topoResult, currentGraph.map((node) => node.id));
        return;
    } else if (selectedAlgorithm === 'kruskal') {
        if (!svgGraphRef.current) return;
        const currentGraph = svgGraphRef.current.getGraph();
        const currentEdges = svgGraphRef.current.getEdges();
        const kruskalSteps = kruskal(currentGraph, currentEdges);
        svgGraphRef.current.clearVisuals();
        await wait(0);
        await animateKruskal(kruskalSteps);
        return;
    } else if (selectedAlgorithm === 'prim') {
        if (!svgGraphRef.current) return;
        const currentGraph = svgGraphRef.current.getGraph();
        const currentEdges = svgGraphRef.current.getEdges();
        const primStartId = svgGraphRef.current.getStartNodeId();
        const primSteps = prim(currentGraph, currentEdges, primStartId);
        svgGraphRef.current.clearVisuals();
        await wait(0);
        await animatePrim(primSteps, currentGraph.length);
        return;
    }
    
    // Clear DOM before new animation and force reflow
    cleanGrid.forEach(row => row.forEach(node => {
        const domNode = document.getElementById(`node-${node.row}-${node.col}`);
        if (domNode) {
            domNode.classList.remove('node-visited', 'node-shortest-path', 'node-weight-visited-5', 'node-weight-visited-10');
        }
    }));
    
    if ((selectedAlgorithm === 'bfs' || selectedAlgorithm === 'dfs' || selectedAlgorithm === 'bellmanFord' || selectedAlgorithm === 'topological' || selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'prim') && svgGraphRef.current) {
        svgGraphRef.current.clearVisuals();
    }
    
    if (visited) await animateAlgorithm(visited, path, hasFailed);
  };

  const clearPathVisualsOnly = () => {
      stopAnimation();
      setIsError(false);
      setBellmanError('');
      setTopologicalError('');
      
      const nextGrid = grid.map(row => row.map(node => ({
        ...node,
        isVisited: false,
        isShortestPath: false,
        distance: Infinity,
        previousNode: null,
        f: Infinity, g: Infinity, h: Infinity
      })));
      setGrid(nextGrid);
      
      // Clear DOM classes manually to ensure immediate sync
      nextGrid.forEach(row => row.forEach(node => {
          const domNode = document.getElementById(`node-${node.row}-${node.col}`);
          if (domNode) {
              domNode.classList.remove('node-visited', 'node-shortest-path', 'node-weight-visited-5', 'node-weight-visited-10');
          }
      }));
      
      if ((selectedAlgorithm === 'bfs' || selectedAlgorithm === 'dfs' || selectedAlgorithm === 'bellmanFord' || selectedAlgorithm === 'topological' || selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'prim') && svgGraphRef.current) {
          svgGraphRef.current.clearVisuals();
          if (selectedAlgorithm === 'bellmanFord') {
            const nodes = svgGraphRef.current.getGraph();
            const start = svgGraphRef.current.getStartNodeId();
            const resetDist = {};
            nodes.forEach((node) => { resetDist[node.id] = node.id === start ? 0 : Infinity; });
            updateBellmanDistanceLabels(resetDist);
          }
      }
      
      const countEl = document.getElementById('nodes-visited-count');
      if (countEl) countEl.innerText = '0';
      const iterationEl = document.getElementById('bellman-iteration-count');
      if (iterationEl) iterationEl.innerText = '0';
      const mstTotalEl = document.getElementById('mst-total-weight-count');
      if (mstTotalEl) mstTotalEl.innerText = '0';
      const primProgressEl = document.getElementById('prim-progress-fill');
      if (primProgressEl) primProgressEl.style.width = '0%';
      const primProgressTextEl = document.getElementById('prim-progress-text');
      if (primProgressTextEl) primProgressTextEl.innerText = '0 / 0';
      setNodesVisitedCount(0);
      setPathLengthCount(0);
  };

  const clearBoard = () => {
      stopAnimation();
      setIsError(false);
      setBellmanError('');
      setTopologicalError('');
      setGrid(getInitialGrid());
      setStartPos({ row: 10, col: 5 });
      setFinishPos({ row: 10, col: 35 });
      
      const countEl = document.getElementById('nodes-visited-count');
      if (countEl) countEl.innerText = '0';
      const lengthEl = document.getElementById('path-length-count');
      if (lengthEl) lengthEl.innerText = '0';
      const iterationEl = document.getElementById('bellman-iteration-count');
      if (iterationEl) iterationEl.innerText = '0';
      const mstTotalEl = document.getElementById('mst-total-weight-count');
      if (mstTotalEl) mstTotalEl.innerText = '0';
      const primProgressEl = document.getElementById('prim-progress-fill');
      if (primProgressEl) primProgressEl.style.width = '0%';
      const primProgressTextEl = document.getElementById('prim-progress-text');
      if (primProgressTextEl) primProgressTextEl.innerText = '0 / 0';

      setNodesVisitedCount(0);
      setPathLengthCount(0);
  };

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
          visualizeAlgorithm();
        }
      }
      
      // Arrows Left/Right: Speed
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = SPEED_OPTIONS.indexOf(speed);
        if (e.code === 'ArrowRight' && currentIndex < SPEED_OPTIONS.length - 1) {
          setSpeedState(SPEED_OPTIONS[currentIndex + 1]);
        } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
          setSpeedState(SPEED_OPTIONS[currentIndex - 1]);
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
  }, [speed, isAnimating]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col relative overflow-hidden"
    >
      <Header navigate={navigate} t={t} language={language} setLanguage={setLanguage} />
      {/*
        <div className="flex-1 flex justify-start">
            <button onClick={() => navigate('/')} className="flex items-center gap-1 text-emerald-200 hover:text-white transition-colors duration-300">
                <ChevronLeft size={24} />
                <span className="hidden md:inline font-semibold">Hub</span>
            </button>
        </div>
        <h1 className="flex-none text-2xl md:text-3xl lg:text-4xl font-bold tracking-wider text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] text-center">
          {t.graphTitle}
        </h1>
        <div className="flex-1 flex justify-end">
          <div className="flex gap-1 bg-neutral-900/50 p-1 rounded-lg border border-emerald-500/20 shadow-lg backdrop-blur-sm hidden sm:flex">
            <button onClick={() => setLanguage('ua')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'ua' ? 'bg-emerald-600 shadow text-white' : 'text-emerald-200 hover:bg-emerald-800'}`}>UA</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${language === 'en' ? 'bg-emerald-600 shadow text-white' : 'text-emerald-200 hover:bg-emerald-800'}`}>EN</button>
          </div>
        </div>
      */}
      
      <main className="flex-1 w-full max-w-[1700px] mx-auto flex flex-col items-center justify-start p-4 lg:p-6 relative z-10">
        
        <ControlsPanel
          dropdownRef={dropdownRef}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          selectedAlgorithm={selectedAlgorithm}
          setSelectedAlgorithm={setSelectedAlgorithm}
          clearPathVisualsOnly={clearPathVisualsOnly}
          visualizeAlgorithm={visualizeAlgorithm}
          isAnimating={isAnimating}
          stopAnimation={stopAnimation}
          clearBoard={clearBoard}
          speed={speed}
          setSpeed={setSpeed}
          algorithmCategories={algorithmCategories}
          flatAlgorithms={flatAlgorithms}
          t={t}
          isAnimatingRef={isAnimatingRef}
          isPaused={isPaused}
          togglePause={togglePause}
          stepForward={stepForward}
          stepBackward={stepBackward}
        />

        <div className="w-full mb-4 flex flex-wrap gap-4 text-sm bg-neutral-900/30 px-6 py-3 rounded-xl border border-emerald-500/10 justify-between items-center z-10">
             <div className="flex gap-6 items-center">
                 <div className="flex gap-2 items-center"><span className="text-emerald-200/70 font-semibold">{t.nodesVisited}</span><span className="font-mono text-emerald-400 text-lg sm:text-xl font-bold bg-neutral-950 px-2 py-0.5 rounded shadow-inner">{nodesVisitedCount}</span></div>
                 <div className="flex gap-2 items-center"><span className="text-purple-200/70 font-semibold">{t.pathLength}</span><span className="font-mono text-purple-400 text-lg sm:text-xl font-bold bg-neutral-950/50 px-2 py-0.5 rounded shadow-inner">{pathLengthCount}</span></div>
                 {(selectedAlgorithm === 'bellmanFord') && <div className="flex gap-2 items-center"><span className="text-sky-200/70 font-semibold">{t.iterationLabel || 'Iteration'}</span><span id="bellman-iteration-count" className="font-mono text-sky-300 text-lg sm:text-xl font-bold bg-sky-950/50 px-2 py-0.5 rounded shadow-inner">0</span></div>}
                 {(selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'prim') && <div className="flex gap-2 items-center"><span className="text-yellow-200/70 font-semibold">Total Weight:</span><span id="mst-total-weight-count" className="font-mono text-yellow-300 text-lg sm:text-xl font-bold bg-yellow-950/40 px-2 py-0.5 rounded shadow-inner">0</span></div>}
                 {(selectedAlgorithm === 'prim') && <div className="flex items-center gap-2 min-w-[220px]"><span className="text-emerald-200/70 font-semibold">Visited:</span><div className="h-2 flex-1 rounded-full bg-neutral-950 border border-emerald-700/60 overflow-hidden"><div id="prim-progress-fill" className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-[width] duration-200" style={{ width: '0%' }}></div></div><span id="prim-progress-text" className="font-mono text-emerald-300 text-sm font-bold">0 / 0</span></div>}
             </div>
             <div className="flex flex-wrap items-center gap-4 text-emerald-200/60 text-[10px] sm:text-xs tracking-wide font-bold uppercase">
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> {t.startNode}</div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> {t.finishNode}</div>
               {(selectedAlgorithm === 'dijkstra' || selectedAlgorithm === 'astar') && (
                 <>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-neutral-900 rounded-sm border border-emerald-500"></div> {t.wallNode}</div>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-600 rounded-sm border border-amber-400 relative flex items-center justify-center"><span className="text-[7px] text-white">5</span></div> {t.weightNode}</div>
                 </>
               )}
             </div>
        </div>

        {selectedAlgorithm !== 'bfs' && selectedAlgorithm !== 'dfs' && selectedAlgorithm !== 'bellmanFord' && selectedAlgorithm !== 'topological' && selectedAlgorithm !== 'kruskal' && selectedAlgorithm !== 'prim' && (
        <div className="w-full mb-4 bg-neutral-950 p-3 rounded-xl border border-emerald-500/20 shadow-md flex flex-wrap gap-4 items-center justify-center md:justify-start z-10 transition-all backdrop-blur-sm">
            <span className="text-emerald-200/70 font-semibold text-xs tracking-wider uppercase ml-2">{t.dragToPaint || "Select a brush to paint:"}</span>
            <div className="flex bg-neutral-950 rounded-lg p-1 border border-emerald-500/30 shadow-inner overflow-hidden">
                <button onClick={() => { setActiveBrush(TOOLS.WALL); activeBrushRef.current = TOOLS.WALL; }} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeBrush === TOOLS.WALL ? 'bg-emerald-600/90 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-800/30'}`}>{t.toolWall || 'Wall'}</button>
                <button onClick={() => { setActiveBrush(TOOLS.WEIGHT_5); activeBrushRef.current = TOOLS.WEIGHT_5; }} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeBrush === TOOLS.WEIGHT_5 ? 'bg-emerald-800/90 text-white shadow-[0_0_10px_rgba(6,95,70,0.5)]' : 'text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-800/30'}`}>{t.toolWeight5 || 'Weight 5'}</button>
                <button onClick={() => { setActiveBrush(TOOLS.WEIGHT_10); activeBrushRef.current = TOOLS.WEIGHT_10; }} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeBrush === TOOLS.WEIGHT_10 ? 'bg-neutral-900/90 text-white shadow-[0_0_10px_rgba(6,78,59,0.5)]' : 'text-amber-600/60 hover:text-amber-400 hover:bg-amber-900/30'}`}>{t.toolWeight10 || 'Weight 10'}</button>
                <button onClick={() => { setActiveBrush(TOOLS.ERASER); activeBrushRef.current = TOOLS.ERASER; }} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeBrush === TOOLS.ERASER ? 'bg-red-600/90 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'text-red-400/60 hover:text-red-300 hover:bg-red-900/30'}`}>{t.toolEraser || 'Eraser'}</button>
            </div>
        </div>
        )}

        {selectedAlgorithm !== 'bfs' && selectedAlgorithm !== 'dfs' && selectedAlgorithm !== 'bellmanFord' && selectedAlgorithm !== 'topological' && selectedAlgorithm !== 'kruskal' && selectedAlgorithm !== 'prim' && (
        <div className="w-full mb-3 bg-neutral-950/40 p-3 xl:p-4 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-md flex flex-col md:flex-row gap-4 xl:gap-6 items-center justify-between z-10 transition-all">
            <div className="flex items-center gap-2 text-emerald-300 font-bold tracking-wider uppercase text-sm w-full md:w-auto justify-center md:justify-start">{t.graphSettingsTitle || "Graph Settings"}</div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 xl:gap-5 w-full md:w-auto justify-center md:justify-end">
                <div className="flex items-center gap-2 xl:gap-3"><label className="text-xs font-semibold text-emerald-200/70 uppercase whitespace-nowrap">{t.inputRows || "Rows"}</label><input type="text" inputMode="numeric" value={inputRows} onChange={(e) => setInputRows(e.target.value.replace(/[^0-9]/g, ''))} disabled={isAnimating} className="w-14 xl:w-16 bg-neutral-900/50 border border-emerald-500/30 rounded px-2 py-1 text-emerald-100 font-mono text-center outline-none focus:border-emerald-400 disabled:opacity-50" /></div>
                <div className="flex items-center gap-2 xl:gap-3"><label className="text-xs font-semibold text-emerald-200/70 uppercase whitespace-nowrap">{t.inputCols || "Cols"}</label><input type="text" inputMode="numeric" value={inputCols} onChange={(e) => setInputCols(e.target.value.replace(/[^0-9]/g, ''))} disabled={isAnimating} className="w-14 xl:w-16 bg-neutral-900/50 border border-emerald-500/30 rounded px-2 py-1 text-emerald-100 font-mono text-center outline-none focus:border-emerald-400 disabled:opacity-50" /></div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0"><button onClick={handleGenerateGrid} disabled={isAnimating} className="flex-1 sm:flex-none px-4 py-1.5 xl:py-2 bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold rounded transition-all text-xs uppercase disabled:opacity-50 tracking-wide border border-emerald-500/50">{t.generateGrid || "Generate"}</button><button onClick={handleResetSettings} disabled={isAnimating} className="flex-1 sm:flex-none px-4 py-1.5 xl:py-2 bg-red-900/40 hover:bg-red-800/80 text-red-100 font-semibold rounded shadow-md transition-all text-xs uppercase disabled:opacity-50 tracking-wide border border-red-500/30">{t.resetSettings || "Reset"}</button></div>
            </div>
        </div>
        )}

        {(selectedAlgorithm === 'bfs' || selectedAlgorithm === 'dfs' || selectedAlgorithm === 'bellmanFord' || selectedAlgorithm === 'topological' || selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'prim') && (
        <div className="w-full mb-3 bg-neutral-950/40 p-3 xl:p-4 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-md flex flex-col md:flex-row gap-4 xl:gap-6 items-center justify-between z-10 transition-all">
            <div className="flex items-center gap-2 text-emerald-300 font-bold tracking-wider uppercase text-sm w-full md:w-auto justify-center md:justify-start">
              {selectedAlgorithm === 'bellmanFord'
                ? (t.bellmanFordSvgGraphTitle || 'Bellman-Ford Weighted Graph')
                : selectedAlgorithm === 'prim'
                  ? 'Prim MST Weighted Graph'
                : selectedAlgorithm === 'kruskal'
                  ? 'Kruskal MST Weighted Graph'
                : selectedAlgorithm === 'topological'
                  ? (t.topologicalSvgGraphTitle || 'Topological Sort DAG')
                : selectedAlgorithm === 'dfs'
                  ? (t.dfsSvgGraphTitle || 'DFS SVG Graph')
                  : (t.bfsSvgGraphTitle || 'BFS SVG Graph')}
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 xl:gap-5 w-full md:w-auto justify-center md:justify-end">
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                   <button onClick={() => setShowEditorModal(true)} disabled={isAnimating} className="flex-1 sm:flex-none px-4 py-1.5 xl:py-2 bg-slate-700/80 hover:bg-slate-600/90 text-white font-semibold rounded shadow-md transition-all text-xs uppercase disabled:opacity-50 tracking-wide border border-slate-500/50 flex items-center justify-center gap-1.5"><Settings size={14}/> {t.editBtn || 'Edit'}</button>
                   <button onClick={() => {
                       svgGraphRef.current?.clearVisuals();
                       if (selectedAlgorithm === 'bellmanFord') {
                         svgGraphRef.current?.loadBellmanFordExample();
                         const base = svgGraphRef.current?.getBellmanFordExample?.() || [];
                         const initialDist = {};
                         base.forEach((node) => { initialDist[node.id] = node.id === 's' ? 0 : Infinity; });
                         updateBellmanDistanceLabels(initialDist);
                       } else if (selectedAlgorithm === 'topological') {
                         svgGraphRef.current?.randomizeGraph();
                       } else if (selectedAlgorithm === 'kruskal') {
                         svgGraphRef.current?.loadKruskalExample();
                       } else if (selectedAlgorithm === 'prim') {
                         svgGraphRef.current?.loadPrimExample();
                       } else if (selectedAlgorithm === 'dfs') {
                         svgGraphRef.current?.loadDfsExample();
                       } else {
                         svgGraphRef.current?.randomizeGraph();
                       }
                       setNodesVisitedCount(0);
                       setPathLengthCount(0);
                       const countEl = document.getElementById('nodes-visited-count');
                       if (countEl) countEl.innerText = '0';
                       const lengthEl = document.getElementById('path-length-count');
                       if (lengthEl) lengthEl.innerText = '0';
                       const mstTotalEl = document.getElementById('mst-total-weight-count');
                       if (mstTotalEl) mstTotalEl.innerText = '0';
                       const primProgressEl = document.getElementById('prim-progress-fill');
                       if (primProgressEl) primProgressEl.style.width = '0%';
                       const primProgressTextEl = document.getElementById('prim-progress-text');
                       if (primProgressTextEl) primProgressTextEl.innerText = '0 / 0';
                   }} disabled={isAnimating} className="flex-1 sm:flex-none px-4 py-1.5 xl:py-2 bg-purple-600/80 hover:bg-purple-500 text-white font-semibold rounded shadow-md transition-all text-xs uppercase disabled:opacity-50 tracking-wide border border-purple-500/50">
                     {(selectedAlgorithm === 'bellmanFord' || selectedAlgorithm === 'dfs' || selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'prim')
                      ? (t.resetToExampleBtn || 'Reset to Example')
                      : (t.randomizeGraphBtn || 'Randomize Graph')}
                   </button>
                </div>
                {selectedAlgorithm === 'bellmanFord' && (
                  <div id="bellman-negative-cycle-banner" className={`text-xs font-bold uppercase tracking-wider ${bellmanError ? 'text-red-300' : 'text-emerald-200/50'}`}>
                    {bellmanError || (t.noNegativeCycleMsg || 'No negative cycle detected')}
                  </div>
                )}
                {selectedAlgorithm === 'topological' && (
                  <div id="topological-cycle-banner" className={`text-xs font-bold uppercase tracking-wider ${topologicalError ? 'text-red-300' : 'text-emerald-200/50'}`}>
                    {topologicalError || (t.topologicalReadyMsg || 'Ready for DAG sorting')}
                  </div>
                )}
                {selectedAlgorithm === 'prim' && (
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-200/50">
                    Click a node to choose Prim root
                  </div>
                )}
            </div>
        </div>
        )}

        <GridCanvas
          selectedAlgorithm={selectedAlgorithm}
          flatAlgorithms={flatAlgorithms}
          t={t}
          isAnimating={isAnimating}
          isError={isError}
          grid={grid}
          startPos={startPos}
          finishPos={finishPos}
          handleMouseDown={handleMouseDown}
          handleMouseEnter={handleMouseEnter}
          drawingType={drawingType}
          svgGraphRef={svgGraphRef}
        />
      </main>
      
      {(selectedAlgorithm === 'bfs' || selectedAlgorithm === 'dfs' || selectedAlgorithm === 'bellmanFord' || selectedAlgorithm === 'topological' || selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'prim') && (
          <GraphEditorModal 
              isOpen={showEditorModal}
              onClose={() => setShowEditorModal(false)}
              initialNodes={svgGraphRef.current ? svgGraphRef.current.getGraph() : []}
              initialStart={svgGraphRef.current ? svgGraphRef.current.getStartNodeId() : 0}
              initialFinish={svgGraphRef.current ? svgGraphRef.current.getFinishNodeId() : 0}
              onSave={(newNodes, newStart, newEnd) => {
                  svgGraphRef.current?.clearVisuals();
                  svgGraphRef.current?.loadCustomGraph(newNodes, newStart, newEnd);
                  setNodesVisitedCount(0);
                  setPathLengthCount(0);
                  const countEl = document.getElementById('nodes-visited-count');
                  if (countEl) countEl.innerText = '0';
                  const lengthEl = document.getElementById('path-length-count');
                  if (lengthEl) lengthEl.innerText = '0';
                  setShowEditorModal(false);
              }}
          />
      )}
    </motion.div>
  );
};

export default GraphVisualizer;
