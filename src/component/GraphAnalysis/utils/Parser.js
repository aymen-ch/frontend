import axios from 'axios';
import { BASE_URL } from './Urls';

// Configuration object for node and edge styling
export const NODE_CONFIG = {
  // Node sizes
  defaultNodeSize: 90,
  groupNodeSize: 70,
  defaultNodeWidth: '200px',/// for 90 it 200 for 120 it 250
  defaultNodeHeight: '200px',/// for 
  groupNodeWidth: '220px',
  groupNodeHeight: '220px',
  centerWrapperWidth: '160px',
  centerWrapperHeight: '160px',
  groupCenterWrapperWidth: '180px',
  groupCenterWrapperHeight: '180px',
  // Image sizes
  defaultImageWidth: '120px',
  defaultImageHeight: '120px',
  groupImageWidth: '100px',
  groupImageHeight: '100px',
  captionBottom: '-45px',
  // Colors (can override getNodeColor if needed)
  nodeColors: {
    Daira: '#FF5733',      // Orange
    Commune: '#33FF57',    // Green
    Wilaya: '#3357FF',     // Blue
    Unite: '#FF33A1',      // Pink
    Affaire: '#D20103',    // Purple
    Virtuel: '#B38F94',    // Cyan
    Phone: '#E9C843',      // Yellow
    Personne: '#33AEE8',   // Light Blue
    default: '#CCCCCC',    // Gray
  },
  nodesize: {
    Daira: 90,      // Orange
    Commune: 90,    // Green
    Wilaya: 90,     // Blue
    Unite: 90,      // Pink
    Affaire: 90,    // Purple
    Virtuel: 90,    // Cyan
    Phone: 90,      // Yellow
    Personne: 90,   // Light Blue
    default: 90,    // Gray
  },

  // Edge styling
  edgeColor: 'red',
  edgeWidth: 7,
  captionSize: 5,
  captionFontSize: '40px',
  captionColor: 'rgb(211, 70, 54)',
  captionBackgroundColor: '#f1c40f',
  captionPadding: '5px',
  captionBorderRadius: '3px',
  captionTextShadow: '1px 1px 2px #000',
};

