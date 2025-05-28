
import React, { useEffect, useState, useRef } from 'react';
import neo4j from 'neo4j-driver';
import Sidebar from './sidebar';
import PathBuilder from './PathBuilder';
import GraphCanvas from '../../VisualisationModule/GraphCanvas';
import LayoutControl from '../../VisualisationModule/layout/Layoutcontrol';
import { createNode, createEdge, createNodeHtml } from '../../Parser';
import {  ForceDirectedLayoutType } from '@neo4j-nvl/base';
import NodeConfigForm from './NodeConfigForm';
import { useTranslation } from 'react-i18next';
import AnalysisAttributeForm from './AnalysisAttribut';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import '../../../../../i18n';
import axios from 'axios';
import Actions from './Actions'
import { FaInfoCircle, FaCogs, FaPlusCircle ,FaSpinner} from 'react-icons/fa';



import {URI,USER,PASSWORD}  from '../../../Platforme/Urls'


const SchemaVisualizer = () => {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeModule, setActiveModule] = useState(t('Detail'));
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
  const [virtualRelations, setVirtualRelations] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const token = localStorage.getItem('authToken');
  const [error, setError] = useState('');
  const [currentDb, setCurrentDb] = useState('');


 useEffect(() => {
    // Fetch aggregations from backend
    const fetchAggregations = async () => {
      try {
        const response = await axios.post(`${BASE_URL_Backend}/get_aggregations/`);
        if (response.status === 200) {
          setVirtualRelations(response.data);
        } else {
          console.error('Failed to fetch aggregations:', response.data.error);
          setVirtualRelations([]);
        }
      } catch (error) {
        console.error('Error fetching aggregations:', error);
        setVirtualRelations([]);
      }
    };

    fetchAggregations();
  }, []);

  useEffect(() => {
    fetchCurrentDatabase();
  }, []);

  const handleModuleClick = (module) => {
    setActiveModule(activeModule === module ? null : module);
  };

  useEffect(() => {
    if (selectedNodes.size === 1) {
      const nodeId = [...selectedNodes][0];
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedItem({
          id: node.id,
          isnode: true,
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
          group: edge.group || edge.type,
          properties: edge.properties || {},
          isnode: false,
          from: edge.from,
          to: edge.to,
          virtual: edge.virtual || false,
          path: edge.path || null,
          finalPath: edge.finalPath || null,
        });
      }
    } else {
      setSelectedItem(null);
    }
  }, [selectedNodes, selectedEdges, edges, nodes]);

  const fetchCurrentDatabase = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/get_current_database/`,
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
    }
  };

  const redrawGraph = (nodeType, config) => {
    console.log('rendre ');
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
            false,
            1,
            node.id,
            false,
            '',
            config.size
          ),
        }));

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
                ),
              };
            }
            return node;
          })
        );
      } catch (error) {
        console.error('Error updating nodes in graph:', error);
      }
      console.log('updated!!');
    }
  };

  const fetchSchema = async () => {
    const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
    const session = driver.session({ database: currentDb });
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


      // NEW CODE: Add self-referential virtual relations with filtering
      const selfReferentialVirtualRelations = [];
      schemaRelationships.forEach((rel) => {
        const startId = rel.start.toString();
        const endId = rel.end.toString();
        if (startId === endId) {
          const startNode = schemaNodes.find((n) => n.identity.toString() === startId);
          if (startNode) {
            const startNodeLabel = startNode.labels[0];
            const relType = rel.type;
            
            // Skip 'appartient' self-relations
            if (relType === 'appartient') return;
            
            // Check if this virtual relation already exists
            const relationExists = virtualRelations.some(vr => 
              vr.name === `${relType}_groupé` && 
              JSON.stringify(vr.path) === JSON.stringify([startNodeLabel, relType, startNodeLabel])
            );
            
            if (!relationExists) {
              selfReferentialVirtualRelations.push({
                name: `${relType}_groupé`,
                path: [startNodeLabel, relType, startNodeLabel],
              });
            }
          }
        }
      });

      // Merge with existing virtual relations, filtering out duplicates
      const allVirtualRelations = [...virtualRelations];
      selfReferentialVirtualRelations.forEach(newRel => {
        if (!allVirtualRelations.some(existingRel => 
          existingRel.name === newRel.name && 
          JSON.stringify(existingRel.path) === JSON.stringify(newRel.path)
        )) {
          allVirtualRelations.push(newRel);
        }
      });

      // Process all virtual relations to create virtual edges
      allVirtualRelations.forEach((relation) => {
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

        // Create a unique ID for the virtual edge
        let virtualEdgeId = `virtual_${relationName}_${startNode.id}_${endNodeId}`;
        let counter = 1;
        
        while (processedEdges.some(edge => edge.id === virtualEdgeId)) {
          virtualEdgeId = `virtual_${relationName}_${startNode.id}_${endNodeId}_${counter}`;
          counter++;
        }

        // Check if this exact virtual edge already exists
        const edgeExists = processedEdges.some(edge => 
          edge.virtual && 
          edge.source === startNode.id && 
          edge.target === endNodeId && 
          edge.label === relationName
        );

        if (!edgeExists) {
          const virtualEdge = {
            ...createEdge(
              {
                type: relationName,
                identity: virtualEdgeId,
              },
              startNode.id,
              endNodeId,
              'green'
            ),
            id: virtualEdgeId,
            virtual: true,
            path: path,
            finalPath: `${startNodeLabel} -${relationName}-> ${endNodeLabel}`,
          };
          processedEdges.push(virtualEdge);
        }
      });

      console.log('Processed Nodes:', processedNodes);
      console.log('Processed Edges:', processedEdges);
      setNodes(processedNodes);
      setEdges(processedEdges);
      return allVirtualRelations;
    } catch (error) {
      console.error('Error fetching schema:', error);
      return virtualRelations;
    } finally {
      await session.close();
      await driver.close();
    }
  };

  useEffect(() => {
    const storedRelations = localStorage.getItem('virtualRelations');
    if (storedRelations) {
      setVirtualRelations(JSON.parse(storedRelations));
    }
  }, []);

  // Modified useEffect to handle fetchSchema and persist virtual relations
  useEffect(() => {
    if (currentDb !== '') {
      fetchSchema().then((newVirtualRelations) => {
        // Conditionally update virtualRelations to avoid unnecessary state changes
        const existingRelationNames = new Set(virtualRelations.map((r) => r.name));
        const hasNewRelations = newVirtualRelations.some(
          (r) => !existingRelationNames.has(r.name)
        );
        if (hasNewRelations) {
          setVirtualRelations(newVirtualRelations);
          localStorage.setItem('virtualRelations', JSON.stringify(newVirtualRelations));
        }
      });
    }
  }, [currentDb]);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };


  return (
    <div className="h-screen w-screen flex flex-col">
      <h2 className="my-7.5 text-center h-10">
        {t('Schema visualization')}
      </h2>
      <div className="flex-1 flex min-h-0 relative">
        <div
          className={`flex-1 relative ${
            isSidebarVisible
              ? activeModule
                ? 'mr-[630px] md:mr-[400px] sm:mr-[80vw]'
                : 'mr-0'
              : 'mr-0'
          }`}
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
            <LayoutControl
              nvlRef={nvlRef}
              nodes={nodes}
              edges={edges}
              layoutType={layoutType}
              setLayoutType={setLayoutType}
            />
          </div>
        </div>

        {isSidebarVisible && (
          <div
            className={`fixed right-0 top-[120px] ${
              activeModule
                ? 'w-[630px] md:w-[630px] sm:w-[200vw]'
                : 'w-[60px]'
            } h-[calc(100vh-40px)] bg-gray-100 border-l border-gray-300 overflow-y-auto ${
              activeModule ? 'p-4' : 'p-4 px-1.5'
            } z-[1000] box-border transition-all duration-300 ease-in-out`}
          >
            <div className="side-nav">
              <div className="side-nav-inner">
                {[
                  { label: t('Detail'), icon: <FaInfoCircle /> },
                  { label: t('Attribue danalyse'), icon: <FaSpinner /> },
                  { label: t('NodeConfig'), icon: <FaCogs /> },
                  { label: t('Aggregation'), icon: <FaPlusCircle /> },
                  { label: t('Actions'), icon: <FaPlusCircle /> },
                ].map(({ label, icon }) => (
                  <div
                    key={label}
                    className={`side-nav-item flex items-center gap-2 p-2.5 cursor-pointer ${
                      activeModule === label ? 'bg-[#E6F0FA] border-l-4 border-cyan-500 text-blue-800 transform scale-105 shadow-md' : 'bg-transparent'
                    }`}
                    onClick={() => handleModuleClick(label)}
                  >
                    <span className="nav-icon text-base">{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {activeModule && (
              <div className="module-panel">
                <div className="module-header flex items-center justify-between">
                  <h5 className="module-title">{activeModule}</h5>
                  <button
                    className="btn btn-sm module-close-btn text-lg"
                    onClick={() => setActiveModule(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="module-content">
                  {activeModule === t('Detail') && <Sidebar selectedItem={selectedItem} />}
                  {activeModule === t('NodeConfig') && (
                    <NodeConfigForm selectedNode={selectedItem} onUpdate={redrawGraph} />
                  )}
                  {activeModule === t('Aggregation') && (
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
                      setLayoutType={setLayoutType}
                    />
                  )}
                  {activeModule === t('Actions') && <Actions selectedItem={selectedItem} />}
                  {activeModule === t('Attribue danalyse') && (
                    <AnalysisAttributeForm selectedItem={selectedItem} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaVisualizer;
