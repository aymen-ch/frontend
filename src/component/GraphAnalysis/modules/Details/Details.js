// DetailsModule.js
import React from 'react';
import { NodeTypeVisibilityControl } from '../../utils/NodeTypeVisibilityControl';
import { getNodeColor,getNodeIcon } from '../../utils/Parser';

const DetailsModule = ({
  visibleNodeTypes,
  toggleNodeTypeVisibility,
  nodetoshow,
  selectedNodeData,
  combinedNodes,
  combinedEdges,
  relationtoshow,
SelectecRelationData
}) => {
  return (
    <>
      <NodeTypeVisibilityControl 
        visibleNodeTypes={visibleNodeTypes} 
        toggleNodeTypeVisibility={toggleNodeTypeVisibility} 
      />

{relationtoshow && SelectecRelationData && (
        <div className="properties-container">
          {(() => {
            console.log(combinedEdges)
            const matchedNode = combinedEdges.find(node => 
              node.id === SelectecRelationData.identity.toString()
            );
            const nodeGroup = matchedNode ? matchedNode.group : 'Unknown';
            const nodeColor ='#B771E5';

            return (
              <>
                Relation Properties
                <div 
                  className="node-type-header" 
                  style={{ 
                    backgroundColor: nodeColor,
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#fff'
                  }}
                >
                  <span>{nodeGroup}</span>
                </div>

                {matchedNode && matchedNode.aggregationType && (
                  <div 
                    className="aggregation-type"
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <strong>Aggregation Type:</strong>
                    <span>{matchedNode.aggregationType}</span>
                  </div>
                )}
              </>
            );
          })()}
          
          <ul className="list-group properties-list">
            {Object.entries(SelectecRelationData).map(([key, value], index) => (
              <li key={key} className="list-group-item property-item">
                <strong className="property-key">{key}:</strong> 
                <span className="property-value">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}      

      {nodetoshow && selectedNodeData && (

        <div className="properties-container">
          {(() => {
            console.log(combinedNodes)
            const matchedNode = combinedNodes.find(node => 
              node.id === selectedNodeData.identity.toString()
            );
            const nodeGroup = matchedNode ? matchedNode.group : 'Unknown';
            const nodeColor = getNodeColor(nodeGroup);
            const nodeIcon = getNodeIcon(nodeGroup);

            return (
              <>
               Node Properties
                <div 
                  className="node-type-header" 
                  style={{ 
                    backgroundColor: nodeColor,
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#fff'
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
                      alt={`${nodeGroup} icon`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  <span>{nodeGroup}</span>
                </div>

                {matchedNode && matchedNode.aggregationType && (
                  <div 
                    className="aggregation-type"
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <strong>Aggregation Type:</strong>
                    <span>{matchedNode.aggregationType}</span>
                  </div>
                )}
              </>
            );
          })()}
          
          <ul className="list-group properties-list">
            {Object.entries(selectedNodeData).map(([key, value], index) => (
              <li key={key} className="list-group-item property-item">
                <strong className="property-key">{key}:</strong> 
                <span className="property-value">
                  {typeof value === 'object' ? JSON.stringify(value) : value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default DetailsModule;