import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import './NodeLinkGraph.css';

const INF_SYMBOL = '∞';

const generateRandomDAG = () => {
  const nodeCount = Math.floor(Math.random() * 5) + 6; // 6 to 10 nodes
  const nodes = [];

  for (let i = 0; i < nodeCount; i++) {
    const xMin = (i / nodeCount) * 80 + 5;
    const xMax = ((i + 1) / nodeCount) * 80 + 5;
    const x = xMin + Math.random() * (xMax - xMin);
    const y = 15 + Math.random() * 70;
    nodes.push({ id: i, x: Math.round(x), y: Math.round(y), neighbors: [] });
  }

  for (let i = 0; i < nodeCount; i++) {
    const outEdgesCount = Math.floor(Math.random() * 2) + 1;
    let createdEdges = 0;

    for (let target = i + 1; target < nodeCount && createdEdges < outEdgesCount; target++) {
      if (target === i + 1 || Math.random() > 0.5) {
        if (!nodes[i].neighbors.includes(target)) {
          nodes[i].neighbors.push(target);
          createdEdges++;
        }
      }
    }
  }

  return nodes;
};

const generateWeightedUndirectedGraph = () => {
  const nodes = [
    { id: 0, x: 16, y: 30, neighbors: [] },
    { id: 1, x: 38, y: 18, neighbors: [] },
    { id: 2, x: 62, y: 24, neighbors: [] },
    { id: 3, x: 82, y: 42, neighbors: [] },
    { id: 4, x: 66, y: 72, neighbors: [] },
    { id: 5, x: 38, y: 80, neighbors: [] },
    { id: 6, x: 16, y: 62, neighbors: [] },
  ];

  const baseEdges = [
    [0, 1, 4], [0, 6, 8], [0, 5, 10],
    [1, 2, 8], [1, 6, 11], [1, 5, 7],
    [2, 3, 7], [2, 4, 2], [2, 6, 4],
    [3, 4, 9], [3, 6, 14],
    [4, 5, 6], [4, 6, 5],
    [5, 6, 3],
  ];

  baseEdges.forEach(([from, to, weight]) => {
    const fromNode = nodes.find((node) => node.id === from);
    if (fromNode) fromNode.neighbors.push({ to, weight });
  });

  return nodes;
};

const generateDenseWeightedUndirectedGraph = () => {
  const nodes = [
    { id: 0, x: 12, y: 45, neighbors: [] },
    { id: 1, x: 28, y: 20, neighbors: [] },
    { id: 2, x: 50, y: 16, neighbors: [] },
    { id: 3, x: 72, y: 22, neighbors: [] },
    { id: 4, x: 88, y: 50, neighbors: [] },
    { id: 5, x: 70, y: 78, neighbors: [] },
    { id: 6, x: 48, y: 84, neighbors: [] },
    { id: 7, x: 26, y: 72, neighbors: [] },
  ];

  const baseEdges = [
    [0, 1, 5], [0, 7, 7], [0, 2, 12], [0, 6, 14],
    [1, 2, 3], [1, 7, 6], [1, 6, 11],
    [2, 3, 4], [2, 6, 9], [2, 7, 8],
    [3, 4, 2], [3, 5, 10], [3, 6, 13],
    [4, 5, 6], [4, 6, 15],
    [5, 6, 1], [5, 7, 12],
    [6, 7, 4],
  ];

  baseEdges.forEach(([from, to, weight]) => {
    const fromNode = nodes.find((node) => node.id === from);
    if (fromNode) fromNode.neighbors.push({ to, weight });
  });

  return nodes;
};

const getBellmanFordExample = () => ([
  { id: 's', x: 12, y: 50, neighbors: [{ to: 't', weight: 6 }, { to: 'y', weight: 7 }] },
  { id: 't', x: 34, y: 24, neighbors: [{ to: 'x', weight: 5 }, { to: 'y', weight: 8 }, { to: 'z', weight: -4 }] },
  { id: 'x', x: 56, y: 24, neighbors: [{ to: 't', weight: -2 }] },
  { id: 'y', x: 56, y: 76, neighbors: [{ to: 'x', weight: -3 }, { to: 'z', weight: 9 }] },
  { id: 'z', x: 80, y: 50, neighbors: [{ to: 'x', weight: 7 }, { to: 's', weight: 2 }] },
]);

