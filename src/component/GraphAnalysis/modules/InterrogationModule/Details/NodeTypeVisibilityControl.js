import React from 'react';
import { getNodeIcon,getNodeColor } from '../../Parser';

export const NodeTypeVisibilityControl = ({ visibleNodeTypes }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px',
        background: '#f9f9f9',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {Object.keys(visibleNodeTypes).map((nodeType) => {
        const iconPath = getNodeIcon(nodeType);
        const color = getNodeColor(nodeType);

        return (
          <div
            key={nodeType}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              flexShrink: 0,
              minWidth: 'fit-content',
            }}
          >
            {iconPath && (
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={iconPath}
                  alt={`${nodeType} icon`}
                  style={{
                    width: '14px',
                    height: '14px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
            <span style={{ color: '#2c3e50', fontWeight: 500, fontSize: '14px' }}>{nodeType}</span>
          </div>
        );
      })}
    </div>
  );
};