// Fetch node properties from the server
const fetchNodeProperties = async (nodeId) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/getdata/`,
      { identity: parseInt(nodeId, 10) },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching node properties:', error.response?.data || error.message);
  }
};

// Utility function to create a node object
export const createNode = (nodeData, nodeType, properties, isSelected = false,aggregatedproperties=null) => {
    console.log("create node have been called")
  // Create the base node object
  const node = {
    id: nodeData.identity.toString(),
    group: nodeType,
    shape: 'circularImage',
    size: NODE_CONFIG.defaultNodeSize,
    color: NODE_CONFIG.nodeColors[nodeType] || NODE_CONFIG.nodeColors.default,
    html: createNodeHtml(LabelManager(nodeType, properties), nodeType, isSelected, false, nodeData.identity.toString(), NODE_CONFIG.defaultNodeSize),
    selecte: isSelected,
    captionnode: LabelManager(nodeType, properties),
    aggregatedproperties:aggregatedproperties,
    //hovered:true,
    properties:properties
  };

  if (properties._class) {
    node._class = properties._class;
  }
  if (properties._betweennessCentrality) {
    node._betweennessCentrality = properties._betweennessCentrality;
  }
  return node;
};

// Utility function to create an edge object
export const createEdge = (rel, startId, endId) => ({
  id: rel.identity ? rel.identity.toString() : `${startId}-${endId}`,
  from: startId.toString(),
  to: endId.toString(),
  color: NODE_CONFIG.edgeColor,
  width: NODE_CONFIG.edgeWidth,
  captionSize: NODE_CONFIG.captionSize || 12, // Default size if not provided
  captionAlign: 'center',
  captions: [
    {
      value: rel.type,
      styles: ['bold,italic'],
      key: rel.type,
    },
  ],
  group:rel.type,
  //hovered: true,
});

// Utility function to parse nodes and edges from a subGraph
const parseSubGraph = (subGraph) => {
  const nodes = [];
  const edges = [];

  const affaire = subGraph.affaire;
  if (affaire && affaire.identity !== null && affaire.identity !== undefined) {
    nodes.push(createNode(affaire, 'Affaire', affaire));
  }

  if (subGraph.nodes && Array.isArray(subGraph.nodes)) {
    subGraph.nodes.forEach((node) => {
      if (node.properties && node.properties.identity !== null && node.properties.identity !== undefined) {
        nodes.push(createNode(node.properties, node.node_type, node.properties));
      }
    });
  }

  if (subGraph.relations && Array.isArray(subGraph.relations)) {
    subGraph.relations.forEach((relation) => {
      if (relation.startId !== null && relation.startId !== undefined && relation.endId !== null && relation.endId !== undefined) {
        edges.push(createEdge(relation, relation.startId, relation.endId));
      }
    });
  }

  return { nodes, edges };
};

// Utility function to parse nodes and edges from neighborhood data
const parseNeighborhood = (neighborhoodData, contextNode) => {
  if (!Array.isArray(neighborhoodData)) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];

  neighborhoodData.forEach((item) => {
    const { related, relationship } = item;
    nodes.push(createNode(related.properties, related.node_type, related.properties));
    edges.push(createEdge(relationship, contextNode.id, related.properties.identity));
  });

  return { nodes, edges };
};

export const parseNetworkData = (networkData) => {
  // Check if the data is valid
  console.log("hi from parser1 " ,networkData);
  if (!networkData || !Array.isArray(networkData.nodes) || !Array.isArray(networkData.edges)) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  console.log("hi from parser 2");

  // Process nodes
  networkData.nodes.forEach((node) => {
    nodes.push(createNode(node.properties , node.labels[0] , node.properties));
  });

  // Process edges
  networkData.edges.forEach((edge) => {
    edges.push(createEdge(edge.type , edge.startNode ,edge.endNode));
  });
 
  console.log("hi from parser3 ");
  return { nodes, edges };
};

// Utility function to parse nodes and edges from path data
export const parsePath = (path, selectedNodes) => {
  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
  const formattedNodes = path.nodes.map((node) => {
    const isSelected = selectedNodeIds.has(node.identity.toString());
    return createNode(node, node.type, node.properties, isSelected);
  });
  const formattedEdges = path.relationships.map((rel) => createEdge(rel, rel.source, rel.target));
  return { nodes: formattedNodes, edges: formattedEdges };
};

// Utility function to handle API responses for aggregation
export const parseAggregationResponse = (responseData) => {
  const { nodes: newNodes, relationships: newEdges } = responseData;
  const parsedNodes = newNodes.map((node) => createNode(node, node.type, node.properties,false,node.aggregated_properties));
  const parsedEdges = newEdges.map((rel) => createEdge(rel, rel.startId, rel.endId));
  return { nodes: parsedNodes, edges: parsedEdges };
};

// Advanced aggregation response parser with async property fetching
export const parseAggregationResponse_advanced = async (responseData) => {
  const { nodes: newNodes, relations: newEdges } = responseData;
  const parsedNodes = await Promise.all(
    newNodes.map(async (node) => {
      try {
        const properties = await fetchNodeProperties(node.identity);
        return createNode(node, node.type, properties);
      } catch (error) {
        console.error(`Error fetching properties for node ${node.identity}:`, error);
        return createNode(node, node.type, {});
      }
    })
  );
  const parsedEdges = newEdges.map((rel) => createEdge(rel, rel.source, rel.target));
  return { nodes: parsedNodes, edges: parsedEdges };
};

// SubGraph parser
export const SubGraphParser = (subGraphs) => {
  const nodes = [];
  const edges = [];

  if (!subGraphs || !Array.isArray(subGraphs)) {
    console.error('Invalid subGraphs data:', subGraphs);
    return { nodes, edges };
  }

  subGraphs.forEach((subGraph) => {
    const { nodes: parsedNodes, edges: parsedEdges } = parseSubGraph(subGraph);
    nodes.push(...parsedNodes);
    edges.push(...parsedEdges);
  });

  return { nodes, edges };
};

// Neighborhood parser
export const AddNeighborhoodParser = (neighborhoodData, contextNode) => {
  return parseNeighborhood(neighborhoodData, contextNode);
};
export const calculateNodeConfig = (node_size) => {
  // Validate input
  if (typeof node_size !== 'number' || node_size < 0) {
    throw new Error('node_size must be a positive number');
  }

  // Calculate all properties based on node_size
  const borderOffset = (node_size - 70) * (13 / 20) + 30;
  const iconOffset = (node_size - 70) * (13 / 20) + 33;

  return {
    borderTop: `${borderOffset}%`,
    borderLeft: `${borderOffset}%`,
    iconTop: `${iconOffset}%`,
    iconLeft: `${iconOffset}%`,
    Nodewidth: `${(node_size * 2) + 10}px`,
    Nodehight: `${(node_size * 2) + 10}px`,
    captionTop: `${node_size}%`,
    captionLeft: `${(node_size / 2) - 2}%`,
    defaultImageWidth: `${node_size}px`,
    defaultImageHeight: `${node_size}px`
  };
};

// Create HTML for nodes
export const createNodeHtml = (captionText, nodetype, isSelected = false, isinpath = false, groupCount = 1,id , AddIcon = false , Icon ="",node_size=90) => {
   //NODE_CONFIG.defaultNodeSize=node_size
 console.log(node_size)
  const nodeconfig=calculateNodeConfig(node_size)
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';
  container.style.width = groupCount > 1 ? NODE_CONFIG.groupNodeWidth : NODE_CONFIG.defaultNodeWidth;
  container.style.height = groupCount > 1 ? NODE_CONFIG.groupNodeHeight : NODE_CONFIG.defaultNodeHeight;
  container.style.textAlign = 'center';

  const centerWrapper = document.createElement('div');
  centerWrapper.style.position = 'absolute';
  centerWrapper.style.top = '50%';
  centerWrapper.style.left = '50%';
  centerWrapper.style.transform = 'translate(-50%, -50%)';
  centerWrapper.style.width = groupCount > 1 ? NODE_CONFIG.groupCenterWrapperWidth : NODE_CONFIG.centerWrapperWidth;
  centerWrapper.style.height = groupCount > 1 ? NODE_CONFIG.groupCenterWrapperHeight : NODE_CONFIG.centerWrapperHeight;

  const border = document.createElement('div');
  border.style.position = 'absolute';
  border.style.top = nodeconfig.borderTop;
  border.style.left = nodeconfig.borderLeft;
  border.style.transform = 'translate(-50%, -50%)';
  border.style.width = groupCount > 1 ? NODE_CONFIG.groupNodeWidth : nodeconfig.Nodewidth;
  border.style.height = groupCount > 1 ? NODE_CONFIG.groupNodeHeight : nodeconfig.Nodehight;
  border.style.borderRadius = '50%';
  border.style.transition = 'all 0.3s ease';

  if (isSelected ) {
  // border.style.boxShadow = '0 0 20px 8px rgba(104, 35, 157, 0.7)';
  // border.style.border = '8px solid rgba(71, 39, 134, 0.9)';
    border.style.backgroundColor = 'rgba(255, 255, 0, 0.05)';
  } else if (groupCount > 1) {
    border.style.border = '3px dashed rgba(0, 128, 255, 0.8)';
    border.style.backgroundColor = 'rgba(0, 128, 255, 0.1)';
  }

  if ( isinpath) {
    border.style.boxShadow = '0 0 20px 8px rgba(59, 173, 46, 0.7)';
    border.style.border = '8px solid rgba(111, 213, 48, 0.9)';
     border.style.backgroundColor = 'rgba(255, 255, 0, 0.05)';
   } 
  const iconElement = document.createElement('img');
  iconElement.src = getNodeIcon(nodetype);
  iconElement.style.position = 'absolute';
  iconElement.style.top = nodeconfig.iconTop;
  iconElement.style.left = nodeconfig.iconLeft;
  iconElement.style.transform = 'translate(-50%, -50%)';
  iconElement.style.width = groupCount > 1 ? NODE_CONFIG.groupImageWidth : nodeconfig.defaultImageWidth;
  iconElement.style.height = groupCount > 1 ? NODE_CONFIG.groupImageHeight : nodeconfig.defaultImageHeight;
  iconElement.style.zIndex = '2';
  iconElement.style.transition = 'all 0.3s ease';

  const captionElement = document.createElement('div');
  captionElement.innerText = captionText;
  captionElement.style.position = 'absolute';
  captionElement.style.width = '200px';
  captionElement.style.height = 'fit-content';
  captionElement.style.left = nodeconfig.captionLeft;
  captionElement.style.top = nodeconfig.captionTop;
  captionElement.style.transform = 'translateX(-50%)';
  captionElement.style.fontSize = groupCount > 1 ? '32px' : '28px';
  captionElement.style.fontWeight = 'bold';
  captionElement.style.color = 'rgba(23, 22, 22, 0.8)';
  captionElement.style.borderRadius = '6px';
  captionElement.style.textAlign = 'center';
  captionElement.style.transition = 'all 0.3s ease';

  if (isSelected) {
    captionElement.style.backgroundColor = 'rgba(69, 36, 157, 0.7)';
    captionElement.style.boxShadow = '0 2px 4px rgba(152, 115, 52, 0.1)';
    captionElement.style.color = 'rgba(255, 255, 255, 0.9)';
  } else if (groupCount > 1) {
    captionElement.style.color = 'rgba(0, 128, 255, 0.9)';
  }
  if (isinpath) {
    captionElement.style.backgroundColor = 'rgba(94, 208, 56, 0.7)';
    captionElement.style.boxShadow = '0 2px 4px rgba(84, 195, 53, 0.1)';
    captionElement.style.color = 'rgba(255, 255, 255, 0.9)';
  } else if (groupCount > 1) {
    captionElement.style.color = 'rgba(0, 128, 255, 0.9)';
  }

  if (AddIcon) {
   
    // Create crown icon element with animation
    const crownIcon = document.createElement("div");
    crownIcon.innerText = Icon; // Crown emoji
    crownIcon.style.position = "absolute";
    crownIcon.style.top = "-20%"; // Position above the node
    crownIcon.style.left = "80%";
    crownIcon.style.transform = "translateX(-50%)";
    crownIcon.style.fontSize = "32px"; // Adjust size as needed
    crownIcon.style.zIndex = "35";

    // Add CSS animation for the crown
    console.log("this is crown") ; // crownIcon.style.animation = "crownBounce 1.5s infinite";

    // Append the crown icon to the container
    container.appendChild(crownIcon);
  
  }

  centerWrapper.appendChild(border);
  centerWrapper.appendChild(iconElement);
  container.appendChild(centerWrapper);
  container.appendChild(captionElement);

  return container;
};

// Node color and icon utilities
export const getNodeColor = (nodeType) => NODE_CONFIG.nodeColors[nodeType] || NODE_CONFIG.nodeColors.default;

export const getNodeIcon = (nodeType) => {
  const basePath = '/icon/';
  const icons = {
    Daira: `${basePath}daira.png`,
    Commune: `${basePath}commune.png`,
    Wilaya: `${basePath}wilaya.png`,
    Unite: `${basePath}unite.png`,
    Affaire: `${basePath}affaire.png`,
    Virtuel: `${basePath}virtuel.png`,
    Phone: `${basePath}phone.png`,
    Personne: `${basePath}personne.png`,
    default: `${basePath}default.png`,
  };
  return icons[nodeType] || icons.default;
};

// Label manager
export const LabelManager = (node_type, properties) => {
  switch (node_type) {
    case 'Daira': return `${properties.nom_arabe}`;
    case 'Commune': return `${properties.nom_arabe}`;
    case 'Wilaya': return `${properties.nom_arabe}`;
    case 'Unite': return `${properties.nom_arabe}`;
    case 'Affaire': return `${properties.Number}`;
    case 'Virtuel': return `${properties.ID}`;
    case 'Phone': return `${properties.operateur}`;
    case 'Personne': return `${properties.اللقب} ${properties.الاسم}`;
    default: return `Unknown Type\nID: ${properties.identity}`;
  }
};

// Edge caption HTML (unchanged for now, but can be parameterized similarly if needed)
const createEdgeCaptionHtml = () => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = 'black';

  return container;
};