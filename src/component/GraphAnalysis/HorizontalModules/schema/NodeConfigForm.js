// src/components/SchemaVisualizer/NodeConfigForm.jsx
import React, { useState, useEffect } from 'react';
import { updateNodeConfig, getNodeColor, getNodeIcon, NODE_CONFIG } from '../../utils/Parser';

const NodeConfigForm = ({ selectedNode, onUpdate }) => {
  const [nodeType, setNodeType] = useState(selectedNode?.group || '');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [icon, setIcon] = useState('');
  const [labelKey, setLabelKey] = useState('');

  // Load current config when nodeType changes
  useEffect(() => {
    if (nodeType) {
      const config = NODE_CONFIG.nodeTypes[nodeType] || NODE_CONFIG.nodeTypes.default;
      setColor(config.color || getNodeColor(nodeType));
      setSize(config.size || NODE_CONFIG.defaultNodeSize);
      setIcon(config.icon || getNodeIcon(nodeType));
      setLabelKey(config.labelKey || '');
    }
  }, [nodeType]);

  // Handle file selection
  const handleIconSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const iconPath = `/icon/${file.name}`; // e.g., "/icon/Personne.png"
      setIcon(iconPath);
      console.log('Selected icon:', file.name, 'Saved as:', iconPath);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {};
      if (color) config.color = color;
      if (size) config.size = parseInt(size, 10);
      if (icon) config.icon = icon; // Saves "/icon/Personne.png"
      if (labelKey) config.labelKey = labelKey;

      await updateNodeConfig(nodeType || 'NewType', config);
      if (typeof onUpdate === 'function') {
        onUpdate(nodeType, config);
      } else {
        console.warn('onUpdate is not a function:', onUpdate);
      }
    } catch (error) {
      console.error('Error updating node config:', error.message);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <form onSubmit={handleSubmit}>
        <label>
          Node Type:
          <input
            type="text"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            placeholder="Enter node type"
            style={{ width: '100%', marginBottom: '8px', padding: '5px' }}
          />
        </label>
        <label>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          />
        </label>
        <label>
          Size:
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Node size"
            style={{ width: '100%', marginBottom: '8px', padding: '5px' }}
          />
        </label>
        <label>
          Icon Path:
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Select or enter icon path"
              style={{ width: '70%', padding: '5px', marginRight: '5px' }}
            />
            <label
              style={{
                padding: '5px 10px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              Browse
              <input
                type="file"
                accept="image/*"
                onChange={handleIconSelect}
                style={{ display: 'none' }}
                title="Choose an icon file"
              />
            </label>
          </div>
        </label>
        <label>
          Label Property Key(s):
          <input
            type="text"
            value={labelKey}
            onChange={(e) => setLabelKey(e.target.value)}
            placeholder="Property keys (comma-separated)"
            style={{ width: '100%', marginBottom: '8px', padding: '5px' }}
          />
        </label>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '8px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
      </form>
    </div>
  );
};

export default NodeConfigForm;