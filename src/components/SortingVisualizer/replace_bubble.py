import re

with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/SortingVisualizer/SortingVisualizer.jsx", "r", encoding="utf-8") as f:
    content = f.read()

start_str = r'const bubbleSort = async \(\) => \{'
end_str = r'cleanupSortExit\(\);\n  \};'

pattern = re.compile(start_str + r'.*?' + end_str, re.DOTALL)
match = pattern.search(content)

if match:
    replacement = """const startBubbleSort = async () => {
    if (isSorting || isCrashed) return;
    setIsSorting(true);
    setInputError('');
    abortRef.current = false;
    isCrashedRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;

    const getDelay = () => Math.max(8, BASE_SORT_DELAY_MS / speedRef.current);
    
    await bubbleSortAlgorithm({
        array,
        setArray,
        setComparisonsCount,
        setSwapsCount,
        setActiveElements: setComparing,
        setSortedElements: setSorted,
        setActiveLine,
        sleep,
        getDelay,
        abortRef,
        waitPause,
        triggerCrash,
        playBeep,
        cleanupSortExit,
        checkCrash: () => (isCrashedRef.current)
    });
  };"""
    new_content = content[:match.start()] + replacement + content[match.end():]
    
    # Also replace bubbleSort() with startBubbleSort() inside handleStartSort
    new_content = new_content.replace("setTimeout(() => bubbleSort(), 50);", "setTimeout(() => startBubbleSort(), 50);")
    new_content = new_content.replace("bubbleSort();", "startBubbleSort();")
    
    with open("/mnt/c/Users/iterb/OneDrive/Рабочий стол/my botik/diploma/src/components/SortingVisualizer/SortingVisualizer.jsx", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Success")
else:
    print("Not found")
