import React, { useEffect, useState, useRef } from 'react';
import Detail from './Detail';
import PathBuilder from './PathBuilder';
import GraphCanvas from '../../VisualisationModule/GraphCanvas';
import LayoutControl from '../../VisualisationModule/layout/Layoutcontrol';
import { createNode, createEdge, createNodeHtml, loadConfig } from '../../VisualisationModule/Parser';
import { ForceDirectedLayoutType } from '@neo4j-nvl/base';
import NodeConfigForm from './NodeConfigForm';
import { useTranslation } from 'react-i18next';
import AnalysisAttributeForm from './AnalysisAttribut';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import '../../../../../i18n';
import axios from 'axios';
import Actions from './Actions';

const SchemaVisualizer = () => {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeModule, setActiveModule] = useState();
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
  const [virtualRelations, setVirtualRelations] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // New loading state
  const token = localStorage.getItem('authToken');

  // Modified fetchSchema to accept virtualRelations as a parameter
  const fetchSchema = async (existingVirtualRelations) => {
  try {
    // Récupère les données du schéma depuis le backend
    const response = await axios.post(BASE_URL_Backend + '/get_schema/');
    const schemaData = response.data;
    const schemaNodes = schemaData['nodes'];
    const schemaRelationships = schemaData['relationships'];
    const unwantedNodeTypes = ['Chunk'];

    // Traite les nœuds en excluant les types non désirés
    let processedNodes = schemaNodes
      .map((node) => {
        const nodeType = node.labels[0];
        const properties = node.properties.indexes;
        return createNode(node.id, nodeType, properties, false, null, true);
      })
      .filter((node) => !unwantedNodeTypes.includes(node.group));

    const processedEdges = [];
    const duplicatedNodesMap = new Map();

    // Traite les relations du schéma
    schemaRelationships.forEach((rel, index) => {
      const startId = rel.startNode.toString();
      const endId = rel.endNode.toString();
      const relType = rel.type;
      const startNode = schemaNodes.find((n) => n.id.toString() === startId);
      const endNode = schemaNodes.find((n) => n.id.toString() === endId);

      if (!startNode || !endNode) return;

      const startLabels = startNode.labels;
      const endLabels = endNode.labels;

      // Liste des relations à exclure
      const unwantedRelationships = [
        { relType: 'Appel_telephone', startLabel: 'Phone', endLabel: 'Affaire' },
        { relType: 'Appel_telephone', startLabel: 'Personne', endLabel: 'Phone' },
        { relType: 'Appel_telephone', startLabel: 'Personne', endLabel: 'Affaire' },
        { relType: 'appartient', startLabel: 'Commune', endLabel: 'Wilaya' },
        { relType: 'appartient', startLabel: 'Daira', endLabel: 'Daira' },
      ];

      // Vérifie si la relation doit être ignorée
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

      // Gestion des relations autoréférentielles
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
            createEdge({ ...rel, id: `${rel.id}_self` }, startId, duplicatedNode.id)
          );

          // Traite les relations connectées
          const relatedEdges = schemaRelationships.filter((r) => {
            const isUnwanted = unwantedRelationships.some(
              ({ relType, startLabel, endLabel }) =>
                r.type === relType &&
                schemaNodes
                  .find((n) => n.id.toString() === r.startNode.toString())
                  ?.labels.includes(startLabel) &&
                schemaNodes
                  .find((n) => n.id.toString() === r.endNode.toString())
                  ?.labels.includes(endLabel)
            );
            return (
              (r.startNode.toString() === startId || r.endNode.toString() === startId) &&
              r.startNode.toString() !== r.endNode.toString() &&
              !isUnwanted
            );
          });

          relatedEdges.forEach((relatedRel, relIndex) => {
            const relStartId = relatedRel.startNode.toString();
            const relEndId = relatedRel.endNode.toString();

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
                    { ...relatedRel, id: `${relatedRel.id}_dup_out_${relIndex}` },
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
                    { ...relatedRel, id: `${relatedRel.id}_dup_in_${relIndex}` },
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

    // Process self-referential virtual relations and save them to the backend
    const selfReferentialVirtualRelations = [];
    for (const rel of schemaRelationships) {
      const startId = rel.startNode.toString();
      const endId = rel.endNode.toString();
      if (startId === endId) {
        const startNode = schemaNodes.find((n) => n.id.toString() === startId);
        if (startNode) {
          const startNodeLabel = startNode.labels[0];
          const relType = rel.type;

          if (relType === 'appartient') continue;

          const pathName = `${relType}_groupé`;
          const pathResult = [startNodeLabel, relType, startNodeLabel];

          // Vérifie si la relation existe déjà
          const relationExists = existingVirtualRelations.some(
            (vr) =>
              vr.name === pathName &&
              JSON.stringify(vr.path) === JSON.stringify(pathResult)
          );

          if (!relationExists) {
            // Ajoute la relation autoréférentielle à la liste
            selfReferentialVirtualRelations.push({
              name: pathName,
              path: pathResult,
            });

            // Sauvegarde la relation dans le backend
            try {
              await axios.post(BASE_URL_Backend + '/add_aggregation/', {
                name: pathName,
                path: pathResult,
              });
              console.log(`Relation autoréférentielle sauvegardée : ${pathName}`);
            } catch (error) {
              console.error(`Erreur lors de la sauvegarde de la relation ${pathName} :`, error);
            }
          }
        }
      }
    }

    // Fusionne les relations virtuelles existantes avec les nouvelles
    const allVirtualRelations = [...existingVirtualRelations, ...selfReferentialVirtualRelations];

    // Traite toutes les relations virtuelles pour créer des arêtes virtuelles
    allVirtualRelations.forEach((relation) => {
      const path = relation.path;
      const relationName = relation.name;
      const startNodeLabel = path[0];
      const endNodeLabel = path[path.length - 1];

      const startNode = processedNodes.find((n) => n.group === startNodeLabel);
      const endNode = processedNodes.find((n) => n.group === endNodeLabel);

      if (!startNode || !endNode) {
        console.warn(
          `Nœuds introuvables pour la relation virtuelle ${relationName}: ${startNodeLabel} -> ${endNodeLabel}`
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

      let virtualEdgeId = `virtual_${relationName}_${startNode.id}_${endNodeId}`;
      let counter = 1;

      // Évite les doublons d'ID pour les arêtes virtuelles
      while (processedEdges.some((edge) => edge.id === virtualEdgeId)) {
        virtualEdgeId = `virtual_${relationName}_${startNode.id}_${endNodeId}_${counter}`;
        counter++;
      }

      // Vérifie si l'arête virtuelle existe déjà
      const edgeExists = processedEdges.some(
        (edge) =>
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
              id: virtualEdgeId,
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

    // Retourne les nœuds, arêtes et relations virtuelles
    return { nodes: processedNodes, edges: processedEdges, virtualRelations: allVirtualRelations };
  } catch (error) {
    console.error('Erreur lors de la récupération du schéma :', error);
    return { nodes: [], edges: [], virtualRelations: existingVirtualRelations };
  }
};

  // Single useEffect to fetch both schema and aggregations
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); // Set loading state

    const initializeData = async () => {
      try {
        // Fetch aggregations first
        const aggResponse = await axios.post(`${BASE_URL_Backend}/get_aggregations/`);
        let fetchedVirtualRelations = [];
        if (aggResponse.status === 200) {
          fetchedVirtualRelations = aggResponse.data;
        } else {
          console.error('Failed to fetch aggregations:', aggResponse.data.error);
        }

        // Fetch schema with virtual relations
        await loadConfig();
        const { nodes, edges, virtualRelations } = await fetchSchema(fetchedVirtualRelations);

        if (isMounted) {
          setNodes(nodes);
          setEdges(edges);
          setVirtualRelations(virtualRelations);
          setIsLoading(false); // Data is ready, allow rendering
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

// Effet pour récupérer les agrégations (relations virtuelles) depuis le backend au montage
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

// Fonction pour gérer le clic sur les onglets de la barre latérale (Detail, Path Builder, etc.)
  const handleModuleClick = (module) => {
    setActiveModule(activeModule === module ? null : module);
  };
  
// Effet pour mettre à jour l'état `selectedItem` (utilisé pour le panneau de détails)
// basé sur les changements dans `selectedNodes` ou `selectedEdges`.
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


// Fonction pour redessiner les nœuds d'un type spécifique (`nodeType`) 
// en appliquant une nouvelle configuration (`config`: couleur, taille, icône, label)
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

 
return (
    <div className="h-[calc(100vh-50px)] bg-gradient-to-b from-gray-50 to-gray-100 p-0 overflow-hidden relative">
      <h3 className="text-center text-xl font-semibold py-2 flex-shrink-0">
        {t('Schema visualization')}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p>Loading schema...</p>
        </div>
      ) : (
        <div className="flex flex-grow m-0 p-0">
          <div
            className={`flex-grow 'lg:w-full md:w-full w-full h-[calc(100vh-60px)] overflow-y-auto' rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${
              isSidebarVisible ? 'mr-[60px]' : 'mr-0'
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
            <div className="absolute right-0 top-0 bottom-0 w-[60px] flex flex-col z-50 p-0">
              <div className="flex flex-col h-full bg-[#E4EFE7] border-l border-black/10 overflow-y-auto justify-start pt-0 mt-0">
                {[t('Detail'), t('Attribue danalyse'), t('NodeConfig'), t('Aggregation'), t('Actions')].map(
                  (module) => (
                    <div
                      key={module}
                      className={`flex items-center justify-center min-h-[100px] border-b border-white/10 text-gray-500 cursor-pointer transition-all writing-mode-vertical-rl px-3 py-4 ${
                        activeModule === module
                          ? 'bg-[#E6F0FA] border-l-4 border-cyan-500 text-blue-800 transform scale-105 shadow-md'
                          : ''
                      }`}
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                      onClick={() => handleModuleClick(module)}
                    >
                      {module}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {isSidebarVisible && activeModule && (
            <div className="absolute right-[60px] top-0 bottom-0 w-[700px] lg:w-[600px] md:w-[400px] sm:w-[300px] bg-white shadow-[-3px_0_10px_rgba(0,0,0,0.1)] z-20 overflow-y-auto p-5 border-l border-gray-200">
              <div className="flex justify-between items-center border-b-2 border-[#3a4a66] pb-2 mb-4 sticky top-0 bg-white pt-1">
                <h5 className="text-gray-800 font-semibold m-0">{activeModule}</h5>
                <button className="text-gray-500 text-xl leading-none p-0" onClick={() => setActiveModule(null)}>
                  ×
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg">
                {activeModule === t('Detail') && <Detail selectedItem={selectedItem} />}
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
                  />
                )}
                {activeModule === t('Actions') && <Actions selectedItem={selectedItem} />}
                {activeModule === t('Attribue danalyse') && <AnalysisAttributeForm selectedItem={selectedItem} />}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchemaVisualizer;


