import React from 'react';
import './GraphVisualizer.css';

const Node = ({
  col,
  row,
  isStart,
  isFinish,
  isWall,
  isWeight,
  weight,
  isVisited,
  isShortestPath,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}) => {
  // Logic to determine the class based on priority: Start/Finish > Path > Visited > Wall/Weight
  let extraClassName = '';
  if (isFinish) extraClassName = 'node-finish';
  else if (isStart) extraClassName = 'node-start';
  else if (isShortestPath) extraClassName = 'node-shortest-path';
  else if (isVisited) {
      if (isWeight) extraClassName = weight === 10 ? 'node-weight-visited-10' : 'node-weight-visited-5';
      else extraClassName = 'node-visited';
  } else if (isWall) extraClassName = 'node-wall';
  else if (isWeight) extraClassName = weight === 10 ? 'node-weight-10' : 'node-weight-5';

  return (
    <div
      id={`node-${row}-${col}`}
      className={`node ${extraClassName} relative flex items-center justify-center`}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, row, col); }}
      onMouseEnter={(e) => { e.preventDefault(); onMouseEnter(e, row, col); }}
      onMouseUp={onMouseUp}
      onDragStart={(e) => e.preventDefault()}
    >
      {(isWeight || extraClassName.includes('node-weight-visited')) && !isStart && !isFinish && (
        <span className="weight-text text-[10px] text-white/70 font-bold select-none pointer-events-none">
          {weight}
        </span>
      )}
      <span className="score-text absolute bottom-0 right-[2px] text-[7px] text-emerald-200/60 font-mono select-none pointer-events-none transition-opacity opacity-0"></span>
    </div>
  );
};

export function areNodePropsEqual(prevProps, nextProps) {
  return (
    prevProps.isWall === nextProps.isWall &&
    prevProps.isWeight === nextProps.isWeight &&
    prevProps.weight === nextProps.weight &&
    prevProps.isStart === nextProps.isStart &&
    prevProps.isFinish === nextProps.isFinish &&
    prevProps.isVisited === nextProps.isVisited &&
    prevProps.isShortestPath === nextProps.isShortestPath
  );
}

export default React.memo(Node, areNodePropsEqual);
