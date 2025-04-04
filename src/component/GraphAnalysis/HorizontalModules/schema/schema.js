import React, { useEffect, useState, useRef } from 'react';
import neo4j from 'neo4j-driver';
import GraphCanvas from '../../utils/VisualizationLibrary/GraphCanvas';
import { createNode, createEdge } from '../../utils/Parser';
import LayoutControl from '../../modules/layout/Layoutcontrol';
import { constructPath } from './cunstructpath';
import { getNodeColor,getNodeIcon } from '../../utils/Parser';
import virtualRelationsData from '../../modules/aggregation/aggregations.json';
const URI = 'neo4j://localhost:7687';
const USER = 'neo4j';
const PASSWORD = '12345678';

// Utility functions (unchanged except for clarity)


// Sidebar component (unchanged)
const Sidebar = ({ selectedItem }) => {
  if (!selectedItem) {
    return (
      <div style={{ padding: '10px' }}>
        <h3>Details</h3>
        <p>Select a node or relationship to see details.</p>
      </div>
    );
  }

  const isNode = selectedItem.group && !selectedItem.from;
  return (
    <div style={{ padding: '10px' }}>
      <h3>{isNode ? 'Node Details' : 'Relationship Details'}</h3>
      <p><strong>ID:</strong> {selectedItem.id}</p>
      {isNode ? (
        <>
          <p><strong>Type:</strong> {selectedItem.group}</p>
          <p><strong>Properties:</strong></p>
          <pre>{JSON.stringify(selectedItem.properties, null, 2)}</pre>
        </>
      ) : (
        <>
          <p><strong>Type:</strong> {selectedItem.group}</p>
          <p><strong>From:</strong> {selectedItem.from}</p>
          <p><strong>To:</strong> {selectedItem.to}</p>
          <p><strong>Properties:</strong></p>
          <pre>{JSON.stringify(selectedItem.properties || {}, null, 2)}</pre>
        </>
      )}
    </div>
  );
};

