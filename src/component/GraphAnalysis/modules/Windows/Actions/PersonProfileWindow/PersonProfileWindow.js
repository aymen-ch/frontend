// src/components/PersonProfileWindow.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import './personProfileWindow.css'; // CSS file for styling the window

const PersonProfileWindow = ({ node, onClose }) => {
  if (!node) return null;

  return (
    <div className="profile-window-overlay">
      <div className="profile-window">
        <div className="window-header">
          <span>Person Profile - {node.label || 'Unknown'}</span>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="window-content">
          <h3>Profile Details</h3>
          <p><strong>ID:</strong> {node.id}</p>
          <p><strong>Group:</strong> {node.group}</p>
          {/* Add more node properties as needed */}
          {node.properties && Object.entries(node.properties).map(([key, value]) => (
            <p key={key}><strong>{key}:</strong> {value}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonProfileWindow;