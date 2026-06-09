import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`no-invert flex items-center justify-center p-2 rounded-lg transition-all border ${
        theme === 'light' 
          ? 'bg-blue-100/50 border-blue-300 text-blue-900 hover:bg-blue-200/50' 
          : 'bg-neutral-800/50 border-neutral-700 text-yellow-400 hover:bg-neutral-700/50'
      }`}
      aria-label="Toggle Theme"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

export default ThemeToggle;
