import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NODE_CONFIG } from '../../utils/Parser'; // Adjust path as needed

const AttributeAnalysis = ({ combinedNodes, onNodeConfigChange }) => {
  const { t } = useTranslation();
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [nodeSize, setNodeSize] = useState({});
  const [sizeProperty, setSizeProperty] = useState('');
  
  const nodeTypes = [...new Set(combinedNodes.map(node => node.group))];

  // Get unique numeric properties from both properties and properties_analyse
  const getPropertiesForNodeType = (nodeType) => {
    const nodesOfType = combinedNodes.filter(node => node.group === nodeType);
    if (nodesOfType.length === 0) return [];
    
    const sampleNode = nodesOfType[0];
    const numericProperties = [];

    if (sampleNode.properties) {
      Object.keys(sampleNode.properties).forEach(key => {
        if (typeof sampleNode.properties[key] === 'number') {
          numericProperties.push(`properties.${key}`);
        }
      });
    }

    if (sampleNode.properties_analyse) {
      Object.keys(sampleNode.properties_analyse).forEach(key => {
        if (typeof sampleNode.properties_analyse[key] === 'number') {
          numericProperties.push(`properties_analyse.${key}`);
        }
      });
    }

    console.log(`Properties for ${nodeType}:`, numericProperties);
    return numericProperties;
  };

  const handleSizeChange = (nodeType, newSize) => {
    const size = Math.max(50, parseInt(newSize) || NODE_CONFIG.defaultNodeSize || 100);
    const updatedSizes = {};
    combinedNodes.forEach(node => {
      if (node.group === nodeType) {
        updatedSizes[node.id] = size;
      } else {
        updatedSizes[node.id] = nodeSize[node.id] || NODE_CONFIG.defaultNodeSize || 100;
      }
    });
    setNodeSize(updatedSizes);
    console.log(`Manual size change for ${nodeType}:`, updatedSizes);
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'size',
        nodeType,
        value: updatedSizes,
      });
    }
  };

  const handleSizePropertyChange = (nodeType, property) => {
    setSizeProperty(property);
    console.log(`Size property selected for ${nodeType}:`, property);

    const defaultSize = NODE_CONFIG.defaultNodeSize || 100;
    const updatedSizes = {};

    combinedNodes.forEach(node => {
      updatedSizes[node.id] = nodeSize[node.id] || defaultSize;
    });

    if (property) {
      const nodesOfType = combinedNodes.filter(node => node.group === nodeType);
      const values = nodesOfType.map(node => {
        let value = 0;
        if (property.startsWith('properties.')) {
          const propKey = property.split('.')[1];
          value = node.properties?.[propKey] || 0;
        } else if (property.startsWith('properties_analyse.')) {
          const propKey = property.split('.')[1];
          value = node.properties_analyse?.[propKey] || 0;
        }
        return value;
      });

      console.log(`Values for ${property} in ${nodeType}:`, values);

      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      
      const minSize = 150;
      const maxSize = 500;

      nodesOfType.forEach(node => {
        const value = property.startsWith('properties.')
          ? node.properties?.[property.split('.')[1]] || 0
          : node.properties_analyse?.[property.split('.')[1]] || 0;
        
        let normalizedSize;
        if (maxValue === minValue || maxValue === 0) {
          normalizedSize = minSize;
        } else {
          normalizedSize = minSize + ((value - minValue) / (maxValue - minValue)) * (maxSize - minSize);
        }
        
        normalizedSize = Math.max(minSize, Math.round(normalizedSize || minSize));
        updatedSizes[node.id] = normalizedSize;
        console.log(`Node ${node.id} (${node.group}) - ${property}: ${value}, Size: ${normalizedSize}`);
      });
    }

    console.log('Updated sizes before onNodeConfigChange:', updatedSizes);
    setNodeSize(updatedSizes);
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'size',
        nodeType,
        property,
        value: updatedSizes,
      });
    }
  };

  // Initialize node sizes
  useEffect(() => {
    const defaultSize = NODE_CONFIG.defaultNodeSize || 100;
    const initialSizes = {};
    combinedNodes.forEach(node => {
      initialSizes[node.id] = nodeSize[node.id] || defaultSize;
    });
    setNodeSize(initialSizes);
    console.log('Initial node sizes:', initialSizes);
  }, [combinedNodes]);

  return (
    <div className="p-3">
      <h5>{t('attribute_analysis')}</h5>
      <div className="node-config-container" style={{ marginBottom: '20px' }}>
        <h6>{t('change_size_of_node_by')}</h6>
        <select 
          value={selectedNodeType || ''} 
          onChange={(e) => setSelectedNodeType(e.target.value)}
          style={{ marginBottom: '10px', width: '100%', padding: '5px' }}
        >
          <option value="">{t('select_node_type')}</option>
          {nodeTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {selectedNodeType && (
          <div className="config-controls">
            <div style={{ marginBottom: '10px' }}>
              <label>{t('size_by_property')}</label>
              <select
                value={sizeProperty}
                onChange={(e) => handleSizePropertyChange(selectedNodeType, e.target.value)}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              >
                <option value="">{t('manual_size')}</option>
                {getPropertiesForNodeType(selectedNodeType).map(prop => (
                  <option key={prop} value={prop}>{prop}</option>
                ))}
              </select>
            </div>

            {!sizeProperty && (
              <div style={{ marginBottom: '10px' }}>
                <label>{t('size')}: {nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize || 100}px</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize || 100}
                  onChange={(e) => handleSizeChange(selectedNodeType, e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributeAnalysis;