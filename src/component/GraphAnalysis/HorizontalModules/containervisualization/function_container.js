
import { useEffect } from 'react';
import { BASE_URL } from '../../utils/Urls';
import { parseAggregationResponse,SubGraphParser } from '../../utils/Parser';
import axios from 'axios';
import { computeDagreLayout_1, computeCytoscapeLayout, computeForceDirectedLayout ,Operationnelle_Soutien_Leader,computeLinearLayout } from "../../modules/layout/layout";
import { FreeLayoutType } from '@neo4j-nvl/base';

export const toggleNodeTypeVisibility = (nodeType, setVisibleNodeTypes) => {
    setVisibleNodeTypes((prev) => ({
      ...prev,
      [nodeType]: !prev[nodeType],
    }));
  };
  export const handlePrevSubGraph = (currentSubGraphIndex, setCurrentSubGraphIndex) => {
    if (currentSubGraphIndex > 0) {
      setCurrentSubGraphIndex(currentSubGraphIndex - 1);
    }
  };
  
  export const handleNextSubGraph = (currentSubGraphIndex, setCurrentSubGraphIndex, SubGrapgTable) => {
    if (currentSubGraphIndex < SubGrapgTable.results.length - 1) {
      setCurrentSubGraphIndex(currentSubGraphIndex + 1);
    }
  };;



 

export const handleLayoutChange = async (newLayoutType, nvlRef, combinedNodes, combinedEdges, setLayoutType) => {
  setLayoutType(newLayoutType);
  if (nvlRef.current) {
    let nodesWithPositions;
    if (newLayoutType === 'dagre') {
      nvlRef.current.setLayout(FreeLayoutType);
      nodesWithPositions = computeDagreLayout_1(combinedNodes, combinedEdges);
    } 
    else if (newLayoutType === 'Operationnelle_Soutien_Leader') {
      nvlRef.current.setLayout(FreeLayoutType);
      nodesWithPositions = Operationnelle_Soutien_Leader(combinedNodes, combinedEdges);
    } 
    else if (newLayoutType === 'elk') {
      nvlRef.current.setLayout(FreeLayoutType);
      nodesWithPositions = computeForceDirectedLayout(combinedNodes, combinedEdges);
    } else if (newLayoutType === 'computeCytoscapeLayout') {
    const nodesWithPositions = computeCytoscapeLayout(combinedNodes, combinedEdges, 5);
    } 
    else if (newLayoutType === 'computeLinearLayout') {
      nvlRef.current.setLayout(FreeLayoutType);
      nodesWithPositions = computeLinearLayout(combinedNodes, combinedEdges, 300);
    }
    else {
      nvlRef.current.setLayout(newLayoutType);
     //nvlRef.current?.resetZoom()
      return;
    }
    nvlRef.current.setNodePositions(nodesWithPositions);
    //nvlRef.current?.resetZoom()
  }
};

