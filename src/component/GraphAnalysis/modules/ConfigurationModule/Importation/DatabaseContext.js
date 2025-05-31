import React, { createContext, useContext, useState } from 'react';

const DatabaseContext = createContext();

////******
// This a globale variable that is shared within The importation module
// currentDb is variable that stoked in the BackEnd Represent the database that  i am connecting to
// 
// 
// 
//  */

export const DatabaseProvider = ({ children }) => {
  const [currentDb, setCurrentDb] = useState('');
  const [databases, setDatabases] = useState([]); /// The list of data bases of  The current  Neo4j Driver

  return (
    <DatabaseContext.Provider value={{ currentDb, setCurrentDb, databases, setDatabases }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  return useContext(DatabaseContext);
};