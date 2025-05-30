import React from 'react';
import { getNodeIcon, getNodeColor } from '../../VisualisationModule/Parser';

export const NodeTypeVisibilityControl = ({ visibleNodeTypes }) => {
  return (
    <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg shadow-sm">
      {Object.keys(visibleNodeTypes).map((nodeType) => {
        const iconPath = getNodeIcon(nodeType);
        const color = getNodeColor(nodeType);

        return (
          <div
            key={nodeType}
            className="flex items-center gap-[6px] p-[6px_10px] rounded-md bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex-shrink-0 min-w-fit"
          >
            {iconPath && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <img
                  src={iconPath}
                  alt={`${nodeType} icon`}
                  className="w-[14px] h-[14px] object-contain"
                />
              </div>
            )}
            <span className="text-gray-800 font-medium text-sm">{nodeType}</span>
          </div>
        );
      })}
    </div>
  );
};