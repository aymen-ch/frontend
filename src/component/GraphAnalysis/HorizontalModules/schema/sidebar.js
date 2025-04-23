import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getNodeColor,getNodeIcon } from '../../utils/Parser';
import './Sidebar.css'
const Sidebar = ({ selectedItem }) => {
  const [showNodeDetails, setShowNodeDetails] = useState(true);

  if (!selectedItem) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">Details</h3>
        <p className="sidebar-placeholder">Select a node or relationship to see details.</p>
      </div>
    );
  }

  const isNode = selectedItem.group && !selectedItem.from;

  const renderProperties = (properties) => {
    let fields = [];
  
    if (Array.isArray(properties) && properties.length === 1 && typeof properties[0] === 'string') {
      // Handle case: ['a,b,c']
      fields = properties[0].split(',').map(f => f.trim()).filter(Boolean);
    } else if (typeof properties === 'string') {
      // Fallback if it’s just a string
      fields = properties.split(',').map(f => f.trim()).filter(Boolean);
    } else {
      // Handle normal object or array
      return (
        <ul className="properties-list">
          {Object.entries(properties || {}).map(([key, value]) => (
            <li key={key} className="property-item">
              <span className="property-key">{key}:</span>
              <span className="property-value">{String(value)}</span>
            </li>
          ))}
        </ul>
      );
    }
  
    // Render list format like:
    // • nom_francais
    // • identity
    return (
      <ul className="properties-list">
        {fields.map((field, index) => (
          <li key={index} className="property-item">• {field}</li>
        ))}
      </ul>
    );
  };
  
  

  const toggleNodeDetails = () => setShowNodeDetails(!showNodeDetails);

  return (
    <div className="sidebar-container">
      <h3 className="sidebar-title">
        {isNode ? 'Node Details' : 'Relationship Details'}
      </h3>

      {isNode ? (
        <>
          <div className="details-section">
            <div className="toggle-header" onClick={toggleNodeDetails}>
            <div
  className="icon-badge"
  style={{ backgroundColor: getNodeColor(selectedItem.group) }}
>
  <img
    src={getNodeIcon(selectedItem.group)}
    alt={selectedItem.group}
    className="node-icon-img"
  />
</div>

              <span className="toggle-title">{selectedItem.group}</span>
              {showNodeDetails ? <FaChevronUp /> : <FaChevronDown />}
            </div>

            {showNodeDetails && (
              <div className="details-card">
                <div className="detail-item">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedItem.id}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedItem.group}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Properties:</span>
                  {renderProperties(selectedItem.properties)}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="details-card">
          <div className="detail-item">
            <span className="detail-label">ID:</span>
            <span className="detail-value">{selectedItem.id}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{selectedItem.group}</span>
          </div>

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
        </div>
      )}
    </div>
  );
};

export default Sidebar;
