import ELK from 'elkjs/lib/elk.bundled.js';
import dagre from 'dagre';
import {  forceX, forceY } from 'd3-force';

import cytoscape from 'cytoscape';
import cise from 'cytoscape-cise';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
// Register the CISe layout with Cytoscape
cytoscape.use(cise);





export const computeForceDirectedLayout = (nodes, edges, width=800, height=800) => {
  // Transform edges to use `source` and `target` instead of `from` and `to`
  const transformedEdges = edges.map(edge => ({
    source: edge.from,
    target: edge.to,
  }));

  // Create a simulation with forces
  const simulation = forceSimulation(nodes)
    .force('link', forceLink(transformedEdges)
      .id(d => d.id)
      .distance(150) // Set ideal edge length (increase for longer edges)
    )
    .force('charge', forceManyBody()
      .strength(-2000) // Increase repulsion strength for better node separation
    )
    .force('center', forceCenter(width / 2, height / 2)) // Center the graph
    .force('collide', forceCollide()
      .radius(200) // Increase radius for more node separation
      .iterations(5) // Increase iterations for better collision resolution
    )
    .stop(); // Stop the simulation after a certain number of ticks

  // Run the simulation for a fixed number of ticks
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  // Extract node positions
  const nodesWithPositions = nodes.map(node => ({
    id: node.id,
    x: node.x,
    y: node.y,
  }));

  return nodesWithPositions;
};

export const computeCytoscapeLayout = (nodes, edges, numClusters = 3) => {
  // Assign random clusters to nodes
  const clusters = [];
  for (let i = 0; i < nodes.length; i++) {
    clusters.push(Math.floor(Math.random() * numClusters)); // Randomly assign clusters
  }

  // Create a new Cytoscape instance
  const cy = cytoscape({
    elements: {
      nodes: nodes.map((node, index) => ({
        data: { id: node.id, clusterID: clusters[index] }, // Add cluster information
      })),
      edges: edges.map((edge) => ({
        data: { id: `${edge.from}-${edge.to}`, source: edge.from, target: edge.to },
      })),
    },
  });

  // Prepare the cluster information as a 2D array
  const clusterInfo = [];
  for (let i = 0; i < numClusters; i++) {
    clusterInfo.push([]); // Initialize empty clusters
  }
  nodes.forEach((node, index) => {
    const clusterID = clusters[index];
    clusterInfo[clusterID].push(node.id); // Add node ID to its cluster
  });

  // Apply the CISe layout
  const layout = cy.layout({
    name: 'cise', // Use the CISe layout
    clusters: clusterInfo, // Pass the cluster information as a 2D array
    animate: false, // Disable animation for faster computation
    refresh: 1, // Number of iterations between layout updates
    fit: false, // Do not fit the graph to the viewport
    padding: 30, // Padding around the graph
    nodeSeparation: 300, // Minimum space between nodes
    idealInterClusterEdgeLengthCoefficient: 50, // Ideal edge length between clusters
    springCoeff: 0.45, // Spring coefficient for force-directed simulation
    nodeRepulsion: 2000, // Node repulsion strength
    gravity: 0.25, // Gravity force
    gravityRange: 3.8, // Range of gravity
    nestingFactor: 0.1, // Nesting factor for hierarchical structures
    animateFilter: () => false, // Disable animation
  });

  // Run the layout
  layout.run();

  // Extract node positions from the Cytoscape instance
  const nodesWithPositions = nodes.map((node, index) => {
    const cyNode = cy.getElementById(node.id);
    return {
      id: node.id,
      x: cyNode.position('x'),
      y: cyNode.position('y'),
      cluster: clusters[index], // Include cluster information in the output
    };
  });

  // Destroy the Cytoscape instance to free up memory
  cy.destroy();

  return nodesWithPositions;
};
export const computeElkLayout = async (nodes, edges) => {
  const elk = new ELK();

  const graph = {
    id: 'root',
    children: nodes.map((node) => ({
      id: node.id,
      width: 100, // Set node width
      height: 50, // Set node height
    })),
    edges: edges.map((edge) => ({
      id: `${edge.from}-${edge.to}`,
      sources: [edge.from],
      targets: [edge.to],
    })),
  };

  const layoutOptions = {
    'elk.algorithm': 'stress', // Use the layered layout algorithm
    'elk.direction': 'DOWN', // Layout direction: DOWN (top-to-bottom)
    'elk.spacing.nodeNode': 50, // Spacing between nodes
    'elk.layered.spacing.nodeNodeBetweenLayers': 100, // Spacing between layers
  };

  const layout = await elk.layout(graph, { layoutOptions });
  return layout.children.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
  }));
};
export const computeLinearLayout = (nodes, edges, spacing = 100) => {
  const nodesWithPositions = [];
  let x = 0;
  let y = 0;
  let direction = 'right'; // Start with left-to-right direction

  nodes.forEach((node, index) => {
    // Place the node at the current position
    nodesWithPositions.push({
      id: node.id,
      x: x,
      y: y,
    });

    // Move to the next position based on the current direction
    if (direction === 'right') {
      x += spacing; // Move right
    } else if (direction === 'left') {
      x -= spacing; // Move left
    }

    // Switch direction after a certain number of nodes (e.g., every 5 nodes)
    if ((index + 1) % 5 === 0) {
      direction = direction === 'right' ? 'left' : 'right'; // Toggle direction
      y += spacing; // Move down to the next row
      x = direction === 'right' ? x : x + spacing; // Adjust x for the new direction
    }
  });

  return nodesWithPositions;
};
//////////////////////