export const fetchNodeProperties = async (nodeId, setSelectedNodeData) => {
    try {
      const response = await axios.post(
        BASE_URL + "/getdata/",
        { "identity": parseInt(nodeId, 10) },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSelectedNodeData(response.data);
    } catch (error) {
      console.error("Error fetching node properties:", error.response?.data || error.message);
      return null;
    }
  };
  export const fetchNodeProperties2= async (nodeId) => {
    try {
      const response = await axios.post(
        BASE_URL + "/getdata/",
        { "identity": parseInt(nodeId, 10) },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching node properties:", error.response?.data || error.message);
      return null;
    }
  };
  export const fetchNoderelation = async (rel, setSelectecRelationData) => {
    console.log(rel)
    try {
      const response = await axios.post(
        BASE_URL + "/getrelationData/",
        { "identity": rel.id,
          "path":rel.aggregationpath,
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
  // Aggregation definitions
const virtualRelations = [
  {
      "name": "Appel_telephone",
      "path": ["Personne", "Proprietaire", "Phone", "Appel_telephone", "Phone", "Proprietaire", "Personne"]
  },
  {
      "name": "memeaffaire",
      "path": ["Personne", "Impliquer", "Affaire", "Impliquer", "Personne"]
  },
  {
      "name": "impliquer",
      "path": ["Phone", "Proprietaire", "Personne", "Impliquer", "Affaire"]
  },
  {
      "name": "ProduitDansCommune",
      "path": ["Affaire", "Traiter", "Unite", "situer", "Commune"]
  },
  {
      "name": "ProduitDansDaira",
      "path": ["Affaire", "Traiter", "Unite", "situer", "Commune", "appartient", "Daira"]
  }
];

// Helper to get aggregation path by name
const getAggregationPath = (relationName) => {
  const relation = virtualRelations.find((rel) => rel.name === relationName);
  console.log(`getAggregationPath for ${relationName}:`, relation ? relation.path : null);
  return relation ? relation.path : null;
};

// Helper to get intermediate types
const getIntermediateTypes = (aggregationPath) => {
  if (!aggregationPath) return [];
  const intermediateTypes = [];
  for (let i = 2; i < aggregationPath.length - 2; i += 2) {
      intermediateTypes.push(aggregationPath[i]);
  }
  console.log('Intermediate types:', intermediateTypes);
  return intermediateTypes;
};

// Handle aggregation API call
const handleAggregation = async (relationName, aggregationPath, nodes) => {
  const startType = aggregationPath[0];
  const nodeIds = nodes
 //     .filter((node) => node.group === startType)
      .map((node) => parseInt(node.id, 10));

  console.log(`handleAggregation - relationName: ${relationName}, startType: ${startType}, nodeIds:`, nodeIds);

  if (nodeIds.length === 0) {
      console.warn('No nodes found for aggregation');
      return { nodes: [], edges: [] };
  }

  try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token found');

      const response = await axios.post(`${BASE_URL}/agregate/`, {
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

// Main hook
export const useAggregation = (affairesInRange, activeAggregations, SubGrapgTable, setNodes, setEdges) => {
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
          affairesInRange.includes(result.affaire.identity)
      );
      console.log('Filtered results:', filteredResults);

      const { nodes: parsedNodes, edges: parsedEdges } = SubGraphParser(filteredResults);
      console.log('Initial parsed nodes:', parsedNodes, 'edges:', parsedEdges);

      const applyAggregations = async () => {
          let aggregatedNodes = [...parsedNodes];
          let aggregatedEdges = [...parsedEdges];

          for (const [relationName, isActive] of Object.entries(activeAggregations)) {
              console.log(`Processing aggregation: ${relationName}, isActive: ${isActive}`);
              if (!isActive) continue;

              const aggregationPath = getAggregationPath(relationName);
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

export const fetchPersonneCrimes = async (combinedNodes) => {
  try {
    const response = await axios.post(
      BASE_URL + "/getPersonneCrimes/",
      { nodeIds: combinedNodes.filter(node => node.group === 'Personne').map(node => parseInt(node.id, 10)) },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const personneCrimes = Object.entries(response.data).map(([nodeId, crimeCount]) => ({
      nodeId: nodeId,
      crimeCount,
    }));
    return personneCrimes;
  } catch (error) {
    console.error("Error fetching personne crimes:", error.response?.data || error.message);
    return [];
  }
};

export const filterPersonneNodesWithCrimes = (personneCrimes) => {
  return personneCrimes.filter(personne => personne.crimeCount >= 1).map(personne => personne.nodeId);
};

export const drawCirclesOnPersonneNodes = async (combinedNodes, setNodes) => {
  const personneCrimes = await fetchPersonneCrimes(combinedNodes);
  const personneNodesWithCrimes = filterPersonneNodesWithCrimes(personneCrimes);
  const crimeCountMap = new Map(personneCrimes.map(pc => [pc.nodeId, pc.crimeCount]));
  const updatedNodes = combinedNodes.map(node => {
    if (personneNodesWithCrimes.includes(node.id)) {
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      if (node.html) {
        wrapper.appendChild(node.html);
      }
      const nodeElement = document.createElement("div");
      nodeElement.style.width = "140px";
      nodeElement.style.height = "140px";
      nodeElement.style.border = "6px solid red";
      nodeElement.style.borderRadius = "50%";
      nodeElement.style.position = "absolute";
      nodeElement.style.top = "0";
      nodeElement.style.left = "0";
      const crimeBadge = document.createElement("div");
      crimeBadge.innerText = crimeCountMap.get(node.id) || "0";
      crimeBadge.style.position = "absolute";
      crimeBadge.style.top = "-5px";
      crimeBadge.style.right = "-5px";
      crimeBadge.style.background = "red";
      crimeBadge.style.color = "white";
      crimeBadge.style.fontSize = "20px";
      crimeBadge.style.fontWeight = "bold";
      crimeBadge.style.padding = "2px 5px";
      crimeBadge.style.borderRadius = "10px";
      crimeBadge.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";
      wrapper.appendChild(nodeElement);
      wrapper.appendChild(crimeBadge);
      return {
        ...node,
        pinned: true,
        html: wrapper,
        data: {
          ...node.data,
          crimeCount: crimeCountMap.get(node.id),
        },
      };
    }
    return node;
  });
  setNodes(updatedNodes);
};


export const BetweennessCentrality = async (combinedNodes, setNodes) => {
  try {
    // Validate input parameters
    // if (!Array.isArray(combinedNodes)) {
    //   throw new Error('combinedNodes must be an array');
    // }
    // if (typeof setNodes !== 'function') {
    //   throw new Error('setNodes must be a function');
    // }

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