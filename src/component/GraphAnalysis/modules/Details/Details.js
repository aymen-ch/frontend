import React, { useState } from 'react';
import { NodeTypeVisibilityControl } from './NodeTypeVisibilityControl';
import { getNodeColor, getNodeIcon, NODE_CONFIG } from '../../utils/Parser';
import  './detail.css'
const DetailsModule = ({
  visibleNodeTypes,
  toggleNodeTypeVisibility,
  nodetoshow,
  selectedNodeData,
  combinedNodes,
  combinedEdges,
  relationtoshow,
  SelectecRelationData,
  onNodeConfigChange // New prop to handle config updates
}) => {
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [nodeSize, setNodeSize] = useState({});
  const [nodeColors, setNodeColors] = useState(NODE_CONFIG.nodeColors);
  const [showDetails, setShowDetails] = useState(false);
  // Get unique node types from combinedNodes
  const nodeTypes = [...new Set(combinedNodes.map(node => node.group))];
  const [expandedDetails, setExpandedDetails] = useState({}); // Track which details are expanded

  const toggleDetail = (detailKey) => {
    setExpandedDetails(prev => ({
      ...prev,
      [detailKey]: !prev[detailKey]
    }));
  };
  const handleSizeChange = (nodeType, newSize) => {
    const updatedSize = { ...nodeSize, [nodeType]: parseInt(newSize) };
    setNodeSize(updatedSize);
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'size',
        nodeType,
        value: parseInt(newSize)
      });
    }
  };

  const handleColorChange = (nodeType, newColor) => {
    const updatedColors = { ...nodeColors, [nodeType]: newColor };
    setNodeColors(updatedColors);
    NODE_CONFIG.nodeColors[nodeType] = newColor; // Update the global config
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'color',
        nodeType,
        value: newColor
      });
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
            
            {/* <div>
              <label>Color:</label>
              <input
                type="color"
                value={nodeColors[selectedNodeType] || getNodeColor(selectedNodeType)}
                onChange={(e) => handleColorChange(selectedNodeType, e.target.value)}
                style={{ marginLeft: '10px' }}
              />
            </div> */}
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

          // Filter out the detail property for separate handling
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

              {/* Main Properties */}
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

              {/* Details Section - With Collapse */}
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
                Node Properties
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
                  {/* ... rest of node header ... */}
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
                {/* ... rest of node properties ... */}
              </>
            );
          })()}
          <ul className="list-group properties-list">
            {Object.entries(selectedNodeData).map(([key, value], index) => (
              <li key={key} className="list-group-item property-item">
                <strong className="property-key">{key}:</strong> 
                <span className="property-value">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default DetailsModule;