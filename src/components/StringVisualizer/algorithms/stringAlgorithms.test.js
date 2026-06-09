import { test, expect } from '@playwright/test';
import { getNaiveSteps } from './stringAlgorithms';

/**
 * Unit-тести для генератора кроків наївного пошуку підрядка.
 * Кожен крок — об'єкт у масиві (аналог yield / next().value у генераторі).
 */
test.describe('getNaiveSteps', () => {
  // Граничний випадок: некоректні вхідні дані не повинні генерувати кроки візуалізації
  test('повертає порожній масив кроків, якщо шаблон довший за текст', () => {
    const steps = getNaiveSteps('abc', 'abcd');

    expect(steps).toEqual([]);
  });

  // Перевірка послідовності кроків порівняння при першій невідповідності символів
  test('генерує кроки compare з коректними індексами та прапорцем match', () => {
    const steps = getNaiveSteps('abx', 'abc');

    expect(steps).toHaveLength(3);
    expect(steps[0]).toMatchObject({
      type: 'compare',
      textIndex: 0,
      patternIndex: 0,
      windowStart: 0,
      match: true,
    });
    expect(steps[1]).toMatchObject({
      type: 'compare',
      textIndex: 1,
      patternIndex: 1,
      windowStart: 0,
      match: true,
    });
    expect(steps[2]).toMatchObject({
      type: 'compare',
      textIndex: 2,
      patternIndex: 2,
      windowStart: 0,
      match: false,
    });
    expect(steps.some((s) => s.type === 'found')).toBe(false);
  });

  // Успішне знаходження підрядка: останній крок має тип found із правильним зсувом вікна
  test('додає крок found після повного збігу шаблону', () => {
    const steps = getNaiveSteps('hello', 'll');

    const foundStep = steps.find((s) => s.type === 'found');

    expect(foundStep).toEqual({
      type: 'found',
      windowStart: 2,
      matchIndex: 2,
    });
  });

  // Алгоритм обходить усі позиції: при відсутності збігу лише compare-кроки
  test('не знаходить підрядок, якщо його немає в тексті', () => {
    const steps = getNaiveSteps('abcdef', 'xyz');

    expect(steps.every((s) => s.type === 'compare')).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });
});