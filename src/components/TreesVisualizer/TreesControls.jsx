import React from 'react';
import { Play, RotateCcw, Square, Shuffle, Search, ChevronDown, StepForward } from 'lucide-react';

export const TreesControls = ({
    selectedAlgorithm,
    setSelectedAlgorithm,
    TREE_ALGORITHMS,
    speed,
    setSpeed,
    SPEED_OPTIONS,
    isAnimating,
    startAlgorithm,
    stopAlgorithm,
    resetVisualization,
    generateNewTree,
    targetValue,
    setTargetValue,
    language,
    labels,
    isPaused,
    togglePause,
    stepForward
}) => {
    return (
        <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 rounded-2xl shadow-inner border transition-all bg-neutral-900/40 border-amber-500/20 z-50">
          
          <div className="flex flex-col gap-2 w-full lg:w-1/2">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="flex flex-col gap-1 shrink-0 w-full sm:w-auto">
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => {
                      setSelectedAlgorithm(e.target.value);
                      resetVisualization();
                  }}
                  disabled={isAnimating}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm text-amber-100 cursor-pointer disabled:opacity-50"
                >
                  {TREE_ALGORITHMS.map((algo) => (
                    <option key={algo.id} value={algo.id}>{algo.label}</option>
                  ))}
                </select>
              </div>

              {selectedAlgorithm === 'bst-search' && (
                  <div className="relative flex items-center w-full sm:w-[140px]">
                      <Search size={16} className="absolute left-3 text-amber-500/50" />
                      <input
                          type="number"
                          value={targetValue}
                          onChange={(e) => setTargetValue(e.target.value ? Number(e.target.value) : '')}
                          disabled={isAnimating}
                          placeholder={labels[language].searchPlaceholder}
                          className="w-full px-4 py-2.5 pl-9 bg-neutral-950 border border-neutral-800 rounded-lg outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm text-amber-100 placeholder-neutral-600 font-mono disabled:opacity-50"
                      />
                  </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-neutral-800 lg:pl-6 relative">
            <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
              <label className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                {labels[language].speed} <span className="text-white font-mono">{speed}x</span>
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-center">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSpeed(option)}
                    className={`h-10 min-w-[3rem] px-3 text-base font-medium rounded-md border transition-all flex items-center justify-center ${
                      speed === option
                        ? 'bg-amber-500/70 border-amber-300 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-amber-200 hover:bg-neutral-800'
                    }`}
                  >
                    {option}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              {!isAnimating ? (
                <button
                  onClick={startAlgorithm}
                  disabled={selectedAlgorithm === 'bst-search' && targetValue === ''}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-amber-600/90 text-white font-bold rounded-xl hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all border border-amber-400/50 disabled:opacity-50"
                >
                  <Play size={18} /> {labels[language].startBtn}
                </button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={togglePause}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 font-bold tracking-wide rounded-lg transition-all uppercase ${isPaused ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300' : 'bg-red-500/90 text-white hover:bg-red-400'}`}
                  >
                    {isPaused ? labels[language].resumeBtn || "Продовжити" : labels[language].pauseBtn || "Пауза"}
                  </button>
                  
                  {isPaused && (
                    <button
                      onClick={stepForward}
                      className="flex-none px-4 py-2.5 bg-blue-900/60 border border-blue-500/50 text-blue-300 flex items-center justify-center rounded-lg hover:bg-blue-800/80 transition-all shadow-inner"
                      title="Next Step (Arrow Down or Enter)"
                    >
                      <StepForward size={18} strokeWidth={2.5} />
                    </button>
                  )}

                  <button
                    onClick={stopAlgorithm}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600/80 text-white font-bold tracking-wide rounded-lg hover:bg-red-500 transition-all uppercase"
                  >
                    <Square size={18} fill="currentColor" /> {labels[language].stopBtn}
                  </button>
                </div>
              )}

              <button
                onClick={resetVisualization}
                disabled={isAnimating}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900/50 text-amber-200 font-semibold rounded-lg hover:bg-neutral-800 transition-all border border-amber-700/50 disabled:opacity-50"
                title={labels[language].clear}
              >
                <RotateCcw size={18} /> <span className="hidden lg:inline">{labels[language].clear}</span>
              </button>
              
              <button
                onClick={generateNewTree}
                disabled={isAnimating}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900/50 text-amber-200 font-semibold rounded-lg hover:bg-neutral-800 transition-all border border-amber-700/50 disabled:opacity-50"
                title={labels[language].newTree}
              >
                <Shuffle size={18} /> <span className="hidden lg:inline">{labels[language].newTree}</span>
              </button>
            </div>
          </div>
        </div>
    );
};
