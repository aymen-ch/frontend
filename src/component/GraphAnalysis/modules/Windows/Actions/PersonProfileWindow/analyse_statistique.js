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

const Analyse_statistique = ({ data, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const nodeRef = useRef(null);
  
//   if (!node) return null;

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
            {console.log("data" ,data)}
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default Analyse_statistique;