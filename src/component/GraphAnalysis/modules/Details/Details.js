import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeTypeVisibilityControl } from './NodeTypeVisibilityControl';
import { getNodeColor, getNodeIcon, NODE_CONFIG } from '../../utils/Parser';
import './detail.css';

const DetailsModule = ({
  visibleNodeTypes,
  toggleNodeTypeVisibility,
  nodetoshow,
  selectedNodeData,
  combinedNodes,
  combinedEdges,
  relationtoshow,
  SelectecRelationData,
  onNodeConfigChange,
}) => {
  const { t } = useTranslation(); // Initialize translation hook
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [nodeSize, setNodeSize] = useState({});
  const [nodeColors, setNodeColors] = useState(NODE_CONFIG.nodeColors);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
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

  const toggleDetail = (detailKey) => {
    setExpandedDetails(prev => ({
      ...prev,
      [detailKey]: !prev[detailKey],
    }));
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

  const handleColorChange = (nodeType, newColor) => {
    const updatedColors = { ...nodeColors, [nodeType]: newColor };
    setNodeColors(updatedColors);
    NODE_CONFIG.nodeColors[nodeType] = newColor;
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'color',
        nodeType,
        value: newColor,
      });
    }
  };

  const handleSizePropertyChange = (nodeType, property) => {
    setSizeProperty(property);
    console.log(`Size property selected for ${nodeType}:`, property);

    const defaultSize = NODE_CONFIG.defaultNodeSize || 100;
    const updatedSizes = {};

    // Initialize all nodes with default size
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
    <>
      <NodeTypeVisibilityControl 
        visibleNodeTypes={visibleNodeTypes} 
        toggleNodeTypeVisibility={toggleNodeTypeVisibility} 
      />

      <div className="node-config-container" style={{ marginBottom: '20px' }}>
        <h5>{t('change_size_of_node_by')}</h5>
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

      {relationtoshow && SelectecRelationData && (
        <div className="properties-container">
          {(() => {
            const matchedNode = combinedEdges.find(node => 
              node.id === SelectecRelationData.identity?.toString()
            );
            const nodeGroup = matchedNode ? matchedNode.group : SelectecRelationData.type || t('unknown');
            const nodeColor = '#B771E5';

            const { detail, ...mainProperties } = SelectecRelationData;

            return (
              <>
                <div 
                  className="node-type-header" 
                  style={{ 
                    backgroundColor: nodeColor,
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#fff',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{t('relation_properties', { nodeGroup })}</span>
                  {detail && Object.keys(detail).length > 0 && (
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => setShowDetails(!showDetails)}
                      style={{ marginLeft: '10px' }}
                    >
                      {showDetails ? t('hide_details') : t('show_details')}
                    </button>
                  )}
                </div>
                  
                {/* <ul className="list-group properties-list" style={{ marginBottom: '15px' }}>
                  {Object.entries(mainProperties).map(([key, value]) => (
                    <li key={key} className="list-group-item property-item">
                      <strong className="property-key">{key}:</strong> 
                      <span className="property-value">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    </li>
                  ))}
                </ul> */}

                <ul className="list-group properties-list" style={{ marginBottom: '15px' }}>
  {/* Render identity */}
  <li className="list-group-item property-item">
    <strong className="property-key">identity:</strong>
    <span className="property-value">{mainProperties.identity}</span>
  </li>
  {/* Render type */}
  <li className="list-group-item property-item">
    <strong className="property-key">type:</strong>
    <span className="property-value">{mainProperties.type}</span>
  </li>
  {/* Render properties */}
  {Object.entries(mainProperties.properties).map(([key, value]) => (
    <li key={key} className="list-group-item property-item">
      <strong className="property-key">{key}:</strong>
      <span className="property-value">
        {typeof value === 'object' ? JSON.stringify(value) : value}
      </span>
    </li>
  ))}
</ul>

                {detail && Object.keys(detail).length > 0 && showDetails && (
                  <div className="details-section">
                    <h6 style={{ marginBottom: '10px', color: nodeColor }}>{t('details')}</h6>
                    {Object.entries(detail).map(([detailKey, detailValue]) => (
                      <div key={detailKey} className="detail-item" style={{ marginBottom: '15px' }}>
                        <div 
                          className="detail-header"
                          style={{
                            backgroundColor: '#f0f0f0',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            marginBottom: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={() => toggleDetail(detailKey)}
                        >
                          <strong>{detailKey} (ID: {detailValue.identity})</strong>
                          <span>{expandedDetails[detailKey] ? '▲' : '▼'}</span>
                        </div>
                        {expandedDetails[detailKey] && (
                          <ul className="list-group detail-properties">
                            {Object.entries(detailValue.properties || {}).map(([propKey, propValue]) => (
                              <li key={propKey} className="list-group-item">
                                <strong>{propKey}:</strong> {propValue}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {nodetoshow && (
        <div className="properties-container">
          {(() => {
            const matchedNode = combinedNodes.find(node => 
              node.id === nodetoshow
            );
            const nodeGroup = matchedNode ? matchedNode.group : t('unknown');
            const nodeColor = getNodeColor(nodeGroup);
            const nodeIcon = getNodeIcon(nodeGroup);
            
            return (
              <>
                <div 
                  className="node-type-header" 
                  style={{ 
                    backgroundColor: nodeColor,
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#fff'
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={nodeIcon}
                      alt={t('node_icon_alt', { nodeGroup })}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  <span>{nodeGroup}</span>
                </div>
                <ul className="list-group properties-list">
                                    {Object.entries(selectedNodeData).map(([key, value]) => (
                    <li key={key} className="list-group-item property-item">
                      <strong className="property-key">{key}:</strong> 
                      <span className="property-value">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    </li>
                  ))}
                  <h4>{t('analysis_attributes')}</h4>

           
                  {matchedNode?.properties_analyse && Object.entries(matchedNode.properties_analyse).map(([key, value]) => (
                    <li key={key} className="list-group-item property-item">
                      <strong className="property-key">{key}:</strong> 
                      <span className="property-value">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default DetailsModule;