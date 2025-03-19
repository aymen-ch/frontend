import React, { useState, useCallback, useEffect } from 'react';
import GraphCanvas from '../../utils/GraphCanvas';
import { FaExpand, FaCompress, FaArrowLeft, FaArrowRight, FaList, FaTimes } from 'react-icons/fa';
import { AddNeighborhoodParser, getNodeIcon, getNodeColor, parsePath } from '../../utils/Parser';
import './PathVisualization.css';
import { computeLinearLayout } from '../layout/layout';
import { FreeLayoutType } from '@neo4j-nvl/base';

const PathVisualization = React.memo(({
  edges,
  nodes,
  nvlRef,
  setnodetoshow,
  nodetoshow,
  setPathEdges,
  setPathNodes,
  setIsBoxPath,
  allPaths,
  currentPathIndex,
  setCurrentPathIndex,
  selectednodes,
  ispath,
  pathisempty,
  setPathisempty,
  setAllPaths
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showPathList, setShowPathList] = useState(false);

  // State for tracking position, size and interactions
  const [position, setPosition] = useState({ x: 500, y: 50 });
  const [size, setSize] = useState({ width: 1300, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Handle mouse down event to start dragging
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('[data-draggable="true"]')) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  }, [size]);

  // Handle mouse move event for both dragging and resizing
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    } else if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  // Handle mouse up event to stop dragging and resizing
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add event listeners when component mounts
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Update loading state when allPaths changes
  useEffect(() => {
    if (allPaths.length > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);

    }
  }, [allPaths]);
  useEffect(() => {
    console.log('Applying layout...');
if (nvlRef && nvlRef.current) {
  const nodesWithPositions = computeLinearLayout(nodes, edges, 400);
  console.log('Nodes with positions:', nodesWithPositions);
  nvlRef.current.setLayout(FreeLayoutType);
  nvlRef.current.setNodePositions(nodesWithPositions, true);
  console.log('Layout applied successfully!');
} else {
  console.log('nvlRef is not ready.');
}
  }, [nodes, edges, nvlRef]);
  const handleNextPath = () => {
    if (currentPathIndex < allPaths.length - 1) {
      const nextIndex = currentPathIndex + 1;
      setCurrentPathIndex(nextIndex);
      updatePathNodesAndEdges(allPaths[nextIndex]);
      const nodesWithPositions = computeLinearLayout(nodes,edges,400)
      nvlRef.current.setLayout(FreeLayoutType);
            nvlRef.current.setNodePositions(nodesWithPositions, true);
      console.log("layout applied!")
    }
  };

  const handlePreviousPath = () => {
    if (currentPathIndex > 0) {
      const prevIndex = currentPathIndex - 1;
      setCurrentPathIndex(prevIndex);
      updatePathNodesAndEdges(allPaths[prevIndex]);
      const nodesWithPositions = computeLinearLayout(nodes,edges,400)
      nvlRef.current.setLayout(FreeLayoutType);
      nvlRef.current.setNodePositions(nodesWithPositions, true);
    }
  };

  const updatePathNodesAndEdges = (path) => {
    const { nodes: formattedNodes, edges: formattedEdges } = parsePath(path, selectednodes);
    setPathNodes([]);
    setPathEdges([]);
    nvlRef.current.restart();
     // Wait for 0.5 seconds before updating the nodes and edges
    setTimeout(() => {
      setPathNodes(formattedNodes);
      setPathEdges(formattedEdges);
    }, 50); // 500 milliseconds = 0.5 seconds

  };

  const selectPath = (index) => {
    setCurrentPathIndex(index);
    updatePathNodesAndEdges(allPaths[index]);
    setShowPathList(false);
  };

  const closePathBox = () => {
    setIsBoxPath(false);
    setPathNodes([]);
    setPathEdges([]);
    setAllPaths([]);
    setCurrentPathIndex(0);
    setPathisempty(false);
  };

  // Function to truncate path data for display
  const getPathSummary = (path) => {
    if (!path || path.length === 0) return "Empty path";
    return `(${path["nodes"].length} nodes)`;
  };

  return (
    <div
      className="path-visualization"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseOver={() => document.body.style.cursor = isDragging ? 'grabbing' : 'auto'}
    >
      {/* // { console.log( "pathisempty" , pathisempty ) } // */}
      {/* Title Bar - Made draggable */}
      <div
        className="path-title-bar"
        data-draggable="true"
      >
        <h5 className="path-title">Path Visualization </h5>
        <div className="path-controls">
          <button
            className="control-button"
            onClick={() => setShowPathList(!showPathList)}
            title="Show Path List"
          >
            <FaList size={14} />
          </button>
          <button
            className="control-button close-button"
            onClick={closePathBox}
            title="Close"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Path Navigation and Count */}
      <div className="path-navigation">
        <div className="path-counter">
          <span className="path-number">Path {currentPathIndex + 1}</span> of {allPaths.length}
        </div>
        <div className="navigation-buttons">
          <button
            className="nav-button"
            onClick={handlePreviousPath}
            disabled={currentPathIndex === 0 || isLoading}
          >
            <FaArrowLeft size={12} /> Previous
          </button>
          <button
            className="nav-button"
            onClick={handleNextPath}
            disabled={currentPathIndex === allPaths.length - 1 || isLoading}
          >
            Next <FaArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Path details bar */}
      {!isLoading && allPaths[currentPathIndex] && (
        <div className="path-details">
          {/* Content for path details if needed */}
        </div>
      )}

      {/* Path List Sidebar - conditionally rendered */}
      {showPathList && (
        <div className="path-list-sidebar">
          <div className="path-list-header">
            <h6 className="path-list-title">All Paths ({allPaths.length})</h6>
          </div>
          <div className="path-list-content">
            {allPaths.map((path, index) => (
              <div 
                key={index}
                onClick={() => selectPath(index)}
                className={`path-list-item ${currentPathIndex === index ? 'active' : ''}`}
              >
                <div className={`path-list-item-title ${currentPathIndex === index ? 'active' : 'inactive'}`}>
                  Path {index + 1}
                </div>
                <div className="path-list-item-summary">
                  {getPathSummary(path)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !pathisempty && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <div>Loading paths...</div>
        </div>
      )}

      {/* Path Visualization Content */}
      {!isLoading && (
        <div
          className="visualization-content"
          style={{ marginLeft: showPathList ? '250px' : '0' }}
        >
          <GraphCanvas
            nvlRef={nvlRef}
            combinedNodes={nodes}
            combinedEdges={edges}
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            setContextMenu={setContextMenu}
            nodetoshow={nodetoshow}
            setnodetoshow={setnodetoshow}
            ispath={ispath}
          />
        </div>
      )}

      {/* Footer with path information */}
      {!isLoading && (
        <div className="path-footer">
          <div>Use the navigation buttons to explore all paths</div>
          <div>Click <FaList style={{ verticalAlign: 'middle', fontSize: '10px' }} /> to show path list</div>
        </div>
      )}

      {/* Resize Handle */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeStart}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 9L9 1M5 9L9 5M9 9L9 9" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
});

export default PathVisualization;