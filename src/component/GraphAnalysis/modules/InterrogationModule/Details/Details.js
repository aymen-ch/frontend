import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeTypeVisibilityControl } from './NodeTypeVisibilityControl';
import { getNodeColor, getNodeIcon } from '../../VisualisationModule/Parser';





// Afficher les informations d'un noeud ou d'une relation et la liste des types de noeuds visualisés
const DetailsModule = ({
  visibleNodeTypes,
  nodetoshow,
  selectedNodeData,
  nodes,
  edges,
  relationtoshow,
  SelectecRelationData,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});

  const toggleDetail = (detailKey) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [detailKey]: !prev[detailKey],
    }));
  };

  return (
    <>
      <NodeTypeVisibilityControl visibleNodeTypes={visibleNodeTypes} />

      {relationtoshow && SelectecRelationData && (
        <div className="p-4 bg-white rounded-lg shadow-md mb-4">
          {(() => {
            const matchedNode = edges.find(
              (node) => node.id === SelectecRelationData.identity?.toString()
            );
            const nodeGroup = matchedNode
              ? matchedNode.group
              : SelectecRelationData.type || t('unknown');

            const { detail, ...mainProperties } = SelectecRelationData;

            return (
              <>
                <div
                  className="bg-[#B771E5] p-2 rounded text-white flex items-center justify-between mb-[10px]"
                >
                  <span>{t('relation_properties', { nodeGroup })}</span>
                  {detail && Object.keys(detail).length > 0 && (
                    <button
                      className="px-2 py-1 bg-white text-gray-800 text-sm rounded hover:bg-gray-100 transition-all"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? t('hide_details') : t('show_details')}
                    </button>
                  )}
                </div>

                <ul className="mb-[15px]">
                  <li className="p-2 border-b border-gray-200">
                    <strong className="font-semibold">identity:</strong>
                    <span className="ml-2">{mainProperties.identity}</span>
                  </li>
                  <li className="p-2 border-b border-gray-200">
                    <strong className="font-semibold">type:</strong>
                    <span className="ml-2">{mainProperties.type}</span>
                  </li>
                  {mainProperties.properties &&
                    typeof mainProperties.properties === 'object' &&
                    Object.entries(mainProperties.properties).map(([key, value]) => (
                      <li key={key} className="p-2 border-b border-gray-200">
                        <strong className="font-semibold">{key}:</strong>
                        <span className="ml-2">
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </span>
                      </li>
                    ))}
                </ul>

                {detail && Object.keys(detail).length > 0 && showDetails && (
                  <div>
                    <h6 className="text-[#B771E5] mb-[10px] text-base font-semibold">
                      {t('details')}
                    </h6>
                    {Object.entries(detail).map(([detailKey, detailValue]) => (
                      <div key={detailKey} className="mb-[15px]">
                        <div
                          className="bg-gray-100 p-[6px_10px] rounded cursor-pointer flex justify-between items-center mb-[5px]"
                          onClick={() => toggleDetail(detailKey)}
                        >
                          <strong>
                            {detailKey} (ID: {detailValue.identity})
                          </strong>
                          <span>{expandedDetails[detailKey] ? '▲' : '▼'}</span>
                        </div>
                        {expandedDetails[detailKey] && (
                          <ul>
                            {Object.entries(detailValue.properties || {}).map(([propKey, propValue]) => (
                              <li key={propKey} className="p-2 border-b border-gray-200">
                                <strong className="font-semibold">{propKey}:</strong>{' '}
                                <span className="ml-2">{propValue}</span>
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

      {nodetoshow && (
        <div className="p-4 bg-white rounded-lg shadow-md mb-4">
          {(() => {
            const matchedNode = nodes.find((node) => node.id === nodetoshow);
            const nodeGroup = matchedNode ? matchedNode.group : t('unknown');
            const nodeColor = getNodeColor(nodeGroup);
            const nodeIcon = getNodeIcon(nodeGroup);

            return (
              <>
                <div
                  className="p-2 rounded text-white flex items-center"
                  style={{ backgroundColor: nodeColor }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-[10px] overflow-hidden">
                    <img
                      src={nodeIcon}
                      alt={t('node_icon_alt', { nodeGroup })}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{nodeGroup}</span>
                </div>
                <ul className="mt-[10px]">
                  {selectedNodeData &&
                    Object.entries(selectedNodeData).map(([key, value]) => (
                      <li key={key} className="p-2 border-b border-gray-200">
                        <strong className="font-semibold">{key}:</strong>
                        <span className="ml-2">
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