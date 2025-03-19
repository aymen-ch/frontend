
import { useEffect } from 'react';
import { BASE_URL } from './Urls';
import { parseAggregationResponse,SubGraphParser } from './Parser';
import axios from 'axios';
import { computeDagreLayout_1, computeCytoscapeLayout, computeForceDirectedLayout ,Operationnelle_Soutien_Leader } from "../modules/layout/layout";
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
      nvlRef.current.setLayout(FreeLayoutType);
      nodesWithPositions = computeCytoscapeLayout(combinedNodes, combinedEdges, 5);
    } else {
      nvlRef.current.setLayout(newLayoutType);
      nvlRef.current.fit(nvlRef.current.getNodes().map((n) => n.id),0.75)
      return;
    }
    nvlRef.current.setNodePositions(nodesWithPositions, true);
    nvlRef.current.fit(nvlRef.current.getNodes().map((n) => n.id),0.75)
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
export const getAggregationPath = (type) => {
    switch (type) {
      case "Phone":
        return ["Personne", "Proprietaire", "Phone", "Appel_telephone", "Phone", "Proprietaire", "Personne"];
      case "Affaire":
        return ["Personne", "Impliquer", "Affaire", "Impliquer", "Personne"];
      case "Personne":
        return ["Phone", "Proprietaire", "Personne", "Impliquer", "Affaire"];
      case "Unite":
        return ["Affaire", "Traiter", "Unite", "situer", "Commune"];
      case "Commune":
        return ["Affaire", "Traiter", "Unite", "situer", "Commune", "appartient", "Daira"];
      default:
        return null;
    }
  };
  
  export const getIntermediateTypes = (aggregationPath) => {
    const intermediateTypes = [];
    for (let i = 2; i < aggregationPath.length - 2; i += 2) {
      intermediateTypes.push(aggregationPath[i]);
    }
    return intermediateTypes;
  };
  
  export const handleAggregation = async (type, aggregationType, nodes, edges) => {
    const nodeIds = nodes
      .filter((node) => type.includes(node.group))
      .map((node) => parseInt(node.id, 10));
  
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/agregate/', {
        node_ids: nodeIds,
        aggregation_type: [type],
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.status === 200) {
        const { nodes: parsedNodes, edges: parsedEdges } = parseAggregationResponse(response.data);

        const updatedNodes = parsedNodes.map(node => ({
          ...node,
          aggregationType: aggregationType,
        }));
        const updatedEdges = parsedEdges.map(edge => ({
          ...edge,
          aggregationType: aggregationType,
        }));
  
        return { nodes: updatedNodes, edges: updatedEdges };
      } else {
        console.error('Aggregation failed.');
        return { nodes: [], edges: [] };
      }
    } catch (error) {
      console.error('Error during aggregation:', error);
      return { nodes: [], edges: [] };
    }
  };




export const useAggregation = (affairesInRange, activeAggregations, SubGrapgTable, setNodes, setEdges) => {
  useEffect(() => {
    if (affairesInRange.length > 0) {
      const filteredResults = SubGrapgTable.results.filter((result) =>
        affairesInRange.includes(result.affaire.identity)
      );

      const { nodes: parsedNodes, edges: parsedEdges } = SubGraphParser(filteredResults);

      const applyAggregations = async () => {
        let aggregatedNodes = [...parsedNodes];
        let aggregatedEdges = [...parsedEdges];

        for (const [type, isActive] of Object.entries(activeAggregations)) {
          if (isActive) {
            const aggregationTypeToCall = getAggregationPath(type);
            if (aggregationTypeToCall) {
              const intermediateTypes = getIntermediateTypes(aggregationTypeToCall);

              aggregatedNodes = aggregatedNodes.map(node => ({
                ...node,
                hidden: intermediateTypes.includes(node.group) || node.hidden,
              }));

              aggregatedEdges = aggregatedEdges.map(edge => ({
                ...edge,
                hidden: intermediateTypes.includes(aggregatedNodes.find(n => n.id === edge.from)?.group) ||
                        intermediateTypes.includes(aggregatedNodes.find(n => n.id === edge.to)?.group) ||
                        edge.hidden,
              }));

              const { nodes: newNodes, edges: newEdges } = await handleAggregation(
                aggregationTypeToCall,
                type,
                aggregatedNodes,
                aggregatedEdges
              );
              aggregatedNodes = [...aggregatedNodes, ...newNodes];
              aggregatedEdges = [...aggregatedEdges, ...newEdges];
            }
          }
        }

        setNodes(aggregatedNodes);
        setEdges(aggregatedEdges);
      };

      applyAggregations();
    }
  }, [affairesInRange, activeAggregations]);
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




export const ColorPersonWithClass = async (combinedNodes, setNodes) => {
  const updatedNodes = combinedNodes.map((node) => {
    // Check if the node is of type 'Personne'
    if (node.group === 'Personne' && node._class) {
      let nodeColor = node.color; // Variable to store the node color

      // Determine the node color based on the _class
      if (node._class.includes('operationeel') && !node._class.includes('soutien') && !node._class.includes('leader')) {
        nodeColor = "#0000ff"; // Blue for 'operationeel'
      } else if (node._class.includes('soutien') && !node._class.includes('leader') ) {
        nodeColor = "#ff00ff"; // Yellow for 'soutien'
      } else if (node._class.includes('leader')) {
        nodeColor = "#FFD700"; // Red for 'leader'
      }

      // Return the updated node with the new color
      return {
        ...node,
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