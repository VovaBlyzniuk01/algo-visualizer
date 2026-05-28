import re

with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/GraphVisualizer/GraphVisualizer.jsx", "r", encoding="utf-8") as f:
    content = f.read()

start_str = r'<div className="w-full mb-4 flex flex-col lg:flex-row justify-between items-center bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/20 shadow-\[0_0_20px_rgba\(16,185,129,0\.05\)\] backdrop-blur-sm gap-4 relative z-50">'
end_str = r'            \</div>\n        \</div>'

# Regex search
pattern = re.compile(start_str + r'.*?' + end_str, re.DOTALL)
match = pattern.search(content)
if match:
    replacement = """<ControlsPanel
          dropdownRef={dropdownRef}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          selectedAlgorithm={selectedAlgorithm}
          setSelectedAlgorithm={setSelectedAlgorithm}
          clearPathVisualsOnly={clearPathVisualsOnly}
          visualizeAlgorithm={visualizeAlgorithm}
          isAnimating={isAnimating}
          stopAnimation={stopAnimation}
          clearBoard={clearBoard}
          speed={speed}
          setSpeed={setSpeed}
          algorithmCategories={algorithmCategories}
          flatAlgorithms={flatAlgorithms}
          t={t}
          isAnimatingRef={isAnimatingRef}
        />"""
    new_content = content[:match.start()] + replacement + content[match.end():]
    with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/GraphVisualizer/GraphVisualizer.jsx", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Success")
else:
    print("Not found")
