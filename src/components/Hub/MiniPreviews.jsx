import React, { useEffect, useId } from 'react';
import { getCardDelay } from './previewUtils';

const waitForFrame = (delay) =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, delay);
    });
  });

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const number = Number.parseInt(value, 16);

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
};

const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const brighten = (hex, amount = 0.25) => {
  const { r, g, b } = hexToRgb(hex);
  const mix = (value) => Math.round(value + (255 - value) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const useScopedId = (prefix) => {
  const reactId = useId();
  return `${prefix}-${reactId.replace(/[:]/g, '')}`;
};

const BAR_TRANSITION = {
  transition:
    'y 360ms cubic-bezier(0.22, 1, 0.36, 1), height 360ms cubic-bezier(0.22, 1, 0.36, 1), fill 240ms ease, stroke 240ms ease',
};

const SHAPE_TRANSITION = {
  transition:
    'fill 260ms ease, stroke 260ms ease, opacity 300ms ease, r 320ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width 260ms ease',
};

const PATH_TRANSITION = {
  transition: 'stroke 260ms ease, stroke-width 260ms ease, opacity 340ms ease',
};

const SORTING_VALUES = [72, 38, 90, 28, 60, 48, 82, 35, 66, 54];
const GRAPH_NODES = [
  { id: 0, x: 48, y: 92 },
  { id: 1, x: 112, y: 52 },
  { id: 2, x: 112, y: 132 },
  { id: 3, x: 184, y: 44 },
  { id: 4, x: 184, y: 92 },
  { id: 5, x: 184, y: 140 },
  { id: 6, x: 252, y: 92 },
];
const GRAPH_LEVELS = [[0], [1, 2], [3, 4, 5], [6]];
const DP_ROWS = 4;
const DP_COLS = 6;
const TREE_NODES = [
  { id: 0, x: 160, y: 36 },
  { id: 1, x: 98, y: 80 },
  { id: 2, x: 222, y: 80 },
  { id: 3, x: 62, y: 128 },
  { id: 4, x: 132, y: 128 },
  { id: 5, x: 196, y: 128 },
  { id: 6, x: 258, y: 128 },
];
const TREE_PREORDER = [0, 1, 3, 4, 2, 5, 6];
const TEXT_CHARS = 'ABABDABACDABABCABAB'.split('');
const PATTERN_CHARS = 'ABABCABAB'.split('');
const GEOMETRY_POINTS = [
  { x: 62, y: 132 },
  { x: 108, y: 58 },
  { x: 148, y: 36 },
  { x: 218, y: 52 },
  { x: 258, y: 110 },
  { x: 212, y: 146 },
  { x: 138, y: 150 },
  { x: 90, y: 108 },
  { x: 170, y: 92 },
  { x: 202, y: 104 },
];
const GEOMETRY_HULL = [0, 1, 2, 3, 4, 5, 6, 0];

const buildPalette = (accent = '#00d2ff') => ({
  accent,
  accentStrong: brighten(accent, 0.4),
  accentSoft: withAlpha(accent, 0.18),
  accentBorder: withAlpha(accent, 0.3),
  accentGlow: withAlpha(accent, 0.55),
  accentGrid: withAlpha(accent, 0.12),
  surface: withAlpha(accent, 0.08),
  surfaceStrong: withAlpha(accent, 0.16),
  idleFill: 'rgba(9, 18, 30, 0.9)',
  idleStroke: withAlpha(accent, 0.24),
  success: brighten(accent, 0.18),
  successStroke: brighten(accent, 0.55),
  alert: '#facc15',
  alertStroke: '#fde68a',
});

function MiniPreviewFrame({ accent, title, children, viewBox = '0 0 320 180' }) {
  const palette = buildPalette(accent);

  return (
    <div
      className="relative h-48 w-full overflow-hidden rounded-[1.9rem] border backdrop-blur-sm"
      style={{
        borderColor: palette.accentBorder,
        background: `radial-gradient(circle at top, ${withAlpha(accent, 0.22)}, transparent 38%), linear-gradient(180deg, rgba(8, 13, 24, 0.96), rgba(5, 10, 20, 0.9))`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 40px ${withAlpha(
          accent,
          0.1,
        )}, 0 20px 40px rgba(3, 7, 18, 0.45)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${withAlpha(accent, 0.14)}, transparent 28%, rgba(255,255,255,0.02))`,
        }}
      />
      <svg viewBox={viewBox} className="relative z-10 h-full w-full">
        <rect x="0" y="0" width="320" height="180" fill="rgba(3, 8, 18, 0.82)" />
        <path
          d="M0 36 H320 M0 72 H320 M0 108 H320 M0 144 H320 M40 0 V180 M80 0 V180 M120 0 V180 M160 0 V180 M200 0 V180 M240 0 V180 M280 0 V180"
          stroke={palette.accentGrid}
          strokeWidth="1"
        />
        <text x="18" y="25" fill={withAlpha(accent, 0.78)} fontSize="10" letterSpacing="2.8">
          {title}
        </text>
        {children(palette)}
      </svg>
    </div>
  );
}

export function MiniSortingPreview({ accent }) {
  const scope = useScopedId('sorting-card');

  useEffect(() => {
    let alive = true;
    const palette = buildPalette(accent);
    const settledGreen = '#4ade80';
    const settledGreenStroke = '#dcfce7';

    const paintBars = (arr, active = [], mode = 'idle', settled = []) => {
      arr.forEach((value, index) => {
        const bar = document.getElementById(`${scope}-bar-${index}`);
        if (!bar) return;

        const height = 32 + value;
        bar.setAttribute('y', `${158 - height}`);
        bar.setAttribute('height', `${height}`);

        let fill = palette.accent;
        let stroke = palette.accentStrong;

        if (settled.includes(index)) {
          fill = settledGreen;
          stroke = settledGreenStroke;
        }

        if (mode === 'compare' && active.includes(index)) {
          fill = palette.accentStrong;
          stroke = '#ffffff';
        }

        if (mode === 'swap' && active.includes(index)) {
          fill = palette.alert;
          stroke = palette.alertStroke;
        }

        if (mode === 'sorted' && active.includes(index)) {
          fill = settledGreen;
          stroke = settledGreenStroke;
        }

        bar.setAttribute('fill', fill);
        bar.setAttribute('stroke', stroke);
      });
    };

    const run = async () => {
      const delay = getCardDelay(132);

      while (alive) {
        const arr = [...SORTING_VALUES].sort(() => Math.random() - 0.5);
        let settled = [];
        paintBars(arr, [], 'idle', settled);
        await waitForFrame(delay * 4);

        for (let end = arr.length - 1; end > 0 && alive; end -= 1) {
          for (let index = 0; index < end && alive; index += 1) {
            paintBars(arr, [index, index + 1], 'compare', settled);
            await waitForFrame(delay);

            if (arr[index] > arr[index + 1]) {
              [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
              paintBars(arr, [index, index + 1], 'swap', settled);
              await waitForFrame(delay + 26);
            }

            paintBars(arr, [], 'idle', settled);
          }

          settled = [...settled, end];
          paintBars(arr, [end], 'sorted', settled);
          await waitForFrame(delay);
        }

        settled = arr.map((_, index) => index);
        paintBars(arr, settled, 'sorted', settled);
        await waitForFrame(delay * 6);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [accent, scope]);

  return (
    <MiniPreviewFrame accent={accent} title="BUBBLE SORT">
      {(palette) => (
        <>
          <path d="M22 156 H302" stroke={palette.accentBorder} strokeWidth="1.5" />
          {SORTING_VALUES.map((value, index) => (
            <rect
              key={index}
              id={`${scope}-bar-${index}`}
              x={26 + index * 28}
              y={158 - (32 + value)}
              width="18"
              height={32 + value}
              rx="4"
              fill={palette.accent}
              stroke={palette.accentStrong}
              strokeWidth="1.5"
              style={BAR_TRANSITION}
            />
          ))}
        </>
      )}
    </MiniPreviewFrame>
  );
}

export function MiniGraphPreview({ accent }) {
  const scope = useScopedId('graph-card');

  useEffect(() => {
    let alive = true;
    const palette = buildPalette(accent);

    const setNodeState = (nodeId, mode = 'idle') => {
      const node = document.getElementById(`${scope}-node-${nodeId}`);
      const halo = document.getElementById(`${scope}-halo-${nodeId}`);
      if (!node || !halo) return;

      if (mode === 'active') {
        node.setAttribute('fill', palette.accentStrong);
        node.setAttribute('stroke', '#ffffff');
        halo.setAttribute('opacity', '0.92');
        halo.setAttribute('r', '17');
      } else if (mode === 'visited') {
        node.setAttribute('fill', palette.success);
        node.setAttribute('stroke', palette.successStroke);
        halo.setAttribute('opacity', '0.35');
        halo.setAttribute('r', '14');
      } else {
        node.setAttribute('fill', palette.idleFill);
        node.setAttribute('stroke', palette.idleStroke);
        halo.setAttribute('opacity', '0');
        halo.setAttribute('r', '11');
      }
    };

    const setEdgeState = (edgeId, active = false) => {
      const edge = document.getElementById(`${scope}-edge-${edgeId}`);
      if (!edge) return;
      edge.setAttribute('stroke', active ? palette.accentStrong : palette.idleStroke);
      edge.setAttribute('strokeWidth', active ? '3' : '2');
    };

    const run = async () => {
      const delay = getCardDelay(272);

      while (alive) {
        GRAPH_NODES.forEach(({ id }) => setNodeState(id));
        for (let edgeId = 0; edgeId < 8; edgeId += 1) {
          setEdgeState(edgeId, false);
        }
        await waitForFrame(delay);

        for (const level of GRAPH_LEVELS) {
          if (!alive) break;
          level.forEach((nodeId) => setNodeState(nodeId, 'active'));
          level.forEach((nodeId) => {
            if (nodeId === 1) setEdgeState(0, true);
            if (nodeId === 2) setEdgeState(1, true);
            if (nodeId === 3) setEdgeState(2, true);
            if (nodeId === 4) setEdgeState(3, true);
            if (nodeId === 5) setEdgeState(5, true);
            if (nodeId === 6) {
              setEdgeState(4, true);
              setEdgeState(6, true);
              setEdgeState(7, true);
            }
          });
          await waitForFrame(delay);
          level.forEach((nodeId) => setNodeState(nodeId, 'visited'));
        }

        await waitForFrame(delay * 3);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [accent, scope]);

  return (
    <MiniPreviewFrame accent={accent} title="BFS WAVE">
      {(palette) => (
        <>
          {[
            [48, 92, 112, 52],
            [48, 92, 112, 132],
            [112, 52, 184, 44],
            [112, 52, 184, 92],
            [184, 44, 252, 92],
            [112, 132, 184, 92],
            [184, 92, 252, 92],
            [112, 132, 184, 140],
          ].map(([x1, y1, x2, y2], index) => (
            <line
              key={index}
              id={`${scope}-edge-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={palette.idleStroke}
              strokeWidth="2"
              style={PATH_TRANSITION}
            />
          ))}
          {GRAPH_NODES.map(({ id, x, y }) => (
            <g key={id}>
              <circle
                id={`${scope}-halo-${id}`}
                cx={x}
                cy={y}
                r="11"
                fill={palette.accentGlow}
                opacity="0"
                style={SHAPE_TRANSITION}
              />
              <circle
                id={`${scope}-node-${id}`}
                cx={x}
                cy={y}
                r="9"
                fill={palette.idleFill}
                stroke={palette.idleStroke}
                strokeWidth="2"
                style={SHAPE_TRANSITION}
              />
            </g>
          ))}
        </>
      )}
    </MiniPreviewFrame>
  );
}

