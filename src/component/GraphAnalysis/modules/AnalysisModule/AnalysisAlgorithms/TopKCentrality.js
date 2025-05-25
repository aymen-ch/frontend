import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, ListGroup, Spinner, Row, Col, Card } from 'react-bootstrap';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import { useTranslation } from 'react-i18next';
import { LabelManager,parsergraph } from '../../Parser';

const TopKCentrality = ({ setNodes, selectedGroup, setSelectedGroup, selectedCentralityAttribute, setSelectedCentralityAttribute }) => {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [topKnodes, setTopKnodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const handleFetchNodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${BASE_URL_Backend}/analyse_fetch_nodes_by_range/`,
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
    const newNode = parsedResult.nodes[0];
    setNodes((prevNodes) => [...prevNodes, newNode]);
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <Card.Title className="mb-4 text-primary">{t('Top K Centrality Nodes')}</Card.Title>

        <Row className="g-3 mb-4">
          <Col md={6}>
            <Form.Group controlId="rangeStart">
              <Form.Label>{t('Start Index')}</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                min="0"
                className="border-primary-subtle"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="rangeEnd">
              <Form.Label>{t('End Index')}</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                min={start}
                className="border-primary-subtle"
              />
            </Form.Group>
          </Col>
        </Row>

        <Button
          variant="primary"
          onClick={handleFetchNodes}
          disabled={isLoading || !selectedGroup || !selectedCentralityAttribute}
          size="sm"
          className="w-100 mb-4 shadow-sm"
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
              {t('Fetching...')}
            </>
          ) : (
            t('Fetch Nodes')
          )}
        </Button>

        {error && <div className="text-danger mb-3">{error}</div>}

        {topKnodes.length > 0 && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <ListGroup variant="flush">
              {topKnodes.map((node, index) => (
                <ListGroup.Item
                  key={index}
                  className="d-flex justify-content-between align-items-center py-3 border-bottom transition-all"
                  style={{ transition: 'background-color 0.2s' }}
                  action
                >
                  <span className="text-dark fw-medium">
                    {LabelManager(node.nodeType, node.properties)}
                    {' | '}
                    <span className="text-muted">
                      {selectedCentralityAttribute}:
                      {'\n '}
                      <span className="fw-bold text-primary">
                        {node.properties[selectedCentralityAttribute] || 'N/A'}
                      </span>
                    </span>
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleAddNodeToVisualization(node)}
                    className="rounded-circle"
                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default TopKCentrality;