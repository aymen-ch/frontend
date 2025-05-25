import React, { useState, useEffect } from 'react';
import { updateNodeConfig, getNodeColor, getNodeIcon, NODE_CONFIG } from '../../utils/Parser';
import { fetchNodeProperties } from '../../utils/Urls';
import './nodeconfig.css';
import { useTranslation } from 'react-i18next';

const NodeConfigForm = ({ selectedNode, onUpdate }) => {
  const [nodeType, setNodeType] = useState(selectedNode?.group || '');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [icon, setIcon] = useState('');
  const [labelKey, setLabelKey] = useState([]); // Array for selected labels
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setNodeType(selectedNode?.group || '');
  }, [selectedNode]);

  useEffect(() => {
    if (nodeType) {
      const config = NODE_CONFIG.nodeTypes[nodeType] || NODE_CONFIG.nodeTypes.default;
      setColor(config.color || getNodeColor(nodeType));
      setSize(config.size || NODE_CONFIG.defaultNodeSize);
      setIcon(config.icon || getNodeIcon(nodeType));
      setLabelKey(config.labelKey ? config.labelKey.split(',') : []); // Split comma-separated string to array

      const fetchProperties = async () => {
        try {
          const nodeProperties = await fetchNodeProperties(nodeType);
          setProperties(nodeProperties || []);
          setError(null);
        } catch (err) {
          console.error('Error fetching node properties:', err.message);
          setError('Failed to load node properties');
          setProperties([]);
        }
      };

      fetchProperties();
    } else {
      setProperties([]);
      setLabelKey([]);
      setColor('');
      setSize('');
      setIcon('');
      setError(null);
    }
  }, [nodeType]);

  const handleIconSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const iconPath = `/icon/${file.name}`;
      setIcon(iconPath);
      console.log('Selected icon:', file.name, 'Saved as:', iconPath);
    }
  };

  const handleAddLabel = (e) => {
    const newLabel = e.target.value;
    if (newLabel && !labelKey.includes(newLabel)) {
      setLabelKey([...labelKey, newLabel]);
    }
    e.target.value = ''; // Reset dropdown
  };

  const handleRemoveLabel = (labelToRemove) => {
    setLabelKey(labelKey.filter((label) => label !== labelToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {};
      if (color) config.color = color;
      if (size) config.size = parseInt(size, 10);
      if (icon) config.icon = icon;
      if (labelKey.length > 0) config.labelKey = labelKey.join(','); // Join array into comma-separated string

      await updateNodeConfig(nodeType || 'NewType', config);
      if (typeof onUpdate === 'function') {
        onUpdate(nodeType, config);
      } else {
        console.warn('onUpdate is not a function:', onUpdate);
      }
    } catch (error) {
      console.error('Error updating node config:', error.message);
      setError('Failed to update node configuration');
    }
  };

  // Filter out already selected properties to avoid duplicates in the dropdown
  const availableProperties = properties.filter((prop) => !labelKey.includes(prop.name));

  if (!selectedNode) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">{t('NodeConfig')}</h3>
        <p className="sidebar-placeholder">{t('Select a node to change its color or icon')}</p>
      </div>
    );
  }

  return (
    <div className="node-config-container">
      <h3 className="sidebar-title">{t('Node Configuration')}</h3>

      {error && <div className="error-alert">{t(error)}</div>}

      <form className="node-config-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('Node Type')}</label>
          <input
            type="text"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            placeholder={t('Enter node type')}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>{t('Color')}</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="form-control"
            style={{ height: '40px', padding: 0 }}
          />
        </div>

        <div className="form-group">
          <label>{t('Size')}</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder={t('Node size')}
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>{t('Icon')}</label>
          <div className="icon-selector">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t('Enter icon path')}
              className="form-control"
            />
            <label className="icon-upload-btn">
              {t('Browse')}
              <input
                type="file"
                accept="image/*"
                onChange={handleIconSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>{t('Label Property Key')}</label>
          <div className="label-tags-container">
            {/* Display selected labels as tags */}
            {labelKey.length > 0 ? (
              <div className="label-tags">
                {labelKey.map((label) => (
                  <span key={label} className="label-tag">
                    {label}
                    <button
                      type="button"
                      className="label-remove-btn"
                      onClick={() => handleRemoveLabel(label)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="no-labels">{t('No labels selected')}</p>
            )}

            {/* Dropdown to add new labels */}
            <select
              onChange={handleAddLabel}
              className="form-control"
              disabled={!nodeType || availableProperties.length === 0}
            >
              <option value="">{t('Select a property to add')}</option>
              {availableProperties.map((prop) => (
                <option key={prop.name} value={prop.name}>
                  {prop.name} ({prop.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="apply-btn">{t('Apply')}</button>
      </form>
    </div>
  );
};

export default NodeConfigForm;