
import { useEffect } from 'react';
import { BASE_URL_Backend } from '../../Platforme/Urls';
import { parseAggregationResponse,ContextualizationGraphParser } from '../VisualisationModule/Parser';
import axios from 'axios';
import { computeDagreLayout_1, computeForceDirectedLayout ,Operationnelle_Soutien_Leader,computeLinearLayout,computeGeospatialLayout } from "../VisualisationModule/layout/layout";
import { FreeLayoutType } from '@neo4j-nvl/base';

//// ce fichier contient les fonction nessecaire pour le container(visualisation dans le navbar horizontal) de modules  
/// fonction permetent d'assuer la gestion des nodes et des relation issu des diffrent methodes

///// pour défilement pour les affaires de la contextualisation ////////

export const handlePrevSubGraph = (currentSubGraphIndex, setCurrentSubGraphIndex) => {
    if (currentSubGraphIndex > 0) {
      setCurrentSubGraphIndex(currentSubGraphIndex - 1);
    }
  };
  
 export const handleNextSubGraph = (currentSubGraphIndex, setCurrentSubGraphIndex, SubGrapgTable) => {
    if (currentSubGraphIndex < SubGrapgTable.results.length - 1) {
      setCurrentSubGraphIndex(currentSubGraphIndex + 1);
    }
  };

  // Appliquer le layout à l'aide des fonctions implémentées dans le fichier layout

 export const handleLayoutChange = async (
    newLayoutType,
    graphRef,
    combinedNodes,
    combinedEdges,
    setLayoutType,
  ) => {
    if (!graphRef.current) {
      console.error('Graph reference not found');
      return;
    }
  
    try {
        let nodesWithPositions;
  
        if (newLayoutType === 'dagre') {
          graphRef.current.setLayout(FreeLayoutType);
          nodesWithPositions = computeDagreLayout_1(combinedNodes, combinedEdges);
        } else if (newLayoutType === 'Operationnelle_Soutien_Leader') {
          graphRef.current.setLayout(FreeLayoutType);
          nodesWithPositions = Operationnelle_Soutien_Leader(combinedNodes, combinedEdges);
        } else if (newLayoutType === 'elk') {
          graphRef.current.setLayout(FreeLayoutType);
          nodesWithPositions = computeForceDirectedLayout(combinedNodes, combinedEdges);
        } else if (newLayoutType === 'computeLinearLayout') {
          graphRef.current.setLayout(FreeLayoutType);
          nodesWithPositions = computeLinearLayout(combinedNodes, combinedEdges, 300);
        } else if (newLayoutType === 'geospatial') {
          graphRef.current.setLayout(FreeLayoutType);
          nodesWithPositions = computeGeospatialLayout(combinedNodes, 800, 800);
        } else {
          graphRef.current.setLayout(newLayoutType,true);
          setLayoutType(newLayoutType);

          return;
        }
        graphRef.current.setNodePositions(nodesWithPositions);
      setLayoutType(newLayoutType);
    } catch (error) {
      console.error('Error in handleLayoutChange:', error);
      throw error;
    }
  };

  
// Récupérer les informations d'un noeud et les stocker dans setSelectedNodeData

