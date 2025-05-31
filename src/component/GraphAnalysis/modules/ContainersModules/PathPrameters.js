// AlgorithmContext.js
import { createContext, useState, useContext, useMemo } from 'react';


///***
// This is a set of global variables. It will be used  , it initialization is in the parent component ContainerModule.js.
// It shares the variables with the child components PathInput.js and PathVisualization.js.
// 
// 
// 
// ** *////

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