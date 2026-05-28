export const bubbleSort = async ({
    array,
    setArray,
    setComparisonsCount,
    setSwapsCount,
    setActiveElements,
    setSortedElements,
    setActiveLine,
    sleep,
    getDelay,
    abortRef,
    waitPause,
    triggerCrash,
    playBeep,
    cleanupSortExit,
    checkCrash
}) => {
    let arr = [...array];
    let n = arr.length;
    let sortedIdx = [];
    
    let comps = 0;
    let swps = 0;
    setComparisonsCount(0);
    setSwapsCount(0);
    
    setActiveLine(0);
    await sleep(getDelay());
    if (abortRef.current) { cleanupSortExit(); return; }

    for (let i = 0; i < n - 1; i++) {
      if (abortRef.current) { cleanupSortExit(); return; }
      
      setActiveLine(1);
      let swapped = false;
      await sleep(getDelay() * 0.8);
      if (abortRef.current) { cleanupSortExit(); return; }

      for (let j = 0; j < n - i - 1; j++) {
        await waitPause();
        if (abortRef.current) { cleanupSortExit(); return; }
        
        setActiveElements([j, j + 1]);
        setActiveLine(2);
        
        comps++;
        setComparisonsCount(comps);
        playBeep(arr[j]);
        
        if (checkCrash && checkCrash()) {
            triggerCrash();
            return;
        }

        await sleep(getDelay());
        if (abortRef.current) { cleanupSortExit(); return; }

        if (arr[j] > arr[j + 1]) {
          setActiveLine(3);
          await sleep(getDelay() * 0.5);
          if (abortRef.current) { cleanupSortExit(); return; }
          
          let temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          swps++;
          setSwapsCount(swps);
          setActiveLine(4);
          await sleep(getDelay() * 0.5);
          setActiveLine(5);
          swapped = true;
          
          setArray([...arr]);
          
          await sleep(getDelay());
          if (abortRef.current) { cleanupSortExit(); return; }
        }
      }
      
      sortedIdx.push(n - i - 1);
      setSortedElements([...sortedIdx]);
      
      if (!swapped) {
         setActiveElements([]);
         setActiveLine(8);
         await sleep(getDelay());
         break;
      }
    }
    
    let finalSorted = [];
    for(let k=0; k<n; k++){ finalSorted.push(k); }
    setSortedElements(finalSorted);
    setActiveElements([]);
    setActiveLine(null);
    await sleep(getDelay() * 0.5);
    cleanupSortExit();
};
