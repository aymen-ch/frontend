import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import GraphCanvas from '../../VisualisationModule/GraphCanvas';
import { FaArrowLeft, FaArrowRight, FaList, FaTimes, FaProjectDiagram, FaBezierCurve, FaLayerGroup, FaSitemap, FaPlus, FaObjectGroup, FaStop } from 'react-icons/fa';
import { parsePath } from '../../Parser';
import './PathVisualization.css';
import { computeLinearLayout } from '../../VisualisationModule/layout/layout';
import { ForceDirectedLayoutType, FreeLayoutType, HierarchicalLayoutType, GridLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from '../../function_container';
import { BASE_URL_Backend } from '../../../Platforme/Urls';

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
  setEdges,
  onStartPathFinding, // Contains { ids, depth }
  onStartShortestPath, // Contains { ids }
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPathList, setShowPathList] = useState(false);
  const [layoutType, setLayoutType] = useState(FreeLayoutType);
  const [position, setPosition] = useState({ x: 500, y: 50 });
  const [size, setSize] = useState({ width: 1300, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [currentDepth, setCurrentDepth] = useState(0);
  const [maxDepth, setMaxDepth] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [accumulatedPaths, setAccumulatedPaths] = useState([]);

  // Handle path-finding API call for a specific depth
  const fetchPathsForDepth = async (ids, depth) => {
    console.log("Fetching paths for depth:", depth);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/get_all_connections/`,
        { ids, depth },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const { paths, depth: returnedDepth } = response.data;
        if (paths.length === 0) {
          setPathisempty(true);
          console.log(`No paths found for depth ${depth}`);
        } else {
          setPathisempty(false);
          setAccumulatedPaths((prev) => [...prev, ...paths.map(path => ({ ...path, depth: returnedDepth }))]);
          // Update path visualization window with the latest path
          setAllPaths(paths);
          setCurrentPathIndex(0);
          if (paths[0]) {
            updatePathNodesAndEdges(paths[0]);
          }
        }
        console.log(`Response paths for depth ${depth}:`, response.data);
      } else {
        console.error(`Failed to fetch paths for depth ${depth}. Status: ${response.status}`);
        setPathisempty(true);
      }
    } catch (error) {
      console.error(`Error fetching paths for depth ${depth}:`, error);
      setPathisempty(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle shortest path API call
  const startShortestPath = async (params) => {
    console.log("Starting shortest path for IDs:", params.ids);
    setIsLoading(true);
    setIsSearching(false);
    setCurrentDepth(0);
    setMaxDepth(0);
    setAccumulatedPaths([]);
    setAllPaths([]);
    setPathNodes([]);
    setPathEdges([]);
    setPathisempty(false);
    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/shortestpath/`,
        { ids: params.ids },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const paths = response.data.paths;
        if (paths.length === 0) {
          setPathisempty(true);
          console.log("No shortest paths found");
        } else {
          setPathisempty(false);
          setAllPaths(paths);
          setAccumulatedPaths(paths.map(path => ({ ...path, depth: 0 })));
          setCurrentPathIndex(0);
          if (paths[0]) {
            updatePathNodesAndEdges(paths[0]);
          }
        }
        console.log("Response shortest paths:", response.data);
      } else {
        console.error('Failed to fetch shortest path. Status:', response.status);
        setPathisempty(true);
      }
    } catch (error) {
      console.error('Error fetching shortest path:', error);
      setPathisempty(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Iterative path finding for each depth
  useEffect(() => {
    if (!isSearching || !onStartPathFinding || currentDepth > maxDepth) return;

    const iterateDepths = async () => {
      for (let depth = currentDepth; depth <= maxDepth && isSearching; depth++) {
        setCurrentDepth(depth);
        await fetchPathsForDepth(onStartPathFinding.ids, depth);
        if (!isSearching) break;
      }
      if (isSearching) {
        setIsSearching(false);
      }
    };

    iterateDepths();
  }, [isSearching, currentDepth, maxDepth, onStartPathFinding]);

  // Initialize path finding when parameters are received
  useEffect(() => {
    if (onStartPathFinding) {
      console.log("Initializing path finding with params:", onStartPathFinding);
      setCurrentDepth(1);
      setMaxDepth(onStartPathFinding.depth);
      setIsSearching(true);
      setAccumulatedPaths([]);
      setAllPaths([]);
      setPathNodes([]);
      setPathEdges([]);
      setPathisempty(false);
    }
  }, [onStartPathFinding]);

  // Handle shortest path when parameters are received
  useEffect(() => {
    console.log("startShortestPath")
    if (onStartShortestPath) {
      startShortestPath(onStartShortestPath);
    }
  }, [onStartShortestPath]);

  // Add paths to main canvas (called manually by user)
  const addPathsToCanvas = (paths) => {
    let nodesToAdd = [];
    let edgesToAdd = [];

    paths.forEach((path) => {
      const { nodes: pathNodes, edges: pathEdges } = parsePath(path, selectednodes);
      nodesToAdd = [...nodesToAdd, ...pathNodes];
      edgesToAdd = [...edgesToAdd, ...pathEdges];
    });

    nodesToAdd = Array.from(new Map(nodesToAdd.map(node => [node.id, node])).values());
    edgesToAdd = Array.from(new Map(edgesToAdd.map(edge => [`${edge.from}-${edge.to}`, edge])).values());

    setNodes((prevNodes) => {
      const existingNodeIds = new Set(prevNodes.map(node => node.id));
      const newNodes = nodesToAdd.filter(node => !existingNodeIds.has(node.id));
      return [...prevNodes, ...newNodes];
    });

    setEdges((prevEdges) => {
      const newEdges = edgesToAdd.map(edge => ({ ...edge, selected: true }));
      return [...prevEdges, ...newEdges];
    });
  };

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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

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

  useEffect(() => {
    if (nvlRef && nvlRef.current && nodes.length > 0) {
      applyLayout(layoutType);
    }
  }, [nodes, edges, nvlRef, layoutType]);

  const handleNextPath = () => {
    if (currentPathIndex < accumulatedPaths.length - 1) {
      const nextIndex = currentPathIndex + 1;
      setCurrentPathIndex(nextIndex);
      updatePathNodesAndEdges(accumulatedPaths[nextIndex]);
      applyLayout(layoutType);
    }
  };

  const handlePreviousPath = () => {
    if (currentPathIndex > 0) {
      const prevIndex = currentPathIndex - 1;
      setCurrentPathIndex(prevIndex);
      updatePathNodesAndEdges(accumulatedPaths[prevIndex]);
      applyLayout(layoutType);
    }
  };

  const updatePathNodesAndEdges = (path) => {
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
    updatePathNodesAndEdges(accumulatedPaths[index]);
  };

  const showAllPathsAsSubgraph = () => {
    if (accumulatedPaths.length > 0) {
      let allNodes = [];
      let allEdges = [];

      accumulatedPaths.forEach((path) => {
        const { nodes: pathNodes, edges: pathEdges } = parsePath(path, selectednodes);
        allNodes = [...allNodes, ...pathNodes];
        allEdges = [...allEdges, ...pathEdges];
      });

      const uniqueNodes = Array.from(new Map(allNodes.map(node => [node.id, node])).values());
      const uniqueEdges = Array.from(new Map(allEdges.map(edge => [edge.id, edge])).values());

      setPathNodes([]);
      setPathEdges([]);
      setTimeout(() => {
        setPathNodes(uniqueNodes);
        setPathEdges(uniqueEdges);
        applyLayout(layoutType);
        setCurrentPathIndex(-1);
      }, 50);

      console.log('Displayed all paths as a single subgraph with unique edges:', uniqueEdges);
    }
  };

  const closePathBox = () => {
    setIsBoxPath(false);
    setPathNodes([]);
    setPathEdges([]);
    setAllPaths([]);
    setAccumulatedPaths([]);
    setCurrentPathIndex(0);
    setPathisempty(false);
    setCurrentDepth(0);
    setMaxDepth(0);
    setIsSearching(false);
  };

  const stopSearching = () => {
    setIsSearching(false);
  };

  const addCurrentPathToVisualization = () => {
    let nodesToAdd = [];
    let edgesToAdd = [];

    if (currentPathIndex === -1) {
      if (accumulatedPaths.length > 0) {
        accumulatedPaths.forEach((path) => {
          const { nodes: pathNodes, edges: pathEdges } = parsePath(path, selectednodes);
          nodesToAdd = [...nodesToAdd, ...pathNodes];
          edgesToAdd = [...edgesToAdd, ...pathEdges];
        });

        nodesToAdd = Array.from(new Map(nodesToAdd.map(node => [node.id, node])).values());
        edgesToAdd = Array.from(new Map(edgesToAdd.map(edge => [`${edge.from}-${edge.to}`, edge])).values());

        console.log('Adding all paths subgraph to main visualization');
      }
    } else if (accumulatedPaths[currentPathIndex]) {
      const { nodes: currentNodes, edges: currentEdges } = parsePath(accumulatedPaths[currentPathIndex], selectednodes);
      nodesToAdd = currentNodes;
      edgesToAdd = currentEdges;
      console.log(`Adding Path ${currentPathIndex + 1} to main visualization`);
    }

    if (nodesToAdd.length > 0 || edgesToAdd.length > 0) {
      setNodes((prevNodes) => {
        const existingNodeIds = new Set(prevNodes.map(node => node.id));
        const newNodes = nodesToAdd.filter(node => !existingNodeIds.has(node.id));
        return [...prevNodes, ...newNodes];
      });

      setEdges((prevEdges) => {
        const newEdges = edgesToAdd.map(edge => ({ ...edge, selected: true }));
        return [...prevEdges, ...newEdges];
      });
    }
  };

  const getPathSummary = (path) => {
    if (!path || !path.nodes || path.nodes.length === 0) return "Empty path";
    return `(${path.nodes.length} nodes, Depth ${path.depth})`;
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
    backgroundColor: 'rgba(66, 153, 225, 0.8)',
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

  const stopButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'rgba(255, 99, 71, 0.8)',
    color: '#fff',
    width: '100px',
    height: '40px',
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
      <div className="path-title-bar" data-draggable="true">
        <h5 className="path-title">Path Visualization (Depth {currentDepth}/{maxDepth})</h5>
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

      <div className="path-navigation">
        <div className="path-counter">
          <span className="path-number">Path {currentPathIndex + 1}</span> of {accumulatedPaths.length}
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
            disabled={currentPathIndex === accumulatedPaths.length - 1 || isLoading}
          >
            Next <FaArrowRight size={12} />
          </button>
          {isSearching && (
            <button
              style={stopButtonStyle}
              onClick={stopSearching}
              title="Stop Searching"
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 99, 71, 1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 99, 71, 0.8)'}
            >
              <FaStop size={14} /> Stop
            </button>
          )}
        </div>
      </div>

      {!isLoading && accumulatedPaths[currentPathIndex] && (
        <div className="path-details">
          {/* Content for path details if needed */}
        </div>
      )}

      {showPathList && (
        <div className="path-list-sidebar">
          <div className="path-list-header">
            <h6 className="path-list-title">All Paths ({accumulatedPaths.length})</h6>
          </div>
          <div className="path-list-content">
            <div
              onClick={showAllPathsAsSubgraph}
              className={`path-list-item ${currentPathIndex === -1 ? 'active' : ''}`}
            >
              <div className={`path-list-item-title ${currentPathIndex === -1 ? 'active' : 'inactive'}`}>
                <FaObjectGroup style={{ marginRight: '5px', verticalAlign: 'middle' }} /> All Paths Subgraph
              </div>
              <div className="path-list-item-summary">
                ({accumulatedPaths.reduce((sum, path) => sum + (path.nodes?.length || 0), 0)} nodes)
              </div>
            </div>
            {accumulatedPaths.map((path, index) => (
              <div
                key={index}
                onClick={() => selectPath(index)}
                className={`path-list-item ${currentPathIndex === index ? 'active' : ''}`}
              >
                <div className={`path-list-item-title ${currentPathIndex === index ? 'active' : 'inactive'}`}>
                  Path {index + 1} (Depth {path.depth})
                </div>
                <div className="path-list-item-summary">
                  {getPathSummary(path)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && !pathisempty && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <div>Loading paths for depth {currentDepth}...</div>
        </div>
      )}

      {pathisempty && (
        <div className="empty-path-container">
          <div className="empty-path-message">
            No paths available to display for depth {currentDepth}.
          </div>
        </div>
      )}

      {!isLoading && (
        <div
          className="visualization-content"
          style={{ marginLeft: showPathList ? '250px' : '0', position: 'relative' }}
        >
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

      {!isLoading && (
        <div className="path-footer">
          <div>Use the navigation buttons to explore all paths</div>
          <div>Click <FaList style={{ verticalAlign: 'middle', fontSize: '10px' }} /> to show path list</div>
        </div>
      )}

      <div className="resize-handle" onMouseDown={handleResizeStart}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 9L9 1M5 9L9 5M9 9L9 9" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
});

export default PathVisualization;