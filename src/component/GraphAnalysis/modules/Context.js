// AlgorithmContext.js
import { createContext, useState, useContext } from 'react';

const AlgorithmContext = createContext();

export function AlgorithmProvider({ children }) {
  const [pathFindingParams, setPathFindingParams] = useState(null);
  const [shortestPathParams, setShortestPathParams] = useState(null);

  const value = {
    pathFindingParams,
    setPathFindingParams,
    shortestPathParams,
    setShortestPathParams
  };

  return (
    <AlgorithmContext.Provider value={value}>
      {children}
    </AlgorithmContext.Provider>
  );
}

export function useAlgorithm() {
  return useContext(AlgorithmContext);
}