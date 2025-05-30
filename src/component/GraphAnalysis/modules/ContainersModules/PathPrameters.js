// AlgorithmContext.js
import { createContext, useState, useContext, useMemo } from 'react';

const AlgorithmContext = createContext();
// Fonction permettant d'assurer la gestion des variables de détection de chemin, par niveau
export function PathPrameter({ children }) {
  const [pathFindingParams, setPathFindingParams] = useState(null);
  const [shortestPathParams, setShortestPathParams] = useState(null);
  const [startPathfinding, setStartPathfinding] = useState(false);
  const [startShortestPathFinding, setStartShortestPathFinding] = useState(false);

  const value = useMemo(() => ({
    pathFindingParams,
    setPathFindingParams,
    shortestPathParams,
    setShortestPathParams,
    startPathfinding,
    setStartPathfinding,
    startShortestPathFinding,
    setStartShortestPathFinding
  }), [pathFindingParams, shortestPathParams, startPathfinding, startShortestPathFinding]);

  return (
    <AlgorithmContext.Provider value={value}>
      {children}
    </AlgorithmContext.Provider>
  );
}

export function useAlgorithm() {
  return useContext(AlgorithmContext);
}