export function MiniDPPreview({ accent }) {
  const scope = useScopedId('dp-card');

  useEffect(() => {
    let alive = true;
    const palette = buildPalette(accent);

    const setCellState = (row, col, mode = 'idle', value = '') => {
      const cell = document.getElementById(`${scope}-cell-${row}-${col}`);
      const label = document.getElementById(`${scope}-label-${row}-${col}`);
      if (!cell || !label) return;

      label.textContent = value;

      if (mode === 'active') {
        cell.setAttribute('fill', palette.accentStrong);
        cell.setAttribute('stroke', '#ffffff');
      } else if (mode === 'locked') {
        cell.setAttribute('fill', palette.success);
        cell.setAttribute('stroke', palette.successStroke);
      } else if (mode === 'dependency') {
        cell.setAttribute('fill', palette.surfaceStrong);
        cell.setAttribute('stroke', palette.accentStrong);
      } else {
        cell.setAttribute('fill', palette.idleFill);
        cell.setAttribute('stroke', palette.idleStroke);
      }
    };

    const run = async () => {
      const delay = getCardDelay(176);
      const values = Array.from({ length: DP_ROWS }, () => Array(DP_COLS).fill(0));

      while (alive) {
        for (let row = 0; row < DP_ROWS; row += 1) {
          for (let col = 0; col < DP_COLS; col += 1) {
            values[row][col] = 0;
            setCellState(row, col, 'idle', '0');
          }
        }

        await waitForFrame(delay * 2);

        for (let row = 1; row < DP_ROWS && alive; row += 1) {
          for (let col = 1; col < DP_COLS && alive; col += 1) {
            setCellState(row - 1, col, 'dependency', `${values[row - 1][col]}`);
            setCellState(row - 1, Math.max(0, col - 1), 'dependency', `${values[row - 1][Math.max(0, col - 1)]}`);
            setCellState(row, col, 'active', '');
            await waitForFrame(delay);

            values[row][col] = Math.max(values[row - 1][col], values[row - 1][Math.max(0, col - 1)] + row + col);
            setCellState(row, col, 'locked', `${values[row][col]}`);
            setCellState(row - 1, col, 'locked', `${values[row - 1][col]}`);
            setCellState(row - 1, Math.max(0, col - 1), 'locked', `${values[row - 1][Math.max(0, col - 1)]}`);
            await waitForFrame(delay - 8);
          }
        }

        await waitForFrame(delay * 4);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [accent, scope]);

  return (
    <MiniPreviewFrame accent={accent} title="KNAPSACK TABLE">
      {(palette) => (
        <>
          {Array.from({ length: DP_ROWS }).map((_, row) =>
            Array.from({ length: DP_COLS }).map((__, col) => (
              <g key={`${row}-${col}`}>
                <rect
                  id={`${scope}-cell-${row}-${col}`}
                  x={28 + col * 44}
                  y={38 + row * 30}
                  width="34"
                  height="22"
                  rx="6"
                  fill={palette.idleFill}
                  stroke={palette.idleStroke}
                  style={SHAPE_TRANSITION}
                />
                <text
                  id={`${scope}-label-${row}-${col}`}
                  x={45 + col * 44}
                  y={52 + row * 30}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.78)"
                  fontSize="10"
                >
                  0
                </text>
              </g>
            )),
          )}
        </>
      )}
    </MiniPreviewFrame>
  );
}

export function MiniTreePreview({ accent }) {
  const scope = useScopedId('tree-card');

  useEffect(() => {
    let alive = true;
    const palette = buildPalette(accent);

    const setNodeState = (nodeId, active = false) => {
      const node = document.getElementById(`${scope}-node-${nodeId}`);
      if (!node) return;
      node.setAttribute('fill', active ? palette.accentStrong : palette.idleFill);
      node.setAttribute('stroke', active ? '#ffffff' : palette.idleStroke);
    };

    const cursor = document.getElementById(`${scope}-cursor`);

    const moveCursor = (x, y) => {
      if (!cursor) return;
      cursor.setAttribute('cx', `${x}`);
      cursor.setAttribute('cy', `${y}`);
    };

    const run = async () => {
      const delay = getCardDelay(238);

      while (alive) {
        TREE_NODES.forEach(({ id }) => setNodeState(id, false));

        for (const nodeId of TREE_PREORDER) {
          if (!alive) break;
          const node = TREE_NODES.find((item) => item.id === nodeId);
          if (!node) continue;

          moveCursor(node.x, node.y);
          setNodeState(nodeId, true);
          await waitForFrame(delay);

          const settled = document.getElementById(`${scope}-node-${nodeId}`);
          if (settled) {
            settled.setAttribute('fill', palette.success);
            settled.setAttribute('stroke', palette.successStroke);
          }

          await waitForFrame(delay - 16);
        }

        await waitForFrame(delay * 4);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [accent, scope]);

  return (
    <MiniPreviewFrame accent={accent} title="PRE-ORDER DFS">
      {(palette) => (
        <>
          {[ 
            [160, 36, 98, 80],
            [160, 36, 222, 80],
            [98, 80, 62, 128],
            [98, 80, 132, 128],
            [222, 80, 196, 128],
            [222, 80, 258, 128],
          ].map(([x1, y1, x2, y2], index) => (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={palette.idleStroke}
              strokeWidth="2"
              style={PATH_TRANSITION}
            />
          ))}
          <circle id={`${scope}-cursor`} cx="160" cy="36" r="5" fill={palette.accentStrong} style={SHAPE_TRANSITION} />
          {TREE_NODES.map(({ id, x, y }) => (
            <circle
              key={id}
              id={`${scope}-node-${id}`}
              cx={x}
              cy={y}
              r="10"
              fill={palette.idleFill}
              stroke={palette.idleStroke}
              strokeWidth="2"
              style={SHAPE_TRANSITION}
            />
          ))}
        </>
      )}
    </MiniPreviewFrame>
  );
}

export function MiniStringPreview({ accent }) {
  const scope = useScopedId('strings-card');

  useEffect(() => {
    let alive = true;
    const palette = buildPalette(accent);

    const reset = () => {
      TEXT_CHARS.forEach((_, index) => {
        const cell = document.getElementById(`${scope}-text-${index}`);
        if (!cell) return;
        cell.setAttribute('fill', palette.idleFill);
        cell.setAttribute('stroke', palette.idleStroke);
      });

      PATTERN_CHARS.forEach((_, index) => {
        const cell = document.getElementById(`${scope}-pattern-${index}`);
        if (!cell) return;
        cell.setAttribute('fill', palette.surface);
        cell.setAttribute('stroke', palette.idleStroke);
      });
    };

    const moveWindow = (offset) => {
      const frame = document.getElementById(`${scope}-window`);
      if (frame) {
        frame.setAttribute('x', `${22 + offset * 13.8}`);
      }
    };

    const highlight = (offset, matchLength, mismatchIndex = -1) => {
      reset();
      moveWindow(offset);

      PATTERN_CHARS.forEach((_, index) => {
        const textCell = document.getElementById(`${scope}-text-${offset + index}`);
        const patternCell = document.getElementById(`${scope}-pattern-${index}`);
        if (!textCell || !patternCell) return;

        if (index < matchLength) {
          textCell.setAttribute('fill', palette.success);
          textCell.setAttribute('stroke', palette.successStroke);
          patternCell.setAttribute('fill', palette.success);
          patternCell.setAttribute('stroke', palette.successStroke);
        } else if (index === mismatchIndex) {
          textCell.setAttribute('fill', palette.alert);
          textCell.setAttribute('stroke', palette.alertStroke);
          patternCell.setAttribute('fill', palette.alert);
          patternCell.setAttribute('stroke', palette.alertStroke);
        }
      });
    };

    const run = async () => {
      const delay = getCardDelay(168);
      const checkpoints = [
        { offset: 0, match: 4, mismatch: 4 },
        { offset: 2, match: 2, mismatch: 2 },
        { offset: 5, match: 3, mismatch: 3 },
        { offset: 10, match: 5, mismatch: 5 },
        { offset: 11, match: 9, mismatch: -1 },
      ];

      while (alive) {
        reset();
        for (const step of checkpoints) {
          if (!alive) break;
          highlight(step.offset, step.match, step.mismatch);
          await waitForFrame(step.mismatch === -1 ? delay * 4 : delay * 2);
        }
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [accent, scope]);

  return (
    <MiniPreviewFrame accent={accent} title="KMP SEARCH">
      {(palette) => (
        <>
          <rect
            id={`${scope}-window`}
            x="22"
            y="54"
            width="124"
            height="28"
            rx="8"
            fill={withAlpha(accent, 0.08)}
            stroke={withAlpha(accent, 0.58)}
            style={PATH_TRANSITION}
          />
          {TEXT_CHARS.map((char, index) => (
            <g key={`text-${index}`}>
              <rect
                id={`${scope}-text-${index}`}
                x={22 + index * 13.8}
                y="54"
                width="12"
                height="28"
                rx="4"
                fill={palette.idleFill}
                stroke={palette.idleStroke}
                style={SHAPE_TRANSITION}
              />
              <text x={28 + index * 13.8} y="72" textAnchor="middle" fill="#f8fafc" fontSize="10">
                {char}
              </text>
            </g>
          ))}
          {PATTERN_CHARS.map((char, index) => (
            <g key={`pattern-${index}`}>
              <rect
                id={`${scope}-pattern-${index}`}
                x={22 + index * 26}
                y="112"
                width="22"
                height="28"
                rx="4"
                fill={palette.surface}
                stroke={palette.idleStroke}
                style={SHAPE_TRANSITION}
              />
              <text x={33 + index * 26} y="130" textAnchor="middle" fill="#fdf2f8" fontSize="11">
                {char}
              </text>
            </g>
          ))}
        </>
      )}
    </MiniPreviewFrame>
  );
}

export function MiniGeometryPreview({ accent }) {
  const scope = useScopedId('geometry-card');

  useEffect(() => {
    let alive = true;
    const palette = buildPalette(accent);

    const reset = () => {
      GEOMETRY_POINTS.forEach((_, index) => {
        const point = document.getElementById(`${scope}-point-${index}`);
        if (!point) return;
        point.setAttribute('fill', index < 7 ? palette.accent : palette.surfaceStrong);
      });

      for (let edge = 0; edge < GEOMETRY_HULL.length - 1; edge += 1) {
        const path = document.getElementById(`${scope}-hull-${edge}`);
        if (!path) continue;
        path.setAttribute('opacity', '0');
      }
    };

    const run = async () => {
      const delay = getCardDelay(224);

      while (alive) {
        reset();

        for (let edge = 0; edge < GEOMETRY_HULL.length - 1 && alive; edge += 1) {
          const start = GEOMETRY_HULL[edge];
          const end = GEOMETRY_HULL[edge + 1];
          const point = document.getElementById(`${scope}-point-${start}`);
          const path = document.getElementById(`${scope}-hull-${edge}`);

          if (point) point.setAttribute('fill', palette.accentStrong);
          if (path) path.setAttribute('opacity', '1');

          await waitForFrame(delay);

          if (point) point.setAttribute('fill', palette.success);
          const nextPoint = document.getElementById(`${scope}-point-${end}`);
          if (nextPoint) nextPoint.setAttribute('fill', palette.accentStrong);
        }

        await waitForFrame(delay * 4);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [accent, scope]);

  return (
    <MiniPreviewFrame accent={accent} title="GRAHAM SCAN">
      {(palette) => (
        <>
          {GEOMETRY_HULL.slice(0, -1).map((pointIndex, index) => {
            const start = GEOMETRY_POINTS[pointIndex];
            const end = GEOMETRY_POINTS[GEOMETRY_HULL[index + 1]];

            return (
              <line
                key={index}
                id={`${scope}-hull-${index}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={palette.accentStrong}
                strokeWidth="3"
                opacity="0"
                style={PATH_TRANSITION}
              />
            );
          })}
          {GEOMETRY_POINTS.map((point, index) => (
            <circle
              key={index}
              id={`${scope}-point-${index}`}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={index < 7 ? palette.accent : palette.surfaceStrong}
              stroke={palette.successStroke}
              style={SHAPE_TRANSITION}
            />
          ))}
        </>
      )}
    </MiniPreviewFrame>
  );
}
