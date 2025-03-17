import React, { useEffect, useState, useRef } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import {createNodeHtml }  from './Parser';
import {IconPersonWithClass} from '..//utils/function_container';
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
  ispath,
}) => {
  const [shiftPressed, setShiftPressed] = useState(false);
  const minimapContainerRef = useRef(null);
  const previouslyHoveredNodeRef = useRef(null); // Track the previously hovered node
const [isnode,setnode] = useState(false)
  // Handle Shift key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Shift') {
        setShiftPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        setShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  

  // Interaction handlers
  useEffect(() => {
    if (!nvlRef.current) return;

    const panInteraction = new PanInteraction(nvlRef.current);
    const boxSelectInteraction = new BoxSelectInteraction(nvlRef.current);
    const clickInteraction = new ClickInteraction(nvlRef.current);
    const zoomInteraction = new ZoomInteraction(nvlRef.current);
    const dragNodeInteraction = new DragNodeInteraction(nvlRef.current);
    const hoverInteraction = new HoverInteraction(nvlRef.current);
    dragNodeInteraction.mouseDownNode=null;

    // console.log('dragNodeInteraction.mouseDownNode', dragNodeInteraction);

    
 

    if (shiftPressed) {
      boxSelectInteraction.updateCallback('onBoxSelect', ({nodes}) => {
        setSelectedNodes((prevSelected) => {
          const newSelected = new Set(prevSelected);
          nodes.forEach((node) => {
            if (newSelected.has(node.id)) {
              newSelected.delete(node.id);
            } else {
              newSelected.add(node.id);
            }
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
      } catch (error) {
        console.error('Error in onNodeRightClick:', { error, node, event });
      }
    });

    clickInteraction.updateCallback('onNodeClick', (node, hitElements, event) => {
      try {
        if (node && node.id) {
          setnodetoshow(node.id);
          setnode(true)
          //// to do a add the style like the one added on hover on teh node 
          const clickEffectPlaceholder = node.html;
          if (clickEffectPlaceholder) {
            const centerWrapper = clickEffectPlaceholder.querySelector('div[style*="transform: translate(-50%, -50%)"]');
            
            if (centerWrapper) {
              const clickEffect = document.createElement('div');
              clickEffect.id = 'click-effect';
              clickEffect.style.position = 'absolute';
              clickEffect.style.top = '43.2%';
              clickEffect.style.left = '43.2%';
              clickEffect.style.transform = 'translate(-50%, -50%)';
              clickEffect.style.width = '200px';
              clickEffect.style.height = '200px';
              clickEffect.style.borderRadius = '50%';
              clickEffect.style.border = '15px solid rgba(84, 207, 67, 0.8)'; // Same as hover
              clickEffect.style.zIndex = '5';
              clickEffect.style.pointerEvents = 'none';

              centerWrapper.appendChild(clickEffect);
            }
          }
        }
      } catch (error) {
        console.error('Error in onNodeClick:', { error, node, event });
      }
    });

    clickInteraction.updateCallback('onCanvasClick', (event) => {
      try {
        if (!event.hitElements || event.hitElements.length === 0) {
          setSelectedNodes(new Set());
        }
      } catch (error) {
        console.error('Error in onCanvasClick:', { error, event });
      }
    });

    clickInteraction.updateCallback('onCanvasRightClick', (event) => {
      try {
         console.log(" canvas !!! ")
      } catch (error) {
        console.error('Error in onCanvasRightClick:', { error, event });
      }
    });
  
    clickInteraction.updateCallback('onRelationshipRightClick', (relationship, hitElements, event) => {
      try {
         console.log("relation context menu::  ")
      } catch (error) {
        console.error('Error in onRelationshipRightClick:', { error, relationship, event });
      }
    });

    zoomInteraction.updateCallback('onZoom', () => console.log('Zooming'));

    hoverInteraction.updateCallback('onHover', (element, hitElements, event) => {
      try {
        if (!hitElements || !hitElements.nodes || hitElements.nodes.length === 0) {
          
          // No nodes hovered, remove hover effect from the previously hovered node
         /// setnodetoshow(null);
          if (previouslyHoveredNodeRef.current) {
            const shadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (shadowEffect) {
              shadowEffect.remove();
              if(isnode==true){
                setnodetoshow(null);
              }
              
            }
            previouslyHoveredNodeRef.current = null;
          }
          return;
        }

        const hoveredNode = hitElements.nodes[0];
        
        if (hoveredNode && hoveredNode.data.id) {
          // Remove hover effect from the previously hovered node
          if (previouslyHoveredNodeRef.current) {
            const previousShadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (previousShadowEffect) {
              previousShadowEffect.remove();
             
              
              
            }
          }
          
          // Add hover effect to the newly hovered node
          const hoverEffectPlaceholder = hoveredNode.data.html;
          console.log(hoveredNode);
          
          if (hoverEffectPlaceholder) {
            setnodetoshow(hoveredNode.data.id);
            
            // Find the centerWrapper where we need to append our hover effect
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
            
            // Update the previously hovered node reference
            previouslyHoveredNodeRef.current = hoverEffectPlaceholder;
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
  }, [nvlRef, shiftPressed, setSelectedNodes, setContextMenu, setnodetoshow]);

  const nvlOptions = {
    minimapContainer: minimapContainerRef.current,
    relationshipThreshold: 0,
    panX: 100,
    panY: 100,
    disableTelemetry: true,
    allowDynamicMinZoom: false, // Prevent dynamic minimum zoom
    physics: {
      enabled: true, // Enable physics simulation
      barnesHut: {
        gravitationalConstant: -5000, // Stronger repulsion between nodes
        centralGravity: 0.008, // Nodes are pulled toward the center
        springLength: 500, // Ideal length of edges (springs)
        springConstant: 0.1, // Strength of the spring force
        damping: 0.05, // Less damping for faster movement
        avoidOverlap: 0.99, // Prevents nodes from overlapping
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
          html: createNodeHtml(node.captionnode, node.group, selectedNodes.has(node.id) , node.selecte === true, 1 , node.id , IconPersonWithClass(node) ,"👑"),
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
              x: nvlRef.current.getPositionById(node.id).x+1000,
              y: nvlRef.current.getPositionById(node.id).y,
              node,
            });
          },
        }}
        onError={(error) => {
          console.error('NVL Error:', error);        }}
        style={{ width: '100%', height: '100%', border: '1px solid lightgray' }}
      />

      <div
        ref={ispath ? minimapContainerRef:null}
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
          display: ispath?'block':'none',
        }}
      />
    </div>
  );
};

export default GraphCanvas;