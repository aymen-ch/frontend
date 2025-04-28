import React from 'react';
import SchemaIcon from './SchemaIcon';
import './NodeDetails.css';

const NodeDetails = ({ nodeId, nodes }) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const { group, color } = {
    group: node.group,
    color: node.color || '#0066cc',
  };

  return (
    <div className="schema-viz-node-details-container">
      <div className="schema-viz-node-details-header">
        <span className="schema-viz-node-type">
          {nodeId.includes('_dup') ? 'End Node' : 'Start Node'}
        </span>
      </div>
      <div className="schema-viz-node-info" style={{ backgroundColor: color }}>
        <SchemaIcon 
          type="project-diagram" 
          size={20} 
          color="white" 
          className="schema-viz-node-icon" 
        />
        <span className="schema-viz-node-group">{group}</span>
      </div>
    </div>
  );
};

export default NodeDetails;
  