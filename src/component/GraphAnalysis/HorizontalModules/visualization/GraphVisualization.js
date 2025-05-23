import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ContextMenu from '../../modules/contextmenu/ContextMenu';
import GraphCanvas from '../../utils/VisualizationLibrary/GraphCanvas';
import PersonProfileWindow from "../../modules/Windows/Actions/PersonProfileWindow/PersonProfileWindow";
import AddActionWindow from "../../modules/Windows/Actions/PersonProfileWindow/Actions";
import Analyse_statistique from "../../modules/Windows/Actions/PersonProfileWindow/analyse_statistique";
import Analyse_BackEnd from "../../modules/Windows/Actions/PersonProfileWindow/Analyse_BackEnd";
import Community_BackEnd from "../../modules/Windows/Actions/PersonProfileWindow/Community_BackEnd";
import { FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaCog, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';
import { MdOutlineTabUnselected } from "react-icons/md";
import { FaDiaspora } from "react-icons/fa6";
import { d3ForceLayoutType, ForceDirectedLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from '../containervisualization/function_container';
import globalWindowState from '../../utils/globalWindowState';
import { useTranslation } from 'react-i18next';
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
import { BASE_URL } from '../../utils/Urls';
import { getNodeColor, getNodeIcon, createNode } from '../../utils/Parser';
import LayoutControl from '../../modules/layout/Layoutcontrol';
import ContextMenuRel from '../../modules/contextmenu/contextmenuRelarion';
import ContextMenucanvas from '../../modules/contextmenu/contextmenucanvas';
import { useGlobalContext } from '../../GlobalVariables';

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
  setActiveAggregations,
  selectedEdges,
  setselectedEdges,
  setSubGrapgTable
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [contextMenuRel, setContextMenuRel] = useState(null);
  const [ContextMenucanvass, SetContextMenucanvass] = useState(null);
  const { t } = useTranslation();

  const [allPaths, setAllPaths] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [render, setRenderer] = useState("canvas");
  const [layoutType, setLayoutType] = useState(ForceDirectedLayoutType);
  const [searchtype, setsearchtype] = useState("current_graph");
  const [graphHistory, setGraphHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [showSettings, setShowSettings] = useState(false);
  const [activeWindow, setActiveWindow] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [multiselecte, setmultiselecte] = useState(false);

  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const fetchNodeAnalysis = async () => {
      if (nodes.length === 0) return;

      try {
        const analysisPromises = nodes.map((node) =>
          axios
            .post(
              BASE_URL+'/node-analysis/',
              { id: node.id },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
            .then((response) => ({
              id: node.id,
              properties_analyse: response.data.properties_analyse || {},
            }))
            .catch((error) => {
              console.error(`Error fetching properties_analyse for node ${node.id}:`, error.message);
              return { id: node.id, properties_analyse: {} };
            })
        );

        const analysisResults = await Promise.all(analysisPromises);
        console.log("analysis result", analysisResults);
        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            const result = analysisResults.find((res) => res.id === node.id);
            return {
              ...node,
              properties_analyse: {
                ...result?.properties_analyse,
              },
            };
          })
        );
      } catch (error) {
        console.error('Error fetching node analysis:', error.message);
      }
    };
    
    // fetchNodeAnalysis();
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

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const newState = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now()
      };
      
      if (historyIndex < graphHistory.length - 1) {
        setGraphHistory(prev => prev.slice(0, historyIndex + 1));
      }
      
      setGraphHistory(prev => [...prev, newState]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [nodes, edges]);

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
      setIsLoading(true);
      try {
        const response = await axios.post(BASE_URL + '/recherche/', {
          query: inputValue
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const limitedResults = response.data.slice(0, 50);
        console.log(limitedResults);
        setSearchResults(limitedResults);
      } catch (error) {
        console.error('Error searching database:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddNodeToCanvas = (result) => {
    console.log(result);
    setNodes(prevNodes => {
      const node = createNode(result.id, result.properties.type, result.properties);
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
    if (historyIndex > 0) {
      const previousIndex = historyIndex - 1;
      const previousState = graphHistory[previousIndex];
      
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(previousIndex);
      
      setSelectedNodes([]);
      setselectedEdges([]);
      
      setTimeout(() => {
        nvlRef.current.fit(
          previousState.nodes.map(n => n.id),
          {
            animated: true,
            maxZoom: 1.0,
            minZoom: 0.5
          }
        );
      }, 100);
      
      console.log(`Reverted to state ${previousIndex + 1} of ${graphHistory.length}`);
    } else {
      console.log('No previous state available');
    }
  };

  const handleDelete = () => {
    const selectedNodeIds = Array.from(selectedNodes);
    const updatedNodes = nodes.filter(node => !selectedNodeIds.includes(node.id));
    const updatedEdges = edges.filter(
      edge => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
    );
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSubGrapgTable({ results: [] });
    setSelectedNodes(new Set());
    setselectedEdges(new Set());
  };

  const handlewebgl = (e) => {
    const selectedRenderer = e.target.value;
    setRenderer(selectedRenderer);
    nvlRef.current.setRenderer(selectedRenderer.toLowerCase());
  };

  const hanldemultiselecte = () => {
    setmultiselecte(!multiselecte);
  };

  const toggleSettingsPanel = () => {
    setShowSettings(!showSettings);
  };

  const handleCloseWindow = () => {
    globalWindowState.clearWindow();
    setActiveWindow(null);
  };

  return (
    <div style={containerStyle(isFullscreen)}>
      <div ref={searchRef} style={{ ...searchStyle, display: 'flex', alignItems: 'center' }}>
        <FaSearch 
          style={{ marginRight: '5px', cursor: 'pointer', width: '200px' }} 
          onClick={handleSearchClick}
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}  
          placeholder={t("Search nodes by any property")}
          style={{ border: 'none', outline: 'none', background: 'transparent', width: '500px', marginRight: '5px' }}
        />
        {isLoading ? (
          <FaSpinner
            style={{ marginRight: '5px', color: '#666', animation: 'spin 1s linear infinite' }}
          />
        ) : inputValue && (
          <FaTimes
            style={{ marginRight: '5px', cursor: 'pointer', color: '#666', width: '200px' }}
            onClick={handleClearSearch}
            title="Clear search"
          />
        )}
        <select
          value={searchtype}
          onChange={handleSearchTypeChange}
          style={searchSelectStyle}
        >
          <option value="current_graph">{t('Current Graph')}</option>
          <option value="database">{t('Database')}</option>
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
            const nodeType = result.properties.type;
            const iconSrc = getNodeIcon(nodeType);
            const backgroundColor = getNodeColor(nodeType);

            return (
              <div
                key={result.id || index}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
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
                    Score: {result.properties.score.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <LayoutControl 
        nvlRef={nvlRef}
        nodes={nodes}
        edges={edges}
        layoutType={layoutType}
        setLayoutType={setLayoutType} 
      />

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '380px' }}
        onClick={handleSave}
        title={t('Save')}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaSave size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '420px' }}
        onClick={toggleFullscreen}
        title={isFullscreen ? t("Exit Fullscreen") : t("Enter Fullscreen")}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '460px' }}
        onClick={handleBack}
        title={t('Back')}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaUndo size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '500px' }}
        onClick={handleDelete}
        title={t('Delete Selected')}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
      >
        <FaTrash size={16} />
      </button>

      {/* Renderer Dropdown */}
      <select
        value={render}
        onChange={handlewebgl}
        style={{
          ...searchSelectStyle,
          position: 'absolute',
          top: '10px',
          left: '580px',
          width: '100px',
          height: '35px',
          padding: '0 8px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '4px',
          zIndex: 1001,
          fontSize: '14px',
          cursor: 'pointer',
        }}
        title={t('Select Renderer')}
      >
        <option value="canvas">{t('Canvas')}</option>
        <option value="WebGL">{t('WebGL')}</option>
      </select>

      <button
        style={{
          ...buttonStyle,
          position: 'absolute',
          top: '10px',
          left: '540px',
         
          backgroundColor: multiselecte ? 'blue' : 'rgba(255, 255, 255, 0.8)',
          cursor: multiselecte ? 'crosshair' : 'pointer',
        }}
        onClick={hanldemultiselecte}
        title={t('Multi select')}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = multiselecte ? 'darkblue' : 'rgba(255, 255, 255, 0.9)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = multiselecte ? 'blue' : 'rgba(255, 255, 255, 0.8)'}
      >
        <MdOutlineTabUnselected size={16} />
      </button>

      <GraphCanvas
        nvlRef={nvlRef}
        nodes={nodes}
        edges={edges}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
        setContextMenu={setContextMenu}
        setContextMenuRel={setContextMenuRel}
        SetContextMenucanvas={SetContextMenucanvass}
        setnodetoshow={setnodetoshow}
        ispath={ispath}
        setrelationtoshow={setrelationtoshow}
        setEdges={setEdges}
        setNodes={setNodes}
        selectedEdges={selectedEdges}
        setselectedEdges={setselectedEdges}
        layoutType={layoutType}
        multiselecte={multiselecte}
        setmultiselecte={setmultiselecte}
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
          setActiveAggregations={setActiveAggregations}
        />
      )}

      {contextMenuRel && contextMenuRel.visible && (
        <ContextMenuRel
          contextMenuRel={contextMenuRel}
          setContextMenuRel={setContextMenuRel}
          setNodes={setNodes}
          setEdges={setEdges}
        />
      )}

      {ContextMenucanvass && ContextMenucanvass.visible && (
        <ContextMenucanvas
          ContextMenucanvas={ContextMenucanvass}
          SetContextMenucanvas={SetContextMenucanvass}
          setNodes={setNodes}
          setEdges={setEdges}
          selectedNodes={selectedNodes}
          setSelectedNodes={setSelectedNodes}
          selectedEdges={selectedEdges}
          setselectedEdges={setselectedEdges}
        />
      )}

      {activeWindow === 'PersonProfile' && (
        <PersonProfileWindow node={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}
      {activeWindow === 'add_action' && (
        <AddActionWindow node={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}

      {activeWindow === 'analyse_statistique' && (
        <Analyse_statistique data={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}
      {activeWindow === 'Analyse_BackEnd' && (
        <Analyse_BackEnd selectedGroup={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}

      {activeWindow === 'Community_BackEnd' && (
        <Community_BackEnd selectedGroup={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}
    </div>
  );
});

export default GraphVisualization;