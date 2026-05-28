import React, { useState, useRef, useEffect } from 'react';
import { MousePointer2, PlusCircle, Trash2, Save, X, Settings2 } from 'lucide-react';
import './GraphEditorModal.css';
import { useLanguage } from '../../context/LanguageContext';

const getNeighborTo = (neighbor) => (typeof neighbor === 'object' ? neighbor.to : neighbor);
const getNeighborWeight = (neighbor) => (typeof neighbor === 'object' ? Number(neighbor.weight ?? 1) : 1);
const makeWeightedNeighbor = (neighbor, weight = 1) =>
  (typeof neighbor === 'object' ? { ...neighbor, weight: Number(weight) } : { to: neighbor, weight: Number(weight) });

const GraphEditorModal = ({ isOpen, onClose, onSave, initialNodes, initialStart, initialFinish }) => {
  const { t } = useLanguage();
  const [nodes, setNodes] = useState([]);
  const [startId, setStartId] = useState(0);
  const [finishId, setFinishId] = useState(0);
  
  const [mode, setMode] = useState('move'); // 'move', 'add', 'delete'
  const [linkSourceId, setLinkSourceId] = useState(null);
  
  const svgRef = useRef(null);
  const dragState = useRef({ id: null, offsetX: 0, offsetY: 0, isDragging: false, hasMoved: false });

  useEffect(() => {
    if (isOpen) {
      const preparedNodes = JSON.parse(JSON.stringify(initialNodes));
      setNodes(preparedNodes);
      setStartId(initialStart);
      setFinishId(initialFinish);
      setMode('move');
      setLinkSourceId(null);
    }
  }, [isOpen, initialNodes, initialStart, initialFinish]);

  if (!isOpen) return null;

  const handleSvgPointerDown = (e) => {
      const isNode = e.target.closest('.editor-node');
      const isEdge = e.target.closest('.editor-edge');
      
      if (mode === 'add' && !isNode && !isEdge) {
          const rect = svgRef.current.getBoundingClientRect();
          const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
          const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
          
          let nextId = 0;
          const existingIds = nodes.map(n => n.id);
          while (existingIds.includes(nextId)) nextId++;
          
          setNodes(prev => [...prev, { id: nextId, x: Math.round(xPercent), y: Math.round(yPercent), neighbors: [] }]);
          
          if (nodes.length === 0) {
              setStartId(nextId);
              setFinishId(nextId);
          }
      } else if (mode === 'move' && !isNode && !isEdge) {
          setLinkSourceId(null);
      }
  };

  const handleSvgPointerMove = (e) => {
      // Dragging logic
      if (mode === 'move' && dragState.current.isDragging && dragState.current.id !== null) {
          dragState.current.hasMoved = true;
          const rect = svgRef.current.getBoundingClientRect();
          const rawX = ((e.clientX - rect.left) / rect.width) * 100;
          const rawY = ((e.clientY - rect.top) / rect.height) * 100;
          
          let newX = rawX - dragState.current.offsetX;
          let newY = rawY - dragState.current.offsetY;
          newX = Math.max(2, Math.min(98, newX));
          newY = Math.max(2, Math.min(98, newY));

          const nodeId = dragState.current.id;
          setNodes((prev) =>
              prev.map((n) => (n.id === nodeId ? { ...n, x: newX, y: newY } : n))
          );
      }
      
  };

  const handleSvgPointerUp = (e) => {
      if (mode === 'move' && dragState.current.isDragging) {
          if (e.target && typeof e.target.hasPointerCapture === 'function' && e.target.hasPointerCapture(e.pointerId)) {
              e.target.releasePointerCapture(e.pointerId);
          }
          const gNode = document.getElementById(`ed-node-${dragState.current.id}`);
          if (gNode) gNode.classList.remove('is-dragging');

          if (!dragState.current.hasMoved) {
             // Quick link creation on click in move mode
             const clickedNodeId = dragState.current.id;
             if (linkSourceId === null) {
                 setLinkSourceId(clickedNodeId);
             } else if (linkSourceId === clickedNodeId) {
                 setLinkSourceId(null);
             } else {
                setNodes((prev) =>
                  prev.map((n) => {
                    if (n.id !== linkSourceId) return n;
                    const exists = n.neighbors.some((neighbor) => getNeighborTo(neighbor) === clickedNodeId);
                    if (exists) return n;
                    return { ...n, neighbors: [...n.neighbors, { to: clickedNodeId, weight: 1 }] };
                  })
                );
                 setLinkSourceId(null);
             }
          }

          dragState.current.isDragging = false;
          dragState.current.id = null;
          dragState.current.hasMoved = false;
      }

  };

  const handleNodePointerDown = (e, node) => {
      e.stopPropagation();
      
      if (mode === 'move') {
          e.currentTarget.setPointerCapture(e.pointerId);
          const rect = svgRef.current.getBoundingClientRect();
          const pointerXPercent = ((e.clientX - rect.left) / rect.width) * 100;
          const pointerYPercent = ((e.clientY - rect.top) / rect.height) * 100;

          dragState.current = {
              id: node.id,
              offsetX: pointerXPercent - node.x,
              offsetY: pointerYPercent - node.y,
              isDragging: true,
              hasMoved: false
          };
          const gNode = document.getElementById(`ed-node-${node.id}`);
          if (gNode) gNode.classList.add('is-dragging');
      } 
      else if (mode === 'delete') {
          setNodes(prev => {
              const newNodes = prev.filter(n => n.id !== node.id);
              newNodes.forEach(n => {
                  n.neighbors = n.neighbors.filter((neighbor) => getNeighborTo(neighbor) !== node.id);
              });
              return newNodes;
          });
              if (linkSourceId === node.id) {
                  setLinkSourceId(null);
              }
              if (startId === node.id || finishId === node.id) {
              // Ensure we don't hold deleted start/finish
              const rem = nodes.filter(n => n.id !== node.id);
              if (rem.length > 0) {
                 if (startId === node.id) setStartId(rem[0].id);
                 if (finishId === node.id) setFinishId(rem[rem.length-1].id);
              }
          }
      }
  };

  const handleEdgePointerDown = (e, from, to) => {
      e.stopPropagation();
      if (mode === 'delete') {
          setNodes(prev => prev.map(n => {
              if (n.id === from) {
                  return { ...n, neighbors: n.neighbors.filter((neighbor) => getNeighborTo(neighbor) !== to) };
              }
              return n;
          }));
      }
  };

  const edges = [];
  nodes.forEach((node) => {
    node.neighbors.forEach((neighbor) => {
      edges.push({ from: node.id, to: getNeighborTo(neighbor), weight: getNeighborWeight(neighbor) });
    });
  });

  const updateEdgeWeight = (from, to, nextWeight) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== from) return node;
        return {
          ...node,
          neighbors: node.neighbors.map((neighbor) =>
            getNeighborTo(neighbor) === to ? makeWeightedNeighbor(neighbor, nextWeight) : neighbor
          ),
        };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-5xl h-[80vh] flex flex-col bg-emerald-950/90 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between bg-emerald-900/60 p-4 border-b border-emerald-500/20">
            <h2 className="text-emerald-100 font-bold text-lg flex items-center gap-2"><Settings2 size={20} className="text-emerald-400" /> {t.graphEditorTitle || 'Graph Editor'}</h2>
            <button onClick={onClose} className="text-emerald-400 hover:text-white transition-colors p-1"><X size={24} /></button>
        </div>

        {/* Tools Panel */}
        <div className="flex items-center gap-4 bg-emerald-950 p-3 border-b border-emerald-500/10 justify-center">
            <button onClick={() => {setMode('move'); setLinkSourceId(null);}} className={`toolbar-btn ${mode === 'move' ? 'active bg-emerald-600 text-white' : 'text-emerald-300 hover:bg-emerald-800'}`}><MousePointer2 size={16}/> {t.graphEditorToolMove || 'Select / Move'}</button>
            <button onClick={() => {setMode('add'); setLinkSourceId(null);}} className={`toolbar-btn ${mode === 'add' ? 'active bg-blue-600 text-white' : 'text-blue-300 hover:bg-blue-900/50'}`}><PlusCircle size={16}/> {t.graphEditorToolAdd || 'Add Node'}</button>
            <button onClick={() => {setMode('delete'); setLinkSourceId(null);}} className={`toolbar-btn ${mode === 'delete' ? 'active bg-red-600 text-white' : 'text-red-300 hover:bg-red-900/50'}`}><Trash2 size={16}/> {t.graphEditorToolDelete || 'Delete'}</button>
        </div>

        {/* Action hints */}
        <div className="text-center py-1.5 text-xs tracking-wider text-emerald-200/50 uppercase font-mono bg-black/20">
            {mode === 'move' && (
              linkSourceId === null
                ? (t.graphEditorHintMove || 'Drag nodes to move. Click node to start path.')
                : `${t.graphEditorHintConnectTo || 'Click target node to connect.'} (${linkSourceId} -> ?)`
            )}
            {mode === 'add' && (t.graphEditorHintAdd || 'Click empty space to add new node.')}
            {mode === 'delete' && (t.graphEditorHintDelete || 'Click on node or line to remove it.')}
        </div>

        {/* Workspace */}
        <div className="flex-1 w-full bg-[#031512] relative overflow-hidden" 
             style={{ cursor: mode === 'add' ? 'crosshair' : mode === 'delete' ? 'not-allowed' : 'default' }}>
            <svg 
               ref={svgRef}
               className="w-full h-full overflow-visible touch-none" 
               style={{ strokeLinecap: "round" }}
               onPointerDown={handleSvgPointerDown}
               onPointerMove={handleSvgPointerMove}
               onPointerUp={handleSvgPointerUp}
               onPointerLeave={handleSvgPointerUp}
            >
              <defs>
                <marker id="editor-arrowhead" markerWidth="8" markerHeight="6" refX="26" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#10b981" opacity="0.6" />
                </marker>
              </defs>
              
              {/* Edges */}
              {edges.map(edge => {
                  const fromNode = nodes.find(n => n.id === edge.from);
                  const toNode = nodes.find(n => n.id === edge.to);
                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;
                  return (
                      <g key={`edge-${edge.from}-${edge.to}`}>
                        <line
                          id={`ed-edge-${edge.from}-${edge.to}`}
                          x1={`${fromNode.x}%`} y1={`${fromNode.y}%`}
                          x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                          stroke="#10b981"
                          strokeWidth={mode === 'delete' ? "8" : "4"}
                          strokeOpacity={mode === 'delete' ? "0.4" : "0.5"}
                          markerEnd="url(#editor-arrowhead)"
                          className={`editor-edge transition-all ${mode === 'delete' ? 'hover:stroke-red-500 hover:stroke-opacity-80 cursor-pointer' : ''}`}
                          onPointerDown={(e) => handleEdgePointerDown(e, edge.from, edge.to)}
                        />
                        <text
                          x={`${midX}%`}
                          y={`${midY}%`}
                          textAnchor="middle"
                          dy="-0.3em"
                          fill={edge.weight < 0 ? '#f87171' : '#cbd5e1'}
                          fontSize="12"
                          fontWeight="700"
                          fontFamily="monospace"
                          className="pointer-events-none select-none"
                        >
                          {edge.weight}
                        </text>
                      </g>
                  )
              })}

              {/* Nodes */}
              {nodes.map(node => {
                  const isStart = node.id === startId;
                  const isFinish = node.id === finishId;
                  const isConnectingSrc = node.id === linkSourceId;
                  
                  let strokeColor = "#10b981";
                  let strokeWidth = "2";
                  if (isStart) { strokeColor = "#3b82f6"; strokeWidth = "4"; }
                  else if (isFinish) { strokeColor = "#ef4444"; strokeWidth = "4"; }

                  let classInject = `editor-node transition-colors cursor-pointer `;
                  if (mode === 'move') classInject += 'hover:drop-shadow-[0_0_12px_rgba(16,185,129,0.8)] cursor-grab ';
                  if (mode === 'delete') classInject += 'hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] ';
                  if (isConnectingSrc) classInject += 'drop-shadow-[0_0_12px_rgba(139,92,246,0.8)] ';

                  return (
                      <g 
                         key={`node-${node.id}`} 
                         id={`ed-node-${node.id}`} 
                         className={classInject}
                         onPointerDown={(e) => handleNodePointerDown(e, node)}
                         onPointerUp={handleSvgPointerUp}
                      >
                          <circle cx={`${node.x}%`} cy={`${node.y}%`} r="24" fill="#042f2e" stroke={isConnectingSrc ? "#8b5cf6" : strokeColor} strokeWidth={isConnectingSrc ? "4" : strokeWidth} />
                          <text x={`${node.x}%`} y={`${node.y}%`} textAnchor="middle" dy=".3em" fill="#e2e8f0" fontSize="16" fontWeight="bold" fontFamily="monospace" className="pointer-events-none select-none">{node.id}</text>
                      </g>
                  );
              })}
            </svg>
        </div>

        {/* Footer */}
        <div className="p-4 bg-emerald-950/80 flex justify-end gap-4 border-t border-emerald-500/20">
            <div className="mr-auto max-w-[55%] max-h-24 overflow-auto text-xs text-emerald-200/80 space-y-1">
              {edges.length === 0 && <div>{t.graphEditorNoEdges || 'No edges yet.'}</div>}
              {edges.map((edge) => (
                <label key={`edge-weight-input-${edge.from}-${edge.to}`} className="flex items-center gap-2">
                  <span className="font-mono text-emerald-300 min-w-[70px]">{String(edge.from)} → {String(edge.to)}</span>
                  <input
                    type="number"
                    step="1"
                    value={edge.weight}
                    onChange={(e) => updateEdgeWeight(edge.from, edge.to, Number(e.target.value))}
                    className="w-16 bg-emerald-900/50 border border-emerald-500/40 rounded px-2 py-0.5 text-emerald-100 font-mono"
                  />
                </label>
              ))}
            </div>
            <button onClick={onClose} className="px-6 py-2 rounded-lg font-semibold text-emerald-200 border border-emerald-700 hover:bg-emerald-800 transition-colors">{t.cancelBtn || 'Cancel'}</button>
            <button onClick={() => onSave(nodes, startId, finishId)} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"><Save size={18}/> {t.applyChangesBtn || 'Apply Changes'}</button>
        </div>
      </div>
    </div>
  );
};

export default GraphEditorModal;
