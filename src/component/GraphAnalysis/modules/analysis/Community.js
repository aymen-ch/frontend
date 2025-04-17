import React from 'react';
import axios from 'axios';
import { Button, Spinner } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';

const Community = ({ nodes, setNodes, isLoading, setIsLoading, ColorPersonWithClass }) => {
  const handleSecteurActiviti = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/Secteur_Activite/', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log(response.data);
      } else {
        console.error('handleSecteurActiviti failed.');
      }
    } catch (error) {
      console.error('Error during handleSecteurActiviti:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 d-flex flex-column gap-3">
      <Button
        variant="warning"
        className="w-100"
        onClick={() => ColorPersonWithClass(nodes, setNodes)}
      >
        Color Node with Class
      </Button>

      <Button
        variant="secondary"
        className="w-100"
        onClick={() => handleSecteurActiviti()}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Loading...
          </>
        ) : (
          'Secteur Activiti (Backend)'
        )}
      </Button>
    </div>
  );
};

export default Community;