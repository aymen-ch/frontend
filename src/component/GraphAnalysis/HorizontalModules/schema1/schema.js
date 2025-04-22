// src/components/SchemaVisualizer/SchemaVisualizer.jsx
import React, { useEffect, useState, useRef } from 'react';
import neo4j from 'neo4j-driver';
import Sidebar from './sidebar';
import GraphCanvas from '../../utils/VisualizationLibrary/GraphCanvas';
import LayoutControl from '../../modules/layout/Layoutcontrol';
import { createNode, createEdge, parsergraph, createNodeHtml } from '../../utils/Parser';
import virtualRelationsData from '../../modules/aggregation/aggregations.json';
import { useGlobalContext } from '../../GlobalVariables';
import SchemaIcon from './SchemaIcon';

const URI = 'neo4j://localhost:7687';
const USER = 'neo4j';
const PASSWORD = '12345678';

// Styles isolés pour le composant SchemaVisualizer
const schemaVisualizerStyles = {
  container: {
    height: '100vh', 
    width: '100vw', 
    display: 'flex', 
    flexDirection: 'column'
  },
  header: {
    background: '#2c3e50', 
    color: 'white', 
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: 0, 
    fontSize: '20px', 
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center'
  },
  toolbar: {
    display: 'flex', 
    gap: '15px'
  },
  layoutControls: {
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px'
  },
  layoutLabel: {
    fontSize: '14px'
  },
  layoutButton: (isActive) => ({
    background: isActive ? '#3498db' : 'transparent',
    color: isActive ? 'white' : '#ecf0f1',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  }),
  toggleButton: {
    background: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  mainContent: {
    flex: 1, 
    display: 'flex', 
    minHeight: 0, 
    position: 'relative'
  },
  graphContainer: (sidebarCollapsed) => ({
    flex: 1,
    position: 'relative',
    marginRight: sidebarCollapsed ? '0' : '350px',
    transition: 'margin-right 0.3s ease'
  }),
  controlsPanel: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '10px',
    zIndex: 100
  },
  sidebarContainer: (sidebarCollapsed) => ({
    position: 'fixed',
    top: '58px', // Hauteur du header
    right: sidebarCollapsed ? '-350px' : '0',
    width: '350px',
    height: 'calc(100vh - 58px)',
    background: '#ffffff',
    boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    overflowY: 'auto',
    zIndex: 1000,
    transition: 'right 0.3s ease',
  })
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeLayout, setActiveLayout] = useState('force');

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
      const edgeid = [...selectedEdges][0];
      const edge = edges.find((e) => e.id === edgeid);
      if (edge) {
        setSelectedItem({
          id: edge.id,
          group: edge.group,
          properties: edge.properties || {},
          from: edge.from,
          to: edge.to
        });
      }
    } else {
      setSelectedItem(null);
    }
  }, [selectedNodes, selectedEdges, edges, nodes]);

  // Redraw graph after config changes
  const redrawGraph = (nodeType, config) => {
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
          html: createNodeHtml(
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
                html: createNodeHtml(
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
    }
  };

  useEffect(() => {
    const fetchSchema = async () => {
      const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
      const session = driver.session();
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

    fetchSchema();
  }, [virtualRelations]);

  useEffect(() => {
    const storedRelations = localStorage.getItem('virtualRelations');
    if (storedRelations) {
      setVirtualRelations(JSON.parse(storedRelations));
    }
  }, []);

  const handleLayoutChange = (layout) => {
    setActiveLayout(layout);
    if (nvlRef.current) {
      nvlRef.current.applyLayout(layout);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="schema-viz-container" style={schemaVisualizerStyles.container}>
      {/* Header avec barre d'outils */}
      <header style={schemaVisualizerStyles.header}>
        <h2 style={schemaVisualizerStyles.title}>
          <SchemaIcon type="project-diagram" size={18} style={{ marginRight: '10px' }} />
          Neo4j Schema Visualizer
        </h2>
        <div style={schemaVisualizerStyles.toolbar}>
          <div style={schemaVisualizerStyles.layoutControls}>
            <span style={schemaVisualizerStyles.layoutLabel}>Layout:</span>
            <button 
              onClick={() => handleLayoutChange('force')}
              style={schemaVisualizerStyles.layoutButton(activeLayout === 'force')}
            >
              <SchemaIcon type="atom" size={14} /> Force
            </button>
            <button 
              onClick={() => handleLayoutChange('circle')}
              style={schemaVisualizerStyles.layoutButton(activeLayout === 'circle')}
            >
              <SchemaIcon type="circle-notch" size={14} /> Circle
            </button>
            <button 
              onClick={() => handleLayoutChange('grid')}
              style={schemaVisualizerStyles.layoutButton(activeLayout === 'grid')}
            >
              <SchemaIcon type="th" size={14} /> Grid
            </button>
          </div>
          <button 
            onClick={toggleSidebar}
            style={schemaVisualizerStyles.toggleButton}
          >
            <SchemaIcon type={sidebarCollapsed ? 'expand' : 'compress'} size={14} />
            {sidebarCollapsed ? 'Show Details' : 'Hide Details'}
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <div style={schemaVisualizerStyles.mainContent}>
        {/* Canvas de graphe */}
        <div style={schemaVisualizerStyles.graphContainer(sidebarCollapsed)}>
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
          
          {/* Contrôles flottants */}
          <div style={schemaVisualizerStyles.controlsPanel}>
            <LayoutControl nvlRef={nvlRef} nodes={nodes} edges={edges} />
          </div>
        </div>

        {/* Barre latérale */}
        <div style={schemaVisualizerStyles.sidebarContainer(sidebarCollapsed)}>
          <Sidebar 
            selectedItem={selectedItem} 
            onUpdate={redrawGraph}
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
        </div>
      </div>
    </div>
  );
};

export default SchemaVisualizer;
