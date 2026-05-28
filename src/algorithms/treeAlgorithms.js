export const runTreeAlgorithm = async ({
    root,
    algorithmId,
    setActiveNode,
    setVisitedNodes,
    setFinalPath,
    setActiveLine,
    sleep,
    getDelay,
    abortRef,
    targetValue,
    playTone
}) => {
    let visited = [];
    setVisitedNodes([]);
    setFinalPath([]);
    setActiveNode(null);
    if (setActiveLine) setActiveLine(-1);

    const safeSetLine = async (line, delayRatio = 0.5) => {
        if (abortRef.current) return;
        if (setActiveLine) setActiveLine(line);
        if (delayRatio > 0) {
            await sleep(getDelay() * delayRatio);
        }
    };

    const visit = async (node, isTarget = false) => {
        if (!node || abortRef.current) return;
        
        setActiveNode(node.id);
        playTone(200 + node.value * 5, 'sine', 0.1, 0.05);

        await sleep(getDelay() * 0.4);
        if (abortRef.current) return;
        
        visited.push(node.id);
        setVisitedNodes([...visited]);
        
        await sleep(getDelay() * 0.4);
        if (abortRef.current) return;
        if (!isTarget) setActiveNode(null);
    };

    const targetFoundAction = async (curr) => {
        setFinalPath([...visited]);
        playTone(600, 'triangle', 0.15, 0.1);
        await sleep(150);
        playTone(800, 'triangle', 0.3, 0.1);
    };

    if (algorithmId === 'bst-search') {
        let curr = root;
        let found = false;
        
        const searchNode = async (node, target) => {
            if (abortRef.current) return null;
            await safeSetLine(0, 0.2); // function search
            
            await safeSetLine(1, 0.4); // if node is null
            if (!node) {
                await safeSetLine(2, 0.4); // return null
                return null;
            }
            
            await safeSetLine(3, 0.4); // if target == node.value
            const isMatch = node.value === target;
            await visit(node, isMatch);
            
            if (isMatch) {
                await safeSetLine(4, 0.4); // return node
                return node;
            }
            
            await safeSetLine(5, 0.4); // if target < node.value
            if (target < node.value) {
                await safeSetLine(6, 0.4); // search(node.left, target)
                return await searchNode(node.left, target);
            } else {
                await safeSetLine(7, 0.2); // else
                await safeSetLine(8, 0.4); // search(node.right, target)
                return await searchNode(node.right, target);
            }
        };

        const result = await searchNode(curr, targetValue);
        if (result && !abortRef.current) {
            await targetFoundAction(result);
        } else if (!abortRef.current) {
            playTone(150, 'sawtooth', 0.4, 0.1);
        }
    } else if (algorithmId === 'bst-min') {
        await safeSetLine(0, 0.2); // function findMin
        await safeSetLine(1, 0.4); // if node is null
        if (!root) {
            await safeSetLine(2, 0.4);
            return;
        }
        await safeSetLine(3, 0.4); // curr = node
        let curr = root;
        
        while (curr) {
            if (abortRef.current) break;
            
            await safeSetLine(4, 0.4); // while curr.left is not null
            const isMin = !curr.left;
            await visit(curr, isMin);
            
            if (isMin) {
                await safeSetLine(6, 0.4); // return curr
                await targetFoundAction(curr);
                break;
            }
            await safeSetLine(5, 0.4); // curr = curr.left
            curr = curr.left;
        }
    } else if (algorithmId === 'bst-max') {
        await safeSetLine(0, 0.2); // function findMax
        await safeSetLine(1, 0.4); // if node is null
        if (!root) {
            await safeSetLine(2, 0.4);
            return;
        }
        await safeSetLine(3, 0.4); // curr = node
        let curr = root;
        
        while (curr) {
            if (abortRef.current) break;
            
            await safeSetLine(4, 0.4); // while curr.right is not null
            const isMax = !curr.right;
            await visit(curr, isMax);
            
            if (isMax) {
                await safeSetLine(6, 0.4); // return curr
                await targetFoundAction(curr);
                break;
            }
            await safeSetLine(5, 0.4); // curr = curr.right
            curr = curr.right;
        }
    } else if (algorithmId === 'dfs-in') {
        const dfsIn = async (node) => {
            if (abortRef.current) return;
            await safeSetLine(0, 0.2); // function inorder
            await safeSetLine(1, 0.4); // if node is not null
            
            if (node) {
                await safeSetLine(2, 0.4); // inorder(node.left)
                await dfsIn(node.left);
                
                if (abortRef.current) return;
                await safeSetLine(3, 0.4); // visit(node)
                await visit(node);
                
                if (abortRef.current) return;
                await safeSetLine(4, 0.4); // inorder(node.right)
                await dfsIn(node.right);
            }
        };
        await dfsIn(root);
        if (!abortRef.current) {
            setActiveNode(null);
            setFinalPath([...visited]);
            playTone(500, 'sine', 0.1, 0.1);
            await sleep(100);
            playTone(700, 'sine', 0.2, 0.1);
        }
    }
    if (!abortRef.current && setActiveLine) {
        setActiveLine(-1);
    }
};
