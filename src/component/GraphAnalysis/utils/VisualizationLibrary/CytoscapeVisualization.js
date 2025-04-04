import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';

// Register the extension
cytoscape.use(edgehandles);

const useCytoVisualization = ({
  nvlRef,
  combinedNodes,
  combinedEdges,
  selectedNodes,
  setSelectedNodes,
  setContextMenu,
  setnodetoshow,
  setrelationtoshow,
  selectedEdges,
  setselectedEdges,
  sethoverEdge,
}) => {
  const cyInstance = useRef(null);
  const ehInstance = useRef(null);
  const [newEdgeInput, setNewEdgeInput] = useState(null);

  useEffect(() => {
    if (!nvlRef.current) return;

    const cy = cytoscape({
      container: nvlRef.current,
      elements: [
        ...combinedNodes.map(node => ({
          data: { 
            id: node.id, 
            label: `${node.captionnode}\n${node.type || ''}`, // Combine caption and type
            group: node.group,
            size: node.size * 3 || 20,
            color: node.color || '#666',
            image: node.image || '', // Add image URL
            type: node.type || '' // Store type separately if needed
          },
          selected: selectedNodes.has(node.id),
        })),
        ...combinedEdges.map(edge => ({
          data: { 
            id: edge.id,
            source: edge.from,
            target: edge.to,
            color: edge.color || '#808080',
            label: edge.group || ''
          },
          selected: selectedEdges.has(edge.id)
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'background-image': 'data(image)', // Use node.image as icon
           // 'background-fit': 'contain', // Changed from 'cover' to 'contain' to fit image inside
           // 'background-clip': 'node', // Clip image to node shape
            'background-width': '60%', // Set image width relative to node size (adjust as needed)
            'background-height': '60%', // Set image height relative to node size (adjust as needed)
            'label': 'data(label)', // Display caption and type
            'width': 'data(size)',
            'height': 'data(size)',
            'text-valign': 'bottom', // Position text below node
            'text-halign': 'center',
            'color': '#fff',
            'text-outline-width': 8,
            'text-outline-color': 'data(color)',
            'border-width': 2,
            'border-color': 'rgba(255, 255, 255, 0.3)',
            'text-wrap': 'wrap', // Allow multiline text
            'text-max-width': 'data(size)', // Match text width to node size
            'padding': 50 // Add padding to separate icon from text
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
            'background-color': '#FF0000', // Red handle
            'width': 12,
            'height': 12,
            'border-width': 2,
            'border-color': '#FFFFFF',
            'z-index': 10 // Ensure handle is above node
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
      ],
      layout: {
        name: 'cose',
        animate: true,
        fit: true,
        padding: 30,
      }
    });

    cyInstance.current = cy;

    // Initialize edgehandles
    const eh = cy.edgehandles({
      canConnect: function(sourceNode, targetNode) {
        return !sourceNode.same(targetNode); // Disallow loops
      },
      edgeParams: function(sourceNode, targetNode) {
        return {
          data: {
            id: `temp-${Date.now()}`,
            source: sourceNode.id(),
            target: targetNode.id(),
            color: '#808080'
          }
        };
      },
      hoverDelay: 150,
      snap: true,
      snapThreshold: 70,
      snapFrequency: 15,
      noEdgeEventsInDraw: true,
      disableBrowserGestures: true,
      handleNodes: 'node', // Apply to all nodes
      handlePosition: 'middle middle', // Center of node
      handleSize: 12,
      handleColor: '#FF0000'
    });
    ehInstance.current = eh;

    // Event handlers
    cy.on('click', 'node', (evt) => {
      const node = evt.target;
      setSelectedNodes(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(node.id())) {
          newSelected.delete(node.id());
          node.unselect();
        } else {
          newSelected.add(node.id());
          node.select();
        }
        return newSelected;
      });
      setnodetoshow(node.id());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNodes(new Set());
        setselectedEdges(new Set());
        cy.nodes().unselect();
        cy.edges().unselect();
        setnodetoshow(null);
        setrelationtoshow(null);
        setNewEdgeInput(null);
        eh.stop();
      }
    });

    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
      const sourcePos = sourceNode.renderedPosition();
      const targetPos = targetNode.renderedPosition();
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;

      setNewEdgeInput({
        source: sourceNode.id(),
        target: targetNode.id(),
        position: { x: midX, y: midY },
        tempId: addedEdge.id()
      });
    });

    cy.on('ehstart', (event, sourceNode) => {
      console.log('Edge drawing started from:', sourceNode.id());
    });

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
      }
      if (ehInstance.current) {
        ehInstance.current.destroy();
      }
    };
  }, [nvlRef]);

  const handleEdgeNameSubmit = (e) => {
    if (e.key === 'Enter' && newEdgeInput) {
      const edgeName = e.target.value;
      if (edgeName) {
        const newEdge = {
          id: `e${Date.now()}`,
          source: newEdgeInput.source,
          target: newEdgeInput.target,
          color: '#808080',
          label: edgeName
        };
        setselectedEdges(prev => new Set(prev).add(newEdge.id));
        combinedEdges.push(newEdge);
        
        // Remove temporary edge and add permanent one
        cyInstance.current.edges(`[id = "${newEdgeInput.tempId}"]`).remove();
        cyInstance.current.add({
          group: 'edges',
          data: newEdge
        });
      }
      setNewEdgeInput(null);
    }
  };

  const getVisualizationComponent = () => {
    return (
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
  };

  return { getVisualizationComponent };
};

export default useCytoVisualization;