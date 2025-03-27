// CytoscapeVisualization.js
import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const useCytoscapeVisualization = ({
  cyRef,
  combinedNodes,
  combinedEdges,
  selectedNodes,
  setSelectedNodes,
  setContextMenu,
  setnodetoshow,
  setrelationtoshow,
  shiftPressed,
  selectedEdges,
  setselectedEdges,
  sethoverEdge,
  ispath,
}) => {
  const containerRef = useRef(null);
  const previouslyHoveredNodeRef = useRef(null);
  const selectedNodeRef = useRef(null);
  const selectedRelationRef = useRef(null);
  const cyInstanceRef = useRef(null);
  const isMountedRef = useRef(false);
  const updateTimeoutRef = useRef(null);
  const nodePositionsRef = useRef({}); // Store node positions

  // Initialize Cytoscape once on mount
  useEffect(() => {
    if (!containerRef.current || cyInstanceRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 12,
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'font-size': 12,
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.7,
            'curve-style': 'bezier',
          },
        },
        {
          selector: '.selected',
          style: {
            'border-width': 3,
            'border-color': 'lightblue',
            'line-color': '#B771E5',
            width: 15,
          },
        },
      ],
      layout: {
        name: 'preset', // Use preset to respect saved positions
        fit: true,
      },
      zoomingEnabled: true,
      panningEnabled: true,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyInstanceRef.current = cy;
    if (cyRef) cyRef.current = cy;
    isMountedRef.current = true;

    // Attach event listeners once
    attachEventListeners(cy);

    // Initial layout if no positions are provided
    cy.ready(() => {
      if (Object.keys(nodePositionsRef.current).length === 0) {
        cy.layout({ name: 'cose', animate: false }).run();
        // Save initial positions
        cy.nodes().forEach((node) => {
          const pos = node.position();
          nodePositionsRef.current[node.id()] = { x: pos.x, y: pos.y };
        });
      }
    });

    return () => {
      isMountedRef.current = false;
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (cyInstanceRef.current) {
        cyInstanceRef.current.destroy();
        cyInstanceRef.current = null;
      }
    };
  }, []);

  // Debounced update function for elements and settings
  const updateGraph = () => {
    const cy = cyInstanceRef.current;
    if (!cy || !isMountedRef.current) return;

    cy.batch(() => {
      cy.elements().remove();
      cy.add([
        ...combinedNodes.map((node) => {
          const savedPos = nodePositionsRef.current[node.id];
          return {
            group: 'nodes',
            data: {
              id: node.id,
              label: node.captionnode,
              group: node.group,
              html: node.html,
              selected: selectedNodes.has(node.id),
            },
            selected:true,
            style: {
              shape: node.shape || 'ellipse',
              width: node.size || 50,
              height: node.size || 50,
              'background-color': node.color || '#666',
              'border-width': node.selecte ? 3 : 1,
              'border-color': node.selecte ? 'lightblue' : 'orange',
            },
            position: savedPos || node.position || undefined, // Use saved or provided position
          };
        }),
        ...combinedEdges.map((edge) => ({
          group: 'edges',
          data: {
            id: edge.id,
            source: edge.from,
            target: edge.to,
            label: edge.captions[0]?.value || '',
            group: edge.group,
            selected: selectedEdges.has(edge.id),
          },
          classes: edge.selected ? 'selected' : '',
          style: {
            width: edge.width || 1,
            'line-color': edge.color || '#808080',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': edge.color || '#808080',
          },
        })),
      ]);

      // Apply preset layout to respect current positions
      cy.layout({ name: 'preset', animate: false }).run();
    });

    cy.boxSelectionEnabled(shiftPressed);
  };

  // Debounce updates
  useEffect(() => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(updateGraph, 100);

    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, [
    combinedNodes,
    combinedEdges,
    selectedNodes,
    selectedEdges,
    shiftPressed,
  ]);

  // Event listeners as a separate function
  const attachEventListeners = (cy) => {
    cy.on('tap', 'node', (event) => {
      if (!isMountedRef.current) return;
      const node = event.target;
      const nodeId = node.id();
      if (!shiftPressed) {
        setSelectedNodes((prev) => {
          const newSelected = new Set(prev);
          newSelected.clear();
          newSelected.add(nodeId);
          return newSelected;
        });
        selectedNodeRef.current = nodeId;
        setnodetoshow(nodeId);
      } else {
        setSelectedNodes((prev) => {
          const newSelected = new Set(prev);
          newSelected.has(nodeId) ? newSelected.delete(nodeId) : newSelected.add(nodeId);
          return newSelected;
        });
      }
    });

    cy.on('tap', 'edge', (event) => {
      if (!isMountedRef.current) return;
      const edge = event.target;
      const edgeId = edge.id();
      setselectedEdges((prev) => {
        const newSelected = new Set(prev);
        newSelected.add(edgeId);
        return newSelected;
      });
      selectedRelationRef.current = edgeId;
      setrelationtoshow(edgeId);
    });

    cy.on('tap', (event) => {
      if (!isMountedRef.current) return;
      if (event.target === cy) {
        setSelectedNodes(new Set());
        setselectedEdges(new Set());
        selectedNodeRef.current = null;
        selectedRelationRef.current = null;
        setnodetoshow(null);
        setrelationtoshow(null);
      }
    });

    cy.on('cxttap', 'node', (event) => {
      if (!isMountedRef.current) return;
      const node = event.target;
      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.renderedPosition.x + containerRef.current.offsetLeft,
        y: event.renderedPosition.y + containerRef.current.offsetTop,
        node: combinedNodes.find((n) => n.id === node.id()),
      });
    });

    cy.on('mouseover', 'node', (event) => {
      if (!isMountedRef.current) return;
      const node = event.target;
      const nodeId = node.id();
      setnodetoshow(nodeId);
      setrelationtoshow(null);
      sethoverEdge(null);
      node.style({
        'border-width': 5,
        'border-color': 'rgba(84, 207, 67, 0.8)',
      });
      previouslyHoveredNodeRef.current = node;
    });

    cy.on('mouseout', 'node', (event) => {
      if (!isMountedRef.current) return;
      const node = event.target;
      if (previouslyHoveredNodeRef.current === node) {
        node.style({
          'border-width': selectedNodes.has(node.id()) ? 3 : 1,
          'border-color': selectedNodes.has(node.id()) ? 'lightblue' : 'orange',
        });
        previouslyHoveredNodeRef.current = null;
      }
      setnodetoshow(selectedNodeRef.current);
    });

    cy.on('mouseover', 'edge', (event) => {
      if (!isMountedRef.current) return;
      const edge = event.target;
      const edgeId = edge.id();
      setnodetoshow(null);
      setrelationtoshow(edgeId);
      sethoverEdge(edgeId);
      edge.style({
        width: 15,
        'line-color': '#B771E5',
      });
    });

    cy.on('mouseout', 'edge', (event) => {
      if (!isMountedRef.current) return;
      const edge = event.target;
      if (!selectedEdges.has(edge.id())) {
        edge.style({
          width: edge.data('width') || 1,
          'line-color': edge.data('color') || '#808080',
        });
      }
      sethoverEdge(null);
      setrelationtoshow(selectedRelationRef.current);
    });

    cy.on('boxselect', 'node', (event) => {
      if (!isMountedRef.current) return;
      const node = event.target;
      const nodeId = node.id();
      setSelectedNodes((prev) => {
        const newSelected = new Set(prev);
        newSelected.add(nodeId);
        return newSelected;
      });
    });

    cy.on('boxselect', 'edge', (event) => {
      if (!isMountedRef.current) return;
      const edge = event.target;
      const edgeId = edge.id();
      setselectedEdges((prev) => {
        const newSelected = new Set(prev);
        newSelected.add(edgeId);
        return newSelected;
      });
    });

    // Save position after dragging
    cy.on('dragfree', 'node', (event) => {
      if (!isMountedRef.current) return;
      const node = event.target;
      const pos = node.position();
      nodePositionsRef.current[node.id()] = { x: pos.x, y: pos.y };
    });
  };

  return { containerRef };
};

export default useCytoscapeVisualization;