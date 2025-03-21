// src/components/GraphVisualization.jsx
import React, { useState, useRef, useEffect } from 'react';
import ContextMenu from '../modules/contextmenu/ContextMenu';
import GraphCanvas from './Visualization/GraphCanvas';
// import PersonProfileWindow from '../modules/windows/Actions/PersonProfileWindow/PersonProfileWindow';
import PersonProfileWindow from "../modules/Windows/Actions/PersonProfileWindow/PersonProfileWindow"; // Import the window component
import { FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaAdn, FaCog, FaSearch, FaProjectDiagram, FaLayerGroup, FaSitemap, FaBezierCurve } from 'react-icons/fa';
import { d3ForceLayoutType, ForceDirectedLayoutType, FreeLayoutType, HierarchicalLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from './function_container';
import { FaDiaspora } from "react-icons/fa6";
import globalWindowState from './globalWindowState'; // Import global state

const GraphVisualization = React.memo(({
  setEdges,
  edges,
  setNodes,
  nodes,
  nvlRef,
  isFullscreen,
  toggleFullscreen,
  setnodetoshow,
  setPathEdges,
  setPathNodes,
  setIsBoxPath,
  depth,
  isPathFindingStarted,
  selectedNodes,
  setSelectedNodes,
  ispath,
  setrelationtoshow,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [allPaths, setAllPaths] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [render, setRenderer] = useState("canvas");
  const [layoutType, setLayoutType] = useState(ForceDirectedLayoutType);
  const [layoutOptions, setLayoutOptions] = useState({
    enableCytoscape: true,
    enableVerlet: false,
    gravity: -20000,
    intelWorkaround: true,
    simulationStopVelocity: 0.1,
  });
  const [showSettings, setShowSettings] = useState(false);

  const [activeWindow, setActiveWindow] = useState(null); // Local state to reflect global state
  
  const [inputValue, setInputValue] = useState('');
  useEffect(() => {
    handleLayoutChange(layoutType, nvlRef, nodes, edges, setLayoutType);
  }, [nodes.length]);


 
  // Effect to sync with global window state
  useEffect(() => {
    const checkWindowState = () => {
      setActiveWindow(globalWindowState.activeWindow); // Update local state when global state changes
    };
    // Check immediately and then poll (for simplicity; ideally use an event system or Context)
    checkWindowState();
    const interval = setInterval(checkWindowState, 100); // Poll every 100ms
    return () => clearInterval(interval); // Cleanup
  }, []);

  const handleSearchClick = () => {
    console.log("click search")
    const newFilteredNodes = filterNodesByQuery(nodes, inputValue);
    console.log(newFilteredNodes);
    // Update nodes with activated property based on whether they are in newFilteredNodes
    const updatedNodes = nodes.map(node => {
      const isActivated = newFilteredNodes.some(filteredNode => filteredNode.id === node.id);
      return {
        ...node,
        hovered:isActivated,
        activated: isActivated // Set activated to true if node is in filtered results, false otherwise
      };
    });
  console.log(updatedNodes)
  setNodes(updatedNodes); // Set the updated nodes with activated property
  };
  const handleInputChange = (e) => {
    setInputValue(e.target.value); // Update input value as user types
  };


  const handleSave = () => {
    nvlRef.current.saveFullGraphToLargeFile({
      backgroundColor: "white",
      filename: "test.png"
    });
    console.log('Save functionality to be implemented');
  };

  const handleBack = () => {
    console.log('Back functionality to be implemented');
  };

  const handleEarth = () => {
    setNodes([]);
    setEdges([]);
  };

  const handlewebgl = () => {
    if (render === 'WebGL') {
      nvlRef.current.setRenderer("canvas");
      setRenderer("canvas");
    } else {
      nvlRef.current.setRenderer("webgl");
      setRenderer("WebGL");
    }
  };

  const filterNodesByQuery = (nodes, query) => {
    if (!query) return []; // Return all nodes if query is empty
    const lowerQuery = query.toLowerCase();
    return nodes.filter(node => 
      node.properties && 
      Object.values(node.properties).some(value => 
        value && 
        value.toString().toLowerCase().includes(lowerQuery)
      )
    );
  };

  const updateLayoutOption = (key, value) => {
    const updatedOptions = { ...layoutOptions, [key]: value };
    setLayoutOptions(updatedOptions);
    nvlRef.current.setLayoutOptions(updatedOptions);
    console.log("layout seted");
  };

  const toggleSettingsPanel = () => {
    setShowSettings(!showSettings);
  };

  const handleCloseWindow = () => {
    globalWindowState.clearWindow(); // Clear global state
    setActiveWindow(null); // Clear local state
  };

  const buttonStyle = { 
    zIndex: 1001,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '35px',
    height: '35px',
    transition: 'background-color 0.2s',
    marginRight: '5px',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'rgba(66, 153, 225, 0.8)',
    color: '#fff',
  };

  const layoutControlStyle = {
    position: 'absolute',
    zIndex: 1001,
    top: '10px',
    left: '60px',
    display: 'flex',
    flexDirection: 'row',
  };

  const searchStyle = {
    position: 'absolute',
    zIndex: 1001,
    top: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '25px',
    padding: '6px 12px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    minWidth: '550px',
    maxWidth: '400px',
  };

  const layouts = [
    { type: d3ForceLayoutType, icon: <FaProjectDiagram size={16} />, title: 'D3 Force Layout' },
    { type: ForceDirectedLayoutType, icon: <FaDiaspora size={16} />, title: 'Force Directed' },
    { type: 'Operationnelle_Soutien_Leader', icon: <FaLayerGroup size={16} />, title: 'Free Layout' },
    { type: "dagre", icon: <FaSitemap size={16} />, title: 'Hierarchical Layout' },
  ];

  const handleLayoutSelect = (type) => {
    handleLayoutChange(type, nvlRef, nodes, edges, setLayoutType);
  };

  return (
    <div
      style={{
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        border: '1px solid lightgray',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 20000 : 'auto',
        backgroundColor: isFullscreen ? '#fff' : 'transparent',
        padding: '0px',
        margin: '0',
      }}
    >
      {/* Search Bar */}
      <div style={searchStyle}>
        <FaSearch 
          style={{ marginRight: '5px', cursor: 'pointer' }} 
          onClick={handleSearchClick} // Trigger search on click
        />
        <input
          type="text"
          value={inputValue} // Use inputValue instead of searchQuery
          onChange={handleInputChange} // Update inputValue as user types
          placeholder="Search nodes by any property..."
          style={{ border: 'none', outline: 'none', background: 'transparent', width: '200px' }}
        />
      </div>

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

      {/* Fullscreen Toggle Button */}
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '200px', left: '10px' }}
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
      </button>

      {/* Save Button */}
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '10px' }}
        onClick={handleSave}
        title="Save"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaSave size={16} />
      </button>

      {/* Back Button */}
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '55px', left: '10px' }}
        onClick={handleBack}
        title="Back"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaUndo size={16} />
      </button>

      {/* Earth/Global View Button */}
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '100px', left: '10px' }}
        onClick={handleEarth}
        title="Global View"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaTrash size={16} />
      </button>

      {/* WebGL/Canvas Toggle Button */}
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '150px', left: '10px' }}
        onClick={handlewebgl}
        title="Toggle Renderer"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaAdn size={16} />
      </button>

      {/* Settings Button */}
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '250px', left: '10px' }}
        onClick={toggleSettingsPanel}
        title="Layout Settings"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaCog size={16} />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            top: '300px',
            left: '10px',
            zIndex: 1002,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            width: '200px',
          }}
        >
          <h4>Layout Settings</h4>
          <div>
            <label>
              Gravity:
              <input
                type="number"
                step="0.1"
                value={layoutOptions.gravity}
                onChange={(e) => updateLayoutOption('gravity', parseFloat(e.target.value))}
              />
            </label>
          </div>
          <div>
            <label>
              Simulation Stop Velocity:
              <input
                type="number"
                step="0.1"
                value={layoutOptions.simulationStopVelocity}
                onChange={(e) => updateLayoutOption('simulationStopVelocity', parseFloat(e.target.value))}
              />
            </label>
          </div>
          <div>
            <label>
              Enable Cytoscape:
              <input
                type="checkbox"
                checked={layoutOptions.enableCytoscape}
                onChange={(e) => updateLayoutOption('enableCytoscape', e.target.checked)}
              />
            </label>
          </div>
          <div>
            <label>
              Enable Verlet:
              <input
                type="checkbox"
                checked={layoutOptions.enableVerlet}
                onChange={(e) => updateLayoutOption('enableVerlet', e.target.checked)}
              />
            </label>
          </div>
        </div>
      )}

      <GraphCanvas
        nvlRef={nvlRef}
        combinedNodes={nodes}
        combinedEdges={edges}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
        setContextMenu={setContextMenu}
        setnodetoshow={setnodetoshow}
        ispath={ispath}
        setrelationtoshow={setrelationtoshow}
        setEdges={setEdges}
      />

      {contextMenu && contextMenu.visible && (
        <ContextMenu
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          setNodes={setNodes}
          setEdges={setEdges}
          setSelectedNodes={setSelectedNodes}
          selectedNodes={selectedNodes}
          setAllPaths={setAllPaths}
          setCurrentPathIndex={setCurrentPathIndex}
          setPathEdges={setPathEdges}
          setPathNodes={setPathNodes}
          nvlref={nvlRef}
          setIsBoxPath={setIsBoxPath}
          depth={depth}
          isPathFindingStarted={isPathFindingStarted}
        />
      )}

      {/* Render PersonProfileWindow based on global state */}
      {activeWindow === 'PersonProfile' && (
        <PersonProfileWindow node={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}
    </div>
  );
});

export default GraphVisualization;