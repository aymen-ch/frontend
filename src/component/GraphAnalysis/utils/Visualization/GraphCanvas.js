// GraphCanvas.js
import React, { useEffect, useState } from 'react';
import useNvlVisualization from './NvlVisualization';

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
  setEdges,
}) => {
  const [shiftPressed, setShiftPressed] = useState(false);
  const [hoveredEdge, sethoverEdge] = useState(null);
  const [selectedEdges, setselectedEdges] = useState(new Set());

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
  const { getVisualizationComponent, minimapContainerRef } = useNvlVisualization({
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
  });

  const VisualizationComponent = getVisualizationComponent(hoveredEdge);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {VisualizationComponent}
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