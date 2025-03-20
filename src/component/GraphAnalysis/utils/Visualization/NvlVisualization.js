// NvlVisualization.js
import { useEffect, useRef } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import {
  PanInteraction,
  ZoomInteraction,
  DragNodeInteraction,
  BoxSelectInteraction,
  ClickInteraction,
  HoverInteraction,
} from '@neo4j-nvl/interaction-handlers';
import { createNodeHtml } from '../Parser';
import { IconPersonWithClass } from '../function_container';

const useNvlVisualization = ({
  nvlRef,
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
  const previouslyHoveredNodeRef = useRef(null);
  const selectedNodeRef = useRef(null);
  const selectedRelationRef = useRef(null);
  const minimapContainerRef = useRef(null);

  useEffect(() => {
    if (!nvlRef.current) return;

    // Initialize interaction handlers
    const panInteraction = new PanInteraction(nvlRef.current);
    const boxSelectInteraction = new BoxSelectInteraction(nvlRef.current);
    const clickInteraction = new ClickInteraction(nvlRef.current);
    const zoomInteraction = new ZoomInteraction(nvlRef.current);
    const dragNodeInteraction = new DragNodeInteraction(nvlRef.current);
    const hoverInteraction = new HoverInteraction(nvlRef.current);

    dragNodeInteraction.mouseDownNode = null;

    // Configure interactions based on shift key
    if (shiftPressed) {
      boxSelectInteraction.updateCallback('onBoxSelect', ({ nodes, rels }) => {
        setSelectedNodes((prevSelected) => {
          const newSelected = new Set(prevSelected);
          nodes.forEach((node) => {
            newSelected.has(node.id) ? newSelected.delete(node.id) : newSelected.add(node.id);
          });
          return newSelected;
        });

        setselectedEdges((prevSelected) => {
          const newSelected = new Set(prevSelected);
          rels.forEach((rel) => {
            newSelected.has(rel.id) ? newSelected.delete(rel.id) : newSelected.add(rel.id);
          });
          return newSelected;
        });
      });
      panInteraction.destroy();
    } else {
      panInteraction.updateCallback('onPan', () => console.log('onPan'));
      boxSelectInteraction.destroy();
    }

    // Right-click on node
    clickInteraction.updateCallback('onNodeRightClick', (node, hitElements, event) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.clientX - 230,
        y: event.clientY - 200,
        node,
      });
    });

    // Node click
    clickInteraction.updateCallback('onNodeClick', (node, hitElements, event) => {
      if (node && node.id) {
        setSelectedNodes((prevSelected) => {
          const newSelected = new Set(prevSelected);
          newSelected.add(node.id);
          return newSelected;
        });
        selectedNodeRef.current = node.id;
        setnodetoshow(node.id);
      }
    });

    // Relationship click
    clickInteraction.updateCallback('onRelationshipClick', (edge, hitElements, event) => {
      if (edge && edge.id) {
        setselectedEdges((prevSelected) => {
          const newSelected = new Set(prevSelected);
          newSelected.add(edge.id);
          return newSelected;
        });
        selectedRelationRef.current = edge.id;
      }
    });

    // Canvas click (deselect)
    clickInteraction.updateCallback('onCanvasClick', (event) => {
      if (!event.hitElements || event.hitElements.length === 0) {
        setSelectedNodes(new Set());
        setselectedEdges(new Set());
        selectedNodeRef.current = null;
        selectedRelationRef.current = null;
        setnodetoshow(null);
        setContextMenu(null)
      }
    });

    // Hover interaction
    hoverInteraction.updateCallback('onHover', (element, hitElements, event) => {
      if (!hitElements || ((!hitElements.nodes || hitElements.nodes.length === 0) && 
          (!hitElements.relationships || hitElements.relationships.length === 0))) {
        if (previouslyHoveredNodeRef.current) {
          const shadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
          if (shadowEffect) shadowEffect.remove();
          previouslyHoveredNodeRef.current = null;
        }
        setrelationtoshow(selectedRelationRef.current);
        sethoverEdge(null);
        setnodetoshow(selectedNodeRef.current);
        return;
      }

      if (hitElements.nodes && hitElements.nodes.length > 0) {
        const hoveredNode = hitElements.nodes[0];
        if (hoveredNode && hoveredNode.data.id) {
          if (previouslyHoveredNodeRef.current) {
            const previousShadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (previousShadowEffect) previousShadowEffect.remove();
          }

          const hoverEffectPlaceholder = hoveredNode.data.html;
          if (hoverEffectPlaceholder) {
            setnodetoshow(hoveredNode.data.id);
            setrelationtoshow(null);

            const centerWrapper = hoverEffectPlaceholder.querySelector('div[style*="transform: translate(-50%, -50%)"]');
            if (centerWrapper) {
              const shadowEffect = document.createElement('div');
              shadowEffect.id = 'test';
              shadowEffect.style.position = 'absolute';
              shadowEffect.style.top = '43.2%';
              shadowEffect.style.left = '43.2%';
              shadowEffect.style.transform = 'translate(-50%, -50%)';
              shadowEffect.style.width = '200px';
              shadowEffect.style.height = '200px';
              shadowEffect.style.borderRadius = '50%';
              shadowEffect.style.border = '15px solid rgba(84, 207, 67, 0.8)';
              shadowEffect.style.zIndex = '5';
              shadowEffect.style.pointerEvents = 'none';
              centerWrapper.appendChild(shadowEffect);
            }
            previouslyHoveredNodeRef.current = hoverEffectPlaceholder;
          }
        }
      }

      if (hitElements.relationships && hitElements.relationships.length > 0) {
        const hoveredEdge = hitElements.relationships[0];
        if (hoveredEdge && hoveredEdge.data.id) {
          if (previouslyHoveredNodeRef.current) {
            const previousShadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (previousShadowEffect) previousShadowEffect.remove();
            previouslyHoveredNodeRef.current = null;
          }
          setnodetoshow(null);
          setrelationtoshow(hoveredEdge.data.id);
          sethoverEdge(hoveredEdge.data.id);
        }
      }
    });

    // Cleanup
    return () => {
      panInteraction.destroy();
      boxSelectInteraction.destroy();
      clickInteraction.destroy();
      zoomInteraction.destroy();
      dragNodeInteraction.destroy();
      hoverInteraction.destroy();
    };
  }, [nvlRef, shiftPressed, setSelectedNodes, setContextMenu, setnodetoshow, setrelationtoshow, setselectedEdges, sethoverEdge]);

  const nvlOptions = {
    minimapContainer: minimapContainerRef.current,
    relationshipThreshold: 0,
    disableTelemetry: true,
    styling : {
        disabledItemFontColor: '#808080',    // Medium gray for disabled text (readable but muted)
        minimapViewportBoxColor: '#FFD700',  // Bright gold for minimap viewport (stands out clearly)
        selectedBorderColor: 'rgba(71, 39, 134, 0.9)', // Bright orange for inner selected border (complements outer border)
        dropShadowColor: 'green'
      }
  };

  const getVisualizationComponent = (hoveredEdge) => {
    const nvlProps = {
      nodes: combinedNodes.map((node) => ({
        ...node,
        Activated:node.Activated,
        selected: selectedNodes.has(node.id),
        html: createNodeHtml(node.captionnode, node.group, selectedNodes.has(node.id), node.selecte === true, 1, node.id, IconPersonWithClass(node), "👑"),
      })),
      rels: combinedEdges.map((edge) => ({
        ...edge,
        selected: selectedEdges.has(edge.id),
        color: edge.id === hoveredEdge || selectedEdges.has(edge.id) ? '#B771E5' : (edge.color || '#808080'),
        width: edge.id === hoveredEdge || selectedEdges.has(edge.id) ? 15 : (edge.width || 1),
      })),
      nvlOptions,
      mouseEventCallbacks: {
        onMultiSelect: shiftPressed,
        onContextMenu: (event, node) => {
          event.preventDefault();
          setContextMenu({
            visible: true,
            x: nvlRef.current.getPositionById(node.id).x + 1000,
            y: nvlRef.current.getPositionById(node.id).y,
            node,
          });
        },
      },
    };

    return (
      <InteractiveNvlWrapper
        ref={nvlRef}
        {...nvlProps}
        allowDynamicMinZoom={true}
        onError={(error) => console.error('NVL Error:', error)}
        style={{ width: '100%', height: '100%', border: '1px solid lightgray' }}
      />
    );
  };

  return { getVisualizationComponent, minimapContainerRef };
};

export default useNvlVisualization;