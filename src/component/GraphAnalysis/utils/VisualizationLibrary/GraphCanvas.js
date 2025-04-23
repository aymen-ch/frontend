// GraphCanvas.js
import React, { useEffect, useState } from 'react';
import useNvlVisualization from './NvlVisualization';
import useCytoVisualization from './CytoscapeVisualization';
const GraphCanvas = ({
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
  ispath,
  setselectedEdges,
  selectedEdges,
  layoutType
}) => {
  const [shiftPressed, setShiftPressed] = useState(false);
  const [hoveredEdge, sethoverEdge] = useState(null);
  // Handle Shift key press
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

  // Use the NVL visualization hook
  const { getVisualizationComponent } = useNvlVisualization({
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
    layoutType
  });

  const VisualizationComponent = getVisualizationComponent(hoveredEdge);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {VisualizationComponent}
    </div>
  );
};

export default GraphCanvas;