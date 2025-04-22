import React from 'react';
import { getNodeColor, getNodeIcon } from '../../utils/Parser';
import './NodeDetails.css';
import { FaCircle, FaArrowRight, FaInfoCircle } from 'react-icons/fa';

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
          <FaInfoCircle />
          {nodeId.includes('_dup') ? 'Nœud Final' : 'Nœud Initial'}
        </span>
      </div>
      <div className="node-info" style={{ backgroundColor: color }}>
        {icon ? (
          <img
            src={icon}
            alt={`${group} icon`}
            className="node-icon"
          />
        ) : (
          <FaCircle className="node-icon" />
        )}
        <span className="node-group">{group}</span>
      </div>
    </div>
  );
};

export default NodeDetails;
