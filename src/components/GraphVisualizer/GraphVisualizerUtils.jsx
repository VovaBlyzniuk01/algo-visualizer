import React from "react";

export const TOOLS = {
  WALL: 'wall',
  WEIGHT_5: 'weight_5',
  WEIGHT_10: 'weight_10',
  ERASER: 'eraser'
};
export const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 10];
export const BASE_GRAPH_DELAY_MS = 80;

export const createNode = (col, row) => {
  return {
    col,
    row,
    distance: Infinity,
    isVisited: false,
    isShortestPath: false,
    isWall: false,
    isWeight: false,
    weight: 1,
    previousNode: null,
    f: Infinity,
    g: Infinity,
    h: Infinity,
  };
};

export const PSEUDOCODES = {
  dijkstra: [
    "distances.fill(Infinity); distances[start] = 0;",
    "while (!unvisited.isEmpty()) {",
    "  node = unvisited.extractMin();",
    "  if (node === finishNode) break;",
    "  node.isVisited = true;",
    "  for (neighbor of node.neighbors) {",
    "    updateDistance(node, neighbor);",
    "  }",
    "}"
  ],
  astar: [
    "openSet.push(start); fScore[start] = h(start, finish);",
    "while (!openSet.isEmpty()) {",
    "  node = openSet.extractMinF();",
    "  if (node === finishNode) break;",
    "  node.isVisited = true;",
    "  for (neighbor of node.neighbors) {",
    "    updateGScore(node, neighbor);",
    "  }",
    "}"
  ],
  bfs: [
    "queue = new Queue();",
    "queue.enqueue(startNode);",
    "while (!queue.isEmpty()) {",
    "  node = queue.dequeue();",
    "  if (node === finishNode) break;",
    "  if (node.isWall) continue;",
    "  for (neighbor of node.neighbors) {",
    "    if (!neighbor.isVisited) {",
    "      neighbor.isVisited = true;",
    "      neighbor.previousNode = node;",
    "      queue.enqueue(neighbor);",
    "    }",
    "  }",
    "}"
  ],
  dfs: [
    "visited = new Set(); parent = new Map();",
    "function dfs(node) {",
    "  visited.add(node);",
    "  if (node === finish) return true;",
    "  for (neighbor of node.neighbors) {",
    "    if (!visited.has(neighbor)) {",
    "      parent[neighbor] = node;",
    "      if (dfs(neighbor)) return true;",
    "    }",
    "  }",
    "  // backtrack",
    "  return false;",
    "}"
  ],
  bellmanFord: [
    "dist.fill(Infinity); dist[start] = 0;",
    "for (i = 1; i <= |V| - 1; i++) {",
    "  for (edge of edges) {",
    "    if (dist[edge.from] + edge.w < dist[edge.to]) {",
    "      dist[edge.to] = dist[edge.from] + edge.w;",
    "      prev[edge.to] = edge.from;",
    "    }",
    "  }",
    "}",
    "for (edge of edges) if relaxes -> NEGATIVE CYCLE"
  ],
  topological: [
    "inDegree[v] = 0 for every node;",
    "for (edge u -> v) inDegree[v]++;",
    "queue = all nodes where inDegree == 0;",
    "while (!queue.isEmpty()) {",
    "  node = queue.dequeue();",
    "  sortedOrder.push(node);",
    "  for (neighbor of node.neighbors) {",
    "    inDegree[neighbor]--;",
    "    if (inDegree[neighbor] == 0) queue.enqueue(neighbor);",
    "  }",
    "}",
    "if sortedOrder.length != nodes.length -> cycle;"
  ],
  kruskal: [
    "sort edges by weight ascending;",
    "makeSet(node) for every node;",
    "mst = []; totalWeight = 0;",
    "for (edge of sortedEdges) {",
    "  if (find(edge.from) != find(edge.to)) {",
    "    mst.push(edge);",
    "    totalWeight += edge.weight;",
    "    union(edge.from, edge.to);",
    "  } else reject edge; // cycle",
    "}",
    "return mst;"
  ],
  prim: [
    "visited = new Set([startNode]);",
    "fringe = edges from startNode;",
    "mst = []; totalWeight = 0;",
    "while (visited.size < nodes.length) {",
    "  edge = fringe.extractMinWeight();",
    "  if (visited.has(edge.to)) continue;",
    "  mst.push(edge); totalWeight += edge.weight;",
    "  visited.add(edge.to);",
    "  add outgoing edges from edge.to to fringe;",
    "}",
    "return mst;"
  ]
};

export const renderCode = (line) => {
    const keywordRegex = /(while|if|for|break|continue|new|Queue|Set|true|Infinity|fill|sort|makeSet|find|union|return|extractMinWeight|extractMinF|extractMin|isEmpty|enqueue|dequeue|push|add|updateDistance|updateGScore|sortedOrder|inDegree|h\(.*\))/g;
    const parts = line.split(keywordRegex);
    return parts.map((part, i) => {
        if (keywordRegex.test(part)) {
            return <span key={i} className="text-pink-400 font-semibold">{part}</span>;
        }
        const propRegex = /(distances|fScore|openSet|queue|start|startNode|finishNode|node|unvisited|visited|fringe|neighbor|nodes|edge|sortedEdges|mst|totalWeight)/g;
        const subParts = part.split(propRegex);
        return subParts.map((sub, j) => {
            if (propRegex.test(sub)) {
                return <span key={`${i}-${j}`} className="text-cyan-300">{sub}</span>;
            }
            return <span key={`${i}-${j}`} className="text-emerald-100/90">{sub}</span>;
        });
    });
};
