const getNodeId = (node) => (typeof node === 'object' ? node.id : node);

const normalizeUndirectedAdjacency = (nodes, edges) => {
  const adjacency = new Map(nodes.map((node) => [getNodeId(node), []]));

  edges.forEach((edge) => {
    const normalized = {
      from: edge.from,
      to: edge.to,
      weight: Number(edge.weight ?? 1),
    };

    adjacency.get(edge.from)?.push({
      node: edge.to,
      edge: normalized,
    });
    adjacency.get(edge.to)?.push({
      node: edge.from,
      edge: normalized,
    });
  });

  return adjacency;
};

export function prim(nodes, edges, startNode = 0) {
  const nodeIds = nodes.map(getNodeId);
  const startId = nodeIds.includes(startNode) ? startNode : nodeIds[0];
  const adjacency = normalizeUndirectedAdjacency(nodes, edges);
  const visited = new Set([startId]);
  const mstEdges = [];
  const fringe = [];

  const addFringeEdges = (nodeId) => {
    (adjacency.get(nodeId) || []).forEach(({ node, edge }) => {
      if (!visited.has(node)) {
        fringe.push({
          ...edge,
          target: node,
        });
      }
    });
  };

  const cleanFringe = () => fringe.filter((edge) => !visited.has(edge.target));
  const steps = [];

  addFringeEdges(startId);
  steps.push({
    activeNode: startId,
    selectedEdge: null,
    visitedNodes: [...visited],
    fringeEdges: cleanFringe().map((edge) => ({ ...edge })),
    mstEdges: [],
  });

  while (visited.size < nodeIds.length && fringe.length > 0) {
    fringe.sort((a, b) => a.weight - b.weight);
    const nextEdge = fringe.shift();

    if (!nextEdge || visited.has(nextEdge.target)) continue;

    visited.add(nextEdge.target);
    const mstEdge = {
      from: nextEdge.from,
      to: nextEdge.to,
      weight: nextEdge.weight,
    };
    mstEdges.push(mstEdge);
    addFringeEdges(nextEdge.target);

    steps.push({
      activeNode: nextEdge.target,
      selectedEdge: { ...mstEdge },
      visitedNodes: [...visited],
      fringeEdges: cleanFringe().map((edge) => ({ ...edge })),
      mstEdges: mstEdges.map((edge) => ({ ...edge })),
    });
  }

  return steps;
}
