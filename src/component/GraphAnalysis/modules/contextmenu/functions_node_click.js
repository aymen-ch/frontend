// src/utils/contextMenuHelpers.js
import axios from 'axios';
import { BASE_URL } from '../../utils/Urls';
import { AddNeighborhoodParser,parsePath ,parseNetworkData,parsergraph } from '../../utils/Parser';
import globalWindowState from '../../utils/globalWindowState';
import { handleAggregation } from '../aggregation/aggregationUtils'
export const fetchPossibleRelations = async (node, setPossibleRelations) => {
  const token = localStorage.getItem('authToken');
  const node_type = node.group;
  const id = parseInt(node.id, 10) ;

  try {
    const response = await axios.post(
      BASE_URL + '/get_possible_relations/',
      { node_type, id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      setPossibleRelations(response.data.relations);
    } else {
      console.error('Failed to fetch possible relations.');
    }
  } catch (error) {
    console.error('Error fetching possible relations:', error);
  }
};


export const handleNodeExpansion_selected = async (selectedNodes, setNodes, setEdges) => {
  const token = localStorage.getItem('authToken');

  try {
    // Get current nodes to map IDs to node objects
    let nodesToExpand = [];
    setNodes((prevNodes) => {
      nodesToExpand = prevNodes.filter((node) => selectedNodes.has(node.id));
      return prevNodes; // No change to nodes yet
    });

    if (nodesToExpand.length === 0) {
      console.log('No valid nodes to expand');
      return;
    }

    // Collect all new nodes and edges from expansions
    const allNewNodes = [];
    const allNewEdges = [];
    const nodeIds = new Set(); // Track unique node IDs
    const edgeIds = new Set(); // Track unique edge identifiers

    for (const node of nodesToExpand) {
      const node_type = node.group;
      const id = parseInt(node.id, 10);

      try {
        // Make API call for standard relations (relationType = null)
        const response = await axios.post(
          BASE_URL + '/get_node_relationships/',
          { node_type, id, relation_type: null },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          const graphData = parsergraph(response.data);
          // Filter unique nodes
          graphData.nodes.forEach((newNode) => {
            if (!nodeIds.has(newNode.id)) {
              nodeIds.add(newNode.id);
              allNewNodes.push(newNode);
            }
          });
          // Filter unique edges (assuming edges have unique from-to pairs)
          graphData.edges.forEach((newEdge) => {
            const edgeKey = `${newEdge.from}-${newEdge.to}`;
            if (!edgeIds.has(edgeKey)) {
              edgeIds.add(edgeKey);
              allNewEdges.push(newEdge);
            }
          });
        } else {
          console.error(`Failed to expand node ${id}:`, response.status);
        }
      } catch (error) {
        console.error(`Error expanding node ${id}:`, error);
      }
    }

    // Update state with deduplicated nodes and edges
    setNodes((prevNodes) => {
      const existingNodeIds = new Set(prevNodes.map((node) => node.id));
      const filteredNewNodes = allNewNodes.filter((node) => !existingNodeIds.has(node.id));
      return [...prevNodes, ...filteredNewNodes];
    });

    setEdges((prevEdges) => {
      const existingEdgeKeys = new Set(prevEdges.map((edge) => `${edge.from}-${edge.to}`));
      const filteredNewEdges = allNewEdges.filter((edge) => !existingEdgeKeys.has(`${edge.from}-${edge.to}`));
      return [...prevEdges, ...filteredNewEdges];
    });
  } catch (error) {
    console.error('Error in handleNodeExpansion_selected:', error);
  }
};

export const handleNodeExpansion = async (node, relationType, setNodes, setEdges, expandLimit = 100, expandDirection = 'In') => {
  const token = localStorage.getItem('authToken');
  const node_type = node.group;
  const id = parseInt(node.id, 10);

  try {
    // Check if relationType is a virtual relation
    let virtualRelations = [];
    try {
      const stored = JSON.parse(localStorage.getItem('virtualRelations'));
      if (Array.isArray(stored)) {
        virtualRelations = stored;
      }
    } catch (err) {
      console.warn("Invalid virtualRelations data in localStorage", err);
    }
    const virtualRelation = virtualRelations.find((vr) => vr.name === relationType);

    let response;
    if (virtualRelation) {
      // Handle virtual relation, include path, sense, and limit in payload
      response = await axios.post(
        BASE_URL + '/get_virtual_relationships/',
        { 
          node_type, 
          id, 
          virtual_relation: relationType,
          path: virtualRelation.path,
          expandLimit, // Include sense
          expandDirection  // Include limit
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // Handle standard relation, include sense and limit
      response = await axios.post(
        BASE_URL + '/get_node_relationships/',
        { 
          node_type, 
          id, 
          relation_type: relationType,
          expandLimit, // Include sense
          expandDirection  // Include limit
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (response.status === 200) {
      console.log("Response data:", response.data);
      const graphData = parsergraph(response.data);
      setNodes((prevNodes) => {
        return [...prevNodes, ...graphData.nodes];
      });
      setEdges((prevEdges) => [...prevEdges, ...graphData.edges]);
    } else {
      console.error('Submission failed:', response.status);
    }
  } catch (error) {
    console.error('Error during submission:', error);
  }
};
export const handleAllConnections = async (
  selectedNodes,
  setAllPaths,
  setCurrentPathIndex,
  setPathNodes,
  setPathEdges,
  setIsBoxPath
) => {
  setIsBoxPath(true);
  const nodeIds = Array.from(selectedNodes).map((id) => parseInt(id, 10));

  try {
    const response = await axios.post(
      BASE_URL + '/get_all_connections/',
      { ids: nodeIds },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.status === 200) {
      const paths = response.data.paths;
      setAllPaths(paths);
      setCurrentPathIndex(0);
      updatePathNodesAndEdges(paths[0], setPathNodes, setPathEdges);
    } else {
      console.error('Failed to fetch all connections.');
    }
  } catch (error) {
    console.error('Error fetching all connections:', error);
  }
};

export const updatePathNodesAndEdges = (path, setPathNodes, setPathEdges) => {
  const { nodes: formattedNodes, edges: formattedEdges } = parsePath(path);
  setPathNodes(formattedNodes);
  setPathEdges(formattedEdges);
};



export const handleActionSelect = async (
  action,
  node,
  setActionsSubMenu,
  setContextMenu,
  setNodes,
  setEdges,
  setActiveAggregations
) => {
  console.log(`Selected action: ${action}`);
  const token = localStorage.getItem('authToken');

  try {
    if (action === 'Show Person Profile' || action === 'add_action') {
      globalWindowState.setWindow(action, node);
      setActionsSubMenu(null);
      setContextMenu(null);
      return;
    }

    const idValue =  parseInt(node.id, 10); // Fallback to node.id if idField is not found

    // Call the execute_action endpoint
    const response = await axios.post(
      `${BASE_URL}/execute_action/`,
      {
        action_name: action,
        id: idValue,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      // Parse the graph data
      const { nodes: newNodes, edges: newEdges } = parsergraph(response.data);

      // Update nodes and edges, avoiding duplicates
      let updatedNodes;
      setNodes((prevNodes) => {
        const existingNodeIds = new Set(prevNodes.map((n) => n.id));
        updatedNodes = [...prevNodes, ...newNodes.filter((n) => !existingNodeIds.has(n.id))];
        return updatedNodes;
      });

      setEdges((prevEdges) => {
        const existingEdgeIds = new Set(prevEdges.map((e) => `${e.from}-${e.to}`));
        const filteredEdges = newEdges.filter((e) => !existingEdgeIds.has(`${e.from}-${e.to}`));
        return [...prevEdges, ...filteredEdges];
      });

      // Apply aggregation for "Show Criminal Network"
      if (action === 'Afficher le reseau criminel') {
        await handleAggregation(
          'apple_telephone',
          ['Personne', 'Proprietaire', 'Phone', 'Appel_telephone', 'Phone', 'Proprietaire', 'Personne'],
          'apple_telephone',
          setNodes,
          setEdges,
          updatedNodes, // Pass the updated nodes including new criminal nodes
          setActiveAggregations
        );
      }

      // Close menus
      setActionsSubMenu(null);
      setContextMenu(null);
    } else {
      console.error(`Failed to execute action: ${action}`);
    }
  } catch (error) {
    console.error(`Error executing action ${action}:`, error);
    // Optionally notify the user (e.g., with react-toastify)
    // import { toast } from 'react-toastify';
    // toast.error(`Failed to execute ${action}: ${error.message}`);
  }
};



// export const handleActionSelect = async (
//   action,
//   node,
//   setActionsSubMenu,
//   setContextMenu,
//   setNodes,
//   setEdges,
//   setActiveAggregations=null
// ) => {
//   try {
//     // Determine the ID field based on node group
//     const idValue = node.id; // Fallback to node.id if idField is not found

//     // Call the execute_action endpoint
//     const response = await axios.post('/api/execute_action/', {
//       action_name: action,
//       id: idValue,
//     });

//     const { nodes, edges } = response.data;

//     // Update nodes and edges, avoiding duplicates
//     setNodes((prevNodes) => {
//       const existingNodeIds = new Set(prevNodes.map((n) => n.id));
//       const newNodes = nodes.filter((n) => !existingNodeIds.has(n.id));
//       return [...prevNodes, ...newNodes];
//     });

//     setEdges((prevEdges) => {
//       const existingEdgeIds = new Set(prevEdges.map((e) => `${e.from}-${e.to}`));
//       const newEdges = edges.filter((e) => !existingEdgeIds.has(`${e.from}-${e.to}`));
//       return [...prevEdges, ...newEdges];
//     });

//     // Optionally update active aggregations
//     setActiveAggregations((prev) => ({
//       ...prev,
//       // Add any aggregation logic if needed
//     }));
//    if(node.group=="Personne"){
//     await handleAggregation(
//       "apple_telephone",
//       ["Personne", "Proprietaire", "Phone", "Appel_telephone", "Phone", "Proprietaire", "Personne"],
//       "apple_telephone",
//       setNodes,
//       setEdges,
//       updatedNodes// Use the prop nodes plus new criminalNodes
//       ,setActiveAggregations
//     );
//    }
//     // Close menus
//     setActionsSubMenu(null);
//     setContextMenu(null);
//   } catch (error) {
//     console.error('Error handling action:', error);
//     // Optionally show an error message to the user
//   }
// };

// export { fetchPossibleRelations, handleNodeExpansion, handleAllConnections, handleAdvancedExpand };

// export const handleCriminalTree = async (node, setNodes, setEdges,setActiveAggregations) => {
//   const token = localStorage.getItem('authToken');
//   console.log("handleCriminalTree");
//   try {
//     const response = await axios.post(
//       BASE_URL + '/personne_criminal_network/',
//       { id:parseInt(node.id, 10) },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (response.status === 200) {
//       const { nodes: criminalNodes, edges: criminalEdges } = parsergraph(response.data);
//       let updatedNodes; // Define variable to hold the updated nodes
//       setNodes((prevNodes) => {
//         updatedNodes = [...prevNodes, ...criminalNodes]; // Assign the updated nodes
//         return updatedNodes;
//       });
//       setEdges((prevEdges) => [...prevEdges, ...criminalEdges]);
//       await handleAggregation(
//         "apple_telephone",
//         ["Personne", "Proprietaire", "Phone", "Appel_telephone", "Phone", "Proprietaire", "Personne"],
//         "apple_telephone",
//         setNodes,
//         setEdges,
//         updatedNodes// Use the prop nodes plus new criminalNodes
//         ,setActiveAggregations
//       );
//     } else {
//       console.error('Failed to fetch criminal network');
//     }
//   } catch (error) {
//     console.error('Error fetching criminal network:', error);
//   }
// };
// export const handleaffair_insame = async (node, setNodes, setEdges) => {
//   const token = localStorage.getItem('authToken');
//   console.log("handleCriminalTree");
//   try {
//     const response = await axios.post(
//       BASE_URL + '/affaire_in_the_same_region/',
//       { id: parseInt(node.id, 10)},
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (response.status === 200) {
//       const { nodes: affairesnode, edges: affaireedges } = parsergraph(response.data);
//       let updatedNodes; // Define variable to hold the updated nodes
//       setNodes((prevNodes) => {
//         updatedNodes = [...prevNodes, ...affairesnode]; // Assign the updated nodes
//         return updatedNodes;
//       });
//       setEdges((prevEdges) => [...prevEdges, ...affaireedges]);
//     } else {
//       console.error('Failed to fetch affaire network');
//     }
//   } catch (error) {
//     console.error('Error fetching affaires network:', error);
//   }
// };

// export const handleActionSelect = async (action, node, setActionsSubMenu, setContextMenu , setNodes ,setEdges,setActiveAggregations) => {
//   console.log(`Selected ${action}`);
//   if (action === 'Show Person Profile') {
//     globalWindowState.setWindow('PersonProfile', node);
//     setActionsSubMenu(null);
//     setContextMenu(null);
//   } 
//   if (action === 'Show tree of criminal') {
//     await handleCriminalTree(node, setNodes, setEdges,setActiveAggregations);
//     setActionsSubMenu(null);
//     setContextMenu(null);
//   }
//   if (action === 'Affaire dans la meme region') {
//     await handleaffair_insame(node, setNodes, setEdges);
//     setActionsSubMenu(null);
//     setContextMenu(null);
//   }
//   else {
//     setActionsSubMenu(null);
//     setContextMenu(null);
//   }
// };

export const handleAdvancedExpand = async (
  node,
  setNodes,
  setEdges,
  advancedExpandParams
) => {
  const token = localStorage.getItem('authToken');
  
  try {
    // console.log("parm" ,parseInt(node.id, 10),
    // attribute,
    // threshold,
    // max_level   );
    const { attribute, threshold, maxLevel } = advancedExpandParams; // Destructure the params
    const response = await axios.post(
      `${BASE_URL}/expand_path_from_node/`,  // Matched your endpoint URL
      {
        id_start: parseInt(node.id, 10),
        attribute, // Use destructured value
        threshold, // Use destructured value
        max_level: maxLevel, // Map maxLevel to max_level for API
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      console.log("nodes_BOB2" ,response.data );

      const { nodes: expandedNodes, edges: expandedEdges } = parsergraph(response.data.data);
      
      // Update state with new nodes and edges
       setNodes(prevNodes => [...prevNodes, ...expandedNodes]);
       setEdges(prevEdges => [...prevEdges, ...expandedEdges]);

      

      return { 
        success: true, 
        // nodes: expandedNodes, 
        // edges: expandedEdges,
        message: 'Path expanded successfully'
      };
    } else {
      console.error('Failed to expand path from node');
      return { 
        success: false, 
        error: 'API request failed',
        status: response.status
      };
    }
  } catch (error) {
    console.error('Error expanding path:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
};


