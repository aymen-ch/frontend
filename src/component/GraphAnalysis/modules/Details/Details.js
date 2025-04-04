import React, { useState, useEffect } from 'react';
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
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [nodeSize, setNodeSize] = useState({});
  const [nodeColors, setNodeColors] = useState(NODE_CONFIG.nodeColors);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [sizeProperty, setSizeProperty] = useState(''); // New state for selected size property

  // Get unique node types from combinedNodes
  const nodeTypes = [...new Set(combinedNodes.map(node => node.group))];
  
  // Get unique properties for the selected node type
  const getPropertiesForNodeType = (nodeType) => {
    const nodesOfType = combinedNodes.filter(node => node.group === nodeType);
    if (nodesOfType.length === 0) return [];
    const sampleNode = nodesOfType[0];
    return Object.keys(sampleNode).filter(key => typeof sampleNode[key] === 'number'); // Only numeric properties
  };

  const toggleDetail = (detailKey) => {
    setExpandedDetails(prev => ({
      ...prev,
      [detailKey]: !prev[detailKey],
    }));
  };

  const handleSizeChange = (nodeType, newSize) => {
    console.log(newSize)
    const updatedSize = { ...nodeSize, [nodeType]: parseInt(newSize) };
    setNodeSize(updatedSize);
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'size',
        nodeType,
        value: parseInt(newSize),
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
    if (property) {
      // Calculate sizes based on the selected property
      const nodesOfType = combinedNodes.filter(node => node.group === nodeType);
      const values = nodesOfType.map(node => node[property] || 0);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      
      const minSize = 50; // Minimum node size
      const maxSize = 300; // Maximum node size

      const updatedSizes = {};
      nodesOfType.forEach(node => {
        const value = node[property] || 0;
        const normalizedSize = maxValue === minValue
          ? minSize // Avoid division by zero
          : minSize + ((value - minValue) / (maxValue - minValue)) * (maxSize - minSize);
        updatedSizes[nodeType] = Math.round(normalizedSize);
      });

      setNodeSize(prev => ({ ...prev, ...updatedSizes }));
      if (onNodeConfigChange) {
        onNodeConfigChange({
          type: 'size',
          nodeType,
          property,
          value: updatedSizes[nodeType],
        });
      }
    }
  };

  return (
    <>
      <NodeTypeVisibilityControl 
        visibleNodeTypes={visibleNodeTypes} 
        toggleNodeTypeVisibility={toggleNodeTypeVisibility} 
      />

      {/* Node Type Configuration Section */}
      <div className="node-config-container" style={{ marginBottom: '20px' }}>
        <h3>Node Type Configuration</h3>
        <select 
          value={selectedNodeType || ''} 
          onChange={(e) => setSelectedNodeType(e.target.value)}
          style={{ marginBottom: '10px', width: '100%', padding: '5px' }}
        >
          <option value="">Select Node Type</option>
          {nodeTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {selectedNodeType && (
          <div className="config-controls">
            {/* Size Property Selector */}
            <div style={{ marginBottom: '10px' }}>
              <label>Size By Property:</label>
              <select
                value={sizeProperty}
                onChange={(e) => handleSizePropertyChange(selectedNodeType, e.target.value)}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              >
                <option value="">Manual Size</option>
                {getPropertiesForNodeType(selectedNodeType).map(prop => (
                  <option key={prop} value={prop}>{prop}</option>
                ))}
              </select>
            </div>

            {/* Manual Size Slider (only shown if no property is selected) */}
            {!sizeProperty && (
              <div style={{ marginBottom: '10px' }}>
                <label>Size: {nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize}px</label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize}
                  onChange={(e) => handleSizeChange(selectedNodeType, e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing Relation Properties Section */}
      {relationtoshow && SelectecRelationData && (
        <div className="properties-container">
          {(() => {
            console.log(SelectecRelationData);
            const matchedNode = combinedEdges.find(node => 
              node.id === SelectecRelationData.identity?.toString()
            );
            const nodeGroup = matchedNode ? matchedNode.group : SelectecRelationData.type || 'Unknown';
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
                  <span>Relation Properties ({nodeGroup})</span>
                  {detail && Object.keys(detail).length > 0 && (
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => setShowDetails(!showDetails)}
                      style={{ marginLeft: '10px' }}
                    >
                      {showDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                  )}
                </div>

                <ul className="list-group properties-list" style={{ marginBottom: '15px' }}>
                  {Object.entries(mainProperties).map(([key, value]) => (
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
                    <h6 style={{ marginBottom: '10px', color: nodeColor }}>Details</h6>
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

      {/* Existing Node Properties Section */}
      {nodetoshow && selectedNodeData && (
        <div className="properties-container">
          {(() => {
            const matchedNode = combinedNodes.find(node => 
              node.id === selectedNodeData.identity.toString()
            );
            const nodeGroup = matchedNode ? matchedNode.group : 'Unknown';
            const nodeColor = nodeColors[nodeGroup] || getNodeColor(nodeGroup);
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
                      alt={`${nodeGroup} icon`}
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