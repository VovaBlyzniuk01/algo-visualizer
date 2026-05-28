export function bfs(graphNodes, startNodeId, finishNodeId, handleFailure = () => {}) {
  const visitedSteps = [];
  const queue = [];
  
  const nodesMap = new Map();
  graphNodes.forEach(n => {
    nodesMap.set(n.id, { ...n, isVisited: false, previousNode: null });
  });

  const startNode = nodesMap.get(startNodeId);
  visitedSteps.push({ type: 'node', id: startNode.id, codeLine: 1 });
  queue.push(startNode);
  startNode.isVisited = true;
  
  let finishNodeFound = null;

  while (queue.length > 0) {
    const currentNode = queue.shift();
    
    if (currentNode.id !== startNodeId) {
      visitedSteps.push({ type: 'node', id: currentNode.id, codeLine: 3 });
    }
    
    if (currentNode.id === finishNodeId) {
      finishNodeFound = currentNode;
      break;
    }
    
    for (const neighborRaw of currentNode.neighbors) {
      const neighborId = typeof neighborRaw === 'object' ? neighborRaw.to : neighborRaw;
      const neighbor = nodesMap.get(neighborId);
      if (!neighbor.isVisited) {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        visitedSteps.push({ type: 'edge', from: currentNode.id, to: neighborId, codeLine: 10 });
        queue.push(neighbor);
      }
    }
  }
  
  const pathSteps = [];
  if (finishNodeFound) {
      let current = finishNodeFound;
      while (current.previousNode) {
        pathSteps.unshift({ type: 'node', id: current.id, codeLine: -1 });
        pathSteps.unshift({ type: 'edge', from: current.previousNode.id, to: current.id, codeLine: -1 });
        current = current.previousNode;
      }
      pathSteps.unshift({ type: 'node', id: current.id, codeLine: -1 });
  } else {
      handleFailure();
  }
  
  return { visitedSteps, pathSteps };
}
