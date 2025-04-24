import { parsergraph } from '../../utils/Parser';
import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, ListGroup, Spinner, Row, Col } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { useTranslation } from 'react-i18next';


const TopKCentrality = ({ setNodes, selectedGroup, setSelectedGroup, selectedCentralityAttribute, setSelectedCentralityAttribute }) => {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [topKnodes, setTopKnodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
 const{t} = useTranslation()
  const handleFetchNodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${BASE_URL}/analyse_fetch_nodes_by_range/`,
        {
          node_type: selectedGroup,
          attribute: selectedCentralityAttribute,
          start: parseInt(start),
          end: parseInt(end),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setTopKnodes(response.data.nodes || []);
      } else {
        setError('Failed to fetch nodes.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching nodes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNodeToVisualization = (node) => {
    const parsedResult = parsergraph({ nodes: [node], edges: [] });
    const newNode = parsedResult.nodes[0]; // Get the single parsed node
    setNodes((prevNodes) => [...prevNodes, newNode]);
  };

  return (
    <div className="p-3 d-flex flex-column gap-3">
      <h5>{t('Top K Centrality Nodes')}</h5>

      <Row className="g-2 mb-3">
        <Col xs={6}>
          <Form.Group controlId="rangeStart">
            <Form.Label>{t('Start Index')}</Form.Label>
            <Form.Control
              type="number"
              size="sm"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              min="0"
            />
          </Form.Group>
        </Col>
        <Col xs={6}>
          <Form.Group controlId="rangeEnd">
            <Form.Label>{t('End Index')}</Form.Label>
            <Form.Control
              type="number"
              size="sm"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              min={start}
            />
          </Form.Group>
        </Col>
      </Row>

      <Button
        variant="success"
        onClick={handleFetchNodes}
        disabled={isLoading || !selectedGroup || !selectedCentralityAttribute}
        size="sm"
        className="w-100 mb-3"
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
            Fetching...
          </>
        ) : (
          'Fetch Nodes'
        )}
      </Button>

      {error && <div className="text-danger">{error}</div>}

      {topKnodes.length > 0 && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <ListGroup>
            {topKnodes.map((node, index) => (
              <ListGroup.Item
                key={index}
                className="d-flex justify-content-between align-items-center"
              >
                <span>
                  Node ID: {node.id || 'N/A'}, {selectedCentralityAttribute}: {node.properties[selectedCentralityAttribute] || 'N/A'}
                </span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleAddNodeToVisualization(node)}
                >
                  +
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default TopKCentrality;
