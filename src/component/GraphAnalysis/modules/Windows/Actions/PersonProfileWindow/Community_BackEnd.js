import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Container, Row, Col, Badge, Tabs, Tab, Image, ListGroup, Form, Spinner } from 'react-bootstrap';
import { 
  XLg, 
  Dash, 
  Fullscreen, 
  FullscreenExit, 
  Person, 
  InfoCircle,
  GeoAlt,
  Clock
} from 'react-bootstrap-icons';
import Draggable from 'react-draggable';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { BASE_URL } from '../../../../utils/Urls';
import { useTranslation } from 'react-i18next';

const Community_BackEnd = ({ selectedGroup, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(true);
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
  const nodeRef = useRef(null);
  const { t } = useTranslation();
  const token = localStorage.getItem('authToken');

  // List of centrality algorithms
  const centralityAlgorithms = [
    'K-1 Coloring',
    'Leiden',
    'Modularity Optimization',
    'Label Propagation',
    'Louvain'
  ];

  useEffect(() => {
    // Fetch relationship types
    const fetchRelationshipTypes = async () => {
      if (!selectedGroup) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${BASE_URL}/get_relationship_types_for_node_type/`, {
          params: {
            nodeType: selectedGroup,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        setRelationshipTypes(response.data.relationship_types || []);
        setSelectedRelationships([]); // Reset selected relationships
      } catch (err) {
        setError(err.response?.data?.error || t('Failed to fetch relationship types'));
      } finally {
        setLoading(false);
      }
    };

    // Fetch and filter virtual relations from local storage
    const fetchVirtualRelations = () => {
      try {
        const virtualRelations = JSON.parse(localStorage.getItem('virtualRelations')) || [];
        // Filter items where path starts and ends with selectedGroup
        const filteredRelations = virtualRelations.filter(
          (item) =>
            item.path.length > 0 &&
            item.path[0] === selectedGroup &&
            item.path[item.path.length - 1] === selectedGroup
        );
        setVirtualRelationItems(filteredRelations);
        setSelectedVirtualRelations([]); // Reset selected virtual relations
      } catch (err) {
        console.error('Error parsing virtualRelations from localStorage:', err);
      }
    };

    fetchRelationshipTypes();
    fetchVirtualRelations();
  }, [selectedGroup, t, token]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleCentralityChange = (e) => {
    setSelectedCentrality(e.target.value);
  };

  const handleNormalizationChange = (e) => {
    setIsNormalized(e.target.checked);
  };

  const handleAttributeNameChange = (e) => {
    setAttributeName(e.target.value);
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

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 10000); // 10 seconds
  };

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
        
        <h5 className="mt-4 mb-3 text-primary">{t('Relationship Types for')} {selectedGroup}</h5>
        {loading && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>{t('Loading...')}</p>
          </div>
        )}
        {error && <p className="text-danger mt-3">{error}</p>}
        {!loading && !error && relationshipTypes.length > 0 ? (
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
      </Card.Body>
    </Card>
  );

  return (
    <div className="profile-window-overlay bg-dark bg-opacity-50">
      {isMaximized ? (
        windowContent
      ) : (
        <Draggable nodeRef={nodeRef} handle=".window-header" bounds="parent">
          <div ref={nodeRef}>{windowContent}</div>
          
        </Draggable>
      )}
    </div>
  );
};

export default Community_BackEnd;