import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

//Utilities
import { getNodeColor, getNodeIcon } from '../../Parser';
import { BASE_URL_Backend } from '../../../Platforme/Urls';

// Styles
import './sidebar.css';

const Sidebar = ({ selectedItem }) => {
  const { t } = useTranslation();

  // State
  const [showNodeDetails, setShowNodeDetails] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [nodeProperties, setNodeProperties] = useState('');
  const [relationshipProperties, setRelationshipProperties] = useState('');

  // API Calls
  const fetchNodeProperties = async () => {
    if (selectedItem?.isnode && selectedItem.group) {
      try {
        const response = await axios.post(`${BASE_URL_Backend}/get_node_properties/`, {
          node_type: selectedItem.group,
        });
        setNodeProperties(response.data.properties || []);
      } catch (error) {
        console.error('Error fetching node properties:', error);
        setNodeProperties([]);
      }
    } else {
      setNodeProperties([]);
    }
  };

  const fetchRelationshipProperties = async () => {
    if (!selectedItem?.isnode && selectedItem?.group && !selectedItem.virtual) {
      try {
        const response = await axios.post(`${BASE_URL_Backend}/get_relationship_properties/`, {
          relationship_type: selectedItem.group,
        });
        setRelationshipProperties(response.data.properties || []);
      } catch (error) {
        console.error('Error fetching relationship properties:', error);
        setRelationshipProperties([]);
      }
    } else {
      setRelationshipProperties([]);
    }
  };

  // Effects
  useEffect(() => {
    fetchNodeProperties();
    fetchRelationshipProperties();
  }, [selectedItem]);

  // Event Handlers
  const toggleNodeDetails = () => setShowNodeDetails(!showNodeDetails);
  const toggleProperties = () => setShowProperties(!showProperties);

  // Render Components
  const renderProperties = (properties) => {
    let fields = [];

    if (Array.isArray(properties) && properties.length === 1 && typeof properties[0] === 'string') {
      fields = properties[0].split(',').map((f) => f.trim()).filter((f) => f && !f.startsWith('_'));
    } else if (typeof properties === 'string') {
      fields = properties.split(',').map((f) => f.trim()).filter((f) => f && !f.startsWith('_'));
    } else if (Array.isArray(properties)) {
      fields = properties.filter((f) => typeof f === 'string' && !f.startsWith('_'));
    } else {
      return (
        <ul className="properties-list">
          {Object.entries(properties || {})
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, value]) => (
              <li key={key} className="property-item">
                <span className="property-key">{key}:</span>
                <span className="property-value">{String(value)}</span>
              </li>
            ))}
        </ul>
      );
    }

    return (
      <ul className="properties-list">
        {fields.map((field, index) => (
          <li key={index} className="property-item">• {field}</li>
        ))}
      </ul>
    );
  };

  const NodeBadge = ({ group, className = 'icon-badge' }) => (
    <div className={className} style={{ backgroundColor: getNodeColor(group) }}>
      <img src={getNodeIcon(group)} alt={group} className="node-icon-img" />
    </div>
  );

  const VirtualPath = ({ path }) => (
    <div className="virtual-path-container">
      {path.map((step, index) => {
        const isNode = index % 2 === 0;
        return (
          <div
            key={index}
            className={`path-step ${isNode ? 'node-step' : 'relation-step'}`}
          >
            {isNode ? (
              <div
                className="node-badge"
                title={step}
                style={{ backgroundColor: getNodeColor(step) }}
              >
                <img src={getNodeIcon(step)} alt={step} className="node-icon-img" />
                <span className="node-text">{step}</span>
              </div>
            ) : (
              <span className="relation-label">➝ {step}</span>
            )}
          </div>
        );
      })}
    </div>
  );

  const FinalRelationSummary = ({ path, group }) => (
    <div className="virtual-path-container final-summary">
      <NodeBadge group={path[0]} className="node-badge" />
      <span className="relation-label">➝ {group}</span>
      <NodeBadge group={path[path.length - 1]} className="node-badge" />
    </div>
  );

  // Conditional Rendering
  if (!selectedItem) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">{t('sidebar.detailsTitle')}</h3>
        <p className="sidebar-placeholder">{t('sidebar.placeholder')}</p>
      </div>
    );
  }

  const isNode = selectedItem.isnode;

  return (
    <div className="sidebar-container">
     <h3
  className="sidebar-title"
  style={
    !isNode
      ? {
          backgroundColor: selectedItem?.virtual ? 'green' : 'red',
          color: 'white',
          padding: '0.5rem',
          borderRadius: '4px',
        }
      : {}
  }
>
  {isNode ? t('sidebar.nodeDetails') : t('sidebar.relationshipDetails')}
</h3>


      {isNode ? (
        <div className="details-section">
          <div className="toggle-header" onClick={toggleNodeDetails}>
            <NodeBadge group={selectedItem.group} />
            <span className="toggle-title">{selectedItem.group}</span>
            {showNodeDetails ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {showNodeDetails && (
            <div className="details-card">
              <div className="detail-item">
                <span className="detail-label">{t('sidebar.id')}:</span>
                <span className="detail-value">{selectedItem.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('sidebar.type')}:</span>
                <span className="detail-value">{selectedItem.group}</span>
              </div>
              <div className="properties-section">
                <div className="properties-header" onClick={toggleProperties}>
                  <span className="properties-title">{t('sidebar.properties')}</span>
                  {showProperties ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {showProperties && (
                  <div className="properties-content">
                    {renderProperties(nodeProperties)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="details-card">
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.type')}:</span>
            <span className="detail-value">{selectedItem.group}</span>
          </div>
          {/* <div className="detail-item">
            <span className="detail-label">{t('sidebar.from')}:</span>
            <span className="detail-value">{selectedItem.from}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.to')}:</span>
            <span className="detail-value">{selectedItem.to}</span>
          </div> */}
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.properties')}:</span>
            {selectedItem.virtual ? (
              renderProperties({ count: 'Nombre total de relations entre un début et une fin' })
            ) : (
              renderProperties(relationshipProperties)
            )}
          </div>

          {selectedItem.virtual && (
            <>
              <hr />
              <div className="detail-item">
                <span className="detail-label">Chemin:</span>
                <VirtualPath path={selectedItem.path} />
              </div>
              <div className="detail-item">
                <span className="detail-label">relation virtuel:</span>
                <FinalRelationSummary path={selectedItem.path} group={selectedItem.group} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// PropTypes
Sidebar.propTypes = {
  selectedItem: PropTypes.shape({
    isnode: PropTypes.bool,
    group: PropTypes.string,
    id: PropTypes.string,
    from: PropTypes.string,
    to: PropTypes.string,
    virtual: PropTypes.bool,
    path: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default Sidebar;