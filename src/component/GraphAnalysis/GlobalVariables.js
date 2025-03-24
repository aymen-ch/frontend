// GlobalVariables.js
import React, { createContext, useContext, useState } from 'react';

// Create the context
const GlobalContext = createContext();

// Create a provider component
export const GlobalProvider = ({ children }) => {
  // Initial global states
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Placeholder for additional global states
  // Add more global states here as needed
  // Example:
  // const [someOtherState, setSomeOtherState] = useState(initialValue);

  // Combine all states and setters in the value object
  const value = {
    nodes,
    setNodes,
    edges,
    setEdges,
    // Add more states and setters here as needed
    // someOtherState,
    // setSomeOtherState,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};