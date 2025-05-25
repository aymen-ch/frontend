import React from 'react';
import { getNodeColor, getNodeIcon } from '../../Parser';
import './NodeDetails.css';
import { FaCircle, FaInfoCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const NodeDetails = ({ nodeId, nodes }) => {
  const { t } = useTranslation();
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const { group, color, icon } = {
    group: node.group,
    color: getNodeColor(node.group),
    icon: getNodeIcon(node.group),
  };

  const nodeTypeLabel = nodeId.includes('_dup')
    ? t('Final Node')
    : t('Initial Node');

  return (
    <div className="node-details-container">
      <div className="node-details-header">
        <span className="node-type">
          <FaInfoCircle />
          {nodeTypeLabel}
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
