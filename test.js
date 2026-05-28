
const bubbleSortLogic = (arr) => {
    let tempArr = [...arr];
    for (let i = 0; i < tempArr.length; i++) {
        for (let j = 0; j < tempArr.length - i - 1; j++) {
            if (tempArr[j] > tempArr[j + 1]) {
                [tempArr[j], tempArr[j + 1]] = [tempArr[j + 1], tempArr[j]];
            }
        }
    }
    return tempArr;
};


test('масив має бути відсортований правильно', () => {
    const input = [5, 3, 8, 1];
    const expected = [1, 3, 5, 8];
    expect(bubbleSortLogic(input)).toEqual(expected);
});

import { render, screen, fireEvent } from '@testing-library/react';
import SortingVisualizer from './SortingVisualizer'; // шлях до твого компонента

test('кнопка Start має ставати неактивною після кліку', () => {
  render(<SortingVisualizer />);
  const startButton = screen.getByText(/Start/i);
  
  fireEvent.click(startButton);
  expect(startButton).toBeDisabled();
});