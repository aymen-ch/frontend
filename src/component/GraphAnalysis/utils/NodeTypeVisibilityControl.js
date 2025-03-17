import React from 'react';

export const NodeTypeVisibilityControl = ({ visibleNodeTypes, toggleNodeTypeVisibility }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Object.keys(visibleNodeTypes).map((nodeType) => (
        <div key={nodeType} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={visibleNodeTypes[nodeType]}
            onChange={() => toggleNodeTypeVisibility(nodeType)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ color: '#2c3e50', fontWeight: '500' }}>{nodeType}</span>
        </div>
      ))}
    </div>
  );
};