const getNodeId = (node) => (typeof node === 'object' ? node.id : node);
const getNeighborTo = (neighbor) => (typeof neighbor === 'object' ? neighbor.to : neighbor);

export function topologicalSort(nodes, edges) {
  const nodeIds = nodes.map(getNodeId);
  const adjacency = new Map(nodeIds.map((id) => [id, []]));
  const inDegrees = {};

  nodeIds.forEach((id) => {
    inDegrees[id] = 0;
  });

  if (Array.isArray(edges) && edges.length > 0) {
    edges.forEach((edge) => {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
      adjacency.get(edge.from).push(edge.to);
      inDegrees[edge.to] = (inDegrees[edge.to] ?? 0) + 1;
      if (inDegrees[edge.from] === undefined) inDegrees[edge.from] = 0;
    });
  } else {
    nodes.forEach((node) => {
      const from = getNodeId(node);
      const neighbors = (node.neighbors || []).map(getNeighborTo);
      adjacency.set(from, neighbors);
      neighbors.forEach((to) => {
        inDegrees[to] = (inDegrees[to] ?? 0) + 1;
      });
    });
  }

  const queue = nodeIds.filter((id) => inDegrees[id] === 0);
  const sortedOrder = [];
  const steps = [
    {
      phase: 'init',
      nodeId: null,
      currentInDegrees: { ...inDegrees },
      activeQueue: [...queue],
      sortedSoFar: [],
      relaxedEdge: null,
    },
  ];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    sortedOrder.push(nodeId);

    steps.push({
      phase: 'process',
      nodeId,
      currentInDegrees: { ...inDegrees },
      activeQueue: [...queue],
      sortedSoFar: [...sortedOrder],
      relaxedEdge: null,
    });

    (adjacency.get(nodeId) || []).forEach((neighborId) => {
      inDegrees[neighborId] -= 1;
      if (inDegrees[neighborId] === 0) queue.push(neighborId);

      steps.push({
        phase: 'relax',
        nodeId: neighborId,
        currentInDegrees: { ...inDegrees },
        activeQueue: [...queue],
        sortedSoFar: [...sortedOrder],
        relaxedEdge: { from: nodeId, to: neighborId },
      });
    });
  }

  if (sortedOrder.length !== nodeIds.length) {
    return {
      steps,
      sortedOrder,
      hasCycle: true,
      error: 'Cycle Detected (Not a DAG)',
    };
  }

  return {
    steps,
    sortedOrder,
    hasCycle: false,
    error: null,
  };
}