export const Operationnelle_Soutien_Leader = (nodes, edges) => {
  const graph = new dagre.graphlib.Graph();

  graph.setGraph({
    rankdir: 'BT', // Layout direction: bottom-to-top
    nodesep: 200, // Space between nodes
    edgesep: 200, // Space between edges
    ranksep: 2000, // Space between ranks (layers)
    acyclicer: 'greedy', // Ensure the graph is acyclic
  });

  graph.setDefaultEdgeLabel(() => ({}));
  graph.isDirected(false);

  // Add all nodes to the graph and assign ranks based on their type and _class
  nodes.forEach((node) => {
    graph.setNode(node.id, { width: 150, height: 1000 }); // Set node dimensions

    // Assign ranks based on node type and _class
    if (node.group === 'Affaire') {
      graph.node(node.id).rank = 0; // Affaire nodes are rank 0
    } else if (node.group === 'Personne' && node.__class && node._class.includes('neutre') && node._class.includes('operationeel')) {
      graph.node(node.id).rank = 1; // Person nodes with _class ['neutre', 'operationeel'] are rank 1
    } else if (node.group === 'Personne' && node._class && node._class.includes('neutre') && node._class.includes('soutien')) {
      graph.node(node.id).rank = 2; // Person nodes with _class ['neutre', 'soutien'] are rank 2
    } else if (node.group === 'Personne' &&  node._class && node._class.includes('neutre') && node._class.includes('soutien') && node._class.includes('leader')) {
      graph.node(node.id).rank = 3; // Person nodes with _class ["neutre","soutien","leader"] are rank 3
    }
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    graph.setEdge(edge.from, edge.to);
  });

  // Compute the layout
  dagre.layout(graph);

  // Find the highest y value in the graph
  let maxY = +Infinity;
  graph.nodes().forEach((nodeId) => {
    const node = graph.node(nodeId);
    if (node.y < maxY) {
      maxY = node.y;
    }
  });

  // Adjust the y position of leader nodes to match the highest y value
  nodes.forEach((node) => {
    if (node.group === 'Personne' &&node._class && node._class.includes('leader')) {
      const graphNode = graph.node(node.id);
      graphNode.y = maxY; // Set y to the highest y value
    }
  });

  // Extract node positions from the graph
  return nodes.map((node) => {
    const graphNode = graph.node(node.id);
    return {
      id: node.id,
      x: graphNode.x,
      y: graphNode.y,
    };
  });
};



//////

export const computeDagreLayout_1 = (nodes, edges) => {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: 'BT', // Layout direction: top-to-bottom
    nodesep: 80, // Reduced space between nodes
    edgesep: 200, // Reduced space between edges
    ranksep: 800, // Reduced space between ranks (layers) 
  });
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach((node) => {
    graph.setNode(node.id, { width: 150, height: 1000 }); // Set smaller node dimensions

    // If the node is of type 'Affaire', set its rank to 0
    if (node.group === 'Affaire') {
      graph.node(node.id).rank = 0;
    }
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    graph.setEdge(edge.from, edge.to);
  });

  // Compute the layout
  dagre.layout(graph);

  // Extract node positions from the graph
  return nodes.map((node) => {
    const graphNode = graph.node(node.id);
    return {
      id: node.id,
      x: graphNode.x,
      y: graphNode.y,
    };
  });
};

// Function to detect disconnected subgraphs (trees)
const detectTrees = (nodes, edges) => {
  const visited = new Set();
  const trees = [];

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const treeNodes = [];
      const stack = [node.id];
      visited.add(node.id);

      while (stack.length > 0) {
        const currentNodeId = stack.pop();
        treeNodes.push(currentNodeId);

        // Find connected nodes
        edges.forEach((edge) => {
          if (edge.from === currentNodeId && !visited.has(edge.to)) {
            visited.add(edge.to);
            stack.push(edge.to);
          }
          if (edge.to === currentNodeId && !visited.has(edge.from)) {
            visited.add(edge.from);
            stack.push(edge.from);
          }
        });
      }

      trees.push(treeNodes);
    }
  });

  return trees;
};

