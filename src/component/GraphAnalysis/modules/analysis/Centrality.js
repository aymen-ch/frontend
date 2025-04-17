import React from 'react';
import axios from 'axios';
import { Button, Spinner, Form } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { CentralityByAttribute } from '../../HorizontalModules/containervisualization/function_container';

const Centrality = ({ nodes, setNodes, selectedGroup, setSelectedGroup, selectedCentralityAttribute, setSelectedCentralityAttribute, isBetweennessLoading, setIsBetweennessLoading }) => {
  const centralityAttributes = [
    '_degree',
    '_betweennessCentrality',
    '_pagerank',
    '_articleRank',
    '_eigenvector',
    '_betweenness',
  ];

  const groupOptions = ['Personne', 'Account'];

  const handleCentralityBackend = async () => {
    try {
      setIsBetweennessLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/calculate_betweenness_centrality/', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log('Centrality calculated:', response.data);
        alert('Centrality calculated successfully!');
      } else {
        console.error('Centrality calculation failed.');
      }
    } catch (error) {
      console.error('Error during centrality calculation:', error);
    } finally {
      setIsBetweennessLoading(false);
    }
  };

  return (
    <div className="p-3 d-flex flex-column gap-3">
      <Form.Group controlId="groupSelect">
        <Form.Label>Select Node Group</Form.Label>
        <Form.Control
          as="select"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          {groupOptions.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      <Form.Group controlId="centralityAttributeSelect">
        <Form.Label>Select Centrality Attribute</Form.Label>
        <Form.Control
          as="select"
          value={selectedCentralityAttribute}
          onChange={(e) => setSelectedCentralityAttribute(e.target.value)}
        >
          {centralityAttributes.map((attr) => (
            <option key={attr} value={attr}>
              {attr}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      <Button
        variant="warning"
        className="w-100"
        onClick={() => CentralityByAttribute(nodes, setNodes, selectedCentralityAttribute, selectedGroup)}
      >
        Centrality by Attribute (Frontend)
      </Button>

      <Button
        variant="primary"
        className="w-100"
        onClick={handleCentralityBackend}
        disabled={isBetweennessLoading}
      >
        {isBetweennessLoading ? (
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
          'Centrality (Backend)'
        )}
      </Button>
    </div>
  );
};

export default Centrality;