const SchemaVisualizer = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedEdges, setSelectedEdges] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [isPathBuilding, setIsPathBuilding] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pathName, setPathName] = useState('');
  const [isPathValid, setIsPathValid] = useState(false);
  const [pathResult, setPathResult] = useState(null);
  const nvlRef = useRef(null);
  const [virtualRelations, setVirtualRelations] = useState(virtualRelationsData);
  useEffect(() => {
    const fetchSchema = async () => {
      const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
      const session = driver.session();
      try {
        const result = await session.run(`CALL db.schema.visualization()`);
        const schemaData = result.records[0];
        const schemaNodes = schemaData.get('nodes');
        const schemaRelationships = schemaData.get('relationships');
  
        // Define unwanted node types
        const unwantedNodeTypes = [
          "Chunk",      // Example: Exclude nodes of type "Phone"
       
        ];
  
        // Process nodes and filter out unwanted node types
        let processedNodes = schemaNodes
          .map(node => {
            const nodeType = node.labels[0];
            const properties = node.properties.indexes;
            return createNode(
              { identity: node.identity },
              nodeType,
              properties,
              false,
              null,
              true
            );
          })
          .filter(node => !unwantedNodeTypes.includes(node.group)); // Filter out unwanted node types
  
        const processedEdges = [];
        const nodeMap = new Map();
  
        schemaRelationships.forEach((rel, index) => {
          const startId = rel.start.toString();
          const endId = rel.end.toString();
          const relType = rel.type;
  
          const startNode = schemaNodes.find(n => n.identity.toString() === startId);
          const endNode = schemaNodes.find(n => n.identity.toString() === endId);
  
          if (!startNode || !endNode) return;
  
          const startLabels = startNode.labels;
          const endLabels = endNode.labels;
  
          const unwantedRelationships = [
            { relType: "Appel_telephone", startLabel: "Phone", endLabel: "Affaire" },
            { relType: "Appel_telephone", startLabel: "Personne", endLabel: "Phone" },
            { relType: "Appel_telephone", startLabel: "Personne", endLabel: "Affaire" },
            { relType: "appartient", startLabel: "Commune", endLabel: "Wilaya" },
            { relType: "appartient", startLabel: "Daira", endLabel: "Daira" },
          ];
  
          const shouldSkip = unwantedRelationships.some(({ relType, startLabel, endLabel }) => {
            return (
              rel.type === relType &&
              startLabels.includes(startLabel) &&
              endLabels.includes(endLabel)
            );
          });
  
          if (shouldSkip) return;
  
          // Ensure the nodes involved in the relationship still exist after filtering
          const startNodeExists = processedNodes.some(n => n.id === startId);
          const endNodeExists = processedNodes.some(n => n.id === endId);
  
          if (startId === endId) {
            const originalNode = processedNodes.find(n => n.id === startId);
            if (originalNode) {
              const duplicatedNode = {
                ...originalNode,
                id: `${originalNode.id}_dup_${index}`,
              };
              processedNodes.push(duplicatedNode);
  
              processedEdges.push(createEdge(
                { ...rel, identity: `${rel.identity}_self_${index}` },
                startId,
                duplicatedNode.id
              ));
  
              const relatedEdges = schemaRelationships.filter(r => {
                const isUnwanted = unwantedRelationships.some(({ relType, startLabel, endLabel }) => (
                  r.type === relType &&
                  schemaNodes.find(n => n.identity.toString() === r.start.toString())?.labels.includes(startLabel) &&
                  schemaNodes.find(n => n.identity.toString() === r.end.toString())?.labels.includes(endLabel)
                ));
                return (
                  (r.start.toString() === startId || r.end.toString() === startId) &&
                  r.start.toString() !== r.end.toString() &&
                  !isUnwanted
                );
              });
  
              const duplicatedConnectedNodes = new Map();
  
              relatedEdges.forEach((relatedRel, relIndex) => {
                const relStartId = relatedRel.start.toString();
                const relEndId = relatedRel.end.toString();
  
                if (relStartId === startId && relEndId !== startId) {
                  const connectedNode = processedNodes.find(n => n.id === relEndId);
                  if (connectedNode && !duplicatedConnectedNodes.has(relEndId)) {
                    const duplicatedConnectedNode = {
                      ...connectedNode,
                      id: `${connectedNode.id}_dup_${index}_${relIndex}`,
                    };
                    processedNodes.push(duplicatedConnectedNode);
                    duplicatedConnectedNodes.set(relEndId, duplicatedConnectedNode.id);
                  }
  
                  const targetId = duplicatedConnectedNodes.get(relEndId) || relEndId;
                  processedEdges.push(createEdge(
                    { ...relatedRel, identity: `${relatedRel.identity}_dup_out_${relIndex}` },
                    duplicatedNode.id,
                    targetId
                  ));
                } else if (relEndId === startId && relStartId !== startId) {
                  const connectedNode = processedNodes.find(n => n.id === relStartId);
                  if (connectedNode && !duplicatedConnectedNodes.has(relStartId)) {
                    const duplicatedConnectedNode = {
                      ...connectedNode,
                      id: `${connectedNode.id}_dup_${index}_${relIndex}`,
                    };
                    processedNodes.push(duplicatedConnectedNode);
                    duplicatedConnectedNodes.set(relStartId, duplicatedConnectedNode.id);
                  }
  
                  const sourceId = duplicatedConnectedNodes.get(relStartId) || relStartId;
                  processedEdges.push(createEdge(
                    { ...relatedRel, identity: `${relatedRel.identity}_dup_in_${relIndex}` },
                    sourceId,
                    duplicatedNode.id
                  ));
                }
              });
            }
          } else {
            if (!shouldSkip && startNodeExists && endNodeExists) {
              processedEdges.push(createEdge(rel, startId, endId));
            }
          }
        });
  
        setNodes(processedNodes);
        setEdges(processedEdges);
      } catch (error) {
        console.error('Error fetching schema:', error);
      } finally {
        await session.close();
        await driver.close();
      }
    };
  
    fetchSchema();
  }, []);



  const handleBuildPath = () => {
    const selectedRels = nvlRef.current?.getSelectedRelationships() || [];
    const selectedNodesArray = nvlRef.current?.getSelectedNodes() || [];
    const result = constructPath(selectedNodesArray, selectedRels, nodes);
    console.log(result);
    const pathExists = virtualRelations.some(relation => 
      JSON.stringify(relation.path) === JSON.stringify(result)
    );
    if (Array.isArray(result) && !pathExists) {
      setPathResult(result);
      setIsPathValid(true);
      console.log('Valid Path:', result);
    } else {
      setIsPathValid(false);
      setPathResult(null);
      alert(result === 'Incomplete selection' 
        ? 'Please select at least one node and one relationship.' 
        : 'No valid path connects the selected nodes and relationships.');
    }
  };


  // Optional: Load from localStorage on component mount
  useEffect(() => {
    const storedRelations = localStorage.getItem('virtualRelations');
    if (storedRelations) {
      setVirtualRelations(JSON.parse(storedRelations));
    }
  }, []);

  const handleCreatePath = () => {
    if (!pathName.trim()) {
      alert('Please enter a path name.');
      return;
    }

     // Check if this path already exists in virtualRelations
     const pathExists = virtualRelations.some(relation => 
      JSON.stringify(relation.path) === JSON.stringify(pathResult)
    );

    if (!pathExists) {
      // Create a new relation object
      const newRelation = {
        name: pathName, // Generate a unique name
        path: pathResult
      };
      const startNodeId = [...selectedNodes][0];
    const endNodeId = selectedNodes.size > 1 ? [...selectedNodes][1] : startNodeId; // Fallback to start if only one node
    
    // Get node details for start and end nodes
    const startNode = nodes.find(n => n.id === startNodeId);
    const endNode = nodes.find(n => n.id === endNodeId) || startNode; // Fallback to start if same node
    
    // Construct the new edge label in the format "startnode-name-endnode"
   // const newEdgeLabel = `${startNode.group}-${pathName.toUpperCase()}-${endNode.group}`;
    
    // Create a new edge object
    const newEdge = createEdge({type:pathName},startNodeId,endNodeId,'green')
  
    // Add the new edge to the edges array
    setEdges(prevEdges => [...prevEdges, newEdge]);
    
    // Reset the UI state
    setIsPathBuilding(false);
    setPathName('');
    setIsPathValid(false);
    setPathResult(null);
      // Update state with new relation
      setVirtualRelations(prev => [...prev, newRelation]);

      // Optional: Save to localStorage as a fallback
      localStorage.setItem(
        'virtualRelations',
        JSON.stringify([...virtualRelations, newRelation])
      );
    //  downloadUpdatedJson([...virtualRelations, newRelation]);
      console.log('New path saved:', newRelation);
    } else {
      console.log('Path already exists in virtualRelations');
    }
    
  //  setSelectedNodes(new Set());
    setSelectedEdges(new Set());
  };

  const getNodeDetails = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { group: node.group, color: getNodeColor(node.group), icon: getNodeIcon(node.group) } : { group: 'Unknown', color: '#95A5A6', icon: '/icons/default.png' };
  };

  const getEdgeDetails = (edgeId) => {
    const edge = edges.find(e => e.id === edgeId);
    return edge ? { group: edge.group } : { group: 'Unknown' };
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ margin: '10px 0', textAlign: 'center' }}>Neo4j Schema Visualizer</h2>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: '3', position: 'relative' }}>
          <GraphCanvas
            nvlRef={nvlRef}
            combinedNodes={nodes}
            combinedEdges={edges}
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            setContextMenu={setContextMenu}
            setnodetoshow={() => {}}
            ispath={false}
            setrelationtoshow={() => {}}
            setEdges={setEdges}
            setNodes={setNodes}
            selectedEdges={selectedEdges}
            setselectedEdges={setSelectedEdges}
          />
          <div>
            <LayoutControl nvlRef={nvlRef} nodes={nodes} edges={edges} />
          </div>
        </div>
        <div style={{ flex: '1', background: '#f0f0f0', borderLeft: '1px solid #ccc', overflowY: 'auto', maxWidth: '800px', width: '600px', padding: '15px' }}>
          <Sidebar selectedItem={selectedItem} />
          
          <div style={{ marginTop: '20px', background: '#ffffff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => setIsPathBuilding(true)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '15px', transition: 'background-color 0.3s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              Start Path Building
            </button>

            {isPathBuilding && (
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Path Construction</h4>
                
                {nvlRef.current.getSelectedNodes().length > 0 && (
                  <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                    {selectedNodes.size === 1 && (
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0066cc', marginRight: '5px' }}>Start Node:</span>
                        {(() => {
                          const nodeId = [...selectedNodes][0];
                          const { group, color, icon } = getNodeDetails(nodeId);
                          return (
                            <span style={{ backgroundColor: color, color: 'white', padding: '2px 8px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center' }}>
                              <img src={icon} alt={`${group} icon`} style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} />
                              {group}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    {selectedNodes.size === 2 && (
                      <>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: '#0066cc', marginRight: '5px' }}>Start Node:</span>
                          {(() => {
                            const nodeId = [...selectedNodes][0];
                            const { group, color, icon } = getNodeDetails(nodeId);
                            return (
                              <span style={{ backgroundColor: color, color: 'white', padding: '2px 8px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center' }}>
                                <img src={icon} alt={`${group} icon`} style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} />
                                {group}
                              </span>
                            );
                          })()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#0066cc', marginRight: '5px' }}>End Node:</span>
                          {(() => {
                            const nodeId = [...selectedNodes][1];
                            const { group, color, icon } = getNodeDetails(nodeId);
                            return (
                              <span style={{ backgroundColor: color, color: 'white', padding: '2px 8px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center' }}>
                                <img src={icon} alt={`${group} icon`} style={{ width: '16px', height: '16px', marginRight: '5px', verticalAlign: 'middle' }} />
                                {group}
                              </span>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedEdges.size > 0 && (
                  <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#0066cc', marginRight: '5px' }}>Selected Relations:</span>
                    <div>
                      {[...selectedEdges].map((edgeId, index) => {
                        const { group } = getEdgeDetails(edgeId);
                        return (
                          <span key={index} style={{ backgroundColor: '#FFD700', color: '#333', padding: '2px 8px', borderRadius: '3px', margin: '2px', display: 'inline-block' }}>
                            ➜ {group}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(selectedNodes.size > 0 || selectedEdges.size > 0) && !isPathValid && (
                  <button
                    onClick={handleBuildPath}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.3s' }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#1e87db'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
                  >
                    Build Path
                  </button>
                )}

                {isPathValid && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
                      Path Relationship Name:
                    </label>
                    <input
                      type="text"
                      value={pathName}
                      onChange={(e) => setPathName(e.target.value)}
                      placeholder="Enter path name (e.g., CONNECTED_BY)"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        marginBottom: '10px'
                      }}
                    />
                    <button
                      onClick={handleCreatePath}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#FF5722', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.3s' }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#e64a19'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#FF5722'}
                    >
                      Confirm Creation
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaVisualizer;