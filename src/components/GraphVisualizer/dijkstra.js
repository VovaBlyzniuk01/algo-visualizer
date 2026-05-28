export function dijkstra(grid, startNode, finishNode, handleFailure = () => {}) {
  const visitedNodesInOrder = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);
  
  while (!!unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();
    
    // If we encounter a wall, we skip it
    if (closestNode.isWall) continue;
    
    // If the closest node is at a distance of infinity,
    // we must be trapped and should stop.
    if (closestNode.distance === Infinity) {
      handleFailure();
      return visitedNodesInOrder;
    }
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    
    // Stop if we reached the finish line
    if (closestNode === finishNode) return visitedNodesInOrder;
    
    updateUnvisitedNeighbors(closestNode, grid);
  }
}

function sortNodesByDistance(unvisitedNodes) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function updateUnvisitedNeighbors(node, grid) {
  const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of unvisitedNeighbors) {
    const tentativeDistance = node.distance + neighbor.weight;
    if (tentativeDistance < neighbor.distance) {
       neighbor.distance = tentativeDistance;
       neighbor.previousNode = node;
    }
  }
}

function getUnvisitedNeighbors(node, grid) {
  const neighbors = [];
  const { col, row } = node;
  // Edge checks
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  
  // Return only neighbors that are unvisited and not walls
  return neighbors.filter(neighbor => !neighbor.isVisited && !neighbor.isWall);
}

function getAllNodes(grid) {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
}

// Backtracks to find the shortest path after running Dijkstra.
export function getNodesInShortestPathOrder(finishNode) {
  const nodesInShortestPathOrder = [];
  let currentNode = finishNode;
  
  while (currentNode !== null && currentNode !== undefined) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  
  return nodesInShortestPathOrder;
}
