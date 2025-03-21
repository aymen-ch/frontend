// src/utils/contextMenuHelpers.js
import axios from 'axios';
import { BASE_URL } from '../../utils/Urls';
import { AddNeighborhoodParser,parsePath ,parseNetworkData } from '../../utils/Parser';
import globalWindowState from '../../utils/globalWindowState';

export const fetchPossibleRelations = async (node, setPossibleRelations) => {
  const token = localStorage.getItem('authToken');
  const node_type = node.group;
  const properties = { identity: parseInt(node.id, 10) };

  try {
    const response = await axios.post(
      BASE_URL + '/get_possible_relations/',
      { node_type, properties },
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
  const properties = { identity: parseInt(node.id, 10) };

  try {
    const response = await axios.post(
      BASE_URL + '/get_node_relationships/',
      { node_type, properties, relation_type: relationType },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { nodes: neighborhoodNodes, edges: neighborhoodEdges } = AddNeighborhoodParser(
        response.data,
        { id: node.id }
      );
      setNodes((prevNodes) => [...prevNodes, ...neighborhoodNodes]);
      setEdges((prevEdges) => [...prevEdges, ...neighborhoodEdges]);
    } else {
      console.error('Submission failed.');
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

export const handleCriminalTree = async (node, setNodes, setEdges) => {
  const token = localStorage.getItem('authToken');
  const properties = { identity: parseInt(node.id, 10) };

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
      const { nodes: criminalNodes, edges: criminalEdges } = parseNetworkData(response.data);
      setNodes((prevNodes) => [...prevNodes, ...criminalNodes]);
      setEdges((prevEdges) => [...prevEdges, ...criminalEdges]);
    } else {
      console.error('Failed to fetch criminal network');
    }
  } catch (error) {
    console.error('Error fetching criminal network:', error);
  }
};

export const handleActionSelect = async (action, node, setActionsSubMenu, setContextMenu , setNodes ,setEdges) => {
  console.log(`Selected ${action}`);
  if (action === 'Show Person Profile') {
    globalWindowState.setWindow('PersonProfile', node);
    setActionsSubMenu(null);
    setContextMenu(null);
  } 
  if (action === 'Show tree of criminal') {
    await handleCriminalTree(node, setNodes, setEdges);
    setActionsSubMenu(null);
    setContextMenu(null);
  }
  else {
    setActionsSubMenu(null);
    setContextMenu(null);
  }
};