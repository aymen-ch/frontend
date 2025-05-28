import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NodeTypeVisibilityControl } from './NodeTypeVisibilityControl';
import { getNodeColor, getNodeIcon } from '../../Parser';


const DetailsModule = ({
  visibleNodeTypes,
  toggleNodeTypeVisibility,
  nodetoshow,
  selectedNodeData,
  combinedNodes,
  combinedEdges,
  relationtoshow,
  SelectecRelationData,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});


  const toggleDetail = (detailKey) => {
    setExpandedDetails(prev => ({
      ...prev,
      [detailKey]: !prev[detailKey],
    }));
  };

  return (
    <>
      <NodeTypeVisibilityControl
        visibleNodeTypes={visibleNodeTypes}
              />

      {relationtoshow && SelectecRelationData && (
        <div className="properties-container">
          {(() => {
            const matchedNode = combinedEdges.find(
              node => node.id === SelectecRelationData.identity?.toString()
            );
            const nodeGroup = matchedNode
              ? matchedNode.group
              : SelectecRelationData.type || t('unknown');
            const nodeColor = '#B771E5';

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
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{t('relation_properties', { nodeGroup })}</span>
                  {detail && Object.keys(detail).length > 0 && (
                    <button
                      className="btn btn-sm btn-light"
                      onClick={() => setShowDetails(!showDetails)}
                      style={{ marginLeft: '10px' }}
                    >
                      {showDetails ? t('hide_details') : t('show_details')}
                    </button>
                  )}
                </div>

                <ul className="list-group properties-list" style={{ marginBottom: '15px' }}>
                  <li className="list-group-item property-item">
                    <strong className="property-key">identity:</strong>
                    <span className="property-value">{mainProperties.identity}</span>
                  </li>
                  <li className="list-group-item property-item">
                    <strong className="property-key">type:</strong>
                    <span className="property-value">{mainProperties.type}</span>
                  </li>
                  {mainProperties.properties &&
                    typeof mainProperties.properties === 'object' &&
                    Object.entries(mainProperties.properties).map(([key, value]) => (
                      <li key={key} className="list-group-item property-item">
                        <strong className="property-key">{key}:</strong>
                        <span className="property-value">
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </span>
                      </li>
                    ))}
                </ul>

                {detail && Object.keys(detail).length > 0 && showDetails && (
                  <div className="details-section">
                    <h6 style={{ marginBottom: '10px', color: nodeColor }}>{t('details')}</h6>
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
                            alignItems: 'center',
                          }}
                          onClick={() => toggleDetail(detailKey)}
                        >
                          <strong>
                            {detailKey} (ID: {detailValue.identity})
                          </strong>
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

      {nodetoshow && (
        <div className="properties-container">
          {(() => {
            const matchedNode = combinedNodes.find(node => node.id === nodetoshow);
            const nodeGroup = matchedNode ? matchedNode.group : t('unknown');
            const nodeColor = getNodeColor(nodeGroup);
            const nodeIcon = getNodeIcon(nodeGroup);

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
                  }}
                >
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
                      alt={t('node_icon_alt', { nodeGroup })}
                      style={{
                        width: '100%',
                        height: '100%',
  objectFit: 'cover',
                      }}
                    />
                  </div>
                  <span>{nodeGroup}</span>
                </div>
                <ul className="list-group properties-list">
                  {selectedNodeData &&
                    Object.entries(selectedNodeData).map(([key, value]) => (
                      <li key={key} className="list-group-item property-item">
                        <strong className="property-key">{key}:</strong>
                        <span className="property-value">
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