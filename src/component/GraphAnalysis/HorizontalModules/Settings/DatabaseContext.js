import React, { createContext, useContext, useState } from 'react';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [currentDb, setCurrentDb] = useState('');
  const [databases, setDatabases] = useState([]);

  return (
    <DatabaseContext.Provider value={{ currentDb, setCurrentDb, databases, setDatabases }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  return useContext(DatabaseContext);
};