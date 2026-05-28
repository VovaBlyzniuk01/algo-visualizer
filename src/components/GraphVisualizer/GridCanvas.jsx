import React from 'react';
import { motion } from 'framer-motion';
import Node from './Node';
import NodeLinkGraph from './NodeLinkGraph';
import { PSEUDOCODES, renderCode } from './GraphVisualizerUtils';

export const GridCanvas = ({
    selectedAlgorithm,
    flatAlgorithms,
    t,
    isAnimating,
    isError,
    grid,
    startPos,
    finishPos,
    handleMouseDown,
    handleMouseEnter,
    drawingType,
    svgGraphRef
}) => {
    return (
<div className="flex gap-6 flex-1 items-stretch w-full overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950/20 border border-emerald-500/20 rounded-2xl shadow-xl overflow-hidden max-w-full relative z-0 p-4">
                {(selectedAlgorithm !== 'dijkstra' && selectedAlgorithm !== 'astar' && selectedAlgorithm !== 'bfs' && selectedAlgorithm !== 'dfs' && selectedAlgorithm !== 'bellmanFord' && selectedAlgorithm !== 'topological' && selectedAlgorithm !== 'kruskal' && selectedAlgorithm !== 'prim') && (
                    <div className="absolute inset-0 z-50 bg-neutral-950 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <div className="bg-neutral-950/90 border border-emerald-500/40 p-8 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] text-center max-w-md mx-4">
                             <h3 className="text-2xl font-bold text-emerald-400 mb-3 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">{selectedAlgorithm === 'kruskal' ? 'Алгоритм Краскала (MST)' : selectedAlgorithm === 'prim' ? 'Алгоритм Прима (MST)' : t[flatAlgorithms.find(a => a.id === selectedAlgorithm)?.key]}</h3>
                             <p className="text-emerald-100/80 font-medium">{t.comingSoonDesc || "This algorithm is currently under development. Coming soon!"}</p>
                        </div>
                    </div>
                )}
                <div className="flex flex-col items-center justify-center border border-emerald-500/30 p-2 bg-neutral-950/40 rounded-xl shadow-2xl relative w-full overflow-hidden">
                  {(selectedAlgorithm === 'bfs' || selectedAlgorithm === 'dfs' || selectedAlgorithm === 'bellmanFord' || selectedAlgorithm === 'topological' || selectedAlgorithm === 'kruskal' || selectedAlgorithm === 'prim') ? (
                      <NodeLinkGraph ref={svgGraphRef} algorithmType={selectedAlgorithm} />
                  ) : (
                      <div className={`grid-container m-auto mt-2 scale-[0.65] sm:scale-[0.8] md:scale-95 xl:scale-100 origin-center select-none ${isError ? 'grid-error' : ''}`} style={{ pointerEvents: isAnimating ? 'none' : 'auto' }}>
                      {grid.map((row, rIdx) => (
                        <div key={rIdx} className="grid-row">
                            {row.map((node, cIdx) => (
                                <Node 
                                    key={`${node.row}-${node.col}`}
                                    {...node}
                                    isStart={node.row === startPos.row && node.col === startPos.col}
                                    isFinish={node.row === finishPos.row && node.col === finishPos.col}
                                    onMouseDown={handleMouseDown}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseUp={() => (drawingType.current = null)}
                                />
                            ))}
                        </div>
                      ))}
                      </div>
                  )}
                </div>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="hidden lg:flex w-[450px] bg-[#0d1c15] border border-emerald-500/20 rounded-2xl shadow-2xl flex-col overflow-hidden text-left max-h-full">
               <div className="p-3 border-b border-emerald-500/20 flex items-center justify-between gap-2 bg-neutral-900/10">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/80"></div><div className="w-3 h-3 rounded-full bg-yellow-500/80"></div><div className="w-3 h-3 rounded-full bg-green-500/80"></div><h3 className="font-semibold text-xs ml-2 text-emerald-100 font-mono tracking-tight">{selectedAlgorithm === 'astar' ? 'AStarAlgorithm.js' : selectedAlgorithm === 'bfs' ? 'BreadthFirstSearch.js' : selectedAlgorithm === 'dfs' ? 'DepthFirstSearch.js' : selectedAlgorithm === 'bellmanFord' ? 'BellmanFord.js' : selectedAlgorithm === 'topological' ? 'TopologicalSort.js' : selectedAlgorithm === 'kruskal' ? 'KruskalAlgorithm.js' : selectedAlgorithm === 'prim' ? 'PrimAlgorithm.js' : 'DijkstraAlgorithm.js'}</h3></div>
               </div>
               <div className="py-3 flex-1 bg-[#060c09] relative flex flex-col justify-start overflow-hidden">
                 <pre className="font-mono text-[11px] md:text-[12px] leading-snug tracking-wide text-emerald-300/70 relative z-0 px-2 lg:px-4 ">
                   
                   {(PSEUDOCODES[selectedAlgorithm] || []).map((line, idx) => <div key={idx} id={`code-line-${idx}`} className="py-1 -mx-3 px-3 rounded-md transition-colors duration-150 relative overflow-hidden whitespace-pre border-l-[2px] border-transparent">{renderCode(line)}</div>)}
                 </pre>
               </div>
            </motion.div>
         </div>
    );
};
