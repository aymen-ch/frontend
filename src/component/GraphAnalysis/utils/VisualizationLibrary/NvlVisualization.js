
import { useEffect, useRef, useState } from 'react';
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
import { IconPersonWithClass } from '../../HorizontalModules/containervisualization/function_container';
import { useGlobalContext } from '../../GlobalVariables';
import { LabelManager, LabelManagerSchema } from '../Parser';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// CSS to ensure NVL nodes remain interactive
const styles = `
  .nvl-wrapper.geospatial .node, 
  .nvl-wrapper.geospatial .relationship {
    pointer-events: auto !important;
  }
`;

// Inject styles into the document
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const useNvlVisualization = ({
  nvlRef,
  nodes,
  edges,
  selectedNodes,
  setSelectedNodes,
  setContextMenu,
  setContextMenuRel,
  SetContextMenucanvas,
  setnodetoshow,
  setrelationtoshow,
  shiftPressed,
  selectedEdges,
  setselectedEdges,
  sethoverEdge,
  ispath,
  layoutType,
}) => {
  const previouslyHoveredNodeRef = useRef(null);
  const selectedNodeRef = useRef(null);
  const selectedRelationRef = useRef(null);
  const minimapContainerRef = useRef(null);
  const [isMinimapReady, setIsMinimapReady] = useState(false);
  const [hoverdnode, sethovernode] = useState(null);
  const {setNodes}  =useGlobalContext()
  const layoutoptions = {
    direction: 'up',
    packing: 'bin',
  };

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

    // Configure interactions based on shift key and layout type
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
      zoomInteraction.destroy();
    } else if (layoutType === 'geospatial') {
      // Disable NVL pan and zoom for geospatial layout to allow map interactions
      panInteraction.destroy();
      zoomInteraction.destroy();
      boxSelectInteraction.destroy();
    } else {
      panInteraction.updateCallback('onPan', () => console.log('onPan'));
      zoomInteraction.updateCallback('onZoom', () => console.log('onZoom'));
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

    clickInteraction.updateCallback('onRelationshipRightClick', (edge, hitElements, event) => {
      event.preventDefault();
      setContextMenuRel({
        visible: true,
        x: event.clientX - 230,
        y: event.clientY - 200,
        edge,
      });
    });

    // Canvas click (deselect)
    clickInteraction.updateCallback('onCanvasClick', (event) => {
      if (!event.hitElements || event.hitElements.length === 0) {
        setSelectedNodes(new Set());
        setselectedEdges(new Set());
        selectedNodeRef.current = null;
        selectedRelationRef.current = null;
        setnodetoshow(null);
        if (typeof setContextMenu === 'function') {
          setContextMenu(null);
        }
        
        if (typeof SetContextMenucanvas === 'function') {
          SetContextMenucanvas(null);
        }
        
      }
    });


    clickInteraction.updateCallback('onCanvasRightClick', (event) => {
      event.preventDefault();
      SetContextMenucanvas({
        visible: true,
        x: event.clientX - 230,
        y: event.clientY - 200,
      });
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
        sethovernode(null);
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
            sethovernode(hoveredNode.data.id);
          }
          previouslyHoveredNodeRef.current = hoverEffectPlaceholder;
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
  }, [nvlRef, shiftPressed, setSelectedNodes, setContextMenu, setnodetoshow, setrelationtoshow, setselectedEdges, sethoverEdge, isMinimapReady, layoutType]);

  const nvlOptions = {
    minimapContainer: minimapContainerRef.current,
    disableTelemetry: true,
    styling: {
      disabledItemFontColor: '#808080',
      selectedBorderColor: 'rgba(71, 39, 134, 0.9)',
      dropShadowColor: 'rgba(85, 83, 174, 0.5)',
      backgroundColor: 'transparent', // Transparent to show map when active
    },
    initialZoom: 1,
    layoutOptions: layoutoptions,
  };

  const getVisualizationComponent = (hoveredEdge) => {
    const nvlProps = {
      nodes: nodes.map((node) => ({
        ...node,
        hovered: node.id === hoverdnode,
        selected: selectedNodes?.has(node.id),
        html: createNodeHtml(
          node.ischema
            ? LabelManagerSchema(node.group, node.properties)
            : LabelManager(node.group, { ...node.properties, ...node.properties_analyse }),
          node.group,
          selectedNodes?.has(node.id),
          node.selecte === true,
          1,
          node.id,
          IconPersonWithClass(node),
          '🔴',
          node.size
        ),
      })),
      rels: edges.map((edge) => ({
        ...edge,
        selected: selectedEdges?.has(edge.id)||edge.selected,
        color: edge.id === hoveredEdge || selectedEdges?.has(edge.id) ||edge.selected? '#B771E5' : (edge.color || '#808080'),
        width: edge.id === hoveredEdge || selectedEdges?.has(edge.id)||edge.selected ? 15 : (edge.width || 1),
      })),
    };

    // Calculate map center based on nodes with lat/lng
    const validNodes = nodes.filter(node => {
      const lat = node.properties?.latitude || node.properties?.lat;
      const lng = node.properties?.longitude || node.properties?.lng;
      return lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng);
    });
    const centerLat = validNodes.length
      ? validNodes.reduce((sum, node) => sum + parseFloat(node.properties.latitude || node.properties.lat), 0) / validNodes.length
      : 0;
    const centerLng = validNodes.length
      ? validNodes.reduce((sum, node) => sum + parseFloat(node.properties.longitude || node.properties.lng), 0) / validNodes.length
      : 0;
    const mapCenter = validNodes.length ? [centerLat, centerLng] : [0, 0];

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Leaflet Map Background - Shown only for geospatial layout */}
        {layoutType === 'geospatial' && (
          <MapContainer
            center={mapCenter}
            zoom={2}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'auto' }}
            // dragging={true}
            // scrollWheelZoom={true}
            // doubleClickZoom={true}
            boxZoom={true}
            keyboard={true}
            touchZoom={true}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </MapContainer>
        )}
        {/* NVL Visualization */}
        {(isMinimapReady || !ispath) && (
          <InteractiveNvlWrapper
            ref={nvlRef}
            {...nvlProps}
            nvlOptions={nvlOptions}
            allowDynamicMinZoom={true}
            onError={(error) => console.error('NVL Error:', error)}
            className={`nvl-wrapper ${layoutType === 'geospatial' ? 'geospatial' : ''}`}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
             
              pointerEvents: layoutType === 'geospatial' ? 'none' : 'auto', // Disable canvas events in geospatial mode
            }}
          />
        )}
        {/* Minimap container */}
        <div
          ref={minimapContainerRef}
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
            display: ispath ? 'block' : 'none',
          }}
        />
      </div>
    );
  };

  return { getVisualizationComponent };
};

export default useNvlVisualization;
