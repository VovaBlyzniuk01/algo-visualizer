import React, { useMemo, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Node, { areNodePropsEqual } from './Node';
import { logStep, logTestResult, logSection } from '../../test-utils/stepReporter';

const createHandlers = () => ({
  onMouseDown: jest.fn(),
  onMouseEnter: jest.fn(),
  onMouseUp: jest.fn(),
});

const baseNodeProps = {
  col: 2,
  row: 3,
  isStart: false,
  isFinish: false,
  isWall: false,
  isWeight: false,
  weight: 1,
  isVisited: false,
  isShortestPath: false,
};

/** Батько зі стабільними пропсами Node — лише його власний стан змінюється */
function StableNodeHost() {
  const nodeProps = useMemo(() => ({ ...baseNodeProps, ...createHandlers() }), []);
  const [parentTick, setParentTick] = useState(0);

  return (
    <>
      <button type="button" data-testid="parent-tick" onClick={() => setParentTick((t) => t + 1)}>
        parent:{parentTick}
      </button>
      <Node {...nodeProps} />
    </>
  );
}

/** Батько змінює лише isVisited — візуально значущий проп для memo */
function MutableVisualHost() {
  const [isVisited, setIsVisited] = useState(false);
  const handlers = useMemo(() => createHandlers(), []);
  const nodeProps = useMemo(
    () => ({
      ...baseNodeProps,
      isVisited,
      ...handlers,
    }),
    [isVisited, handlers]
  );

  return (
    <>
      <button type="button" data-testid="toggle-visited" onClick={() => setIsVisited((v) => !v)}>
        visited:{String(isVisited)}
      </button>
      <Node {...nodeProps} />
    </>
  );
}

describe('Node — оптимізація через React.memo', () => {
  beforeEach(() => {
    logSection('Модуль: Graph Node (React.memo + лічильник ререндерів)');
  });

  // Тест 5: статична перевірка — компонент експортується як React.memo з кастомним comparator
  it('використовує React.memo для мемоізації', () => {
    logStep(1, 'Перевірка типу експортованого компонента Node', screen);

    expect(Node).toBeDefined();
    expect(String(Node.$$typeof)).toBe('Symbol(react.memo)');
    expect(typeof areNodePropsEqual).toBe('function');

    logStep(2, 'Comparator: row/col не викликають ререндер без зміни візуального стану', screen);

    const prev = { ...baseNodeProps, ...createHandlers(), col: 0, row: 0 };
    const next = { ...baseNodeProps, ...createHandlers(), col: 5, row: 9 };
    expect(areNodePropsEqual(prev, next)).toBe(true);

    const changed = { ...next, isVisited: true };
    expect(areNodePropsEqual(next, changed)).toBe(false);

    logTestResult(5, 'Наявність React.memo та функції порівняння пропсів');
  });

  // Тест 6: при оновленні батька класи DOM вузла не змінюються (memo блокує зайву роботу)
  it('зберігає візуальний стан вузла при оновленні лише батьківського компонента', () => {
    logStep(1, 'Монтування Node зі стабільними пропсами під батьком', screen);

    render(<StableNodeHost />);
    const node = document.getElementById('node-3-2');
    const classBefore = node.className;

    logStep(2, 'Два кліки по parent-tick — змінюється лише лічильник батька', screen);
    fireEvent.click(screen.getByTestId('parent-tick'));
    fireEvent.click(screen.getByTestId('parent-tick'));

    logStep(3, 'DOM вузла графа не змінився (React.memo уникнув зайвого оновлення)', screen);

    expect(node.className).toBe(classBefore);
    expect(node.className).not.toMatch(/node-visited/);

    logTestResult(6, 'Мемоізація: стабільний DOM при незмінних пропсах Node');
  });

  // Тест 7: зміна isVisited інвалідує memo — вузол отримує новий CSS-клас
  it('оновлює CSS-клас вузла при зміні візуально значущих пропсів', () => {
    logStep(1, 'Початковий стан: isVisited=false', screen);

    render(<MutableVisualHost />);
    const node = document.getElementById('node-3-2');

    expect(node.className).not.toMatch(/node-visited/);

    logStep(2, 'Тогл isVisited=true — очікуємо клас node-visited', screen);
    fireEvent.click(screen.getByTestId('toggle-visited'));

    logStep(3, 'DOM відобразив новий візуальний стан обходу', screen);

    expect(node.className).toMatch(/node-visited/);
    expect(screen.getByTestId('toggle-visited')).toHaveTextContent('visited:true');

    logTestResult(7, 'Інвалідація memo при зміні isVisited');
  });
});
