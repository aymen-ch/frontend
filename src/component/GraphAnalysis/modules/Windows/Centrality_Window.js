import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Row, Col, Badge, Tabs, Tab, Image, ListGroup, Form, Spinner, Table } from 'react-bootstrap';
import { 
  XLg, 
  Dash, 
  Fullscreen, 
  FullscreenExit, 
} from 'react-bootstrap-icons';
import Draggable from 'react-draggable';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { BASE_URL_Backend } from '../../Platforme/Urls';
import { useTranslation } from 'react-i18next';

const Analyse_BackEnd = ({ selectedGroup, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [virtualRelationItems, setVirtualRelationItems] = useState([]);
  const [selectedRelationships, setSelectedRelationships] = useState([]);
  const [selectedVirtualRelations, setSelectedVirtualRelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCentrality, setSelectedCentrality] = useState('Article Rank');
  const [isNormalized, setIsNormalized] = useState(false);
  const [attributeName, setAttributeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightProperty, setWeightProperty] = useState('');
  const [isDirected, setIsDirected] = useState(true);
  const [numericProperties, setNumericProperties] = useState({});
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [centralityResults, setCentralityResults] = useState([]); // New state for centrality results
  const nodeRef = useRef(null);
  const { t } = useTranslation();
  const token = localStorage.getItem('authToken');

  const centralityAlgorithms = [
    'Article Rank',
    'Articulation Points',
    'Betweenness Centrality',
    'Bridges',
    'Closeness Centrality',
    'Degree Centrality',
    'Eigenvector Centrality',
    'Page Rank'
  ];

  // Define algorithms that support weights and directed graphs
  const weightedAlgorithms = [
    'Article Rank',
    'Betweenness Centrality',
    'Closeness Centrality',
    'Degree Centrality',
    'Eigenvector Centrality',
    'Page Rank'
  ];
  const directedAlgorithms = [
    'Article Rank',
    'Betweenness Centrality',
    'Closeness Centrality',
    'Degree Centrality',
    'Eigenvector Centrality',
    'Page Rank'
  ];

  useEffect(() => {
    const fetchRelationshipTypes = async () => {
      if (!selectedGroup) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${BASE_URL_Backend}/get_relationship_types_for_node_type/`, {
          params: { nodeType: selectedGroup },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        setRelationshipTypes(response.data.relationship_types || []);
        setSelectedRelationships([]);
      } catch (err) {
        setError(err.response?.data?.error || t('Failed to fetch relationship types'));
      } finally {
        setLoading(false);
      }
    };

    const fetchVirtualRelations = () => {
      try {
        const virtualRelations = JSON.parse(localStorage.getItem('virtualRelations')) || [];
        const filteredRelations = virtualRelations.filter(
          (item) =>
            item.path.length > 0 &&
            item.path[0] === selectedGroup &&
            item.path[item.path.length - 1] === selectedGroup
        );
        setVirtualRelationItems(filteredRelations);
        setSelectedVirtualRelations([]);
      } catch (err) {
        console.error('Error parsing virtualRelations from localStorage:', err);
      }
    };

    fetchRelationshipTypes();
    fetchVirtualRelations();
  }, [selectedGroup, t, token]);

  // Modified useEffect to fetch numeric properties for all weighted algorithms
  useEffect(() => {
    if (!weightedAlgorithms.includes(selectedCentrality) || selectedRelationships.length === 0) {
      setNumericProperties({});
      return;
    }

    const fetchNumericProperties = async () => {
      setLoadingProperties(true);
      const properties = {};

      try {
        for (const relType of selectedRelationships) {
          const response = await axios.get(`${BASE_URL_Backend}/get_relationship_numeric_properties/`, {
            params: { relationshipType: relType },
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          properties[relType] = response.data.numeric_properties || [];
        }
        setNumericProperties(properties);
      } catch (err) {
        console.error('Error fetching numeric properties:', err);
        setError(t('Failed to fetch numeric properties'));
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchNumericProperties();
  }, [selectedRelationships, selectedCentrality, token, t]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleCentralityChange = (e) => {
    setSelectedCentrality(e.target.value);
    setWeightProperty(''); // Reset weight property when algorithm changes
  };

  const handleNormalizationChange = (e) => {
    setIsNormalized(e.target.checked);
  };

  const handleAttributeNameChange = (e) => {
    setAttributeName(e.target.value);
  };

  const handleWeightPropertyChange = (e) => {
    setWeightProperty(e.target.value);
  };

  const handleDirectedChange = (e) => {
    setIsDirected(e.target.checked);
  };

  const handleRelationshipToggle = (relType) => {
    setSelectedRelationships((prev) =>
      prev.includes(relType)
        ? prev.filter((item) => item !== relType)
        : [...prev, relType]
    );
  };

  const handleVirtualRelationToggle = (name) => {
    setSelectedVirtualRelations((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setCentralityResults([]); // Clear previous results

    try {
      const response = await axios.post(`${BASE_URL_Backend}/calculate_centrality/`, {
        nodeType: selectedGroup,
        centralityAlgorithm: selectedCentrality,
        attributeName: attributeName,
        normalize: isNormalized,
        weightProperty: weightProperty || null,
        isDirected: directedAlgorithms.includes(selectedCentrality) ? isDirected : false,
        selectedRelationships: selectedRelationships,
        virtualRelationships: selectedVirtualRelations,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Store the centrality results
      setCentralityResults(response.data.results || []);
      console.log('Centrality calculation result:', response.data);
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to calculate centrality'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableWeightProperties = Array.from(
    new Set(
      Object.values(numericProperties).flat()
    )
  );

  const windowContent = (
    <Card className={`profile-window ${isMaximized ? 'maximized' : ''} shadow-lg rounded-3`}>
      <Card.Header className="window-header d-flex justify-content-between align-items-center bg-primary text-white py-2 px-3">
        <Card.Title className="mb-0 fs-5">{t('Analysis for')} {selectedGroup}</Card.Title>
        <div className="window-controls">
          <Button variant="link" className="control-button p-0 me-2" title={t('Minimize')}>
            <Dash size={16} color="white" />
          </Button>
          <Button
            variant="link"
            className="control-button p-0 me-2"
            onClick={toggleMaximize}
            title={isMaximized ? t('Restore') : t('Maximize')}
          >
            {isMaximized ? <FullscreenExit size={16} color="white" /> : <Fullscreen size={16} color="white" />}
          </Button>
          <Button
            variant="link"
            className="control-button p-0"
            onClick={onClose}
            title={t('Close')}
          >
            <XLg size={16} color="white" />
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="window-content p-4 bg-light">
        <h5 className="mb-3 text-primary">{t('Analysis Settings')}</h5>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t('Centrality Algorithm')}</Form.Label>
              <Form.Select
                value={selectedCentrality}
                onChange={handleCentralityChange}
                className="shadow-sm"
              >
                {centralityAlgorithms.map((algo, index) => (
                  <option key={index} value={algo}>{algo}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">{t('Attribute Name')}</Form.Label>
              <Form.Control
                type="text"
                value={attributeName}
                onChange={handleAttributeNameChange}
                placeholder={t('Enter attribute name')}
                className="shadow-sm"
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label={t('Normalisation')}
            checked={isNormalized}
            onChange={handleNormalizationChange}
            className="fw-bold"
          />
        </Form.Group>

        {/* Advanced Configuration for All Supported Algorithms */}
        {(weightedAlgorithms.includes(selectedCentrality) || directedAlgorithms.includes(selectedCentrality)) && (
          <>
            <h5 className="mt-4 mb-3 text-primary">{t('Advanced Configuration')}</h5>
            <Row>
              {weightedAlgorithms.includes(selectedCentrality) && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">{t('Weight Property')}</Form.Label>
                    {loadingProperties ? (
                      <Spinner animation="border" size="sm" variant="primary" />
                    ) : (
                      <Form.Select
                        value={weightProperty}
                        onChange={handleWeightPropertyChange}
                        className="shadow-sm"
                        disabled={availableWeightProperties.length === 0}
                      >
                        <option value="">{t('Select weight property')}</option>
                        {availableWeightProperties.map((prop, index) => (
                          <option key={index} value={prop}>{prop}</option>
                        ))}
                      </Form.Select>
                    )}
                  </Form.Group>
                </Col>
              )}
              {directedAlgorithms.includes(selectedCentrality) && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label={t('Directed Graph')}
                      checked={isDirected}
                      onChange={handleDirectedChange}
                      className="fw-bold mt-4"
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>
          </>
        )}

        <h5 className="mt-4 mb-3 text-primary">{t('Relationship Types for')} {selectedGroup}</h5>
        {loading && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>{t('Loading...')}</p>
          </div>
        )}
       
        {!loading  && relationshipTypes.length > 0 ? (
          <ListGroup variant="flush" className="bg-white rounded shadow-sm">
            {relationshipTypes.map((relType, index) => (
              <ListGroup.Item
                key={index}
                className="d-flex align-items-center py-2"
              >
                <Form.Check
                  type="checkbox"
                  checked={selectedRelationships.includes(relType)}
                  onChange={() => handleRelationshipToggle(relType)}
                  className="me-3"
                />
                <span>{relType}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          !loading && !error && <p className="text-muted mt-3">{t('No relationship types found.')}</p>
        )}

        <h5 className="mt-4 mb-3 text-primary">{t('Virtual Relations')}</h5>
        {virtualRelationItems.length > 0 ? (
          <ListGroup variant="flush" className="bg-white rounded shadow-sm">
            {virtualRelationItems.map((item, index) => (
              <ListGroup.Item
                key={index}
                className="d-flex align-items-center py-2"
              >
                <Form.Check
                  type="checkbox"
                  checked={selectedVirtualRelations.includes(item.name)}
                  onChange={() => handleVirtualRelationToggle(item.name)}
                  className="me-3"
                />
                <span>
                  {item.name} <Badge bg="secondary" className="ms-2">Path: {item.path.join(' → ')}</Badge>
                </span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted mt-3">
            {t('No virtual relations found where path starts and ends with')} {selectedGroup}.
          </p>
        )}
        {error && <p className="text-danger mt-3">{error}</p>}
        <div className="d-grid gap-2 mt-4">
               
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                {t('Submitting...')}
              </>
            ) : (
              t('Submit')
            )}
          </Button>
        </div>

        {/* Centrality Results Table */}
        {centralityResults.length > 0 && (
          <div className="mt-5">
            <h5 className="mb-3 text-primary">{t('Centrality Results')}</h5>
            <Table striped bordered hover responsive className="shadow-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th>{t('Node ID')}</th>
                  <th>{t('Centrality Score')}</th>
                  {isNormalized && <th>{t('Normalized Score')}</th>}
                  <th>{t('Algorithm')}</th>
                </tr>
              </thead>
              <tbody>
                {centralityResults.map((result, index) => (
                  <tr key={index}>
                    <td>{result.node_id}</td>
                    <td>{result.score.toFixed(4)}</td>
                    {isNormalized && <td>{result.normalized_score?.toFixed(4) || 'N/A'}</td>}
                    <td>{selectedCentrality}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );

return (
  <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-50 flex justify-center items-center z-[1050] backdrop-blur-sm">
    {console.log('isMaximized', isMaximized)}
    {isMaximized ? (
      windowContent
    ) : (
      <Draggable nodeRef={nodeRef} handle=".window-header" bounds="parent">
        <div ref={nodeRef} className="w-full max-w-3xl bg-white rounded-lg shadow-xl">
          {windowContent}
        </div>
      </Draggable>
    )}
  </div>
);
};

export default Analyse_BackEnd;

