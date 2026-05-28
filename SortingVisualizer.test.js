import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';


const TestVisualizer = () => {
  const [isSorting, setIsSorting] = React.useState(false);
  return (
    <div>
      <h1>Sorting Visualizer Test</h1>
      <button 
        onClick={() => setIsSorting(true)} 
        disabled={isSorting}
      >
        {isSorting ? 'Sorting...' : 'Start'}
      </button>
    </div>
  );
};

test('перевірка взаємодії з інтерфейсом через React Testing Library', () => {

  render(<TestVisualizer />);

  
  const startButton = screen.getByText(/Start/i);
  
 
  expect(startButton).not.toBeDisabled();

  
  fireEvent.click(startButton);

 
  expect(startButton).toBeDisabled();
  expect(startButton).toHaveTextContent(/Sorting.../i);
});