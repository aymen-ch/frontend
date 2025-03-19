import React, { useEffect, useState, useRef } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import { createNodeHtml } from './Parser';
import { IconPersonWithClass } from '../utils/function_container';
import {
  PanInteraction,
  ZoomInteraction,
  DragNodeInteraction,
  BoxSelectInteraction,
  ClickInteraction,
  HoverInteraction,
} from '@neo4j-nvl/interaction-handlers';

const GraphCanvas = ({
  nvlRef,
  combinedNodes,
  combinedEdges,
  selectedNodes,
  setSelectedNodes,
  setContextMenu,
  setnodetoshow,
  setrelationtoshow,
  ispath,
  setEdges
}) => {
  const [shiftPressed, setShiftPressed] = useState(false);
  const minimapContainerRef = useRef(null);
  const previouslyHoveredNodeRef = useRef(null);
  const selectedNodeRef = useRef(null); // Track the selected node

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Shift') setShiftPressed(true);
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') setShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!nvlRef.current) return;

    const panInteraction = new PanInteraction(nvlRef.current);
    const boxSelectInteraction = new BoxSelectInteraction(nvlRef.current);
    const clickInteraction = new ClickInteraction(nvlRef.current);
    const zoomInteraction = new ZoomInteraction(nvlRef.current);
    const dragNodeInteraction = new DragNodeInteraction(nvlRef.current);
    const hoverInteraction = new HoverInteraction(nvlRef.current);

    if (shiftPressed) {
      boxSelectInteraction.updateCallback('onBoxSelect', ({ nodes }) => {
        setSelectedNodes((prevSelected) => {
          const newSelected = new Set(prevSelected);
          nodes.forEach((node) => {
            newSelected.has(node.id) ? newSelected.delete(node.id) : newSelected.add(node.id);
          });
          return newSelected;
        });
      });
      panInteraction.destroy();
    } else {
      panInteraction.updateCallback('onPan', () => console.log('onPan'));
      boxSelectInteraction.destroy();
    }
    clickInteraction.updateCallback('onNodeRightClick', (node, hitElements, event) => {
      try {
        event.preventDefault();
        setContextMenu({
          visible: true,
          x: event.clientX -230,
          y: event.clientY - 200,
          node,
        });
        console.log(" this from main context menue : " , "x :" ,event.clientX -230, " y ",event.clientY - 200);
      } catch (error) {
        console.error('Error in onNodeRightClick:', { error, node, event });
      }
    });
    clickInteraction.updateCallback('onNodeClick', (node, hitElements, event) => {
      try {
        if (node && node.id) {
          // Set as selected node
          setSelectedNodes((prevSelected) => {
            const newSelected = new Set(prevSelected);
            newSelected.add(node.id); // Add new node to existing selection
            return newSelected;
          });
          selectedNodeRef.current = node.id;
          setnodetoshow(node.id);
          
          // Add click effect
        
        }
      } catch (error) {
        console.error('Error in onNodeClick:', { error, node, event });
      }
    });

    clickInteraction.updateCallback('onCanvasClick', (event) => {
      try {
        if (!event.hitElements || event.hitElements.length === 0) {
          setSelectedNodes(new Set());
          selectedNodeRef.current = null;
          setnodetoshow(null);
        }
      } catch (error) {
        console.error('Error in onCanvasClick:', { error, event });
      }
    });

    hoverInteraction.updateCallback('onHover', (element, hitElements, event) => {
      try {
        // When nothing is hovered
        if (!hitElements || ((!hitElements.nodes || hitElements.nodes.length === 0) && 
            (!hitElements.relationships || hitElements.relationships.length === 0))) {
          if (previouslyHoveredNodeRef.current) {
            const shadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (shadowEffect) shadowEffect.remove();
            previouslyHoveredNodeRef.current = null;
          }
          setrelationtoshow(null);
          // Show selected node when not hovering anything
          setnodetoshow(selectedNodeRef.current);
          return;
        }

        // Handle node hovering
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

        // Handle relationship hovering
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
          }
        }
      } catch (error) {
        console.error('Error in onHover:', { error, element, event });
      }
    });

    return () => {
      panInteraction.destroy();
      boxSelectInteraction.destroy();
      clickInteraction.destroy();
      zoomInteraction.destroy();
      dragNodeInteraction.destroy();
      hoverInteraction.destroy();
    };
  }, [nvlRef, shiftPressed, setSelectedNodes, setContextMenu, setnodetoshow, setrelationtoshow]);

  const nvlOptions = {
    minimapContainer: minimapContainerRef.current,
    relationshipThreshold: 0,
    panX: 100,
    panY: 100,
    disableTelemetry: true,
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -5000,
        centralGravity: 0.008,
        springLength: 500,
        springConstant: 0.1,
        damping: 0.05,
        avoidOverlap: 0.99,
      },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <InteractiveNvlWrapper
        ref={nvlRef}
        nodes={combinedNodes.map((node) => ({
          ...node,
          selected: selectedNodes.has(node.id),
          html: createNodeHtml(node.captionnode, node.group, selectedNodes.has(node.id), node.selecte === true, 1, node.id, IconPersonWithClass(node), "👑"),
        }))}
        allowDynamicMinZoom={true}
        nvlOptions={nvlOptions}
        rels={combinedEdges}
        mouseEventCallbacks={{
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
        }}
        onError={(error) => console.error('NVL Error:', error)}
        style={{ width: '100%', height: '100%', border: '1px solid lightgray' }}
      />
      <div
        ref={ispath ? minimapContainerRef : null}
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          width: '200px',
          height: '150px',
          backgroundColor: 'white',
          border: '1px solid lightgray',
          borderRadius: '4px',
          overflow: 'hidden',
          display: ispath ? 'block' : 'none',
        }}
      />
    </div>
  );
};

export default GraphCanvas;