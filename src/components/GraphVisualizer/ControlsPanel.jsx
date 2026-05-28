import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trash2, Square, ChevronDown, StepForward, StepBack } from 'lucide-react';
import { SPEED_OPTIONS } from './GraphVisualizerUtils';

export const ControlsPanel = ({
  dropdownRef,
  isDropdownOpen,
  setIsDropdownOpen,
  selectedAlgorithm,
  setSelectedAlgorithm,
  clearPathVisualsOnly,
  visualizeAlgorithm,
  isAnimating,
  stopAnimation,
  clearBoard,
  speed,
  setSpeed,
  algorithmCategories,
  flatAlgorithms,
  t,
  isAnimatingRef,
  isPaused,
  togglePause,
  stepForward,
  stepBackward
}) => {
  return (
    <div className="w-full mb-4 flex flex-col lg:flex-row justify-between items-center bg-neutral-950/40 p-4 rounded-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] backdrop-blur-sm gap-4 relative z-50">
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
        <div className="relative w-full sm:w-[280px]" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-neutral-950/60 border border-emerald-500/30 rounded-lg text-emerald-100 font-medium hover:bg-neutral-900/80 transition-all w-full">
            <span className="truncate">{selectedAlgorithm === 'kruskal' ? 'Алгоритм Краскала (MST)' : selectedAlgorithm === 'prim' ? 'Алгоритм Прима (MST)' : (t[flatAlgorithms.find(a => a.id === selectedAlgorithm)?.key] || 'Algorithm')}</span>
            <ChevronDown size={16} className={`shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 mt-2 min-w-[280px] w-full bg-[#0B0B0F]/95 backdrop-blur-md border border-emerald-500/30 rounded-xl shadow-2xl overflow-y-auto max-h-[60vh] z-[100] flex flex-col py-2">
                {algorithmCategories.map((cat, catIndex) => (
                  <React.Fragment key={cat.id}>
                    <div className="px-4 py-2 mt-1 first:mt-0"><span className="text-[10px] sm:text-xs font-bold text-emerald-500/60 uppercase tracking-wider select-none">{t[cat.key]}</span></div>
                    <div className="flex flex-col">
                      {cat.items.map(algo => (
                        <button key={algo.id} onClick={() => { setSelectedAlgorithm(algo.id); setIsDropdownOpen(false); clearPathVisualsOnly(); }} className={`w-full text-left pl-6 pr-4 py-2.5 text-sm transition-all border-l-4 ${selectedAlgorithm === algo.id ? 'text-emerald-400 font-bold bg-emerald-500/10 border-emerald-400' : 'text-white border-transparent hover:bg-emerald-500/20 hover:border-emerald-400'}`}>{algo.id === 'kruskal' ? 'Алгоритм Краскала (MST)' : algo.id === 'prim' ? 'Алгоритм Прима (MST)' : t[algo.key]}</button>
                      ))}
                    </div>
                    {catIndex < algorithmCategories.length - 1 && <div className="h-px w-full bg-emerald-500/20 my-2"></div>}
                  </React.Fragment>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!isAnimating ? (
          <button onClick={async () => { if (!isAnimatingRef.current) await visualizeAlgorithm(); }} disabled={isAnimating} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-3 bg-emerald-600/90 text-white font-bold rounded-xl hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all border border-emerald-400/50"><Play size={18} /> {t.graphStartBtn || "ЗАПУСТИТИ"}</button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={togglePause} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 font-bold tracking-wide rounded-lg transition-all uppercase ${isPaused ? 'bg-amber-400 text-blue-950 hover:bg-amber-300' : 'bg-amber-600/80 text-white hover:bg-amber-500'}`}>
              {isPaused ? (t.resumeBtn || "Продовжити") : (t.pauseBtn || "Пауза")}
            </button>
            {isPaused && (
               <>
                 <button onClick={stepBackward} className="flex-none px-4 py-2.5 bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 flex items-center justify-center rounded-lg hover:bg-emerald-800/80 transition-all shadow-inner" title="Previous Step (Arrow Up or Backspace)">
                   <StepBack size={18} strokeWidth={2.5} />
                 </button>
                 <button onClick={stepForward} className="flex-none px-4 py-2.5 bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 flex items-center justify-center rounded-lg hover:bg-emerald-800/80 transition-all shadow-inner" title="Next Step (Arrow Down or Enter)">
                   <StepForward size={18} strokeWidth={2.5} />
                 </button>
               </>
            )}
            <button onClick={stopAnimation} disabled={!isAnimating} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600/80 text-white font-bold tracking-wide rounded-lg hover:bg-red-500 transition-all uppercase disabled:opacity-50"><Square size={18} fill="currentColor" /> {t.stopBtn || "Зупинити"}</button>
          </div>
        )}
        <button onClick={clearPathVisualsOnly} disabled={isAnimating} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900/50 text-emerald-200 font-semibold rounded-lg hover:bg-emerald-800 transition-all border border-emerald-700/50 disabled:opacity-50"><RotateCcw size={18} /> {t.clearPath}</button>
        <button onClick={clearBoard} disabled={isAnimating} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-950/50 text-red-300 font-semibold rounded-lg hover:bg-red-900/80 transition-all border border-red-800/50 disabled:opacity-50"><Trash2 size={18} /> {t.clearBoard}</button>
      </div>
      <div className="flex flex-col items-center lg:items-end w-full lg:w-auto gap-2">
        <div className="flex flex-col items-center lg:items-end w-full lg:w-48 gap-1">
          <label className="text-xs font-semibold text-emerald-300/80 uppercase tracking-widest flex justify-between w-full"><span>{t.speed}</span><span className="font-mono">{speed}x</span></label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-center">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSpeed(option)}
                className={`h-9 min-w-10 px-2 rounded-md border text-sm font-semibold transition-all flex items-center justify-center ${speed === option ? 'bg-emerald-600/90 border-emerald-300 text-white' : 'bg-neutral-950 border-emerald-700/70 text-emerald-200 hover:bg-emerald-800/70'}`}
              >
                {option}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