export const computeDagreLayout5 = (nodes, edges) => {
  // Detect separate trees
  const trees = detectTrees(nodes, edges);

  // Compute layout for each tree and position them vertically
  let yOffset = 0;
  const nodesWithPositions = [];

  trees.forEach((treeNodes) => {
    // Create a new directed graph for this tree
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({
      rankdir: 'BT', // Layout direction: TB (top-to-bottom)
      nodesep: 100, // Minimum space between nodes
      edgesep: 100, // Minimum space between edges
      ranksep: 350, // Minimum space between ranks (layers)
    });
    graph.setDefaultEdgeLabel(() => ({}));

    // Add nodes to the graph
    treeNodes.forEach((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      graph.setNode(nodeId, { width: 200, height: 600 }); // Set node dimensions
    });

    // Add edges to the graph
    edges.forEach((edge) => {
      if (treeNodes.includes(edge.from) && treeNodes.includes(edge.to)) {
        graph.setEdge(edge.from, edge.to);
      }
    });

    // Compute the layout for this tree
    dagre.layout(graph);

    // Extract node positions from the graph and adjust y positions
    treeNodes.forEach((nodeId) => {
      const graphNode = graph.node(nodeId);
      nodesWithPositions.push({
        id: nodeId,
        x: graphNode.x,
        y: graphNode.y + yOffset, // Adjust y position to place the tree below the previous one
      });
    });

    // Update yOffset for the next tree
    const treeHeight = Math.max(...treeNodes.map((nodeId) => graph.node(nodeId).y)) + 200; // Add padding between trees
    yOffset += treeHeight;
  });

  return nodesWithPositions;
};



export const computeElkLayout3 = async (nodes, edges) => {
  const elk = new ELK();

  const graph = {
    id: 'root',
    children: nodes.map((node) => ({
      id: node.id,
      width: 100, // Set node width
      height: 50, // Set node height
    })),
    edges: edges.map((edge) => ({
      id: `${edge.from}-${edge.to}`,
      sources: [edge.from],
      targets: [edge.to],
    })),
  };

  const layoutOptions = {
    'elk.algorithm': 'disco', // Use the stress layout algorithm
    'elk.spacing.nodeNode': 200, // Spacing between nodes
    'elk.stress.desiredEdgeLength': 300, // Desired edge length (increase this to space nodes further apart)
    'elk.stress.epsilon': 10e-10, // Stress epsilon (convergence threshold)
    'elk.stress.iterations': 500, // Maximum number of iterations for stress majorization
    'elk.disco.componentPacking': 'false', // Enable component packing using disco
  };

  const layout = await elk.layout(graph, { layoutOptions });
  return layout.children.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
  }));
};




export const computeElkLayout2 = async (nodes, edges, clusters) => {
  const elk = new ELK();

  const graph = {
    id: 'root',
    children: nodes.map((node) => ({
      id: node.id,
      width: 100, // Set node width
      height: 50, // Set node height
      cluster: node.cluster, // Assign each node to a cluster
    })),
    edges: edges.map((edge) => ({
      id: `${edge.from}-${edge.to}`,
      sources: [edge.from],
      targets: [edge.to],
    })),
  };

  const layoutOptions = {
    'elk.algorithm': 'radial', // Use the radial layout algorithm
    'elk.spacing.nodeNode': 50, // Spacing between nodes within a cluster
    'elk.radial.cluster': 'true', // Enable clustering (if supported)
    'elk.radial.spacing.radius': 100, // Spacing between clusters
    'elk.radial.spacing.angle': 45, // Angular spacing between nodes
    'elk.radial.avoidOverlap': 'true', // Avoid overlap within clusters
  };

  const layout = await elk.layout(graph, { layoutOptions });
  return layout.children.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    cluster: node.cluster, // Include cluster information in the output
  }));
};





export const computeCombinedLayout = (nodes, edges) => {
  // Step 1: Compute the initial Dagre layout
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: 'BT', // Layout direction: bottom-to-top
    nodesep: 100, // Minimum space between nodes
    edgesep: 100, // Minimum space between edges
    ranksep: 350, // Minimum space between ranks (layers)
  });
  graph.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach((node) => {
    graph.setNode(node.id, { width: 200, height: 400 }); // Set node dimensions
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    graph.setEdge(edge.from, edge.to);
  });

  // Compute the Dagre layout
  dagre.layout(graph);

  // Extract node positions from the graph
  const dagreNodes = nodes.map((node) => {
    const graphNode = graph.node(node.id);
    return {
      id: node.id,
      x: graphNode.x,
      y: graphNode.y,
    };
  });

  // Step 2: Identify clusters (e.g., nodes with a large number of connections)
  const clusterThreshold = 15; // Define a threshold for what constitutes a "large" node
  const clusters = [];
  nodes.forEach((node) => {
    const connections = edges.filter((edge) => edge.from === node.id || edge.to === node.id).length;
    if (connections >= clusterThreshold) {
      clusters.push(node.id);
    }
  });

  // Step 3: Apply a force-directed layout within clusters
  const simulation = forceSimulation(dagreNodes)
    .force('charge', forceManyBody().strength(-500)) // Repel nodes from each other
    .force('center', forceCenter()) // Center the simulation
    .force('collide', forceCollide().radius(-100)) // Prevent node overlap
    .stop();

  // Run the simulation for a fixed number of iterations
  for (let i = 0; i < 300; i++) simulation.tick();

  // Step 4: Adjust the position of the cluster's center node
  clusters.forEach((clusterId) => {
    const clusterNode = dagreNodes.find((node) => node.id === clusterId);
    if (clusterNode) {
      clusterNode.y = Math.min(...dagreNodes.map((node) => node.y)) - 200; // Move to the top
    }
  });

  return dagreNodes;
};