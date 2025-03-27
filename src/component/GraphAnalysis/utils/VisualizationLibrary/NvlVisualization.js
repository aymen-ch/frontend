// NvlVisualization.js
import { useEffect, useRef,useState } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import {
  PanInteraction,
  ZoomInteraction,
  DragNodeInteraction,
  BoxSelectInteraction,
  ClickInteraction,
  HoverInteraction,
} from '@neo4j-nvl/interaction-handlers';
import { createNodeHtml,calculateNodeConfig } from '../Parser';
import { IconPersonWithClass } from '../../HorizontalModules/containervisualization/function_container';

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
  const [isMinimapReady, setIsMinimapReady] = useState(false);
  const [hoverdnode, sethovernode] = useState(null);

  const layoutoptions={
    direction:"up",
    packing: "bin"
}
  useEffect(() => {
    if (minimapContainerRef.current) {
      setIsMinimapReady(true);
    }
  }, []);


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
        setContextMenu(null);
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
        sethovernode(null)
        return;
      }

      if (hitElements.nodes && hitElements.nodes.length > 0) {
        const hoveredNode = hitElements.nodes[0];
        if (hoveredNode && hoveredNode.data.id) {
          if (previouslyHoveredNodeRef.current) {
            const previousShadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (previousShadowEffect) previousShadowEffect.remove();
          }
          console.log(hoveredNode.data)
          const hoverEffectPlaceholder = hoveredNode.data.html;
          if (hoverEffectPlaceholder) {
            setnodetoshow(hoveredNode.data.id);
            setrelationtoshow(null);
             sethovernode(hoveredNode.data.id)
         
            /// make the node hover 
            // const config = calculateNodeConfig(hoveredNode.data.size);
            // const centerWrapper = hoverEffectPlaceholder.querySelector('div[style*="transform: translate(-50%, -50%)"]');
            // if (centerWrapper) {
            //   const shadowEffect = document.createElement('div');
            //   shadowEffect.id = 'test';
            //   shadowEffect.style.position = 'absolute';
            //   shadowEffect.style.top = config.borderTop;
            //   shadowEffect.style.left = config.borderTop;
            //   shadowEffect.style.transform = 'translate(-50%, -50%)';
            //   shadowEffect.style.width = config.Nodewidth;
            //   shadowEffect.style.height = config.Nodewidth;
            //   shadowEffect.style.borderRadius = '50%';
            //   shadowEffect.style.border = '15px solid rgba(84, 207, 67, 0.8)';
            //   shadowEffect.style.zIndex = '5';
            //   shadowEffect.style.pointerEvents = 'none';
            //   centerWrapper.appendChild(shadowEffect);
            // }
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
          console.log(hoveredEdge.data)
          setrelationtoshow(hoveredEdge.data);
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
    
  }, [nvlRef, shiftPressed, setSelectedNodes, setContextMenu, setnodetoshow, setrelationtoshow, setselectedEdges, sethoverEdge,isMinimapReady]);
  const nvlOptions = {
    minimapContainer: minimapContainerRef.current, // Reference to the DOM element for the minimap
    relationshipThreshold: 0,
    disableTelemetry:true,
    styling: {
      disabledItemFontColor: '#808080',
      selectedBorderColor: 'rgba(71, 39, 134, 0.9)',
      dropShadowColor: 'rgba(85, 83, 174, 0.5)'
        },
    initialZoom:1,
    layoutOptions:layoutoptions
  };

  const getVisualizationComponent = (hoveredEdge) => {
    const nvlProps = {
      nodes: combinedNodes.map((node) => ({
        ...node,
        hovered:node.id==hoverdnode ,
        selected: selectedNodes.has(node.id),
        html: createNodeHtml(node.captionnode, node.group, selectedNodes.has(node.id), node.selecte === true, 1, node.id, IconPersonWithClass(node), "🔴",node.size),
      })),
      rels: combinedEdges.map((edge) => ({
        ...edge,
        selected: selectedEdges?.has(edge.id),
        color: edge.id === hoveredEdge || selectedEdges?.has(edge.id) ? '#B771E5' : (edge.color || '#808080'),
        width: edge.id === hoveredEdge || selectedEdges?.has(edge.id) ? 15 : (edge.width || 1),
      })),
    };

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Main visualization */}
       
        {(isMinimapReady || !ispath) && (
          <InteractiveNvlWrapper
            ref={nvlRef}
            {...nvlProps}
            nvlOptions={nvlOptions}
            allowDynamicMinZoom={true}
            onError={(error) => console.error('NVL Error:', error)}
            style={{ width: '100%', height: '100%', border: '1px solid lightgray' }}
          />
        )}
        {/* Minimap container */}
        <div
          ref={ispath ?  minimapContainerRef:null}
          style={{
            position: 'absolute',
            bottom: '100px',
            right: '80px',
            width: '200px',
            height: '150px',
            backgroundColor: 'white',
            border: '1px solid lightgray',
            borderRadius: '4px',
            overflow: 'hidden',
            display: ispath ? 'block' : 'none', // Conditional display based on ispath
          }}
        />
      </div>
    );
  };

  return { getVisualizationComponent };
};

export default useNvlVisualization;