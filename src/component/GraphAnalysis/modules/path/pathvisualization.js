import React, { useState, useCallback, useEffect } from 'react';
import GraphCanvas from '../../utils/VisualizationLibrary/GraphCanvas';
import { FaExpand, FaCompress, FaArrowLeft, FaArrowRight, FaList, FaTimes, FaProjectDiagram, FaBezierCurve, FaLayerGroup, FaSitemap, FaPlus, FaObjectGroup } from 'react-icons/fa';
import { AddNeighborhoodParser, getNodeIcon, getNodeColor, parsePath } from '../../utils/Parser';
import './PathVisualization.css';
import { computeLinearLayout } from '../layout/layout';
import { d3ForceLayoutType, ForceDirectedLayoutType, FreeLayoutType, HierarchicalLayoutType,GridLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from '../../HorizontalModules/containervisualization/function_container';

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
  setSelectedNodes,
  ispath,
  setrelationtoshow,
  pathisempty,
  setPathisempty,
  setAllPaths,
  setNodes,
  setEdges
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPathList, setShowPathList] = useState(false);
  const [layoutType, setLayoutType] = useState(FreeLayoutType); // Default layout type

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

  // Apply layout when nodes, edges, or layoutType changes
  useEffect(() => {
    if (nvlRef && nvlRef.current && nodes.length > 0) {
      applyLayout(layoutType);
    }
  }, [nodes, edges, nvlRef, layoutType]);

  const handleNextPath = () => {
    if (currentPathIndex < allPaths.length - 1) {
      const nextIndex = currentPathIndex + 1;
      setCurrentPathIndex(nextIndex);
      updatePathNodesAndEdges(allPaths[nextIndex]);
      applyLayout(layoutType);
    }
  };

  const handlePreviousPath = () => {
    if (currentPathIndex > 0) {
      const prevIndex = currentPathIndex - 1;
      setCurrentPathIndex(prevIndex);
      updatePathNodesAndEdges(allPaths[prevIndex]);
      applyLayout(layoutType);
    }
  };

  const updatePathNodesAndEdges = (path) => {
    console.log(selectednodes)
    const { nodes: formattedNodes, edges: formattedEdges } = parsePath(path, selectednodes);
    setPathNodes([]);
    setPathEdges([]);
    setTimeout(() => {
      setPathNodes(formattedNodes);
      setPathEdges(formattedEdges);
      applyLayout(layoutType);
    }, 50);
  };

  const applyLayout = (type) => {
    if (nvlRef && nvlRef.current) {
      if (type === 'computeLinearLayout') {
        const nodesWithPositions = computeLinearLayout(nodes, edges, 400);
        nvlRef.current.setLayout(FreeLayoutType);
        nvlRef.current.setNodePositions(nodesWithPositions, true);
        console.log('Applied computeLinearLayout');
      } else {
        handleLayoutChange(type, nvlRef, nodes, edges, setLayoutType);
        console.log(`Applied layout: ${type}`);
      }
    } else {
      console.log('nvlRef is not ready.');
    }
  };

  const handleLayoutSelect = (type) => {
    setLayoutType(type);
    applyLayout(type);
  };

  const selectPath = (index) => {
    setCurrentPathIndex(index);
    updatePathNodesAndEdges(allPaths[index]);
  };

  const showAllPathsAsSubgraph = () => {
    if (allPaths.length > 0) {
      let allNodes = [];
      let allEdges = [];

      // Combine all paths into one subgraph
      allPaths.forEach((path) => {
        const { nodes: pathNodes, edges: pathEdges } = parsePath(path, selectednodes);
        allNodes = [...allNodes, ...pathNodes];
        allEdges = [...allEdges, ...pathEdges];
      });

      // Remove duplicate nodes based on id
      const uniqueNodes = Array.from(new Map(allNodes.map(node => [node.id, node])).values());

      // Remove duplicate edges based on id (or another unique identifier)
      const uniqueEdges = Array.from(
        new Map(allEdges.map(edge => [edge.id, edge])).values()
      );

      // Update the visualization
      setPathNodes([]);
      setPathEdges([]);
      setTimeout(() => {
        setPathNodes(uniqueNodes);
        setPathEdges(uniqueEdges);
        applyLayout(layoutType);
        setCurrentPathIndex(-1); // Indicate no single path is selected
      }, 50);

      console.log('Displayed all paths as a single subgraph with unique edges:', uniqueEdges);
    }
  };

  const closePathBox = () => {
    setIsBoxPath(false);
    setPathNodes([]);
    setPathEdges([]);
    setAllPaths([]);
    setCurrentPathIndex(0);
    setPathisempty(false);
  };

  const addCurrentPathToVisualization = () => {
    let nodesToAdd = [];
    let edgesToAdd = [];

    if (currentPathIndex === -1) {
      // Handle the subgraph case
      if (allPaths.length > 0) {
        allPaths.forEach((path) => {
          const { nodes: pathNodes, edges: pathEdges } = parsePath(path, selectednodes);
          nodesToAdd = [...nodesToAdd, ...pathNodes];
          edgesToAdd = [...edgesToAdd, ...pathEdges];
        });

        // Remove duplicates from the combined subgraph
        nodesToAdd = Array.from(new Map(nodesToAdd.map(node => [node.id, node])).values());
        edgesToAdd = Array.from(new Map(edgesToAdd.map(edge => [`${edge.from}-${edge.to}`, edge])).values());

        console.log('Adding all paths subgraph to main visualization');
      }
    } else if (allPaths[currentPathIndex]) {
      // Handle single path case
      const { nodes: currentNodes, edges: currentEdges } = parsePath(allPaths[currentPathIndex], selectednodes);
      nodesToAdd = currentNodes;
      edgesToAdd = currentEdges;
      console.log(`Adding Path ${currentPathIndex + 1} to main visualization`);
    }

    if (nodesToAdd.length > 0 || edgesToAdd.length > 0) {
      // Append nodes, avoiding duplicates by checking IDs
      setNodes((prevNodes) => {
        const existingNodeIds = new Set(prevNodes.map(node => node.id));
        const newNodes = nodesToAdd.filter(node => !existingNodeIds.has(node.id));
        return [...prevNodes, ...newNodes];
      });

      // Append edges, avoiding duplicates by checking from and to
      setEdges((prevEdges) => {

        const newed = edgesToAdd
          .map(edge => ({ ...edge, selected: true }));
        return [...prevEdges, ...newed];
      });
    }
  };

  const getPathSummary = (path) => {
    if (!path || path.length === 0) return "Empty path";
    return `(${path["nodes"].length} nodes)`;
  };

  const buttonStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    transition: 'background-color 0.2s',
    marginLeft: '5px',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'rgba(66, 153, 225, 0.8)', // Highlight active layout
    color: '#fff',
  };

  const layoutControlStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    flexDirection: 'row',
    zIndex: 1001,
  };

  const addButtonStyle = {
    ...buttonStyle,
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    zIndex: 1001,
    marginLeft: '0',
  };

  const layouts = [
    { type: 'computeLinearLayout', icon: <FaProjectDiagram size={14} />, title: 'Linear Layout' },
    { type: ForceDirectedLayoutType, icon: <FaBezierCurve size={14} />, title: 'Force Directed' },
    { type: GridLayoutType, icon: <FaLayerGroup size={14} />, title: 'Free Layout' },
    { type: HierarchicalLayoutType, icon: <FaSitemap size={14} />, title: 'Hierarchical Layout' },
  ];

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
      {/* Title Bar - Made draggable */}
      <div className="path-title-bar" data-draggable="true">
        <h5 className="path-title">Path Visualization</h5>
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
            {/* "Show All Paths as Subgraph" as the first item */}
            <div
              onClick={showAllPathsAsSubgraph}
              className={`path-list-item ${currentPathIndex === -1 ? 'active' : ''}`}
            >
              <div className={`path-list-item-title ${currentPathIndex === -1 ? 'active' : 'inactive'}`}>
                <FaObjectGroup style={{ marginRight: '5px', verticalAlign: 'middle' }} /> All Paths Subgraph
              </div>
              <div className="path-list-item-summary">
                ({allPaths.reduce((sum, path) => sum + (path["nodes"]?.length || 0), 0)} nodes)
              </div>
            </div>
            {/* Individual paths */}
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

        {pathisempty && (
          <div className="empty-path-container">
            <div className="empty-path-message">
              No paths available to display.
            </div>
          </div>
        )}

      {/* Path Visualization Content */}
      {!isLoading && (
        <div
          className="visualization-content"
          style={{ marginLeft: showPathList ? '250px' : '0', position: 'relative' }}
        >
          {/* Layout Control */}
          <div style={layoutControlStyle}>
            {layouts.map((layout) => (
              <button
                key={layout.type}
                style={layoutType === layout.type ? activeButtonStyle : buttonStyle}
                onClick={() => handleLayoutSelect(layout.type)}
                title={layout.title}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = layoutType === layout.type ? 'rgba(66, 153, 225, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
              >
                {layout.icon}
              </button>
            ))}
          </div>

          {/* Add Current Path Button */}
          <button
  style={{
    ...addButtonStyle,
    width: '200px',
    height: '40px',
    color: 'white',
    backgroundColor: 'black'
  }}
  onClick={addCurrentPathToVisualization}
  title="Add Current Path to Visualization"
  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(33, 77, 108, 0.9)'}
  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(7, 4, 4, 0.8)'}
>
  <FaPlus size={14} /> Add to Canvas
</button>

          <GraphCanvas
            nvlRef={nvlRef}
            nodes={nodes}
            edges={edges}
            selectedNodes={selectednodes}
            setSelectedNodes={setSelectedNodes}
            setContextMenu={setContextMenu}
            nodetoshow={nodetoshow}
            setnodetoshow={setnodetoshow}
            ispath={ispath}
            setrelationtoshow={setrelationtoshow}
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
      <div className="resize-handle" onMouseDown={handleResizeStart}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 9L9 1M5 9L9 5M9 9L9 9" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
});

export default PathVisualization;