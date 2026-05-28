class DisjointSet {
  constructor(nodes) {
    this.parent = new Map();
    this.rank = new Map();

    nodes.forEach((node) => {
      const id = typeof node === 'object' ? node.id : node;
      this.parent.set(id, id);
      this.rank.set(id, 0);
    });
  }

  find(nodeId) {
    const parent = this.parent.get(nodeId);
    if (parent !== nodeId) {
      this.parent.set(nodeId, this.find(parent));
    }
    return this.parent.get(nodeId);
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA === rootB) return false;

    const rankA = this.rank.get(rootA);
    const rankB = this.rank.get(rootB);

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }

    return true;
  }

  components() {
    const groups = new Map();
    this.parent.forEach((_, nodeId) => {
      const root = this.find(nodeId);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(nodeId);
    });
    return [...groups.values()];
  }
}

export function kruskal(nodes, edges) {
  const dsu = new DisjointSet(nodes);
  const sortedEdges = [...edges].sort((a, b) => Number(a.weight ?? 1) - Number(b.weight ?? 1));
  const mstEdges = [];

  const steps = sortedEdges.map((edge) => {
    const isAccepted = dsu.union(edge.from, edge.to);
    if (isAccepted) mstEdges.push(edge);

    return {
      currentEdge: { ...edge },
      isAccepted,
      mstEdgesSoFar: mstEdges.map((mstEdge) => ({ ...mstEdge })),
      currentComponents: dsu.components(),
    };
  });

  steps.sortedEdges = sortedEdges.map((edge) => ({ ...edge }));
  return steps;
}
