export function astar(grid, startNode, finishNode, handleFailure = () => {}) {
  const visitedNodesInOrder = [];
  const unvisitedNodes = []; // Open list
  
  // Initialize values
  for (const row of grid) {
    for (const node of row) {
      node.g = Infinity;
      node.h = Infinity;
      node.f = Infinity;
      node.previousNode = null;
    }
  }
  
  startNode.g = 0;
  startNode.h = heuristic(startNode, finishNode);
  startNode.f = startNode.g + startNode.h;
  // Use distance property for compatibility with existing animation playBeep
  startNode.distance = 0; 
  
  unvisitedNodes.push(startNode);
  
  while (!!unvisitedNodes.length) {
    unvisitedNodes.sort((a, b) => a.f === b.f ? a.h - b.h : a.f - b.f);
    const closestNode = unvisitedNodes.shift();
    
    // If it's a wall, skip it
    if (closestNode.isWall) continue;
    
    // If we're trapped
    if (closestNode.f === Infinity) {
      handleFailure();
      return visitedNodesInOrder;
    }
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    
    // Check if we reached the finish line
    if (closestNode === finishNode) return visitedNodesInOrder;
    
    updateNeighbors(closestNode, grid, finishNode, unvisitedNodes);
  }
  
  // If the open set is exhausted and we haven't reached the finish line:
  handleFailure();
  return visitedNodesInOrder;
}

function updateNeighbors(node, grid, finishNode, unvisitedNodes) {
  const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of unvisitedNeighbors) {
    // node.distance is needed for audio frequency logic in GraphVisualizer
    const tentativeG = node.g + neighbor.weight;
    
    // If we found a shorter path to neighbor
    if (tentativeG < neighbor.g) {
      neighbor.previousNode = node;
      neighbor.g = tentativeG;
      neighbor.h = heuristic(neighbor, finishNode);
      neighbor.f = neighbor.g + neighbor.h;
      neighbor.distance = neighbor.g; // keep legacy distance up to date
      
      // If neighbor is not in open list, add it
      if (!unvisitedNodes.includes(neighbor)) {
        unvisitedNodes.push(neighbor);
      }
    }
  }
}

function getUnvisitedNeighbors(node, grid) {
  const neighbors = [];
  const { col, row } = node;
  
  // Non-diagonal movement only (Orthogonal)
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  
  return neighbors.filter(neighbor => !neighbor.isVisited && !neighbor.isWall);
}

// Manhattan distance heuristic for orthogonal movement grids
function heuristic(nodeA, nodeB) {
  return Math.abs(nodeA.col - nodeB.col) + Math.abs(nodeA.row - nodeB.row);
}