export const fetchNodeDetail = async (nodeId, setSelectedNodeData) => {
    try {
      const response = await axios.post(
        BASE_URL_Backend + "/getnodedata/",
        { "identity": parseInt(nodeId, 10) },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSelectedNodeData(response.data);
      console.log(response.data)
    } catch (error) {
      console.error("Error fetching node properties:", error.response?.data || error.message);
      return null;
    }
  };

// Récupérer les informations d'un relation et les stocker dans setSelectecRelationData
   
export const fetchrelationDetail = async (rel, setSelectecRelationData) => {
    console.log(rel)
    try {
      const response = await axios.post(
        BASE_URL_Backend + "/getrelationData/",
        { "identity": rel.id,
          "path":rel.aggregationpath,
          "type":rel.aggregationType,
         },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSelectecRelationData(response.data);
    } catch (error) {
      console.error("Error fetching node properties:", error.response?.data || error.message);
      return null;
    }
  };

  
// Récupérer les aggregation possible
export const fetchAggregations = async (setVirtualRelations) => {
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
  
// Fonction utilitaire pour récupérer le chemin d'agrégation par nom , par exemple :  "name": "test","path": ["Commune", "situer", "Unite", "Traiter", "Affaire", "Impliquer", "Personne", "Proprietaire", "Virtuel"]
 
const getAggregationPath = async (relationName,aggregations) => {
  const relation = aggregations.find((rel) => rel.name === relationName);
  console.log("rr:",relation.path)
  return relation ? relation.path : null;
};

// Fonction utilitaire pour récupérer les types intermédiaires à masquer par l'agrégation 
//// par exemple "path": ["Commune", "situer", "Unite", "Traiter", "Affaire", "Impliquer", "Personne", "Proprietaire", "Virtuel"]  
//// Unite,Affaire,Personne sorant returner pour les masquer
const getIntermediateTypes = (aggregationPath) => {
  if (!aggregationPath) return [];
  const intermediateTypes = [];
  for (let i = 2; i < aggregationPath.length - 2; i += 2) {
      intermediateTypes.push(aggregationPath[i]);
  }
  console.log('Intermediate types:', intermediateTypes);
  return intermediateTypes;
};

// Gérer l'appel API pour l'agrégation 
const handleAggregation = async (relationName, aggregationPath, nodes) => {

  const startType = aggregationPath[0];
  console.log("sta: ",aggregationPath)
  const nodeIds = nodes
      .map((node) => parseInt(node.id, 10));

  console.log(`handleAggregation - relationName: ${relationName}, startType: ${startType}, nodeIds:`, nodeIds);

  if (nodeIds.length === 0) {
      console.warn('No nodes found for aggregation');
      return { nodes: [], edges: [] };
  }

  try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token found');

      const response = await axios.post(`${BASE_URL_Backend}/agregate/`, {
          node_ids: nodeIds,
          aggregation_type: [aggregationPath],
          type: relationName
      }, {
          headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
      });

      console.log('API Response:', response.status, response.data);

      if (response.status === 200) {
          const { nodes: parsedNodes, edges: parsedEdges } = parseAggregationResponse(response.data);
          console.log('Parsed nodes:', parsedNodes, 'Parsed edges:', parsedEdges);

          const updatedNodes = parsedNodes.map(node => ({
              ...node,
              aggregationType: relationName,
              aggregationPath: aggregationPath
          }));

          const updatedEdges = parsedEdges.map(edge => ({
              ...edge,
              aggregationType: relationName,
              aggregationPath: aggregationPath
          }));

          return { nodes: updatedNodes, edges: updatedEdges };
      } else {
          console.error('Aggregation failed with status:', response.status);
          return { nodes: [], edges: [] };
      }
  } catch (error) {
      console.error('Error during aggregation:', error.message);
      return { nodes: [], edges: [] };
  }
};
/// utiliser lorquer on est dans un mode de contextualisation a chquer difilement des affaires on appliquer l'aggregation qui est activer
export const useAggregation = (affairesInRange, activeAggregations, SubGrapgTable, setNodes, setEdges,aggregations) => {
  useEffect(() => {
      console.log('useEffect triggered - affairesInRange:', affairesInRange, 'activeAggregations:', activeAggregations);

      if (!affairesInRange || affairesInRange.length === 0) {
          console.log('No affaires in range, skipping aggregation');
          return;
      }

      if (!SubGrapgTable || !SubGrapgTable.results) {
          console.error('SubGrapgTable or results is undefined');
          return;
      }

      const filteredResults = SubGrapgTable.results.filter((result) =>
          affairesInRange.includes(result.affaire.id)
      );
      console.log('Filtered results:', filteredResults);

      const { nodes: parsedNodes, edges: parsedEdges } = ContextualizationGraphParser(filteredResults);
      console.log('Initial parsed nodes:', parsedNodes, 'edges:', parsedEdges);

      const applyAggregations = async () => {
          let aggregatedNodes = [...parsedNodes];
          let aggregatedEdges = [...parsedEdges];

          for (const [relationName, isActive] of Object.entries(activeAggregations)) {
              console.log(`Processing aggregation: ${relationName}, isActive: ${isActive}`);
              if (!isActive) continue;

              const aggregationPath = await getAggregationPath(relationName,aggregations);
              if (!aggregationPath) {
                  console.warn(`No aggregation path found for ${relationName}`);
                  continue;
              }

              const intermediateTypes = getIntermediateTypes(aggregationPath);

              // Hide intermediate nodes
              aggregatedNodes = aggregatedNodes.map(node => ({
                  ...node,
                  hidden: intermediateTypes.includes(node.group) || node.hidden,
              }));

              // Hide edges connected to intermediate nodes
              aggregatedEdges = aggregatedEdges.map(edge => {
                  const fromNode = aggregatedNodes.find(n => n.id === edge.from);
                  const toNode = aggregatedNodes.find(n => n.id === edge.to);
                  return {
                      ...edge,
                      hidden: intermediateTypes.includes(fromNode?.group) ||
                             intermediateTypes.includes(toNode?.group) ||
                             edge.hidden,
                  };
              });

              // Perform aggregation
              const { nodes: newNodes, edges: newEdges } = await handleAggregation(
                  relationName,
                  aggregationPath,
                  aggregatedNodes
              );

              console.log('New nodes from aggregation:', newNodes, 'New edges:', newEdges);
              aggregatedNodes = [...aggregatedNodes, ...newNodes];
              aggregatedEdges = [...aggregatedEdges, ...newEdges];
          }

          console.log('Final aggregated nodes:', aggregatedNodes, 'edges:', aggregatedEdges);
          setNodes(aggregatedNodes);
          setEdges(aggregatedEdges);
      };

      applyAggregations().catch(error => console.error('Aggregation process failed:', error));
  }, [affairesInRange, activeAggregations, SubGrapgTable, setNodes, setEdges]);
};


//////  changer la taille de nodes selon leur centrality
export const CentralityByAttribute = async (combinedNodes, setNodes, attribute, group) => {
  try {
    // Define constants
    const BASE_SIZE = 90;  // Default base size for nodes
    const FACTOR = 150;    // Scaling factor for centrality visualization
   
    const updatedNodes = combinedNodes.map((node) => {
      
      
      // Check if node matches the selected group and has the specified attribute
      if (node.group === group && node.properties[attribute] !== undefined) {
        // Calculate new size based on centrality
    
        console.log("h0" ,node.properties )
        console.log("h1",node.group ,node.properties[attribute] )
        console.log("h23",group ,attribute )
        
        const newSize = BASE_SIZE + FACTOR * node.properties[attribute];
       
        return {
          ...node,
          size: Math.max(BASE_SIZE, newSize),  // Ensure minimum size
        };
      }

      // Return unchanged node if conditions aren't met
      return node;
    });

    // Update nodes state
    setNodes(updatedNodes);
  } catch (error) {
    console.error(`Error in CentralityByAttribute for ${attribute} on group ${group}:`, error);
    throw error;  // Re-throw to allow caller to handle
  }
};



export const BetweennessCentrality = async (combinedNodes, setNodes) => {
  try {


    // Define constants
    const BASE_SIZE = 90;  // Default base size for nodes
    const FACTOR = 1000;    // Scaling factor for centrality visualization

    const updatedNodes = combinedNodes.map((node) => {
      // Verify node structure
  

      // Check if node is of type 'Personne' and has betweenness centrality
      if (node.group === 'Personne' &&  node._betweennessCentrality ) {
        // Calculate new size based on centrality
        const newSize = BASE_SIZE + FACTOR * node._betweennessCentrality;
        
        return {
          ...node,
          size: Math.max(BASE_SIZE, newSize),  // Ensure minimum size
        };
      }

      // Return unchanged node if conditions aren't met
      return node;
    });

    // Update nodes state
    setNodes(updatedNodes);
  } catch (error) {
    console.error('Error in BetweennessCentrality:', error);
    throw error;  // Re-throw to allow caller to handle
  }
};

////changer la color de personne selon leur class , soutein , leader, operationelle
export const ColorPersonWithClass = async (combinedNodes, setNodes) => {
  const updatedNodes = combinedNodes.map((node) => {
    // Check if the node is of type 'Personne'
    if (node.group === 'Personne' && node._class) {
      let nodeColor = node.color; // Variable to store the node color
      let  activated = false ;
      // Determine the node color based on the _class
      if (node._class.includes('operationeel') && !node._class.includes('soutien') && !node._class.includes('leader')) {
        nodeColor = "#0000ff"; // Blue for 'operationeel'
      } else if (node._class.includes('soutien') && !node._class.includes('leader') ) {
        nodeColor = "#ff00ff"; // Yellow for 'soutien'
        activated=true;
      } else if (node._class.includes('leader')) {
        nodeColor = "#FFD700"; // Red for 'leader'
      }

      // Return the updated node with the new color
      return {
        ...node,
        activated:activated,
        color: nodeColor,
      };
    }

    // Return the node as-is if it's not a 'Personne' node
    return node;
  });

  // Update the nodes in the state
  setNodes(updatedNodes);
};

export const IconPersonWithClass = (node) => {
  // Check if the node is of type 'Personne'
  if (node.group === 'Personne' && node._class) {
    // Determine if the node is a leader
    // Determine the node color based on the _class

    if (node._class.includes('operationeel') && !node._class.includes('soutien') && !node._class.includes('leader')) {
      return false; // Blue for 'operationeel'
    } else if (node._class.includes('soutien') && !node._class.includes('leader') && !node._class.includes('operationeel')) {
      return true; // Yellow for 'soutien'
    } else if (node._class.includes('leader')) {
      return true;
    }
  }
  // Return false if the node is not a 'Personne' or doesn't match any _class
  return false;
};