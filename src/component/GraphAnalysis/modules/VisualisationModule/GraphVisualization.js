import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import ContextMenu from '../../Modules/InterrogationModule/Oreinted/Extensibilty/NodeContextMenu';
import GraphCanvas from '../VisualisationModule/GraphCanvas';
import PersonProfileWindow from "../Windows/Actions/PersonProfileWindow/PersonProfileWindow";
import AddActionWindow from "../Windows/Actions/PersonProfileWindow/Actions";
import Analyse_statistique from "../Windows/Actions/PersonProfileWindow/analyse_statistique";
import Analyse_BackEnd from "../Windows/Actions/PersonProfileWindow/Analyse_BackEnd";
import Community_BackEnd from "../Windows/Actions/PersonProfileWindow/Community_BackEnd";
import { FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';
import { MdOutlineTabUnselected } from "react-icons/md";
import { ForceDirectedLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from '../function_container';
import globalWindowState from '../globalWindowState';
import { useTranslation } from 'react-i18next';
import { filterNodesByQuery } from './GraphVisualizationUtils';
import { BASE_URL_Backend } from '../../Platforme/Urls';
import { getNodeColor, getNodeIcon, createNode } from '../Parser';
import LayoutControl from '../VisualisationModule/layout/Layoutcontrol';
import ContextMenuRel from '../InterrogationModule/Oreinted/Extensibilty/contextmenuRelarion';
import ContextMenucanvas from '../InterrogationModule/Oreinted/Extensibilty/contextmenucanvas';
import PropTypes from 'prop-types';

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
  setSubGrapgTable,
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveType, setSaveType] = useState('png');
  const [fileName, setFileName] = useState('');

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
        const response = await axios.post(BASE_URL_Backend + '/recherche/', {
          query: inputValue
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const limitedResults = response.data.slice(0, 50);
        setSearchResults(limitedResults);
      } catch (error) {
        console.error('Error searching database:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddNodeToCanvas = (result) => {
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
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async () => {
    if (!fileName.trim()) {
      alert(t('Please enter a file name'));
      return;
    }
    if (saveType === 'png') {
      nvlRef.current.saveFullGraphToLargeFile({
        backgroundColor: "white",
        filename: `${fileName}.png`
      });
    }
    setShowSaveModal(false);
    setFileName('');
    setSaveType('png');
  };

  const handleSaveCancel = () => {
    setShowSaveModal(false);
    setFileName('');
    setSaveType('json');
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
    <div className={`w-full h-full ${isFullscreen ? 'fixed inset-0 z-[20000] bg-white' : 'relative border border-gray-300'}`}>
      {/* Search Bar - Hidden on small screens, visible on md and above */}
     <div
  ref={searchRef}
  className="hidden 2xl:flex absolute top-2 left-1/2 transform -translate-x-1/2 z-[100] items-center bg-white/95 rounded-full px-4 py-2 shadow-md border border-gray-200/30 hover:shadow-lg hover:scale-[1.02] transition-all max-w-md w-full"
>
  <FaSearch
    className="mr-2 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
    onClick={handleSearchClick}
  />
  <input
    type="text"
    value={inputValue}
    onChange={handleInputChange}
    placeholder={t("Search nodes by any property")}
    className="flex-1 border-none outline-none bg-transparent text-gray-800 text-sm placeholder-gray-500"
  />
  {isLoading ? (
    <FaSpinner className="mr-2 text-gray-600 animate-spin" />
  ) : (
    inputValue && (
      <FaTimes
        className="mr-2 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
        onClick={handleClearSearch}
        title="Clear search"
      />
    )
  )}
  <select
    value={searchtype}
    onChange={handleSearchTypeChange}
    className="ml-2 p-1 border border-gray-200 rounded bg-white/90 text-sm cursor-pointer hover:bg-white hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
  >
    <option value="current_graph">{t('Current Graph')}</option>
    <option value="database">{t('Database')}</option>
  </select>
</div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-[1002] top-14 left-1/2 transform -translate-x-1/2 bg-white/95 rounded-lg p-3 max-h-80 overflow-y-auto shadow-lg border border-gray-100/50 w-80 md:w-96"
        >
          {searchResults.map((result, index) => {
            const nodeType = result.properties.type;
            const iconSrc = getNodeIcon(nodeType);
            const backgroundColor = getNodeColor(nodeType);

            return (
              <div
                key={result.id || index}
                className="p-2 cursor-pointer border-b border-gray-100/50 flex items-center hover:bg-gray-50 transition-colors"
                onClick={() => handleAddNodeToCanvas(result)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                  style={{ backgroundColor }}
                >
                  <img src={iconSrc} alt={nodeType} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{nodeType}</div>
                  <div className="text-xs">
                    {result.properties && Object.entries(result.properties).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600">
                    Score: {result.properties.score.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls Container - LayoutControl and Other Buttons Side by Side on md+ */}
      <div className="absolute top-2 left-2 z-[1000] flex flex-col md:flex-row gap-2 items-start">
        <LayoutControl
          nvlRef={nvlRef}
          nodes={nodes}
          edges={edges}
          layoutType={layoutType}
          setLayoutType={setLayoutType}
        />

  


        <div className="flex flex-col md:flex-row gap-2 bg-white/95 rounded-lg p-2 shadow-md">
    <button
      className="bg-white/80 border border-gray-200 rounded p-2 hover:bg-white hover:scale-105 transition-all"
      onClick={handleSave}
      title={t('Save')}
    >
      <FaSave className="text-gray-600" size={16} />
    </button>
    <button
      className="bg-white/80 border border-gray-200 rounded p-2 hover:bg-white hover:scale-105 transition-all"
      onClick={toggleFullscreen}
      title={isFullscreen ? t("Exit Fullscreen") : t("Enter Fullscreen")}
    >
      {isFullscreen ? <FaCompress className="text-gray-600" size={16} /> : <FaExpand className="text-gray-600" size={16} />}
    </button>
    <button
      className="bg-white/80 border border-gray-200 rounded p-2 hover:bg-white hover:scale-105 transition-all"
      onClick={handleDelete}
      title={t('Delete Selected')}
    >
      <FaTrash className="text-gray-600" size={16} />
    </button>
    <button
      className={`border border-gray-200 rounded p-2 hover:scale-105 transition-all ${multiselecte ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/80 hover:bg-white'}`}
      onClick={hanldemultiselecte}
      title={t('Multi select')}
    >
      <MdOutlineTabUnselected className={`${multiselecte ? 'text-white' : 'text-gray-600'}`} size={16} />
    </button>
  </div>
<select
  value={render}
  onChange={handlewebgl}
  className="mt-[2.5px] h-[45px] bg-white/95 border border-gray-200 rounded px-3 py-2 text-sm cursor-pointer hover:bg-white hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-md"
  title={t('Select Renderer')}
>
  <option value="canvas">{t('Canvas')}</option>
  <option value="WebGL">{t('WebGL')}</option>
</select>


      </div>

      {/* Graph Canvas */}
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

      {/* Context Menus */}
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

      {/* Windows */}
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

      {/* Save Modal */}
      <Modal show={showSaveModal} onHide={handleSaveCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('Save Graph')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="saveType" className="mb-3">
              <Form.Label>{t('Save As')}</Form.Label>
              <Form.Control
                as="select"
                value={saveType}
                onChange={(e) => setSaveType(e.target.value)}
              >
                <option value="png">{t('Image (PNG)')}</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="fileName">
              <Form.Label>{t('File Name')}</Form.Label>
              <Form.Control
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={t('Enter file name')}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleSaveCancel}>
            {t('Cancel')}
          </Button>
          <Button variant="primary" onClick={handleSaveConfirm}>
            {t('Save')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
});

GraphVisualization.propTypes = {
  setEdges: PropTypes.func.isRequired,
  edges: PropTypes.arrayOf(PropTypes.object).isRequired,
  setNodes: PropTypes.func.isRequired,
  nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  nvlRef: PropTypes.object.isRequired,
  isFullscreen: PropTypes.bool.isRequired,
  toggleFullscreen: PropTypes.func.isRequired,
  setnodetoshow: PropTypes.func.isRequired,
  setPathEdges: PropTypes.func.isRequired,
  setPathNodes: PropTypes.func.isRequired,
  setIsBoxPath: PropTypes.func.isRequired,
  depth: PropTypes.number,
  isPathFindingStarted: PropTypes.bool,
  selectedNodes: PropTypes.instanceOf(Set).isRequired,
  setSelectedNodes: PropTypes.func.isRequired,
  ispath: PropTypes.bool.isRequired,
  setrelationtoshow: PropTypes.func.isRequired,
  setActiveAggregations: PropTypes.func.isRequired,
  selectedEdges: PropTypes.instanceOf(Set).isRequired,
  setselectedEdges: PropTypes.func.isRequired,
  setSubGrapgTable: PropTypes.func.isRequired,
};

export default GraphVisualization;