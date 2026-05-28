export const mergeSort = async ({
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
    
    const merge = async (l, m, r) => {
        let n1 = m - l + 1;
        let n2 = r - m;
        let L = new Array(n1);
        let R = new Array(n2);
        
        for (let i = 0; i < n1; i++) L[i] = arr[l + i];
        for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
        
        let i = 0, j = 0, k = l;
        setActiveLine(3);
        await sleep(getDelay() * 0.8);
        if (abortRef.current) return -1;
        
        while (i < n1 && j < n2) {
            await waitPause();
            if (abortRef.current) return -1;
            
            setActiveElements([l + i, m + 1 + j]);
            setActiveLine(4);
            
            comps++;
            setComparisonsCount(comps);
            playBeep(L[i]);
            
            if (checkCrash && checkCrash()) {
                triggerCrash();
                return -1;
            }
            
            await sleep(getDelay());
            if (abortRef.current) return -1;
            
            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            swps++;
            setSwapsCount(swps);
            setArray([...arr]);
            
            await sleep(getDelay() * 0.5);
            if (abortRef.current) return -1;
            k++;
        }
        
        setActiveLine(6);
        while (i < n1) {
            arr[k] = L[i];
            i++; k++;
            swps++;
            setSwapsCount(swps);
            setArray([...arr]);
            await sleep(getDelay() * 0.5);
            if (abortRef.current) return -1;
        }
        
        while (j < n2) {
            arr[k] = R[j];
            j++; k++;
            swps++;
            setSwapsCount(swps);
            setArray([...arr]);
            await sleep(getDelay() * 0.5);
            if (abortRef.current) return -1;
        }
        
        setActiveElements([]);
        return 0;
    };
    
    const ms = async (l, r) => {
        if (abortRef.current) return;
        if (l >= r) return;
        
        let m = l + Math.floor((r - l) / 2);
        setActiveLine(1);
        await sleep(getDelay());
        if (abortRef.current) return;
        
        await ms(l, m);
        if (abortRef.current) return;
        
        await ms(m + 1, r);
        if (abortRef.current) return;
        
        let res = await merge(l, m, r);
        if (abortRef.current || res === -1) return;
    };
    
    await sleep(getDelay());
    if (abortRef.current) { cleanupSortExit(); return; }
    
    await ms(0, arr.length - 1);
    if (abortRef.current) { cleanupSortExit(); return; }
    
    let finalSorted = [];
    for(let k=0; k<arr.length; k++){ finalSorted.push(k); }
    setSortedElements(finalSorted);
    setActiveElements([]);
    setActiveLine(null);
    await sleep(getDelay() * 0.5);
    cleanupSortExit();
};
