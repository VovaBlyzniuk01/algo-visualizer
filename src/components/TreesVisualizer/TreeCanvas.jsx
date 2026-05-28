import React from 'react';
import { motion } from 'framer-motion';

export const TreeCanvas = ({ root, getEdges, getNodesList, activeNode, visitedNodes, finalPath }) => {
    if (!root) return null;
    const edges = getEdges(root);
    const nodes = getNodesList(root);

    return (
        <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(245,158,11,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <svg viewBox="0 0 1000 500" className="w-full h-full relative z-10 max-h-[75vh]" preserveAspectRatio="xMidYMid meet">
                {edges.map((edge) => {
                    const isVisited = visitedNodes.includes(edge.target.id);
                    const isFinalPath = finalPath.includes(edge.target.id) && finalPath.includes(edge.source.id);
                    
                    let strokeColor = "#262626"; // neutral-800
                    let strokeWidth = "3";
                    
                    if (isFinalPath) {
                        strokeColor = "#10b981"; // emerald-500
                        strokeWidth = "4";
                    } else if (isVisited) {
                        strokeColor = "#f59e0b"; // amber-500
                    }

                    return (
                        <motion.line
                            key={edge.id}
                            x1={edge.source.x}
                            y1={edge.source.y}
                            x2={edge.target.x}
                            y2={edge.target.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8 }}
                            style={isFinalPath ? { filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.4))' } : {}}
                        />
                    );
                })}
                
                {nodes.map((node) => {
                    const isVisited = visitedNodes.includes(node.id);
                    const isActive = activeNode === node.id;
                    const isFinal = finalPath.includes(node.id);
                    const isTargetFound = finalPath.length > 0 && finalPath[finalPath.length - 1] === node.id;

                    let fill = "#171717"; // neutral-900
                    let stroke = "#404040"; // neutral-700
                    let textColor = "#a3a3a3"; // neutral-400
                    let filter = "none";

                    if (isTargetFound) {
                        fill = "rgba(16, 185, 129, 0.2)"; // emerald-500/20
                        stroke = "#10b981"; // emerald-500
                        textColor = "#34d399"; // emerald-400
                        filter = 'drop-shadow(0 0 15px rgba(16,185,129,0.4))';
                    } else if (isActive) {
                        fill = "rgba(245, 158, 11, 0.2)"; // amber-500/20
                        stroke = "#f59e0b"; // amber-500
                        textColor = "#fbbf24"; // amber-400
                        filter = 'drop-shadow(0 0 15px rgba(244,63,94,0.4))'; // Using similar to string matcher but amber
                    } else if (isFinal) {
                        fill = "rgba(16, 185, 129, 0.1)"; // emerald-500/10
                        stroke = "rgba(16, 185, 129, 0.5)"; // emerald-500/50
                        textColor = "#a7f3d0"; // emerald-200
                    } else if (isVisited) {
                        fill = "rgba(245, 158, 11, 0.1)"; // amber-500/10
                        stroke = "rgba(245, 158, 11, 0.3)"; // amber-500/30
                        textColor = "#fcd34d"; // amber-200
                    }

                    return (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                            <circle 
                                r={isTargetFound ? "26" : "22"} 
                                fill="#171717" 
                            />
                            <motion.circle
                                r={isTargetFound ? "26" : "22"}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth="2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                style={{ filter }}
                            />
                            <text
                                textAnchor="middle"
                                dy=".3em"
                                fill={textColor}
                                className={`font-bold select-none ${isTargetFound ? 'text-base' : 'text-sm'}`}
                            >
                                {node.value}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
