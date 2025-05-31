
export const BASE_URL_Backend = 'http://127.0.0.1:8000/api';
// Utility function to get the authentication token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};