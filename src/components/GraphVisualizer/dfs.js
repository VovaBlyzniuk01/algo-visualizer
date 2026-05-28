const getNodeId = (node) => (typeof node === 'object' ? node.id : node);
const getNeighborTo = (neighbor) => (typeof neighbor === 'object' ? neighbor.to : neighbor);

const buildAdjacency = (nodes, edges = []) => {
  const adj = new Map();
  nodes.forEach((node) => adj.set(node.id, []));

  if (edges.length > 0) {
    edges.forEach((edge) => {
      if (!adj.has(edge.from)) adj.set(edge.from, []);
      adj.get(edge.from).push(edge.to);
    });
    return adj;
  }

  nodes.forEach((node) => {
    const neighbors = (node.neighbors || []).map(getNeighborTo);
    adj.set(node.id, neighbors);
  });
  return adj;
};

export function dfs(nodes, edges, startNode, finishNode, handleFailure = () => {}) {
  const startId = getNodeId(startNode);
  const finishId = getNodeId(finishNode);
  const adjacency = buildAdjacency(nodes, edges);

  const visited = new Set();
  const recursionStack = new Set();
  const parent = new Map();
  const visitedSteps = [];

  let found = false;

  const traverse = (nodeId) => {
    if (found) return true;

    visited.add(nodeId);
    recursionStack.add(nodeId);
    visitedSteps.push({ type: 'node', id: nodeId, phase: 'dive', codeLine: 1, countAsVisit: true });

    if (nodeId === finishId) {
      found = true;
      recursionStack.delete(nodeId);
      return true;
    }

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighborId of neighbors) {
      visitedSteps.push({ type: 'edge', from: nodeId, to: neighborId, phase: 'dive', codeLine: 4 });

      if (recursionStack.has(neighborId)) continue;
      if (visited.has(neighborId)) continue;

      parent.set(neighborId, nodeId);
      if (traverse(neighborId)) {
        recursionStack.delete(nodeId);
        return true;
      }
    }

    if (nodeId !== startId) {
      visitedSteps.push({ type: 'node', id: nodeId, phase: 'backtrack', codeLine: 8, countAsVisit: false });
      const p = parent.get(nodeId);
      if (p !== undefined && p !== null) {
        visitedSteps.push({ type: 'edge', from: p, to: nodeId, phase: 'backtrack', codeLine: 8 });
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  parent.set(startId, null);
  traverse(startId);

  if (!found) {
    handleFailure();
    return { visitedSteps, pathSteps: [] };
  }

  const pathSteps = [];
  let current = finishId;
  while (current !== null && current !== undefined) {
    pathSteps.unshift({ type: 'node', id: current, codeLine: -1 });
    const prev = parent.get(current);
    if (prev !== null && prev !== undefined) {
      pathSteps.unshift({ type: 'edge', from: prev, to: current, codeLine: -1 });
    }
    current = prev;
  }

  return { visitedSteps, pathSteps };
}

