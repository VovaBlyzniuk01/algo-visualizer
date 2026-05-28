import re

with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/GraphVisualizer/GraphVisualizer.jsx", "r", encoding="utf-8") as f:
    content = f.read()

start_str = r'<div className="flex gap-6 flex-1 items-stretch w-full overflow-hidden">'
end_str = r'            </motion.div>\n         </div>'

pattern = re.compile(start_str + r'.*?' + end_str, re.DOTALL)
match = pattern.search(content)

if match:
    # Save the matched part to GridCanvas.jsx
    canvas_content = """import React from 'react';
import { motion } from 'framer-motion';
import Node from './Node';
import NodeLinkGraph from './NodeLinkGraph';
import { PSEUDOCODES, renderCode } from './GraphVisualizerUtils';

export const GridCanvas = ({
    selectedAlgorithm,
    flatAlgorithms,
    t,
    isAnimating,
    isError,
    grid,
    startPos,
    finishPos,
    handleMouseDown,
    handleMouseEnter,
    drawingType,
    svgGraphRef
}) => {
    return (
""" + match.group(0) + """
    );
};
"""
    with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/GraphVisualizer/GridCanvas.jsx", "w", encoding="utf-8") as f:
        f.write(canvas_content)

    replacement = """<GridCanvas
          selectedAlgorithm={selectedAlgorithm}
          flatAlgorithms={flatAlgorithms}
          t={t}
          isAnimating={isAnimating}
          isError={isError}
          grid={grid}
          startPos={startPos}
          finishPos={finishPos}
          handleMouseDown={handleMouseDown}
          handleMouseEnter={handleMouseEnter}
          drawingType={drawingType}
          svgGraphRef={svgGraphRef}
        />"""
    new_content = content[:match.start()] + replacement + content[match.end():]
    with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/GraphVisualizer/GraphVisualizer.jsx", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Success")
else:
    print("Not found")
