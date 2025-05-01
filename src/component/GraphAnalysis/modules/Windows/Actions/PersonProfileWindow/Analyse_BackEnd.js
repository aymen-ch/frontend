// src/components/PersonProfileWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Container, Row, Col, Badge, Tabs, Tab, Image, ListGroup } from 'react-bootstrap';
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

const Analyse_BackEnd = ({selectedGroup, onClose  }) => {
    const [isMaximized, setIsMaximized] = useState(true);
    const [relationshipTypes, setRelationshipTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const nodeRef = useRef(null);
    const { t } = useTranslation();
    const token = localStorage.getItem('authToken');    

    useEffect(() => {
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
          } catch (err) {
            setError(err.response?.data?.error || t('Failed to fetch relationship types'));
          } finally {
            setLoading(false);
          }
        };
    
        fetchRelationshipTypes();
      }, [selectedGroup]);


  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Format timestamp to readable date if it exists


  const windowContent = (
    <Card className={`profile-window ${isMaximized ? 'maximized' : ''} shadow`}>
      <Card.Header className="window-header d-flex justify-content-between align-items-center">
        
        <div className="window-controls">
          <Button variant="link" className="control-button p-0 me-2" title="Minimize">
            <Dash size={16} color="white" />
          </Button>
          <Button 
            variant="link" 
            className="control-button p-0 me-2" 
            onClick={toggleMaximize} 
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <FullscreenExit size={16} color="white" /> : <Fullscreen size={16} color="white" />}
          </Button>
          <Button 
            variant="link" 
            className="control-button p-0" 
            onClick={onClose} 
            title="Close"
          >
            <XLg size={16} color="white" />
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="window-content p-3">
        <h5>{t('Relationship Types for')} {selectedGroup}</h5>
        {loading && <p>{t('Loading...')}</p>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && relationshipTypes.length > 0 ? (
          <ListGroup variant="flush">
            {relationshipTypes.map((relType, index) => (
              <ListGroup.Item key={index}>{relType}</ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          !loading && !error && <p>{t('No relationship types found.')}</p>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="profile-window-overlay">
      {isMaximized ? (
        windowContent
      ) : (
        <Draggable nodeRef={nodeRef} handle=".window-header" bounds="parent">
          <div ref={nodeRef}>
            {windowContent}
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default Analyse_BackEnd;

