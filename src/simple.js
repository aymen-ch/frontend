import React, { useEffect, useState, useRef } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { forceSimulation, forceLink, forceManyBody, forceX, forceY, forceCollide } from 'd3-force';

const ForceDirectedGraph = () => {
  const [nodes, setNodes] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const nvlRef = useRef(null); // Ref to access the NVL instance

  // Define cluster centers
  const clusterCenters = {
    clusterA: { x: 200, y: 150 }, // Top-left region
    clusterB: { x: 600, y: 150 }, // Top-right region
    clusterC: { x: 400, y: 450 }, // Bottom-center region
  };

  // Generate random nodes and relationships
  useEffect(() => {
    // Define possible colors
    const colors = ['red', 'blue', 'green'];
    const clusters = ['clusterA', 'clusterB', 'clusterC'];

    // Generate 100 random nodes
    const generatedNodes = Array.from({ length: 100 }, (_, i) => {
      const cluster = clusters[Math.floor(Math.random() * clusters.length)]; // Random cluster
      return {
        id: i.toString(),
        caption: `Node ${i}`,
        r: Math.random() * 10 + 5, // Random radius between 5 and 15
        color: colors[clusters.indexOf(cluster)], // Assign color based on cluster
        cluster: cluster, // Assign cluster
      };
    });

    // Generate 50 random relationships
    const generatedRelationships = Array.from({ length: 50 }, () => {
      const from = Math.floor(Math.random() * 100).toString();
      const to = Math.floor(Math.random() * 100).toString();
      return {
        id: `${from}-${to}`,
        from: from, // Use `from` for NVL
        to: to, // Use `to` for NVL
        dist: Math.random() * 100 + 50, // Random distance between 50 and 150
      };
    });

    // Map relationships to use node objects for D3's forceLink
    const mappedRelationships = generatedRelationships.map((rel) => ({
      ...rel,
      source: generatedNodes.find((node) => node.id === rel.from), // Map `from` to `source` for D3
      target: generatedNodes.find((node) => node.id === rel.to), // Map `to` to `target` for D3
    }));

    // Run the force simulation
    const simulation = forceSimulation(generatedNodes)
      .force('link', forceLink(mappedRelationships).id((d) => d.id).distance((d) => d.dist).strength(1))
      .force('charge', forceManyBody().strength(-200))
      .force('x', forceX((d) => clusterCenters[d.cluster].x).strength(0.1)) // Pull nodes to cluster's x position
      .force('y', forceY((d) => clusterCenters[d.cluster].y).strength(0.1)) // Pull nodes to cluster's y position
      .force('collide', forceCollide().radius((d) => d.r + 5).strength(1)) // Prevent node overlap
      .on('tick', () => {
        // Update node positions using setNodePositions
        if (nvlRef.current) {
          const nodePositions = generatedNodes.map((node) => ({
            id: node.id,
            x: node.x,
            y: node.y,
          }));
          nvlRef.current.setNodePositions(nodePositions, false); // Update positions without re-running layout
        }
      });

    // Stop the simulation after a while to avoid continuous updates
    setTimeout(() => simulation.stop(), 1000);

    setNodes(generatedNodes);
    setRelationships(generatedRelationships); // Use the original relationships for NVL
  }, []);

  // Define mouse event callbacks for interactions
  const mouseEventCallbacks = {
    onHover: (element, hitTargets, evt) =>
      console.log('onHover', element, hitTargets, evt),
    onRelationshipRightClick: (rel, hitTargets, evt) =>
      console.log('onRelationshipRightClick', rel, hitTargets, evt),
    onNodeClick: (node, hitTargets, evt) =>
      console.log('onNodeClick', node, hitTargets, evt),
    onNodeRightClick: (node, hitTargets, evt) =>
      console.log('onNodeRightClick', node, hitTargets, evt),
    onNodeDoubleClick: (node, hitTargets, evt) =>
      console.log('onNodeDoubleClick', node, hitTargets, evt),
    onRelationshipClick: (rel, hitTargets, evt) =>
      console.log('onRelationshipClick', rel, hitTargets, evt),
    onRelationshipDoubleClick: (rel, hitTargets, evt) =>
      console.log('onRelationshipDoubleClick', rel, hitTargets, evt),
    onCanvasClick: (evt) => console.log('onCanvasClick', evt),
    onCanvasDoubleClick: (evt) => console.log('onCanvasDoubleClick', evt),
    onCanvasRightClick: (evt) => console.log('onCanvasRightClick', evt),
    onDrag: (nodes) => console.log('onDrag', nodes),
    onPan: (evt) => console.log('onPan', evt),
    onZoom: (zoomLevel) => console.log('onZoom', zoomLevel),
  };

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}>
      <InteractiveNvlWrapper
        ref={nvlRef} // Attach the ref to the NVL instance
        nodes={nodes} // Pass nodes without x and y
        rels={relationships} // Use the original relationships with `from` and `to`
        mouseEventCallbacks={mouseEventCallbacks} // Add interaction callbacks
        nvlOptions={{
          layout: 'none', // Disable internal layout engine
          physics: {
            enabled: false, // Disable physics to prevent nodes from moving
          },
        }}
      />
    </div>
  );
};

export default ForceDirectedGraph;