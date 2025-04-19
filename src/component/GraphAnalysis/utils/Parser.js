// NodeStyleConfig.js
import axios from 'axios';
import { BASE_URL } from './Urls';

// Initialize configuration object
let NODE_CONFIG = {
  nodeTypes: {},
  defaultNodeSize: 90,
};

// Load configuration from Django API
const loadConfig = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/node-config/');
    NODE_CONFIG = response.data;
    console.log(NODE_CONFIG)
  } catch (error) {
    console.error('Error loading nodeConfig:', error.message);
    throw error;
  }
};

// Update node config via Django API
export const updateNodeConfig = async (nodeType, { color, size, icon, labelKey } = {}) => {
  try {
    const config = {};
    if (color) config.color = color;
    if (size) config.size = size;
    if (icon) config.icon = icon;
    if (labelKey) config.labelKey = labelKey;

    await axios.post('http://127.0.0.1:8000/api/update-node-config/', {
      nodeType,
      config,
    });

    // Reload config to ensure frontend is in sync
    await loadConfig();
  } catch (error) {
    console.error('Error updating node config:', error.message);
    throw error;
  }
};

// Initialize config on module load
loadConfig();

// Fetch node properties from the server
export const fetchNodeProperties = async (nodeId) => {
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

// Parse graph data
export const parsergraph = (searchResult) => {
  console.log("searchResult2",searchResult)
  const nodes = searchResult.nodes.map((node) =>
    createNode(
      node.id,
      node.nodeType,
      node.properties,
      false, // isSelected
      null, // aggregatedproperties
      false // ischema
    )
  );

  const edges = searchResult.edges.map((edge) =>
    createEdge(
      { id: edge.id, type: edge.type, properties: edge.properties },
      edge.startNode,
      edge.endNode,
      NODE_CONFIG.edgeColor || 'red' // Use config or fallback
    )
  );
  return { nodes, edges };
};

// Utility function to create a node object
export const createNode = (
  id,
  nodeType,
  properties,
  isSelected = false,
  aggregatedproperties = null,
  ischema = false
) => {
  console.log("create")
  const nodeSize = NODE_CONFIG.nodeTypes[nodeType]?.size || NODE_CONFIG.defaultNodeSize;
  const node = {
    id: id.toString(),
    group: nodeType,
    shape: 'circularImage',
    size: nodeSize,
    color: getNodeColor(nodeType),
    html: createNodeHtml(
      LabelManager(nodeType, properties),
      nodeType,
      isSelected,
      false,
      id.toString(),
      nodeSize
    ),
    ischema:ischema,
    selecte: isSelected,
    captionnode: ischema ? LabelManagerSchema(nodeType, properties) : LabelManager(nodeType, properties),
    aggregatedproperties,
    properties,
    image: getNodeIcon(nodeType),
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
export const createEdge = (rel, startId, endId, color = null,aggregationPath=null) => ({
  id: rel.id ? rel.id.toString() : `${startId}-${endId}`,
  from: startId.toString(),
  to: endId.toString(),
  properties:rel.properties?rel.properties:'empty',
  color: color || NODE_CONFIG.edgeColor || 'red',
  width: NODE_CONFIG.edgeWidth || 7,
  captionSize: NODE_CONFIG.captionSize || 5,
  captionAlign: 'center',
  aggregationPath:aggregationPath,
  captions: [
    {
      value: rel.type,
      styles: ['bold', 'italic'],
      key: rel.type,
    },
  ],
  group: rel.type,
});

// Utility function to parse nodes and edges from a subGraph
const parseSubGraph = (subGraph) => {
  const nodes = [];
  const edges = [];

  const affaire = subGraph.affaire;
  if (affaire && affaire.id !== null && affaire.id !== undefined) {
    nodes.push(createNode(affaire.id, 'Affaire', affaire.properties));
  }

  if (subGraph.nodes && Array.isArray(subGraph.nodes)) {
    subGraph.nodes.forEach((node) => {
      if (node.properties && node.id !== null && node.id !== undefined) {
        nodes.push(createNode(node.id, node.node_type, node.properties));
      }
    });
  }

  if (subGraph.relations && Array.isArray(subGraph.relations)) {
    subGraph.relations.forEach((relation) => {
      if (
        relation.startId !== null &&
        relation.startId !== undefined &&
        relation.endId !== null &&
        relation.endId !== undefined
      ) {
        edges.push(createEdge({ id: relation.id, type: relation.type }, relation.startId, relation.endId));
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
  console.log('hi from parser1 ', networkData);
  if (!networkData || !Array.isArray(networkData.nodes) || !Array.isArray(networkData.edges)) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  console.log('hi from parser 2');

  networkData.nodes.forEach((node) => {
    nodes.push(createNode(node.properties, node.labels[0], node.properties));
  });

  networkData.edges.forEach((edge) => {
    edges.push(createEdge(edge.type, edge.startNode, edge.endNode));
  });

  console.log('hi from parser3 ');
  return { nodes, edges };
};

export const parsePath = (path, selectedNodes) => {
  console.log(path);
  const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
  const formattedNodes = path.nodes.map((node) => {
    const isSelected = selectedNodeIds.has(node.id.toString());
    return createNode(node.id, node.type, node.properties, isSelected);
  });
  const formattedEdges = path.relationships.map((rel) =>
    createEdge({ id: rel.id, type: rel.type }, rel.source, rel.target)
  );
  return { nodes: formattedNodes, edges: formattedEdges };
};

export const parseAggregationResponse = (responseData) => {
  const { nodes: newNodes, relationships: newEdges } = responseData;
  const parsedNodes = newNodes.map((node) =>
    createNode(node.id, node.type, node.properties, false, node.aggregated_properties)
  );
  const parsedEdges = newEdges.map((rel) => createEdge(rel, rel.startId, rel.endId));
  return { nodes: parsedNodes, edges: parsedEdges };
};

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

export const SubGraphParser = (subGraphs) => {
  const nodes = [];
  const edges = [];

  if (!subGraphs || !Array.isArray(subGraphs)) {
    console.error('Invalid subGraphs data:', subGraphs);
    return { nodes, edges };
  }
  console.log(subGraphs);
  subGraphs.forEach((subGraph) => {
    const { nodes: parsedNodes, edges: parsedEdges } = parseSubGraph(subGraph);
    nodes.push(...parsedNodes);
    edges.push(...parsedEdges);
  });

  return { nodes, edges };
};

export const AddNeighborhoodParser = (neighborhoodData, contextNode) => {
  return parseNeighborhood(neighborhoodData, contextNode);
};

export const calculateNodeConfig = (node_size) => {
  if (typeof node_size !== 'number' || node_size < 0) {
    throw new Error('node_size must be a positive number');
  }

  const borderOffset = (node_size - 70) * (13 / 20) + 30;
  const iconOffset = (node_size - 70) * (13 / 20) + 33;
  // Scale defaultNodeWidth and defaultNodeHeight based on node_size
  const baseSize = node_size === 90 ? 200 : node_size === 120 ? 250 : (node_size / 90) * 200;

  return {
    borderTop: `${borderOffset}%`,
    borderLeft: `${borderOffset}%`,
    iconTop: `${iconOffset}%`,
    iconLeft: `${iconOffset}%`,
    Nodewidth: `${baseSize}px`,
    Nodehight: `${baseSize}px`,
    captionTop: `${node_size}%`,
    captionLeft: `${node_size / 2 - 2}%`,
    defaultImageWidth: `${node_size}px`,
    defaultImageHeight: `${node_size}px`,
  };
};

// Create HTML for nodes
export const createNodeHtml = (
  captionText,
  nodetype,
  isSelected = false,
  isinpath = false,
  groupCount = 1,
  id,
  AddIcon = false,
  Icon = "",
  node_size = 90
) => {
  console.log(node_size);
  const nodeconfig = calculateNodeConfig(node_size);
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.display = "inline-block";
  container.style.width =
    groupCount > 1 ? NODE_CONFIG.groupNodeWidth : NODE_CONFIG.defaultNodeWidth;
  container.style.height =
    groupCount > 1 ? NODE_CONFIG.groupNodeHeight : NODE_CONFIG.defaultNodeHeight;
  container.style.textAlign = "center";

  const centerWrapper = document.createElement("div");
  centerWrapper.style.position = "absolute";
  centerWrapper.style.top = "50%";
  centerWrapper.style.left = "50%";
  centerWrapper.style.transform = "translate(-50%, -50%)";
  centerWrapper.style.width =
    groupCount > 1
      ? NODE_CONFIG.groupCenterWrapperWidth
      : NODE_CONFIG.centerWrapperWidth;
  centerWrapper.style.height =
    groupCount > 1
      ? NODE_CONFIG.groupCenterWrapperHeight
      : NODE_CONFIG.centerWrapperHeight;

  const border = document.createElement("div");
  border.style.position = "absolute";
  border.style.top = nodeconfig.borderTop;
  border.style.left = nodeconfig.borderLeft;
  border.style.transform = "translate(-50%, -50%)";
  border.style.width =
    groupCount > 1 ? NODE_CONFIG.groupNodeWidth : nodeconfig.Nodewidth;
  border.style.height =
    groupCount > 1 ? NODE_CONFIG.groupNodeHeight : nodeconfig.Nodehight;
  border.style.borderRadius = "50%";
  border.style.transition = "all 0.3s ease";

  if (isSelected) {
    border.style.backgroundColor = "rgba(255, 255, 0, 0.05)";
  } else if (groupCount > 1) {
    border.style.border = "3px dashed rgba(0, 128, 255, 0.8)";
    border.style.backgroundColor = "rgba(0, 128, 255, 0.1)";
  }

  if (isinpath) {
    border.style.boxShadow = "0 0 20px 8px rgba(59, 173, 46, 0.7)";
    border.style.border = "8px solid rgba(111, 213, 48, 0.9)";
    border.style.backgroundColor = "rgba(255, 255, 0, 0.05)";
  }

  const iconElement = document.createElement("img");
  iconElement.src = getNodeIcon(nodetype);
  iconElement.style.position = "absolute";
  iconElement.style.top = nodeconfig.iconTop;
  iconElement.style.left = nodeconfig.iconLeft;
  iconElement.style.transform = "translate(-50%, -50%)";
  iconElement.style.width =
    groupCount > 1
      ? NODE_CONFIG.groupImageWidth
      : nodeconfig.defaultImageWidth;
  iconElement.style.height =
    groupCount > 1
      ? NODE_CONFIG.groupImageHeight
      : nodeconfig.defaultImageHeight;
  iconElement.style.zIndex = "2";
  iconElement.style.transition = "all 0.3s ease";

  const captionElement = document.createElement("div");
  captionElement.innerText = captionText; // Preserve newlines
  captionElement.style.position = "absolute";
  captionElement.style.width = "300px"; // Wide enough for typical labels
  captionElement.style.height = "auto"; // Allow height to adjust to content
  captionElement.style.lineHeight = "1.4"; // Space between lines
  captionElement.style.left = nodeconfig.captionLeft;
  captionElement.style.top = nodeconfig.captionTop;
  captionElement.style.transform = "translateX(-50%)";
  captionElement.style.fontSize = groupCount > 1 ? "24px" : "20px"; // Smaller for clarity
  captionElement.style.fontWeight = "bold";
  captionElement.style.color = "rgba(23, 22, 22, 0.8)";
  captionElement.style.borderRadius = "6px";
  captionElement.style.textAlign = "center";
  captionElement.style.transition = "all 0.3s ease";
  captionElement.style.padding = "4px 8px"; // Add padding for better appearance

  if (isSelected) {
    captionElement.style.backgroundColor = "rgba(69, 36, 157, 0.7)";
    captionElement.style.boxShadow = "0 2px 4px rgba(152, 115, 52, 0.1)";
    captionElement.style.color = "rgba(255, 255, 255, 0.9)";
  } else if (groupCount > 1) {
    captionElement.style.color = "rgba(0, 128, 255, 0.9)";
  }
  if (isinpath) {
    captionElement.style.backgroundColor = "rgba(94, 208, 56, 0.7)";
    captionElement.style.boxShadow = "0 2px 4px rgba(84, 195, 53, 0.1)";
    captionElement.style.color = "rgba(255, 255, 255, 0.9)";
  } else if (groupCount > 1) {
    captionElement.style.color = "rgba(0, 128, 255, 0.9)";
  }

  if (AddIcon) {
    const crownIcon = document.createElement("div");
    crownIcon.innerText = Icon;
    crownIcon.style.position = "absolute";
    crownIcon.style.top = "-30px";
    crownIcon.style.left = "80%";
    crownIcon.style.transform = "translateX(-50%)";
    crownIcon.style.fontSize = "32px";
    crownIcon.style.zIndex = "35";
    console.log("this is crown");
    container.appendChild(crownIcon);
  }

  centerWrapper.appendChild(border);
  centerWrapper.appendChild(iconElement);
  container.appendChild(centerWrapper);
  container.appendChild(captionElement);

  return container;
};

// Node color and icon utilities
export const getNodeColor = (nodeType) =>
  NODE_CONFIG.nodeTypes[nodeType]?.color || NODE_CONFIG.nodeTypes.default.color;

export const getNodeIcon = (nodeType) =>
  NODE_CONFIG.nodeTypes[nodeType]?.icon || NODE_CONFIG.nodeTypes.default.icon;

// Label manager
export const LabelManager = (node_type, properties) => {
  console.log("LabelManager input:", { node_type, properties });
  const labelKey = NODE_CONFIG.nodeTypes[node_type]?.labelKey || NODE_CONFIG.nodeTypes.default.labelKey;
  if (!labelKey) {
    const fallback = `Unknown Type\nID: ${properties.identity || 'N/A'}`;
    console.log("LabelManager output:", fallback);
    return fallback;
  }

  if (labelKey.includes(',')) {
    const keys = labelKey.split(',');
    const result = keys
      .map((key) => {
        if (properties[key] !== undefined && properties[key] !== null) {
          return `${key}: ${properties[key]}`;
        }
        return '';
      })
      .filter((item) => item !== '')
      .join('\n'); // Use newline to separate pairs
    console.log("LabelManager output:", result);
    return result;
  }

  const result =
    properties[labelKey] !== undefined && properties[labelKey] !== null
      ? `${labelKey}: ${properties[labelKey]}`
      : `Unknown ${node_type}`;
  console.log("LabelManager output:", result);
  return result;
};

export const LabelManagerSchema = (node_type, properties) => node_type;

// Edge caption HTML
const createEdgeCaptionHtml = () => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = 'black';
  return container;
};

// Export NODE_CONFIG for direct access
export { NODE_CONFIG };