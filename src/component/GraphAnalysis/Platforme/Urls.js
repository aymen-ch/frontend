
export const BASE_URL_Backend = 'http://127.0.0.1:8000/api';


export const URI = 'neo4j://localhost:7687';
export const USER = 'neo4j';
export const PASSWORD = '12345678';

// Utility function to get the authentication token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Utility function to handle API requests

