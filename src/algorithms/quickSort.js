export const quickSort = async ({
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
    let comps = 0;
    let swps = 0;
    let sortedIdx = new Set();
    
    setComparisonsCount(0);
    setSwapsCount(0);
    setActiveLine(0);
    
    const partition = async (low, high) => {
        let pivot = arr[high];
        let i = low - 1;
        setActiveLine(2);
        await sleep(getDelay());
        if (abortRef.current) return -1;
        
        for (let j = low; j <= high - 1; j++) {
            await waitPause();
            if (abortRef.current) return -1;
            
            setActiveElements([j, high]);
            setActiveLine(3);
            
            comps++;
            setComparisonsCount(comps);
            playBeep(arr[j]);
            
            if (checkCrash && checkCrash()) {
                triggerCrash();
                return -1;
            }
            
            await sleep(getDelay() * 0.8);
            if (abortRef.current) return -1;
            
            if (arr[j] < pivot) {
                i++;
                setActiveLine(4);
                let temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
                swps++;
                setSwapsCount(swps);
                setArray([...arr]);
                
                await sleep(getDelay());
                if (abortRef.current) return -1;
            }
        }
        setActiveLine(6);
        let temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        swps++;
        setSwapsCount(swps);
        setArray([...arr]);
        
        await sleep(getDelay());
        if (abortRef.current) return -1;
        
        setActiveElements([]);
        return i + 1;
    };
    
    const qs = async (low, high) => {
        if (abortRef.current) return;
        if (low < high) {
            setActiveLine(1);
            let pi = await partition(low, high);
            if (abortRef.current || pi === -1) return;
            
            sortedIdx.add(pi);
            setSortedElements([...sortedIdx]);
            
            await qs(low, pi - 1);
            if (abortRef.current) return;
            
            await qs(pi + 1, high);
            if (abortRef.current) return;
        } else if (low === high) {
            sortedIdx.add(low);
            setSortedElements([...sortedIdx]);
        }
    };
    
    await sleep(getDelay());
    if (abortRef.current) { cleanupSortExit(); return; }
    
    await qs(0, arr.length - 1);
    if (abortRef.current) { cleanupSortExit(); return; }
    
    let finalSorted = [];
    for(let k=0; k<arr.length; k++){ finalSorted.push(k); }
    setSortedElements(finalSorted);
    setActiveElements([]);
    setActiveLine(null);
    await sleep(getDelay() * 0.5);
    cleanupSortExit();
};
