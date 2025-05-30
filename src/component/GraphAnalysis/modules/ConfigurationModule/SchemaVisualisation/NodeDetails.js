import React from 'react';
import { getNodeColor, getNodeIcon } from '../../VisualisationModule/Parser';
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
    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm hover:-translate-y-0.5 transition-transform duration-200 max-w-[300px] sm:p-2.5 sm:max-w-full">
      <div className="mb-2">
        <span className="font-semibold text-sm text-blue-600 uppercase tracking-wide flex items-center gap-1">
          <FaInfoCircle />
          {nodeTypeLabel}
        </span>
      </div>
      <div className="flex items-center p-2 rounded-md gap-2 min-h-[36px] sm:p-1.5" style={{ backgroundColor: color }}>
        {icon ? (
          <img
            src={icon}
            alt={`${group} icon`}
            className="w-5 h-5 object-contain"
          />
        ) : (
          <FaCircle className="w-5 h-5" />
        )}
        <span className="text-white text-sm font-medium [text-shadow:_0_1px_1px_rgba(0,0,0,0.2)]">{group}</span>
      </div>
    </div>
  );
};

export default NodeDetails;