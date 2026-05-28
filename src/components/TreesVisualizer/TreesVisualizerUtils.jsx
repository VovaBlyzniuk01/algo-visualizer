import React from 'react';
export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 10];
export const BASE_DELAY_MS = 1000;

export const TREE_ALGORITHMS = [
  { id: 'bst-search', key: 'bst-search', label: 'Пошук значення (BST Search)' },
  { id: 'bst-min', key: 'bst-min', label: 'Пошук мінімуму (Find Min)' },
  { id: 'bst-max', key: 'bst-max', label: 'Пошук максимуму (Find Max)' },
  { id: 'dfs-in', key: 'dfs-in', label: 'Симметричний обхід (In-order DFS)' },
];

export const generateTree = (level, x, y, horizontalSpacing, count = 15) => {
    // Generate random unique numbers for BST
    const nums = new Set();
    while(nums.size < count) nums.add(Math.floor(Math.random() * 90) + 10);
    const arr = Array.from(nums).sort((a,b) => a-b);

    const buildTree = (arr, x, y, hSpacing, depth) => {
        if (arr.length === 0 || depth === 0) return null;
        const mid = Math.floor(arr.length / 2);
        const node = {
            id: Math.random().toString(36).substr(2, 9),
            value: arr[mid],
            x,
            y,
            left: null,
            right: null
        };
        node.left = buildTree(arr.slice(0, mid), x - hSpacing, y + 100, hSpacing / 1.8, depth - 1);
        node.right = buildTree(arr.slice(mid + 1), x + hSpacing, y + 100, hSpacing / 1.8, depth - 1);
        return node;
    };

    return buildTree(arr, x, y, horizontalSpacing, level);
};

export const getEdges = (node, edges = []) => {
    if (!node) return edges;
    if (node.left) {
        edges.push({ id: `e-${node.id}-${node.left.id}`, source: node, target: node.left });
        getEdges(node.left, edges);
    }
    if (node.right) {
        edges.push({ id: `e-${node.id}-${node.right.id}`, source: node, target: node.right });
        getEdges(node.right, edges);
    }
    return edges;
};

export const getNodesList = (node, nodes = []) => {
    if (!node) return nodes;
    nodes.push(node);
    getNodesList(node.left, nodes);
    getNodesList(node.right, nodes);
    return nodes;
};

export const PSEUDOCODES = {
  'bst-search': [
    'function search(node, target):',
    '  if node is null:',
    '    return null',
    '  if target == node.value:',
    '    return node',
    '  if target < node.value:',
    '    return search(node.left, target)',
    '  else:',
    '    return search(node.right, target)'
  ],
  'bst-min': [
    'function findMin(node):',
    '  if node is null:',
    '    return null',
    '  curr = node',
    '  while curr.left is not null:',
    '    curr = curr.left',
    '  return curr'
  ],
  'bst-max': [
    'function findMax(node):',
    '  if node is null:',
    '    return null',
    '  curr = node',
    '  while curr.right is not null:',
    '    curr = curr.right',
    '  return curr'
  ],
  'dfs-in': [
    'function inorder(node):',
    '  if node is not null:',
    '    inorder(node.left)',
    '    visit(node)',
    '    inorder(node.right)'
  ]
};

export const renderCode = (codeLine) => {
    return codeLine.split(/(\b(?:function|if|return|else|while|is|not|null)\b)/g).map((part, i) => {
        if (['function', 'if', 'return', 'else', 'while'].includes(part)) {
            return <span key={i} className="text-pink-400 font-semibold">{part}</span>;
        }
        if (['is', 'not', 'null'].includes(part)) {
            return <span key={i} className="text-purple-400">{part}</span>;
        }
        if (/^[a-zA-Z_]\w*$/.test(part) && !['search', 'findMin', 'findMax', 'inorder', 'visit', 'node', 'target', 'curr', 'left', 'right', 'value'].includes(part)) {
             return <span key={i} className="text-amber-200">{part}</span>;
        }
        if (['search', 'findMin', 'findMax', 'inorder', 'visit'].includes(part)) {
            return <span key={i} className="text-blue-400">{part}</span>;
        }
        if (!isNaN(part) && part.trim() !== '') {
            return <span key={i} className="text-orange-400">{part}</span>;
        }
        return <span key={i} className="text-neutral-300">{part}</span>;
    });
};
