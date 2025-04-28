import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';

cytoscape.use(edgehandles);

const useCytoVisualization = ({
  nvlRef,
  nodes,
  edges,
  selectedNodes,
  setSelectedNodes,
  setContextMenu,
  setContextMenuRel,
  setnodetoshow,
  setrelationtoshow,
  shiftPressed,
  selectedEdges,
  setselectedEdges,
  sethoverEdge,
  ispath,
  layoutType
}) => {
  const ehInstance = useRef(null);
  const cyInstance = useRef(null);
  const [newEdgeInput, setNewEdgeInput] = useState(null);
  const prevElements = useRef({ nodes: [], edges: [] });

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!nvlRef.current) {
      console.log("❌ nvlRef.current is not available");
      return;
    }

    // Destroy previous instances if they exist
    if (cyInstance.current) {
      cyInstance.current.destroy();
    }
    if (ehInstance.current) {
      ehInstance.current.destroy();
    }

    console.log("✅ Initializing new Cytoscape instance");

    const cy = cytoscape({
      container: nvlRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'background-image': 'data(image)',
            'background-width': '60%',
            'background-height': '60%',
            'label': 'data(label)',
            'width': 'data(size)',
            'height': 'data(size)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'color': '#fff',
            'text-outline-width': 8,
            'text-outline-color': 'data(color)',
            'border-width': 2,
            'border-color': 'rgba(255, 255, 255, 0.3)',
            'text-wrap': 'wrap',
            'text-max-width': 'data(size)',
            'padding': 50
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 10,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'text-outline-width': 2,
            'text-outline-color': '#000',
            'color': '#fff'
          }
        },
        {
          selector: ':selected',
          style: {
            'border-width': 20,
            'border-color': '#00FF00'
          }
        },
        {
          selector: '.eh-handle',
          style: {
            'background-color': '#FF0000',
            'width': 12,
            'height': 12,
            'border-width': 2,
            'border-color': '#FFFFFF',
            'z-index': 10
          }
        },
        {
          selector: 'edge.eh-ghost-edge',
          style: {
            'width': 5,
            'line-color': '#808080',
            'target-arrow-shape': 'none',
            'opacity': 0.5
          }
        },
        {
          selector: 'edge.eh-preview',
          style: {
            'width': 5,
            'line-color': '#808080',
            'target-arrow-shape': 'none',
            'opacity': 0.5
          }
        }
      ]
    });

    cyInstance.current = cy;
    nvlRef.current = cy;

    // Initialize edgehandles
    const eh = cy.edgehandles({
      canConnect: (sourceNode, targetNode) => !sourceNode.same(targetNode),
      edgeParams: (sourceNode, targetNode) => ({
        data: {
          id: `temp-${Date.now()}`,
          source: sourceNode.id(),
          target: targetNode.id(),
          color: '#808080'
        }
      }),
      hoverDelay: 150,
      snap: true,
      snapThreshold: 70,
      snapFrequency: 15,
      noEdgeEventsInDraw: true,
      disableBrowserGestures: true,
      handleNodes: 'node',
      handlePosition: 'middle middle',
      handleSize: 12,
      handleColor: '#FF0000'
    });
    ehInstance.current = eh;

    // Event handlers
    const nodeClickHandler = (evt) => {
      const node = evt.target;
      setSelectedNodes(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(node.id())) {
          newSelected.delete(node.id());
        } else {
          newSelected.add(node.id());
        }
        return newSelected;
      });
      setnodetoshow(node.id());
    };

    const nodeContextHandler = (evt) => {
      const node = evt.target;
      const { x, y } = evt.renderedPosition;
      setContextMenu({
        visible: true,
        x,
        y,
        node: {
          id: node.id(),
          label: node.data('label'),
          group: node.data('group'),
          size: node.data('size'),
          color: node.data('color'),
          image: node.data('image'),
          type: node.data('type')
        }
      });
    };

    const graphClickHandler = (evt) => {
      if (evt.target === cy) {
        setSelectedNodes(new Set());
        setselectedEdges(new Set());
        setnodetoshow(null);
        setrelationtoshow(null);
        setNewEdgeInput(null);
        setContextMenu({ visible: false });
        eh.stop();
      }
    };

    const edgeCompleteHandler = (event, sourceNode, targetNode, addedEdge) => {
      const sourcePos = sourceNode.renderedPosition();
      const targetPos = targetNode.renderedPosition();
      setNewEdgeInput({
        source: sourceNode.id(),
        target: targetNode.id(),
        position: {
          x: (sourcePos.x + targetPos.x) / 2,
          y: (sourcePos.y + targetPos.y) / 2
        },
        tempId: addedEdge.id()
      });
    };

    cy.on('click', 'node', nodeClickHandler);
    cy.on('cxttap', 'node', nodeContextHandler);
    cy.on('tap', graphClickHandler);
    cy.on('ehcomplete', edgeCompleteHandler);

    return () => {
      if (cyInstance.current) {
        cyInstance.current.off('click', 'node', nodeClickHandler);
        cyInstance.current.off('cxttap', 'node', nodeContextHandler);
        cyInstance.current.off('tap', graphClickHandler);
        cyInstance.current.off('ehcomplete', edgeCompleteHandler);
        cyInstance.current.destroy();
      }
      if (ehInstance.current) {
        ehInstance.current.destroy();
      }
    };
  }, [nvlRef]);

  // Update graph elements
  useEffect(() => {
    if (!cyInstance.current) return;

    const cy = cyInstance.current;
    const currentElements = { nodes, edges };

    // Check if elements have actually changed
    const elementsChanged = 
      JSON.stringify(currentElements.nodes) !== JSON.stringify(prevElements.current.nodes) ||
      JSON.stringify(currentElements.edges) !== JSON.stringify(prevElements.current.edges);

    if (!elementsChanged) return;

    console.log('🔄 Updating graph elements');

    // Store current positions and states
    const nodePositions = {};
    const nodeStates = {};
    cy.nodes().forEach(node => {
      nodePositions[node.id()] = node.position();
      nodeStates[node.id()] = {
        selected: node.selected(),
        style: node.style()
      };
    });

    // Batch updates
    cy.batch(() => {
      // Remove elements that no longer exist
      const currentIds = {
        nodes: new Set(nodes.map(n => n.id)),
        edges: new Set(edges.map(e => e.id))
      };

      cy.elements().forEach(el => {
        const isNode = el.isNode();
        if ((isNode && !currentIds.nodes.has(el.id())) || 
            (!isNode && !currentIds.edges.has(el.id()))) {
          el.remove();
        }
      });

      // Add or update nodes
      nodes.forEach(node => {
        const existing = cy.getElementById(node.id);
        const nodeData = {
          id: node.id,
          label: `${node.captionnode}\n${node.type || ''}`,
          group: node.group,
          size: node.size * 3 || 20,
          color: node.color || '#666',
          image: node.image || '',
          type: node.type || ''
        };

        if (existing.length === 0) {
          // New node
          cy.add({
            group: 'nodes',
            data: nodeData,
            position: nodePositions[node.id] || undefined,
            selected: selectedNodes.has(node.id)
          });
        } else {
          // Update existing node
          existing.data(nodeData);
          if (selectedNodes.has(node.id)) {
            existing.select();
          } else {
            existing.unselect();
          }
        }
      });

      // Add or update edges
      edges.forEach(edge => {
        const existing = cy.getElementById(edge.id);
        const edgeData = {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          color: edge.color || '#808080',
          label: edge.group || ''
        };

        if (existing.length === 0) {
          // New edge
          cy.add({
            group: 'edges',
            data: edgeData,
            selected: selectedEdges.has(edge.id)
          });
        } else {
          // Update existing edge
          existing.data(edgeData);
          if (selectedEdges.has(edge.id)) {
            existing.select();
          } else {
            existing.unselect();
          }
        }
      });
    });

    // Run layout only if nodes were added or removed
    const nodeCountChanged = nodes.length !== prevElements.current.nodes.length;
    if (nodeCountChanged) {
      console.log('🚀 Running layout due to node count change');
      cy.layout({
        name: 'cose',
        animate: true,
        fit: true,
        padding: 30,
        nodeDimensionsIncludeLabels: true
      }).run();
    }

    prevElements.current = currentElements;
  }, [nodes, edges, selectedNodes, selectedEdges]);

  const handleEdgeNameSubmit = (e) => {
    if (e.key === 'Enter' && newEdgeInput) {
      const edgeName = e.target.value.trim();
      if (edgeName) {
        // This should be handled by the parent component
        // via the edges prop update
        setNewEdgeInput(null);
        
        // Remove the temporary edge
        cyInstance.current.getElementById(newEdgeInput.tempId).remove();
      }
    }
  };

  const getVisualizationComponent = () => (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={nvlRef}
        style={{ width: '100%', height: '100%', border: '1px solid lightgray' }}
      />
      {newEdgeInput && (
        <input
          type="text"
          style={{
            position: 'absolute',
            left: `${newEdgeInput.position.x}px`,
            top: `${newEdgeInput.position.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            padding: '4px',
            fontSize: '14px'
          }}
          placeholder="Enter edge name"
          onKeyDown={handleEdgeNameSubmit}
          onBlur={() => setNewEdgeInput(null)}
          autoFocus
        />
      )}
    </div>
  );

  return { getVisualizationComponent };
};

export default useCytoVisualization;