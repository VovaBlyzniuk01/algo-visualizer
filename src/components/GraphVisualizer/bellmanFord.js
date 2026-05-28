const INF = Infinity;

const getNodeId = (node) => (typeof node === 'object' ? node.id : node);

const normalizeEdges = (nodes, edges = []) => {
  if (Array.isArray(edges) && edges.length > 0) {
    return edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      weight: Number(edge.weight ?? 1),
    }));
  }

  const normalized = [];
  nodes.forEach((node) => {
    (node.neighbors || []).forEach((neighbor) => {
      if (typeof neighbor === 'object') {
        normalized.push({
          from: node.id,
          to: neighbor.to,
          weight: Number(neighbor.weight ?? 1),
        });
      } else {
        normalized.push({ from: node.id, to: neighbor, weight: 1 });
      }
    });
  });
  return normalized;
};

export function bellmanFord(nodes, edges, startNode) {
  const nodeIds = nodes.map((node) => node.id);
  const startId = getNodeId(startNode);
  const graphEdges = normalizeEdges(nodes, edges);

  const distances = {};
  const previous = {};
  nodeIds.forEach((id) => {
    distances[id] = INF;
    previous[id] = null;
  });
  distances[startId] = 0;

  const iterations = [
    {
      iteration: 0,
      distances: { ...distances },
      updatedNodes: [],
      relaxedEdges: [],
    },
  ];
  const relaxationSteps = [];

  const totalIterations = Math.max(0, nodeIds.length - 1);
  for (let iteration = 1; iteration <= totalIterations; iteration += 1) {
    const updatedNodes = new Set();
    const relaxedEdges = [];
    let changed = false;

    for (const edge of graphEdges) {
      const fromDist = distances[edge.from];
      const candidate = fromDist === INF ? INF : fromDist + edge.weight;
      const didUpdate = candidate < distances[edge.to];

      if (didUpdate) {
        distances[edge.to] = candidate;
        previous[edge.to] = edge.from;
        changed = true;
        updatedNodes.add(edge.to);
      }

      const step = {
        iteration,
        from: edge.from,
        to: edge.to,
        weight: edge.weight,
        updated: didUpdate,
        distances: { ...distances },
      };
      relaxedEdges.push(step);
      relaxationSteps.push(step);
    }

    iterations.push({
      iteration,
      distances: { ...distances },
      updatedNodes: [...updatedNodes],
      relaxedEdges,
    });

    if (!changed) break;
  }

  let negativeCycle = false;
  let negativeCycleEdge = null;
  for (const edge of graphEdges) {
    const fromDist = distances[edge.from];
    if (fromDist === INF) continue;

    if (fromDist + edge.weight < distances[edge.to]) {
      negativeCycle = true;
      negativeCycleEdge = edge;
      break;
    }
  }

  return {
    iterations,
    relaxationSteps,
    distances: { ...distances },
    previous,
    negativeCycle,
    negativeCycleEdge,
    error: negativeCycle ? 'Negative Cycle Detected' : null,
  };
}
