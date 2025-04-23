// src/components/SchemaVisualizer/SchemaVisualizer.jsx
import React, { useEffect, useState, useRef } from 'react';
import neo4j from 'neo4j-driver';
import Sidebar from './sidebar';
import PathBuilder from './PathBuilder';
import GraphCanvas from '../../utils/VisualizationLibrary/GraphCanvas';
import LayoutControl from '../../modules/layout/Layoutcontrol';
import { createNode, createEdge, parsergraph,createNodeHtml } from '../../utils/Parser';
import virtualRelationsData from '../../modules/aggregation/aggregations.json';
import { useGlobalContext } from '../../GlobalVariables';
import { d3ForceLayoutType, ForceDirectedLayoutType } from '@neo4j-nvl/base'; 
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import NodeConfigForm from './NodeConfigForm';

import { BASE_URL } from '../../utils/Urls';

import axios from 'axios';
// import { BASE_URL } from '../../utils/Urls';

const URI = 'neo4j://localhost:7687';
const USER = 'neo4j';
const PASSWORD = '12345678';

const SchemaVisualizer = () => {
  const [nodes,setNodes] = useState([])
  const [edges,setEdges] = useState([])
  const [activeModule, setActiveModule] = useState('Detail');
  const [layoutType, setLayoutType] = useState(ForceDirectedLayoutType);
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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const token = localStorage.getItem('authToken');
  const [error, setError] = useState('');
  const [currentDb, setCurrentDb] = useState('');

   useEffect(() => {
      fetchCurrentDatabase();
    }, []);

  const handleModuleClick = (module) => {
    setActiveModule(activeModule === module ? null : module);
  };
  // Handle node selection and update selectedItem
  useEffect(() => {
    if (selectedNodes.size === 1) {
      const nodeId = [...selectedNodes][0];
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedItem({
          id: node.id,
          group: node.group,
          properties: node.properties || {},
        });
      }
    } else if (selectedEdges.size === 1) {
      console.log(selectedEdges)
      const edgeid = [...selectedEdges][0];
      const edge = edges.find((e) => e.id === edgeid);
      if (edge) {
        setSelectedItem({
          id: edge.id,
          group: edge.group,
          properties: edge.properties || {},
        });
      }
    }else
    
    {
      setSelectedItem(null);
    }
  }, [selectedNodes,selectedEdges,edges, nodes]);

    const fetchCurrentDatabase = async () => {
     
      try {
        const response = await axios.post(
          `${BASE_URL}/get_current_database/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        setCurrentDb(response.data.current_database);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch current database');
      } finally {
      
      }
    };

  // Redraw graph after config changes
  const redrawGraph = (nodeType, config) => {
    console.log("rendre ")
    if (nvlRef.current && nodes.length > 0) {
      const nodesToUpdate = nodes
      .filter((node) => node.group === nodeType)
      .map((node) => ({
        id: node.id,
        color: config.color || node.color,
        size: config.size || node.size,
        image: config.icon || node.image,
        label: config.labelKey
          ? node.properties[config.labelKey] || node.label
          : node.label,
         html : createNodeHtml(
            config.icon,
            node.group,
            node.selected,
            false, // isinpath
            1, // groupCount
            node.id,
            false, // AddIcon
            '', // Icon
            config.size
          )
      }));

    // Update graph with new node properties
    try {
      nvlRef.current.addAndUpdateElementsInGraph(nodesToUpdate, []);
      console.log(`Updated ${nodesToUpdate.length} nodes of type ${nodeType}`);
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.group === nodeType) {
            const label = config.labelKey
              ? node.properties[config.labelKey] || node.label
              : node.label;
            const size = config.size || node.size;
            const image = config.icon || node.image;
            return {
              ...node,
              color: config.color || node.color,
              size,
              image,
              label,
                 html : createNodeHtml(
                  label,
                  nodeType,
                  node.selected,
                  false,
                  1,
                  node.id,
                  false,
                  '',
                  size
                )
                     
            };
          }
          return node;
        }));
    } catch (error) {
      console.error('Error updating nodes in graph:', error);
    }
      console.log("updated!!")
    }
  };

  const fetchSchema = async () => {
    const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
    const session = driver.session({database :currentDb});
    try {
      const result = await session.run(`CALL db.schema.visualization()`);
      const schemaData = result.records[0];
      const schemaNodes = schemaData.get('nodes');
      const schemaRelationships = schemaData.get('relationships');

      const unwantedNodeTypes = ['Chunk'];

      let processedNodes = schemaNodes
        .map((node) => {
          const nodeType = node.labels[0];
          const properties = node.properties.indexes;
          return createNode(node.identity, nodeType, properties, false, null, true);
        })
        .filter((node) => !unwantedNodeTypes.includes(node.group));

      const processedEdges = [];
      const duplicatedNodesMap = new Map();

      schemaRelationships.forEach((rel, index) => {
        const startId = rel.start.toString();
        const endId = rel.end.toString();
        const relType = rel.type;
        const startNode = schemaNodes.find((n) => n.identity.toString() === startId);
        const endNode = schemaNodes.find((n) => n.identity.toString() === endId);

        if (!startNode || !endNode) return;

        const startLabels = startNode.labels;
        const endLabels = endNode.labels;

        const unwantedRelationships = [
          { relType: 'Appel_telephone', startLabel: 'Phone', endLabel: 'Affaire' },
          { relType: 'Appel_telephone', startLabel: 'Personne', endLabel: 'Phone' },
          { relType: 'Appel_telephone', startLabel: 'Personne', endLabel: 'Affaire' },
          { relType: 'appartient', startLabel: 'Commune', endLabel: 'Wilaya' },
          { relType: 'appartient', startLabel: 'Daira', endLabel: 'Daira' },
        ];

        const shouldSkip = unwantedRelationships.some(
          ({ relType, startLabel, endLabel }) =>
            rel.type === relType &&
            startLabels.includes(startLabel) &&
            endLabels.includes(endLabel)
        );

        if (shouldSkip) return;

        const startNodeExists = processedNodes.some((n) => n.id === startId);
        const endNodeExists = processedNodes.some((n) => n.id === endId);

        if (!startNodeExists || !endNodeExists) return;

        if (startId === endId) {
          const originalNode = processedNodes.find((n) => n.id === startId);
          if (originalNode) {
            let duplicatedNode;
            if (!duplicatedNodesMap.has(startId)) {
              duplicatedNode = {
                ...originalNode,
                id: `${originalNode.id}_dup`,
              };
              processedNodes.push(duplicatedNode);
              duplicatedNodesMap.set(startId, duplicatedNode.id);
            } else {
              duplicatedNode = processedNodes.find((n) => n.id === duplicatedNodesMap.get(startId));
            }

            processedEdges.push(
              createEdge({ ...rel, identity: `${rel.identity}_self` }, startId, duplicatedNode.id)
            );

            const relatedEdges = schemaRelationships.filter((r) => {
              const isUnwanted = unwantedRelationships.some(
                ({ relType, startLabel, endLabel }) =>
                  r.type === relType &&
                  schemaNodes
                    .find((n) => n.identity.toString() === r.start.toString())
                    ?.labels.includes(startLabel) &&
                  schemaNodes
                    .find((n) => n.identity.toString() === r.end.toString())
                    ?.labels.includes(endLabel)
              );
              return (
                (r.start.toString() === startId || r.end.toString() === startId) &&
                r.start.toString() !== r.end.toString() &&
                !isUnwanted
              );
            });

            relatedEdges.forEach((relatedRel, relIndex) => {
              const relStartId = relatedRel.start.toString();
              const relEndId = relatedRel.end.toString();

              if (relStartId === startId && relEndId !== startId) {
                const connectedNode = processedNodes.find((n) => n.id === relEndId);
                if (connectedNode) {
                  let targetNodeId = relEndId;
                  if (!duplicatedNodesMap.has(relEndId)) {
                    const duplicatedConnectedNode = {
                      ...connectedNode,
                      id: `${connectedNode.id}_dup`,
                    };
                    processedNodes.push(duplicatedConnectedNode);
                    duplicatedNodesMap.set(relEndId, duplicatedConnectedNode.id);
                    targetNodeId = duplicatedConnectedNode.id;
                  } else {
                    targetNodeId = duplicatedNodesMap.get(relEndId);
                  }

                  processedEdges.push(
                    createEdge(
                      { ...relatedRel, identity: `${relatedRel.identity}_dup_out_${relIndex}` },
                      duplicatedNode.id,
                      targetNodeId
                    )
                  );
                }
              } else if (relEndId === startId && relStartId !== startId) {
                const connectedNode = processedNodes.find((n) => n.id === relStartId);
                if (connectedNode) {
                  let sourceNodeId = relStartId;
                  if (!duplicatedNodesMap.has(relStartId)) {
                    const duplicatedConnectedNode = {
                      ...connectedNode,
                      id: `${connectedNode.id}_dup`,
                    };
                    processedNodes.push(duplicatedConnectedNode);
                    duplicatedNodesMap.set(relStartId, duplicatedConnectedNode.id);
                    sourceNodeId = duplicatedConnectedNode.id;
                  } else {
                    sourceNodeId = duplicatedNodesMap.get(relStartId);
                  }

                  processedEdges.push(
                    createEdge(
                      { ...relatedRel, identity: `${relatedRel.identity}_dup_in_${relIndex}` },
                      sourceNodeId,
                      duplicatedNode.id
                    )
                  );
                }
              }
            });
          }
        } else {
          if (startNodeExists && endNodeExists) {
            processedEdges.push(createEdge(rel, startId, endId));
          }
        }
      });

      virtualRelations.forEach((relation) => {
        const path = relation.path;
        const relationName = relation.name;
        const startNodeLabel = path[0];
        const endNodeLabel = path[path.length - 1];

        const startNode = processedNodes.find((n) => n.group === startNodeLabel);
        const endNode = processedNodes.find((n) => n.group === endNodeLabel);

        if (!startNode || !endNode) {
          console.warn(
            `Could not find nodes for virtual relation ${relationName}: ${startNodeLabel} -> ${endNodeLabel}`
          );
          return;
        }

        let endNodeId = endNode.id;

        if (startNodeLabel === endNodeLabel && startNode.id === endNode.id) {
          if (duplicatedNodesMap.has(startNode.id)) {
            endNodeId = duplicatedNodesMap.get(startNode.id);
          } else {
            const duplicatedNode = {
              ...startNode,
              id: `${startNode.id}_dup`,
            };
            processedNodes.push(duplicatedNode);
            duplicatedNodesMap.set(startNode.id, duplicatedNode.id);
            endNodeId = duplicatedNode.id;
          }
        }

        const virtualEdge = createEdge(
          {
            type: relationName,
            identity: `virtual_${relationName}_${startNode.id}_${endNodeId}`,
          },
          startNode.id,
          endNodeId,
          'green'
        );
        processedEdges.push(virtualEdge);
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


  useEffect(() => {
    if(currentDb !='')
      fetchSchema();
  }, [virtualRelations,currentDb]);

  useEffect(() => {
    const storedRelations = localStorage.getItem('virtualRelations');
    if (storedRelations) {
      setVirtualRelations(JSON.parse(storedRelations));
    }
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ margin: '10px 0', textAlign: 'center', height: '40px' }}>
        Schema Visualizer
      </h2>
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <div
          style={{
            flex: 1,
            position: 'relative',
            marginRight: isSidebarVisible ? '400px' : '0',
            transition: 'margin-right 0.3s ease-in-out',
          }}
        >
          <GraphCanvas
            nvlRef={nvlRef}
            nodes={nodes}
            edges={edges}
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
            <LayoutControl nvlRef={nvlRef} nodes={nodes} edges={edges} layoutType={layoutType} setLayoutType={setLayoutType}/>
          </div>
        </div>
        
 
        
        {/* Sidebar */}
        <div
          style={{
            position: 'fixed',
            right: isSidebarVisible ? '0' : '-400px',
            width: '530px',
            height: 'calc(100vh - 40px)',
            background: '#f0f0f0',
            borderLeft: '1px solid #ccc',
            overflowY: 'auto',
            padding: '15px',
            zIndex: 1000,
            boxSizing: 'border-box',
            transition: 'right 0.3s ease-in-out',
          }}
        >

{true && (
          <div className="side-nav">
            <div className="side-nav-inner">
              {['Detail', 'NodeConfig', 'Aggregation'].map((module) => (
                <div
                  key={module}
                  className={`side-nav-item ${activeModule === module ? 'active' : ''}`}
                  onClick={() => handleModuleClick(module)}
                >
                  {module}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModule && (
          <div className="module-panel">
            <div className="module-header">
              <h5 className="module-title">{activeModule}</h5>
              <button className="btn btn-sm module-close-btn" onClick={() => setActiveModule(null)}>×</button>
            </div>
            
            <div className="module-content">
            {activeModule === 'Detail' && (
                <Sidebar selectedItem={selectedItem}/>
              )}
              {activeModule === 'NodeConfig' && (
                <NodeConfigForm selectedNode={selectedItem} onUpdate={redrawGraph} />
              )}
              {activeModule === 'Aggregation' && (
               <PathBuilder
               isPathBuilding={isPathBuilding}
               setIsPathBuilding={setIsPathBuilding}
               selectedNodes={selectedNodes}
               selectedEdges={selectedEdges}
               nodes={nodes}
               edges={edges}
               pathName={pathName}
               setPathName={setPathName}
               isPathValid={isPathValid}
               setIsPathValid={setIsPathValid}
               pathResult={pathResult}
               setPathResult={setPathResult}
               virtualRelations={virtualRelations}
               setVirtualRelations={setVirtualRelations}
               setEdges={setEdges}
               nvlRef={nvlRef}
             />
              )}
             
            </div>
          </div>
        )}
          {/* <Sidebar selectedItem={selectedItem} onUpdate={redrawGraph} />
           */}
        </div>
      </div>
    </div>
  );
};

export default SchemaVisualizer;
