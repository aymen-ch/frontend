import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getNodeColor, getNodeIcon } from '../../utils/Parser';
import { useTranslation } from 'react-i18next';
import './sidebar.css';

const Sidebar = ({ selectedItem }) => {
  const { t } = useTranslation();
  const [showNodeDetails, setShowNodeDetails] = useState(true);

  if (!selectedItem) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">{t('sidebar.detailsTitle')}</h3>
        <p className="sidebar-placeholder">{t('sidebar.placeholder')}</p>
      </div>
    );
  }

  const isNode = selectedItem.group && !selectedItem.from;

  const renderProperties = (properties) => {
    let fields = [];

    if (Array.isArray(properties) && properties.length === 1 && typeof properties[0] === 'string') {
      fields = properties[0].split(',').map(f => f.trim()).filter(Boolean);
    } else if (typeof properties === 'string') {
      fields = properties.split(',').map(f => f.trim()).filter(Boolean);
    } else {
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
        {isNode ? t('sidebar.nodeDetails') : t('sidebar.relationshipDetails')}
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
                  <span className="detail-label">{t('sidebar.id')}:</span>
                  <span className="detail-value">{selectedItem.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('sidebar.type')}:</span>
                  <span className="detail-value">{selectedItem.group}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t('sidebar.properties')}:</span>
                  {renderProperties(selectedItem.properties)}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="details-card">
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.id')}:</span>
            <span className="detail-value">{selectedItem.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.type')}:</span>
            <span className="detail-value">{selectedItem.group}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.from')}:</span>
            <span className="detail-value">{selectedItem.from}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.to')}:</span>
            <span className="detail-value">{selectedItem.to}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.properties')}:</span>
            {renderProperties(selectedItem.properties)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
