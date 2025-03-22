// src/components/GraphVisualization.jsx
import React, { useState, useEffect } from 'react';
import ContextMenu from '../../modules/contextmenu/ContextMenu';
import GraphCanvas from '../Visualization/GraphCanvas';
import PersonProfileWindow from "../../modules/Windows/Actions/PersonProfileWindow/PersonProfileWindow";
import { FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaAdn, FaCog, FaSearch } from 'react-icons/fa';
import { FaDiaspora } from "react-icons/fa6";
import { d3ForceLayoutType, ForceDirectedLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from '../function_container';
import globalWindowState from '../globalWindowState';
import { 
  buttonStyle, 
  activeButtonStyle, 
  layoutControlStyle, 
  searchStyle, 
  containerStyle,
  settingsPanelStyle 
} from './GraphVisualizationStyles';
import { filterNodesByQuery, updateLayoutOption } from './GraphVisualizationUtils';
import { FaProjectDiagram, FaLayerGroup, FaSitemap } from 'react-icons/fa';

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
  const [searchtype, setsearchtype] = useState("current_graph");
  const [layoutOptions, setLayoutOptions] = useState({
    enableCytoscape: true,
    enableVerlet: false,
    gravity: -20000,
    intelWorkaround: true,
    simulationStopVelocity: 0.1,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeWindow, setActiveWindow] = useState(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    handleLayoutChange(layoutType, nvlRef, nodes, edges, setLayoutType);
  }, [nodes.length]);

  useEffect(() => {
    const checkWindowState = () => {
      setActiveWindow(globalWindowState.activeWindow);
    };
    checkWindowState();
    const interval = setInterval(checkWindowState, 100);
    return () => clearInterval(interval);
  }, []);

  const handleSearchClick = () => {
    if (searchtype === "current_graph") {
      const newFilteredNodes = filterNodesByQuery(nodes, inputValue);
      const updatedNodes = nodes.map(node => {
        const isActivated = newFilteredNodes.some(filteredNode => filteredNode.id === node.id);
        return {
          ...node,
          hovered: isActivated,
          activated: isActivated
        };
      });
      setNodes(updatedNodes);
    } else {
      // Add database search logic here
      console.log('Database search to be implemented for query:', inputValue);
    }
  };

  const handleSearchTypeChange = (e) => {
    setsearchtype(e.target.value);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSave = () => {
    nvlRef.current.saveFullGraphToLargeFile({
      backgroundColor: "white",
      filename: "test.png"
    });
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

  const toggleSettingsPanel = () => {
    setShowSettings(!showSettings);
  };

  const handleCloseWindow = () => {
    globalWindowState.clearWindow();
    setActiveWindow(null);
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
    <div style={containerStyle(isFullscreen)}>
      <div style={{ ...searchStyle, display: 'flex', alignItems: 'center' }}>
        <FaSearch 
          style={{ marginRight: '5px', cursor: 'pointer' }} 
          onClick={handleSearchClick}
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Search nodes by any property..."
          style={{ border: 'none', outline: 'none', background: 'transparent', width: '200px', marginRight: '10px' }}
        />
        <select
          value={searchtype}
          onChange={handleSearchTypeChange}
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer'
          }}
        >
          <option value="current_graph">Current Graph</option>
          <option value="database">Database</option>
        </select>
      </div>

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

      {/* Rest of the buttons remain unchanged */}
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '200px', left: '10px' }}
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '10px' }}
        onClick={handleSave}
        title="Save"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaSave size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '55px', left: '10px' }}
        onClick={handleBack}
        title="Back"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaUndo size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '100px', left: '10px' }}
        onClick={handleEarth}
        title="Global View"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaTrash size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '150px', left: '10px' }}
        onClick={handlewebgl}
        title="Toggle Renderer"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaAdn size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '250px', left: '10px' }}
        onClick={toggleSettingsPanel}
        title="Layout Settings"
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaCog size={16} />
      </button>


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

      {activeWindow === 'PersonProfile' && (
        <PersonProfileWindow node={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}
    </div>
  );
});

export default GraphVisualization;