const getDfsExample = () => ([
  { id: 1, x: 50, y: 12, neighbors: [2, 5, 9] },
  { id: 2, x: 20, y: 30, neighbors: [3] },
  { id: 3, x: 20, y: 48, neighbors: [4] },
  { id: 4, x: 20, y: 66, neighbors: [] },
  { id: 5, x: 50, y: 30, neighbors: [6] },
  { id: 6, x: 50, y: 48, neighbors: [7] },
  { id: 7, x: 50, y: 66, neighbors: [8] },
  { id: 8, x: 50, y: 84, neighbors: [] },
  { id: 9, x: 80, y: 30, neighbors: [10] },
  { id: 10, x: 80, y: 48, neighbors: [11] },
  { id: 11, x: 80, y: 66, neighbors: [12] },
  { id: 12, x: 80, y: 84, neighbors: [] },
]);

const getNeighborTo = (neighbor) => (typeof neighbor === 'object' ? neighbor.to : neighbor);
const getNeighborWeight = (neighbor) => (typeof neighbor === 'object' ? Number(neighbor.weight ?? 1) : 1);

const getEdgesFromNodes = (nodes) => {
  const edges = [];
  nodes.forEach((node) => {
    (node.neighbors || []).forEach((neighbor) => {
      edges.push({ from: node.id, to: getNeighborTo(neighbor), weight: getNeighborWeight(neighbor) });
    });
  });
  return edges;
};

const getPairKey = (from, to) => {
  const a = String(from);
  const b = String(to);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
};

const getPairOffsets = (edges) => {
  const groups = new Map();
  edges.forEach((edge) => {
    const pairKey = getPairKey(edge.from, edge.to);
    if (!groups.has(pairKey)) groups.set(pairKey, []);
    groups.get(pairKey).push(edge);
  });

  const offsets = new Map();
  groups.forEach((group) => {
    const spacing = 14;
    const center = (group.length - 1) / 2;
    group.forEach((edge, idx) => {
      const key = `${edge.from}=>${edge.to}`;
      offsets.set(key, (idx - center) * spacing);
    });
  });
  return offsets;
};

