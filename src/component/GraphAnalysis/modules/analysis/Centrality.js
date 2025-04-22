import axios from 'axios';
import { Button, Spinner, Form } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { CentralityByAttribute } from '../../HorizontalModules/containervisualization/function_container';
import { parsergraph } from '../../utils/Parser';
import TopKCentrality from './TopKCentrality';
import React, { useEffect, useState } from 'react';

const Centrality = ({ nodes, setNodes, selectedGroup, setSelectedGroup, selectedCentralityAttribute, setSelectedCentralityAttribute, isBetweennessLoading, setIsBetweennessLoading }) => {
  const centralityAttributes = [
    'degree_out',
    'degree_in',
    '_betweennessCentrality',
    '_pagerank',
    '_articleRank',
    '_eigenvector',
    '_betweenness',
  ];

  const [nodeData, setNodeData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
      const fetchNodeTypes = async () => {
          try {
              const token = localStorage.getItem('authToken');
              const response = await axios.get(BASE_URL+'/node-types/', {
                  headers: {
                      Authorization: `Bearer ${token}`,
                  },
              });
              if (response.status !== 200) {
                  throw new Error('Network response was not ok');
              }
              setNodeData(response.data.node_types);
              // Set the first node type as selected if nodeData is not empty
              if (response.data.node_types.length > 0) {
                  setSelectedGroup(response.data.node_types[0].type);
              }
          } catch (error) {
              console.error('Error fetching data:', error);
              setError(error.message || 'An error occurred');
          }
      };
      fetchNodeTypes();
  }, []);

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
          {nodeData.map((node, index) => (
            <option key={node.type} value={node.type}>
              {node.type}
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

      <TopKCentrality
        setNodes={setNodes}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        selectedCentralityAttribute={selectedCentralityAttribute}
        setSelectedCentralityAttribute={setSelectedCentralityAttribute}
      />
    </div>
  );
};

export default Centrality;