import React from 'react';
import NodeConfigForm from './NodeConfigForm';
import './Sidebar.css';

const Sidebar = ({ selectedItem, onUpdate }) => {
  if (!selectedItem) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">Details</h3>
        <p className="sidebar-placeholder">Select a node or relationship to see details.</p>
      </div>
    );
  }

  const isNode = selectedItem.group && !selectedItem.from;

  // Function to normalize and render properties
  const renderProperties = (properties) => {
    let props = properties || {};

    // Handle cases where properties might be a string or array
    if (typeof properties === 'string') {
      try {
        props = JSON.parse(properties);
      } catch (e) {
        // If it's a comma-separated string, split it into key-value pairs
        props = properties.split(',').reduce((acc, item, index) => {
          acc[`key_${index}`] = item.trim();
          return acc;
        }, {});
      }
    } else if (Array.isArray(properties)) {
      // Convert array to object with indexed keys
      props = properties.reduce((acc, item, index) => {
        acc[`item_${index}`] = String(item);
        return acc;
      }, {});
    }

    if (!props || Object.keys(props).length === 0) {
      return <p className="no-properties">No properties available</p>;
    }

    return (
      <ul className="properties-list">
        {Object.entries(props).map(([key, value]) => (
          <li key={key} className="property-item">
            <span className="property-key">{key}:</span>
            <span className="property-value">{String(value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="sidebar-container">
      <h3 className="sidebar-title">{isNode ? 'Node Details' : 'Relationship Details'}</h3>
      <div className="details-card">
        <div className="detail-item">
          <span className="detail-label">ID:</span>
          <span className="detail-value">{selectedItem.id}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Type:</span>
          <span className="detail-value">{selectedItem.group}</span>
        </div>
        {isNode ? (
          <>
            <div className="detail-item">
              <span className="detail-label">Properties:</span>
              {renderProperties(selectedItem.properties)}
            </div>
            <h4 className="config-title">Configure Node</h4>
            <NodeConfigForm selectedNode={selectedItem} onUpdate={onUpdate} />
          </>
        ) : (
          <>
            <div className="detail-item">
              <span className="detail-label">From:</span>
              <span className="detail-value">{selectedItem.from}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">To:</span>
              <span className="detail-value">{selectedItem.to}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Properties:</span>
              {renderProperties(selectedItem.properties)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;