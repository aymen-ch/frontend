import axios from 'axios';
// Define the base URL for your API requests
export const BASE_URL_Backend = 'http://127.0.0.1:8000/api';

export const BASE_URL_Neo4j = 'http://127.0.0.1:8000/api';

export const URI = 'neo4j://localhost:7687';
export const USER = 'neo4j';
export const PASSWORD = '12345678';

// Utility function to get the authentication token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Utility function to handle API requests
export const fetchNodeProperties = async (nodeType) => {
  const token = getAuthToken();
  try {
    const response = await axios.get(`${BASE_URL_Backend}/node-types/properties/`, {
      params: { node_type: nodeType },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return response.data.properties;
    } else {
      throw new Error('Error fetching properties');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Utility function to submit search form
export const submitSearch = async (nodeType, formValues) => {
  const token = getAuthToken();
  const filteredFormValues = Object.fromEntries(
    Object.entries(formValues).filter(([key, value]) => value !== '' && value !== null)
  );

  const payload = {
    node_type: nodeType,
    properties: { ...filteredFormValues },
  };

  try {
    const response = await axios.post(
      `${BASE_URL_Backend}/search-nodes/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Submission failed.');
    }
  } catch (error) {
    console.error('Error during submission:', error);
    throw error;
  }
};
