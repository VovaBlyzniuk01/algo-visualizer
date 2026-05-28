import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Hub from './components/Hub/Hub';
import SortingVisualizer from './components/SortingVisualizer/SortingVisualizer';
import GraphVisualizer from './components/GraphVisualizer/GraphVisualizer';
import DPWorkbench from './components/DPWorkbench/DPWorkbench';
import GeometryVisualizer from './components/GeometryVisualizer/GeometryVisualizer';
import TreesVisualizer from './components/TreesVisualizer/TreesVisualizer';
import StringVisualizer from './components/StringVisualizer/StringVisualizer';
import { LanguageProvider } from './context/LanguageContext';

function AppContent() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Hub />} />
        <Route path="/sorting" element={<SortingVisualizer />} />
        <Route path="/graphs" element={<GraphVisualizer />} />
        <Route path="/dp-workbench" element={<DPWorkbench />} />
        <Route path="/geometry" element={<GeometryVisualizer />} />
        <Route path="/trees" element={<TreesVisualizer />} />
        <Route path="/strings" element={<StringVisualizer />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
