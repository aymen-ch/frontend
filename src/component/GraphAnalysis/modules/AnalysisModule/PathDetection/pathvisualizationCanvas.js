import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import GraphCanvas from '../../VisualisationModule/GraphCanvas';
import { FaArrowLeft, FaArrowRight, FaList, FaTimes, FaProjectDiagram, FaBezierCurve, FaLayerGroup, FaSitemap, FaPlus, FaObjectGroup, FaStop } from 'react-icons/fa';
import { parsePath } from '../../VisualisationModule/Parser';
import { computeLinearLayout } from '../../VisualisationModule/layout/layout';
import { ForceDirectedLayoutType, FreeLayoutType, HierarchicalLayoutType, GridLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from '../../ContainersModules/function_container';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import { useAlgorithm } from '../../ContainersModules/PathPrameters'

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
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPathList, setShowPathList] = useState(false);
  const [layoutType, setLayoutType] = useState(ForceDirectedLayoutType);
  const [position, setPosition] = useState({ x: 500, y: 50 });
  const [size, setSize] = useState({ width: 1300, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isSearching, setIsSearching] = useState(true);
  const [accumulatedPaths, setAccumulatedPaths] = useState([]);
  const [currentDepth, setCurrentDepth] = useState(0);

  const { 
    pathFindingParams, 
    shortestPathParams,
    startPathfinding,
    startShortestPathFinding
  } = useAlgorithm();

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
        console.log('paths2', paths);
        if (paths.length === 0) {
          setPathisempty(true);
          console.log(`No paths found for depth ${depth}`);
        } else {
          setPathisempty(false);
          setAccumulatedPaths((prev) => [...prev, ...paths.map(path => ({ ...path, depth: returnedDepth }))]);
          setAllPaths(paths);
          setCurrentPathIndex(0);
          if (paths[0]) {
            updatePathNodesAndEdges(paths[0]);
          }
        }
        console.log(`Response paths for depth ${depth}:`, response.data);
        return paths.length; // Return the number of paths found
      } else {
        console.error(`Failed to fetch paths for depth ${depth}. Status: ${response.status}`);
        setPathisempty(true);
        return 0;
      }
    } catch (error) {
      console.error(`Error fetching paths for depth ${depth}:`, error);
      setPathisempty(true);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle shortest path API call
  const startShortestPath = async (params) => {
    console.log("Starting shortest path for IDs:", params.ids);
    setIsLoading(true);
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

  useEffect(() => {
    if (pathFindingParams && startPathfinding) {
      console.log("Initializing path finding with params:", pathFindingParams);
      setIsSearching(true);
      setAccumulatedPaths([]);
      setAllPaths([]);
      setPathNodes([]);
      setPathEdges([]);
      setPathisempty(false);
      setCurrentDepth(0);

      const iterateDepths = async () => {
        let depth = 1;
        while (depth <= pathFindingParams.depth && isSearching) {
          setCurrentDepth(depth); // Update current depth
          setIsSearching(true);
          const pathCount = await fetchPathsForDepth(pathFindingParams.ids, depth);
          if (pathCount > 0) {
            setIsSearching(false); // Stop searching if paths are found
            break; // Exit the loop
          }
          depth++;
        }
        if (depth > pathFindingParams.depth) {
          setIsSearching(false);
          setCurrentDepth(0); // Reset depth when max depth is reached
        }
      };

      iterateDepths();
    }
  }, [pathFindingParams, startPathfinding]);

  const fetchNextDepth = () => {
    if (currentDepth < pathFindingParams.depth) {
      setCurrentDepth(currentDepth + 1);
      fetchPathsForDepth(pathFindingParams.ids, currentDepth).then((pathCount) => {
        if (pathCount === 0 && currentDepth >= pathFindingParams.depth) {
          setIsSearching(false);
        }
      });
    }
  };

  const stopSearching = () => {
    setIsSearching(false);
    setCurrentDepth(0);
  };

  useEffect(() => {
    if (shortestPathParams && startShortestPathFinding) {
      console.log("Starting shortest path with params:", startShortestPathFinding);
      startShortestPath(shortestPathParams);
    }
  }, [shortestPathParams, startShortestPathFinding]);

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
    <>
      <style>
        {`
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #eee;
            border-top-color: #4a6cf7;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
 <div
  className="fixed top-0 left-0 bg-white shadow-lg rounded-lg z-[30000] flex flex-col overflow-hidden transition-shadow duration-300"
  style={{
    transform: `translate(${position.x}px, ${position.y}px)`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    cursor: isDragging ? 'grabbing' : 'auto',
  }}
  onMouseDown={handleMouseDown}
  onMouseOver={() => (document.body.style.cursor = isDragging ? 'grabbing' : 'auto')}
>
        <div className="p-3 bg-gradient-to-r from-[#4a6cf7] to-[#3f5ef8] text-white border-b border-black/10 flex justify-between items-center cursor-grab select-none rounded-t-lg" data-draggable="true">
          <h5 className="m-0 font-semibold text-base">Path Visualization (Depth {currentDepth})</h5>
          <div className="flex gap-2.5">
            <button
              className="bg-white/20 text-white border-none rounded w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors duration-200"
              onClick={() => setShowPathList(!showPathList)}
              title="Show Path List"
            >
              <FaList size={14} />
            </button>
            <button
              className="bg-white/20 text-white border-none rounded w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-red-500/60 transition-colors duration-200"
              onClick={closePathBox}
              title="Close"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>

        <div className="p-2.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="font-medium text-sm text-gray-600">
            <span className="text-[#4a6cf7] font-semibold">Path {currentPathIndex + 1}</span> of {accumulatedPaths.length}
            {isSearching && currentDepth > 0 && (
              <span className="ml-2.5">
                (Searching Depth: {currentDepth})
              </span>
            )}
            {pathisempty && !isLoading && (
              <div className="mt-2 text-sm text-gray-600">
                No paths available to display for depth {currentDepth || 'N/A'}.
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className={`border-none rounded px-3 py-1.5 text-xs flex items-center gap-1.5 ${currentPathIndex === 0 || isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#4a6cf7] text-white cursor-pointer hover:bg-[#3b5de7] transition-colors duration-200'}`}
              onClick={handlePreviousPath}
              disabled={currentPathIndex === 0 || isLoading}
            >
              <FaArrowLeft size={12} /> Previous
            </button>
            <button
              className={`border-none rounded px-3 py-1.5 text-xs flex items-center gap-1.5 ${currentPathIndex === accumulatedPaths.length - 1 || isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#4a6cf7] text-white cursor-pointer hover:bg-[#3b5de7] transition-colors duration-200'}`}
              onClick={handleNextPath}
              disabled={currentPathIndex === accumulatedPaths.length - 1 || isLoading}
            >
              Next <FaArrowRight size={12} />
            </button>
            {startPathfinding && (
              <button
                className={`border border-gray-300 rounded px-3 py-2 text-sm flex items-center gap-1.5 ${isSearching ? 'bg-red-500/80 text-white cursor-pointer hover:bg-red-500' : 'bg-gray-200/50 text-white cursor-not-allowed'}`}
                onClick={stopSearching}
                disabled={!isSearching}
                title={isSearching ? 'Stop Searching' : 'Not Searching'}
              >
                <FaStop size={14} /> Stop
              </button>
            )}
            {startPathfinding && currentDepth < (pathFindingParams?.depth || 0) && (
              <button
                className="border border-gray-300 rounded px-3 py-2 text-sm flex items-center gap-1.5 bg-blue-600/80 text-white cursor-pointer hover:bg-blue-600"
                onClick={fetchNextDepth}
                title="Fetch Next Depth"
              >
                <FaArrowRight size={14} /> Next Depth
              </button>
            )}
          </div>
        </div>

        {!isLoading && accumulatedPaths[currentPathIndex] && (
          <div className="p-2 border-b border-gray-200 bg-blue-50/50 text-sm text-gray-700 flex items-center justify-between">
            {/* Content for path details if needed */}
          </div>
        )}

        {showPathList && (
          <div className="absolute top-[50px] left-0 w-[250px] h-[calc(100%-50px)] bg-white border-r border-gray-200 z-10 overflow-y-auto shadow-[2px_0_10px_rgba(0,0,0,0.1)] flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h6 className="m-0 font-semibold text-sm text-gray-600">All Paths ({accumulatedPaths.length})</h6>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div
                onClick={showAllPathsAsSubgraph}
                className={`p-2.5 border-b border-gray-200 cursor-pointer border-l-4 ${currentPathIndex === -1 ? 'bg-blue-50/50 border-[#4a6cf7]' : 'border-transparent hover:bg-gray-50'}`}
              >
                <div className={`text-sm ${currentPathIndex === -1 ? 'font-semibold text-[#4a6cf7]' : 'font-normal text-gray-800'}`}>
                  <FaObjectGroup className="inline mr-1.5 align-middle" /> All Paths Subgraph
                </div>
                <div className="text-xs text-gray-600 mt-1 truncate">
                  ({accumulatedPaths.reduce((sum, path) => sum + (path.nodes?.length || 0), 0)} nodes)
                </div>
              </div>
              {accumulatedPaths.map((path, index) => (
                <div
                  key={index}
                  onClick={() => selectPath(index)}
                  className={`p-2.5 border-b border-gray-200 cursor-pointer border-l-4 ${currentPathIndex === index ? 'bg-blue-50/50 border-[#4a6cf7]' : 'border-transparent hover:bg-gray-50'}`}
                >
                  <div className={`text-sm ${currentPathIndex === index ? 'font-semibold text-[#4a6cf7]' : 'font-normal text-gray-800'}`}>
                    Path {index + 1} (Depth {path.depth})
                  </div>
                  <div className="text-xs text-gray-600 mt-1 truncate">{getPathSummary(path)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && !pathisempty && (
          <div className="flex-1 flex flex-col justify-center items-center text-base text-gray-600 gap-4 bg-gray-50">
            <div className="loading-spinner" />
            <div>Loading paths for depth {currentDepth}...</div>
          </div>
        )}

        {!isLoading && (
          <div
            className={`flex-1 overflow-hidden relative ${showPathList ? 'ml-[250px]' : 'ml-0'} transition-all duration-300`}
          >
            <div className="absolute top-2.5 right-2.5 flex flex-row z-[1001]">
              {layouts.map((layout) => (
                <button
                  key={layout.type}
                  className={`border border-gray-300 rounded p-1.5 flex items-center justify-center w-7 h-7 transition-colors duration-200 ${layoutType === layout.type ? 'bg-blue-600/80 text-white' : 'bg-white/80 text-black hover:bg-white/90'}`}
                  onClick={() => handleLayoutSelect(layout.type)}
                  title={layout.title}
                >
                  {layout.icon}
                </button>
              ))}
            </div>

            <button
              className="absolute bottom-2.5 left-2.5 z-[1001] bg-black text-white border border-gray-300 rounded w-[200px] h-10 flex items-center justify-center hover:bg-[#214d6c]/90 transition-colors duration-200"
              onClick={addCurrentPathToVisualization}
              title="Add Current Path to Visualization"
            >
              <FaPlus size={14} className="mr-1" /> Add to Canvas
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
          <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 flex justify-between">
            <div>Use the navigation buttons to explore all paths</div>
            <div>
              Click <FaList className="inline align-middle text-[10px]" /> to show path list
            </div>
          </div>
        )}

        <div className="absolute bottom-0.5 right-0.5 w-5 h-5 cursor-se-resize bg-transparent z-[11]" onMouseDown={handleResizeStart}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="absolute bottom-1.5 right-1.5">
            <path d="M1 9L9 1M5 9L9 5M9 9L9 9" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
});

export default PathVisualization;