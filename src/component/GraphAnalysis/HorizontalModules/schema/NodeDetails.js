import React from 'react';
import { getNodeColor, getNodeIcon } from '../../utils/Parser';
import './NodeDetails.css'; // We'll create this CSS file

const NodeDetails = ({ nodeId, nodes }) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const { group, color, icon } = {
    group: node.group,
    color: getNodeColor(node.group),
    icon: getNodeIcon(node.group),
  };

  return (
    <div className="node-details-container">
      <div className="node-details-header">
        <span className="node-type">
          {nodeId.includes('_dup') ? 'End Node' : 'Start Node'}
        </span>
      </div>
      <div className="node-info" style={{ backgroundColor: color }}>
        <img
          src={icon}
          alt={`${group} icon`}
          className="node-icon"
        />
        <span className="node-group">{group}</span>
      </div>
    </div>
  );
};

export default NodeDetails;