const NodeLinkGraph = forwardRef((props, ref) => {
  const isBellmanFord = props.algorithmType === 'bellmanFord';
  const isTopological = props.algorithmType === 'topological';
  const isKruskal = props.algorithmType === 'kruskal';
  const isPrim = props.algorithmType === 'prim';
  const [graphNodes, setGraphNodes] = useState(generateRandomDAG());
  const [startId, setStartId] = useState(0);
  const [finishId, setFinishId] = useState(graphNodes.length - 1);

  const svgRef = useRef(null);
  const dragState = useRef({ id: null, offsetX: 0, offsetY: 0, isDragging: false, hasMoved: false });

  useImperativeHandle(ref, () => ({
    getGraph: () => graphNodes,
    getEdges: () => getEdgesFromNodes(graphNodes),
    getStartNodeId: () => startId,
    getFinishNodeId: () => finishId,
    randomizeGraph: () => {
      const newNodes = generateRandomDAG();
      setGraphNodes(newNodes);
      setStartId(0);
      setFinishId(newNodes.length - 1);
    },
    randomizeKruskalGraph: () => {
      const newNodes = generateWeightedUndirectedGraph();
      setGraphNodes(newNodes);
      setStartId(0);
      setFinishId(newNodes.length - 1);
    },
    loadKruskalExample: () => {
      const nodes = generateWeightedUndirectedGraph();
      setGraphNodes(nodes);
      setStartId(0);
      setFinishId(nodes.length - 1);
    },
    loadPrimExample: () => {
      const nodes = generateDenseWeightedUndirectedGraph();
      setGraphNodes(nodes);
      setStartId(0);
      setFinishId(nodes.length - 1);
    },
    loadBellmanFordExample: () => {
      const nodes = getBellmanFordExample();
      setGraphNodes(nodes);
      setStartId('s');
      setFinishId('z');
    },
    loadDfsExample: () => {
      const nodes = getDfsExample();
      setGraphNodes(nodes);
      setStartId(1);
      setFinishId(12);
    },
    loadCustomGraph: (customNodes, startNodeId, finishNodeId) => {
      setGraphNodes(customNodes);
      setStartId(startNodeId);
      setFinishId(finishNodeId);
    },
    setNodeDistances: (distances = {}) => {
      graphNodes.forEach((node) => {
        const distEl = document.getElementById(`node-distance-label-${node.id}`);
        if (!distEl) return;
        const value = distances[node.id];
        distEl.textContent = value === undefined || value === Infinity ? INF_SYMBOL : String(value);
      });
    },
    setInDegreeLabels: (inDegrees = {}) => {
      graphNodes.forEach((node) => {
        const labelEl = document.getElementById(`node-indegree-label-${node.id}`);
        if (labelEl) labelEl.textContent = `in: ${inDegrees[node.id] ?? 0}`;
      });
    },
    setTopologicalOrder: (order = []) => {
      const orderEl = document.getElementById('topological-order-values');
      if (orderEl) orderEl.textContent = order.join(' -> ');
    },
    setSortedEdges: (edges = []) => {
      const listEl = document.getElementById('kruskal-sorted-edges');
      if (!listEl) return;
      listEl.textContent = edges.map((edge) => `${edge.from}-${edge.to}(${edge.weight})`).join('  ');
    },
    clearVisuals: () => {
      graphNodes.forEach((node) => {
        const nDom = document.getElementById(`node-svg-${node.id}`);
        if (nDom) nDom.classList.remove('visited', 'shortest-path', 'distance-updated', 'backtrack', 'queue-ready', 'processing', 'processed', 'prim-root', 'prim-visited', 'prim-active');
        const inDegreeEl = document.getElementById(`node-indegree-label-${node.id}`);
        if (inDegreeEl) inDegreeEl.textContent = 'in: 0';
      });

      const edges = getEdgesFromNodes(graphNodes);
      edges.forEach((edge) => {
        const eDom = document.getElementById(`edge-svg-${edge.from}-${edge.to}`);
        if (eDom) {
          eDom.classList.remove('visited', 'shortest-path', 'relaxing', 'backtrack', 'topo-relaxed', 'mst-candidate', 'mst-accepted', 'mst-rejected', 'prim-fringe', 'prim-selected', 'prim-tree');
          eDom.setAttribute('stroke', '#10b981');
          eDom.setAttribute('stroke-width', '3');
          eDom.setAttribute('stroke-opacity', '0.3');
        }
      });
      const orderEl = document.getElementById('topological-order-values');
      if (orderEl) orderEl.textContent = '';
      const sortedEdgesEl = document.getElementById('kruskal-sorted-edges');
      if (sortedEdgesEl) sortedEdgesEl.textContent = '';
    },
    getBellmanFordExample,
    getDfsExample,
  }));

  const handlePointerDown = (e, node) => {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      
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
      
      const gNode = document.getElementById(`node-svg-${node.id}`);
      if (gNode) gNode.classList.add('is-dragging');
  };

  const handlePointerMove = (e) => {
      if (!dragState.current.isDragging || dragState.current.id === null) return;
      
      dragState.current.hasMoved = true;
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 100;
      const rawY = ((e.clientY - rect.top) / rect.height) * 100;
      
      let newX = rawX - dragState.current.offsetX;
      let newY = rawY - dragState.current.offsetY;
      
      newX = Math.max(2, Math.min(98, newX));
      newY = Math.max(2, Math.min(98, newY));

      const nodeId = dragState.current.id;
      const currentOffsets = getPairOffsets(getEdgesFromNodes(graphNodes));

      const setWeightLabelPosition = (weightEl, fromX, fromY, toX, toY, fromId, toId) => {
          if (!weightEl) return;
          const pairKey = getPairKey(fromId, toId);
          const [aId, bId] = pairKey.split('|');
          const aIsFrom = String(fromId) === aId;
          const ax = aIsFrom ? fromX : toX;
          const ay = aIsFrom ? fromY : toY;
          const bx = aIsFrom ? toX : fromX;
          const by = aIsFrom ? toY : fromY;
          const dx = bx - ax;
          const dy = by - ay;
          const len = Math.hypot(dx, dy) || 1;
          const normalX = -dy / len;
          const normalY = dx / len;
          const offset = currentOffsets.get(`${fromId}=>${toId}`) || 0;
          const midX = (fromX + toX) / 2 + normalX * offset;
          const midY = (fromY + toY) / 2 + normalY * offset;
          weightEl.setAttribute('x', `${midX}%`);
          weightEl.setAttribute('y', `${midY}%`);
      };

      const circleEl = document.querySelector(`#node-svg-${nodeId} circle`);
      const nodeIdTextEl = document.querySelector(`#node-svg-${nodeId} .node-id-label`);
      const distanceTextEl = document.getElementById(`node-distance-label-${nodeId}`);
      if (circleEl) {
          circleEl.setAttribute('cx', `${newX}%`);
          circleEl.setAttribute('cy', `${newY}%`);
      }
      if (nodeIdTextEl) {
          nodeIdTextEl.setAttribute('x', `${newX}%`);
          nodeIdTextEl.setAttribute('y', `${newY - 1.8}%`);
      }
      if (distanceTextEl) {
          distanceTextEl.setAttribute('x', `${newX}%`);
          distanceTextEl.setAttribute('y', `${newY + 2.2}%`);
      }
      const inDegreeTextEl = document.getElementById(`node-indegree-label-${nodeId}`);
      if (inDegreeTextEl) {
          inDegreeTextEl.setAttribute('x', `${newX}%`);
          inDegreeTextEl.setAttribute('y', `${newY - 7.2}%`);
      }

      const nodeData = graphNodes.find(n => n.id === nodeId);
      if (nodeData) {
          nodeData.neighbors.forEach((neighbor) => {
              const targetId = getNeighborTo(neighbor);
              const lineEl = document.getElementById(`edge-svg-${nodeId}-${targetId}`);
              const weightEl = document.getElementById(`edge-weight-${nodeId}-${targetId}`);
              if (lineEl) {
                  lineEl.setAttribute('x1', `${newX}%`);
                  lineEl.setAttribute('y1', `${newY}%`);
              }
              if (weightEl) {
                  const targetNode = graphNodes.find((n) => n.id === targetId);
                  if (targetNode) {
                    setWeightLabelPosition(weightEl, newX, newY, targetNode.x, targetNode.y, nodeId, targetId);
                  }
              }
          });
      }
      
      graphNodes.forEach(n => {
          const hasIncoming = n.neighbors.some((neighbor) => getNeighborTo(neighbor) === nodeId);
          if (hasIncoming) {
              const lineEl = document.getElementById(`edge-svg-${n.id}-${nodeId}`);
              const weightEl = document.getElementById(`edge-weight-${n.id}-${nodeId}`);
              if (lineEl) {
                  lineEl.setAttribute('x2', `${newX}%`);
                  lineEl.setAttribute('y2', `${newY}%`);
              }
              if (weightEl) {
                  const fromNode = graphNodes.find((from) => from.id === n.id);
                  if (fromNode) {
                    setWeightLabelPosition(weightEl, fromNode.x, fromNode.y, newX, newY, n.id, nodeId);
                  }
              }
          }
      });
  };

  const handlePointerUp = (e, node) => {
      if (!dragState.current.isDragging) return;
      e.target.releasePointerCapture(e.pointerId);
      
      const gNode = document.getElementById(`node-svg-${node.id}`);
      if (gNode) gNode.classList.remove('is-dragging');

      if (!dragState.current.hasMoved) {
          if (isPrim) {
             setStartId(node.id);
             dragState.current = { id: null, offsetX: 0, offsetY: 0, isDragging: false, hasMoved: false };
             return;
          }
          if (startId === node.id) {
             // skip if already start
          } else if (finishId === node.id) {
             // skip if already finish
          } else {
             setStartId(finishId);
             setFinishId(node.id);
          }
      } else {
          const rect = svgRef.current.getBoundingClientRect();
          const rawX = ((e.clientX - rect.left) / rect.width) * 100;
          const rawY = ((e.clientY - rect.top) / rect.height) * 100;
          let newX = rawX - dragState.current.offsetX;
          let newY = rawY - dragState.current.offsetY;
          newX = Math.max(2, Math.min(98, newX));
          newY = Math.max(2, Math.min(98, newY));
          
          setGraphNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: newX, y: newY } : n));
      }

      dragState.current = { id: null, offsetX: 0, offsetY: 0, isDragging: false, hasMoved: false };
  };

  const edges = getEdgesFromNodes(graphNodes);
  const pairOffsets = getPairOffsets(edges);

  return (
    <div className="w-full h-full relative min-h-[400px] flex items-center justify-center bg-neutral-950/20 border border-emerald-500/20 rounded-2xl shadow-xl overflow-hidden p-4">
      <svg 
         ref={svgRef}
         className="w-full h-full min-h-[400px] max-h-[600px] overflow-visible touch-none" 
         style={{ strokeLinecap: "round" }}
         onPointerMove={handlePointerMove}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="26" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#10b981" opacity="0.4" className="arrow-polygon transition-all duration-300" />
          </marker>
          <marker id="arrowhead-visited" markerWidth="8" markerHeight="6" refX="26" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#0ea5e9" className="transition-all duration-300" />
          </marker>
          <marker id="arrowhead-path" markerWidth="8" markerHeight="6" refX="26" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#4ade80" className="transition-all duration-300" />
          </marker>
        </defs>
        
        {edges.map((edge) => {
          const fromNode = graphNodes.find((n) => n.id === edge.from);
          const toNode = graphNodes.find((n) => n.id === edge.to);
          const pairKey = getPairKey(edge.from, edge.to);
          const [aId] = pairKey.split('|');
          const aNode = String(fromNode.id) === aId ? fromNode : toNode;
          const bNode = String(fromNode.id) === aId ? toNode : fromNode;
          const dx = bNode.x - aNode.x;
          const dy = bNode.y - aNode.y;
          const len = Math.hypot(dx, dy) || 1;
          const normalX = -dy / len;
          const normalY = dx / len;
          const offset = pairOffsets.get(`${edge.from}=>${edge.to}`) || 0;
          const midX = (fromNode.x + toNode.x) / 2 + normalX * offset;
          const midY = (fromNode.y + toNode.y) / 2 + normalY * offset;
          const weightColor = edge.weight < 0 ? '#f87171' : '#cbd5e1';

          return (
            <g key={`edge-group-${edge.from}-${edge.to}`}>
              <line
                key={`edge-${edge.from}-${edge.to}`}
                id={`edge-svg-${edge.from}-${edge.to}`}
                x1={`${fromNode.x}%`} y1={`${fromNode.y}%`}
                x2={`${toNode.x}%`} y2={`${toNode.y}%`}
                stroke="#10b981"
                strokeWidth="3"
                strokeOpacity="0.3"
                markerEnd={(isKruskal || isPrim) ? undefined : 'url(#arrowhead)'}
                className="svg-edge transition-all duration-300"
              />
              {(isBellmanFord || isKruskal || isPrim) && (
                <text
                  id={`edge-weight-${edge.from}-${edge.to}`}
                  x={`${midX}%`}
                  y={`${midY}%`}
                  textAnchor="middle"
                  dy="-0.4em"
                  fill={weightColor}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="monospace"
                  className="pointer-events-none select-none edge-weight-label"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {graphNodes.map((node) => {
          const isStart = !isTopological && !isKruskal && node.id === startId;
          const isFinish = !isTopological && !isKruskal && !isPrim && node.id === finishId;
          let strokeColor = '#10b981';
          let extraClass = 'hover-glow';
          let strokeWidth = '2';

          if (isStart) {
            strokeColor = '#3b82f6';
            extraClass = isPrim ? 'prim-root' : 'drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]';
            strokeWidth = '4';
          } else if (isFinish) {
            strokeColor = '#ef4444';
            extraClass = 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]';
            strokeWidth = '4';
          }

          return (
            <g
              key={`node-${node.id}`}
              id={`node-svg-${node.id}`}
              className={`svg-node transition-colors duration-300 cursor-grab ${extraClass}`}
              onPointerDown={(e) => handlePointerDown(e, node)}
              onPointerUp={(e) => handlePointerUp(e, node)}
            >
              <circle cx={`${node.x}%`} cy={`${node.y}%`} r="24" fill="#042f2e" stroke={strokeColor} strokeWidth={strokeWidth} className="node-circle" />
              {isTopological && (
                <text
                  id={`node-indegree-label-${node.id}`}
                  x={`${node.x}%`}
                  y={`${node.y - 7.2}%`}
                  textAnchor="middle"
                  fill="#facc15"
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="monospace"
                  className="pointer-events-none select-none node-indegree-label"
                >
                  in: 0
                </text>
              )}
              <text
                className="pointer-events-none select-none node-id-label"
                x={`${node.x}%`}
                y={`${node.y - 1.8}%`}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="12"
                fontWeight="700"
                fontFamily="monospace"
              >
                {String(node.id)}
              </text>
              <text
                id={`node-distance-label-${node.id}`}
                x={`${node.x}%`}
                y={`${node.y + 2.2}%`}
                textAnchor="middle"
                fill={isBellmanFord ? '#cbd5e1' : '#94a3b8'}
                fontSize="11"
                fontWeight="700"
                fontFamily="monospace"
                className="pointer-events-none select-none"
              >
                {isBellmanFord ? INF_SYMBOL : ''}
              </text>
            </g>
          );
        })}
      </svg>
      {isTopological && (
        <div className="topological-order-bar">
          <span>Topological Order:</span>
          <strong id="topological-order-values"></strong>
        </div>
      )}
      {isKruskal && (
        <div className="kruskal-sorted-bar">
          <span>Sorted Edges:</span>
          <strong id="kruskal-sorted-edges"></strong>
        </div>
      )}
    </div>
  );
});

export default NodeLinkGraph;
