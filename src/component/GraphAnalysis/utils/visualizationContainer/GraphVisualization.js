import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ContextMenu from '../../modules/contextmenu/ContextMenu';
import GraphCanvas from '../Visualization/GraphCanvas';
import PersonProfileWindow from "../../modules/Windows/Actions/PersonProfileWindow/PersonProfileWindow";
import { FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaAdn, FaCog, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import { FaDiaspora } from "react-icons/fa6";
import { d3ForceLayoutType, ForceDirectedLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange, fetchNodeProperties } from '../function_container';
import globalWindowState from '../globalWindowState';
import { 
  buttonStyle, 
  activeButtonStyle, 
  layoutControlStyle, 
  searchStyle, 
  containerStyle,
  settingsPanelStyle,
  searchSelectStyle 
} from './GraphVisualizationStyles';
import { filterNodesByQuery, updateLayoutOption } from './GraphVisualizationUtils';
import { FaProjectDiagram, FaLayerGroup, FaSitemap } from 'react-icons/fa';
import { BASE_URL } from '../Urls';
import { getNodeColor, getNodeIcon, createNode } from '../Parser';

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
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const searchRef = useRef(null);
  const resultsRef = useRef(null);

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

  const handleSearchClick = async () => {
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
      nvlRef.current.fit(
        newFilteredNodes.map((n) => n.id), 
        {
          animated: true,
          maxZoom: 1.0,
          minZoom: 0.5,
          outOnly: false
        }
      );
      setSearchResults([]);
    } else {
      setIsLoading(true); // Start loading
      try {
        const response = await axios.post(BASE_URL + '/recherche/', {
          query: inputValue
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const limitedResults = response.data.slice(0, 50);
        setSearchResults(limitedResults);
        //console.log(response.data);
      } catch (error) {
        console.error('Error searching database:', error);
        setSearchResults([{ node: { id: 'error', label: 'Error performing search' }, score: 0 }]);
      } finally {
        setIsLoading(false); // Stop loading
      }
    }
  };

  const handleAddNodeToCanvas = (result) => {
    setNodes(prevNodes => {
      const node = createNode(result.properties, result.type, result.properties);
      if (prevNodes.some(n => n.id === node.id)) {
        return prevNodes;
      }
      return [...prevNodes, { ...node }];
    });
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setInputValue('');
  };

  const handleSearchTypeChange = (e) => {
    setsearchtype(e.target.value);
    setSearchResults([]);
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
      <div ref={searchRef} style={{ ...searchStyle, display: 'flex', alignItems: 'center' }}>
        <FaSearch 
          style={{ marginRight: '5px', cursor: 'pointer' }} 
          onClick={handleSearchClick}
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Search nodes by any property..."
          style={{ border: 'none', outline: 'none', background: 'transparent', width: '200px', marginRight: '5px' }}
        />
        {isLoading ? (
          <FaSpinner
            style={{ marginRight: '5px', color: '#666', animation: 'spin 1s linear infinite' }}
          />
        ) : inputValue && (
          <FaTimes
            style={{ marginRight: '5px', cursor: 'pointer', color: '#666' }}
            onClick={handleClearSearch}
            title="Clear search"
          />
        )}
        <select
          value={searchtype}
          onChange={handleSearchTypeChange}
          style={searchSelectStyle}
        >
          <option value="current_graph">Current Graph</option>
          <option value="database">Database</option>
        </select>
      </div>

      {searchResults.length > 0 && (
        <div 
          ref={resultsRef}
          style={{
            position: 'absolute',
            zIndex: 1002,
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '8px',
            padding: '10px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            width: '350px',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          {searchResults.map((result, index) => {
            const nodeType = result.type;
            const iconSrc = getNodeIcon(nodeType);
            const backgroundColor = getNodeColor(nodeType);

            return (
              <div
                key={result.identity || index}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                  }
                }}
                onClick={() => handleAddNodeToCanvas(result)}
              >
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '10px',
                }}>
                  <img 
                    src={iconSrc} 
                    alt={nodeType} 
                    style={{ width: '20px', height: '20px' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {nodeType}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    {result.properties && Object.entries(result.properties).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Score: {result.score.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
        setNodes={setNodes}
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