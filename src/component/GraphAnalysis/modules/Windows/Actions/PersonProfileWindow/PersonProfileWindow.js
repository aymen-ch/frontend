// src/components/PersonProfileWindow.jsx
import React, { useState, useRef } from 'react';
import { Button, Card, Container, Row, Col, Badge, Tabs, Tab, Image } from 'react-bootstrap';
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
import './PersonProfileWindow.css';

const PersonProfileWindow = ({ node, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const nodeRef = useRef(null);
  
  if (!node) return null;

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Format timestamp to readable date if it exists
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Get background color based on group
  const getGroupColor = (group) => {
    const colorMap = {
      1: 'primary',
      2: 'success',
      3: 'warning',
      4: 'danger',
      5: 'info'
    };
    return colorMap[group] || 'secondary';
  };

  const windowContent = (
    <Card className={`profile-window ${isMaximized ? 'maximized' : ''} shadow`}>
      <Card.Header className="window-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Person size={20} className="me-2" />
          <span className="window-title">{node.label || 'Unknown Person'}</span>
        </div>
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
      <Card.Body className="window-content p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="profile-tabs mb-3"
        >
          <Tab eventKey="details" title="Details">
            <Container className="py-3">
              <Row className="mb-3">
                <Col md={4} className="text-center mb-3">
                  <div className="profile-photo-container">
                    <Image 
                      src="/icon/profile.png" 
                      alt="Profile" 
                      className="profile-photo" 
                      roundedCircle 
                    />
                  </div>
                  <h5 className="mt-3">{node.label}</h5>
                  <Badge bg={getGroupColor(node.group)} className="mt-1 mb-3">
                    Group {node.group}
                  </Badge>
                </Col>
                <Col md={8}>
                  <Card className="profile-card mb-3">
                    <Card.Body>
                      <h5 className="mb-3">Basic Information</h5>
                      
                      <div className="mb-3">
                        <div className="field-label">ID</div>
                        <div className="field-value">{node.id}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="field-label">Name</div>
                        <div className="field-value">{node.label}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="field-label">Group</div>
                        <div className="field-value">
                          <Badge bg={getGroupColor(node.group)}>
                            Group {node.group}
                          </Badge>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                  
                  <Card className="profile-card">
                    <Card.Body>
                      <h5 className="mb-3">Custom Properties</h5>
                      {node.properties && Object.entries(node.properties).length > 0 ? (
                        Object.entries(node.properties).map(([key, value]) => (
                          <div className="mb-3" key={key}>
                            <div className="field-label">{key}</div>
                            <div className="field-value">{value}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No custom properties available</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </Tab>
          
          <Tab eventKey="connections" title="Connections">
            <Container className="py-3">
              <h4 className="mb-4">Network Connections</h4>
              <Card className="profile-card mb-3">
                <Card.Body>
                  <p className="text-muted">
                    <InfoCircle className="me-2" />
                    This section shows connections to other nodes in the network
                  </p>
                  
                  {/* Placeholder for connections data */}
                  <div className="p-4 bg-light text-center rounded">
                    <p>Connection visualization would appear here</p>
                  </div>
                </Card.Body>
              </Card>
            </Container>
          </Tab>
          
          <Tab eventKey="activity" title="Activity">
            <Container className="py-3">
              <h4 className="mb-4">
                <Clock className="me-2" />
                Recent Activity
              </h4>
              <Card className="profile-card mb-3">
                <Card.Body>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-marker bg-primary"></div>
                      <div className="timeline-content">
                        <h6>Profile created</h6>
                        <p className="text-muted">{formatDate(node.createdAt || Date.now())}</p>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-marker bg-info"></div>
                      <div className="timeline-content">
                        <h6>Last updated</h6>
                        <p className="text-muted">{formatDate(node.updatedAt || Date.now())}</p>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Container>
          </Tab>
          
          <Tab eventKey="activityMap" title="Activity Map">
            <Container className="py-3">
              <h4 className="mb-4">
                <GeoAlt className="me-2" />
                Areas of Activity
              </h4>
              <Card className="profile-card mb-3">
                <Card.Body>
                  <div className="map-container">
                    {/* Map placeholder - in a real application, you'd integrate a mapping library like Leaflet, Google Maps, etc. */}
                    <div className="activity-map">
                      <div className="map-placeholder">
                        <GeoAlt size={48} className="text-secondary mb-3" />
                        <h5>Activity Map</h5>
                        <p className="text-muted">
                          This map shows the geographical areas where this person has been active.
                        </p>
                        <div className="map-legend">
                          <div className="d-flex align-items-center mb-2">
                            <span className="legend-marker high"></span>
                            <span className="ms-2">High activity</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="legend-marker medium"></span>
                            <span className="ms-2">Medium activity</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <span className="legend-marker low"></span>
                            <span className="ms-2">Low activity</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
              
              <Card className="profile-card">
                <Card.Body>
                  <h5 className="mb-3">Activity Locations</h5>
                  <div className="locations-list">
                    <div className="location-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6>New York City, NY</h6>
                          <p className="text-muted mb-0">Primary location</p>
                        </div>
                        <Badge bg="success">High</Badge>
                      </div>
                    </div>
                    <div className="location-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6>Boston, MA</h6>
                          <p className="text-muted mb-0">Secondary location</p>
                        </div>
                        <Badge bg="warning">Medium</Badge>
                      </div>
                    </div>
                    <div className="location-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6>San Francisco, CA</h6>
                          <p className="text-muted mb-0">Occasional visits</p>
                        </div>
                        <Badge bg="info">Low</Badge>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Container>
          </Tab>
        </Tabs>
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

export default PersonProfileWindow;