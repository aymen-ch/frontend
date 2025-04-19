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

export const handleNodeExpansion = async (node, relationType, setNodes, setEdges) => {
  const token = localStorage.getItem('authToken');
  const node_type = node.group;
  const id = parseInt(node.id, 10);

  try {
    // Check if relationType is a virtual relation
    const virtualRelations = JSON.parse(localStorage.getItem('virtualRelations')) || [];
    const virtualRelation = virtualRelations.find((vr) => vr.name === relationType);

    let response;
    if (virtualRelation) {
      // Handle virtual relation, include path in payload
      response = await axios.post(
        BASE_URL + '/get_virtual_relationships/',
        { 
          node_type, 
          id, 
          virtual_relation: relationType,
          path: virtualRelation.path 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // Handle standard relation
      response = await axios.post(
        BASE_URL + '/get_node_relationships/',
        { node_type, id, relation_type: relationType },
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

export const handleCriminalTree = async (node, setNodes, setEdges,setActiveAggregations) => {
  const token = localStorage.getItem('authToken');
  const properties = { identity: parseInt(node.id, 10) };
  console.log("handleCriminalTree");
  try {
    const response = await axios.post(
      BASE_URL + '/personne_criminal_network/',
      { properties },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { nodes: criminalNodes, edges: criminalEdges } = parsergraph(response.data);
      let updatedNodes; // Define variable to hold the updated nodes
      setNodes((prevNodes) => {
        updatedNodes = [...prevNodes, ...criminalNodes]; // Assign the updated nodes
        return updatedNodes;
      });
      setEdges((prevEdges) => [...prevEdges, ...criminalEdges]);
      await handleAggregation(
        "apple_telephone",
        ["Personne", "Proprietaire", "Phone", "Appel_telephone", "Phone", "Proprietaire", "Personne"],
        "apple_telephone",
        setNodes,
        setEdges,
        updatedNodes// Use the prop nodes plus new criminalNodes
        ,setActiveAggregations
      );
    } else {
      console.error('Failed to fetch criminal network');
    }
  } catch (error) {
    console.error('Error fetching criminal network:', error);
  }
};

export const handleActionSelect = async (action, node, setActionsSubMenu, setContextMenu , setNodes ,setEdges,setActiveAggregations) => {
  console.log(`Selected ${action}`);
  if (action === 'Show Person Profile') {
    globalWindowState.setWindow('PersonProfile', node);
    setActionsSubMenu(null);
    setContextMenu(null);
  } 
  if (action === 'Show tree of criminal') {
    await handleCriminalTree(node, setNodes, setEdges,setActiveAggregations);
    setActionsSubMenu(null);
    setContextMenu(null);
  }
  else {
    setActionsSubMenu(null);
    setContextMenu(null);
  }
};

export const handleAdvancedExpand = async (
  node,
  setNodes,
  setEdges,
  {
    attribute = '_betweenness',
    threshold = 0.1,
    max_level = 2 // Changed to match API parameter name
  } = {}
) => {
  const token = localStorage.getItem('authToken');
  
  try {
    console.log("parm" ,parseInt(node.id, 10),
    attribute,
    threshold,
    max_level   );
    const response = await axios.post(
      `${BASE_URL}/expand_path_from_node/`,  // Matched your endpoint URL
      {
        id_start: parseInt(node.id, 10),
        attribute,
        threshold,
        max_level  // Using exact parameter name from API
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


