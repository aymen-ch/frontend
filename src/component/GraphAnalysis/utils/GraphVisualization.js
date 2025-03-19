import React, { useState, useRef } from 'react';
import ContextMenu from '../modules/contextmenu/ContextMenu';
import GraphCanvas from './GraphCanvas';
import { FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaAdn, FaProjectDiagram, FaCog ,FaSearch} from 'react-icons/fa';

const GraphVisualization = React.memo(({
  setEdges,
  edges,
  setNodes,
  nodes,
  nvlRef,
  isFullscreen,
  toggleFullscreen,
  setnodetoshow,
  nodetoshow,
  setPathEdges,
  setPathNodes,
  setIsBoxPath,
  depth,
  isPathFindingStarted,
  selectedNodes,
  setSelectedNodes,
  ispath,setrelationtoshow
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [allPaths, setAllPaths] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [render, setRenderer] = useState("canvas");
  const [layoutOptions, setLayoutOptions] = useState({
    enableCytoscape: true,
    enableVerlet: false,
    gravity: -20000,
    intelWorkaround: true,
    simulationStopVelocity: 0.1,
  });
  const [showSettings, setShowSettings] = useState(false); // Toggle settings panel
  const [searchQuery, setSearchQuery] = useState(''); // Added state for search

  // Add search handler
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Add your search logic here
    // For example: filter nodes based on search query
    console.log('Search query:', query);
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
    console.log(render);
    if (render === 'WebGL') {
      nvlRef.current.setRenderer("canvas");
      setRenderer("canvas");
    } else {
      nvlRef.current.setRenderer("webgl");
      setRenderer("WebGL");
    }
  };

  const handleLayoutChange = (options) => {
    setLayoutOptions(options);
    nvlRef.current.setLayoutOptions(options);
  };

  const toggleSettingsPanel = () => {
    setShowSettings(!showSettings);
  };

  const updateLayoutOption = (key, value) => {
    const updatedOptions = { ...layoutOptions, [key]: value };
    setLayoutOptions(updatedOptions);
    nvlRef.current.setLayoutOptions(updatedOptions);
    console.log("layout seted")
  };

  const buttonStyle = {
    position: 'absolute',
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
  };

  const searchStyle = {
    position: 'absolute',
    zIndex: 1001,
    top: '15px', // Slightly increased from 10px for better spacing
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // More opaque for better contrast
    border: 'none', // Removing basic border for a cleaner look
    borderRadius: '25px', // More pronounced rounded corners
    padding: '6px 12px', // Slightly more padding for comfort
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)', // Soft, layered shadow
    transition: 'all 0.3s ease', // Smooth transition for all animated properties
    minWidth: '250px', // Minimum width to ensure it doesn't look cramped
    maxWidth: '400px', // Maximum width to prevent it from getting too wide
    '&:hover': { // Adding hover effect (note: this works in styled-components, for inline you'll need to handle it differently)
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 5px rgba(0, 0, 0, 0.07)',
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    '&:focus-within': { // Expands slightly when focused
      minWidth: '280px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 5px rgba(0, 0, 0, 0.07), 0 0 0 3px rgba(66, 153, 225, 0.3)', // Subtle focus ring
    },
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

<div
        style={searchStyle}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaSearch style={{ marginRight: '5px' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search nodes..."
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '200px',
          }}
        />
      </div>
      {/* Fullscreen Toggle Button */}
      <button
        style={{
          ...buttonStyle,
          top: '200px',
          left: '10px',
        }}
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
      </button>

      {/* Save Button */}
      <button
        style={{
          ...buttonStyle,
          top: '10px',
          left: '10px',
        }}
        onClick={handleSave}
        title="Save"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaSave size={16} />
      </button>

      {/* Back Button */}
      <button
        style={{
          ...buttonStyle,
          top: '55px',
          left: '10px',
        }}
        onClick={handleBack}
        title="Back"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaUndo size={16} />
      </button>

      {/* Earth/Global View Button */}
      <button
        style={{
          ...buttonStyle,
          top: '100px',
          left: '10px',
        }}
        onClick={handleEarth}
        title="Global View"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaTrash size={16} />
      </button>

      {/* WebGL/Canvas Toggle Button */}
      <button
        style={{
          ...buttonStyle,
          top: '150px',
          left: '10px',
        }}
        onClick={handlewebgl}
        title="Toggle Renderer"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaAdn size={16} />
      </button>

      {/* Settings Button */}
      <button
        style={{
          ...buttonStyle,
          top: '250px',
          left: '10px',
        }}
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
        nodetoshow={nodetoshow}
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
    </div>
  );
});

export default GraphVisualization;