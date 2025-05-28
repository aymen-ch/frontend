import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ContainerModules.css';
import ContextManagerComponent from '../Modules/AnalysisModule/AnalyseTempSpatiale/ContextManager';
import GraphVisualization from '../Modules/VisualisationModule/GraphVisualization';
import Aggregation from '../Modules/AnalysisModule/Aggregation/aggregation';
import TimelineBar from '../Modules/AnalysisModule/AnalyseTempSpatiale/BarScroll';
import PathVisualization from '../Modules/AnalysisModule/PathDetection/pathvisualizationCanvas';
import PathFinder from '../Modules/AnalysisModule/PathDetection/PathInput';
import Analysis from '../Modules/AnalysisModule/AnalysisAlgorithms/analysis';
import DetailsModule from '../Modules/InterrogationModule/Details/Details';
import InterrogationModule from '../Modules/InterrogationModule/interrogation';
import { useAggregation, fetchNodeProperties, drawCirclesOnPersonneNodes, ColorPersonWithClass, fetchNoderelation } from './function_container';
import { NODE_CONFIG } from './Parser';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { FaInfoCircle, FaCogs, FaPlusCircle ,FaSpinner} from 'react-icons/fa';

const MemoizedGraphVisualization = memo(GraphVisualization);
const Memoizedcontext = memo(ContextManagerComponent);

const Container_AlgorithmicAnalysis = () => {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [SubGrapgTable, setSubGrapgTable] = useState({ results: [] });
  const [activeModule, setActiveModule] = useState(null);
  const nvlRef = useRef(null);
  const nvlRefPath = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [SelectecRelationData, setSelectecRelationData] = useState(null);
  const [nodetoshow, setnodetoshow] = useState();
  const [relationtoshow, setrelationtoshow] = useState(null);
  const [selectedOption, setSelectedOption] = useState('option1');
  const [pathisempty, setPathisempty] = useState(false);
  const [pathNodes, setPathNodes] = useState([]);
  const [pathEdges, setPathEdges] = useState([]);
  const [currentSubGraphIndex, setCurrentSubGraphIndex] = useState(0);
  const [isBoxPath, setIsBoxPath] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [affairesInRange, setAffairesInRange] = useState([]);
  const [allPaths, setAllPaths] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [activeAggregations, setActiveAggregations] = useState({});
  const [visibleNodeTypes, setVisibleNodeTypes] = useState({});
  const [selectedEdges, setselectedEdges] = useState(new Set());

  const [pathFindingParams, setPathFindingParams] = useState(null);
  const [shortestPathParams, setShortestPathParams] = useState(null);
  // Callback functions to pass to PathFinder
  const handleStartPathFinding = (params) => {
    setPathFindingParams(params);
  };

  const handleStartShortestPath = (params) => {
    setShortestPathParams(params);
  };

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  useEffect(() => {
    const nodeTypes = {};
    nodes.forEach((node) => {
      if (!nodeTypes[node.group]) {
        nodeTypes[node.group] = true;
      }
    });
    setVisibleNodeTypes(nodeTypes);
  }, [nodes]);

  const toggleNodeTypeVisibility = (nodeType) => {
    setVisibleNodeTypes((prev) => ({
      ...prev,
      [nodeType]: !prev[nodeType],
    }));
  };

  const handleModuleClick = (module) => {
    setActiveModule(activeModule === module ? null : module);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (nodetoshow) {
      fetchNodeProperties(nodetoshow, setSelectedNodeData);
    }
  }, [nodetoshow]);

  useEffect(() => {
    if (relationtoshow) {
      fetchNoderelation(relationtoshow, setSelectecRelationData);
    }
  }, [relationtoshow]);

  const extractAffaires = () => {
    return SubGrapgTable.results.map((result, index) => {
      const affaireData = {
        id: result.affaire.id,
        type: result.affaire.properties.Number,
        date: result.affaire.properties.date,
      };

      if (result.nodes && Array.isArray(result.nodes)) {
        result.nodes.forEach((node) => {
          const nodeType = node.node_type || node.group || 'unknown';
          const nodeProperties = node.properties || {};
          Object.entries(nodeProperties).forEach(([key, value]) => {
            affaireData[`${nodeType}_${key}`] = value;
          });
          affaireData[`${nodeType}_type`] = nodeType;
        });
      }

      return affaireData;
    });
  };

  const handlePrevSubGraph = () => {
    if (currentSubGraphIndex > 0) {
      setCurrentSubGraphIndex(currentSubGraphIndex - 1);
    }
  };

  const handleNextSubGraph = () => {
    if (currentSubGraphIndex < SubGrapgTable.results.length - 1) {
      setCurrentSubGraphIndex(currentSubGraphIndex + 1);
    }
  };

  useEffect(() => {
    if (SubGrapgTable.results.length > 0 && affairesInRange.length === 0) {
      setAffairesInRange([SubGrapgTable.results[0].affaire.id]);
      setCurrentSubGraphIndex(0);
    }
  }, [SubGrapgTable]);

  useAggregation(affairesInRange, activeAggregations, SubGrapgTable, setNodes, setEdges);

  const combinedNodes = [...nodes].filter((node) => !node.hidden);
  const combinedEdges = [...edges].filter((edge) => !edge.hidden);

  const handleNodeConfigChange = (change) => {
    if (change.type === 'size') {
      const updatedNodes = combinedNodes.map((node) => {
        if (node.group === change.nodeType) {
          const size = change.value[node.id] || NODE_CONFIG.nodeTypes[change.nodeType]?.size || 100;
          if (typeof size !== 'number' || size <= 0) {
            console.warn(`Invalid size for node ${node.id}: ${size}, using default`);
            return { ...node, size: NODE_CONFIG.nodeTypes[change.nodeType]?.size || 100 };
          }
          return { ...node, size };
        }
        return { ...node, size: node.size || NODE_CONFIG.nodeTypes[change.nodeType]?.size || 100 };
      });
      setNodes(updatedNodes);
    } else if (change.type === 'color') {
      const updatedNodes = combinedNodes.map((node) => {
        if (node.group === change.nodeType) {
          return { ...node, color: change.value };
        }
        return node;
      });
      setNodes(updatedNodes);
    }
  };

  return (
  <div className="h-[calc(100vh-50px)] bg-gradient-to-b from-gray-50 to-gray-100 p-0 overflow-hidden relative">
    <div className="flex flex-col min-h-screen p-0">
      <div className="flex flex-grow m-0 p-0">
        <div className={`flex-grow ${isFullscreen ? 'p-0 h-screen' : 'lg:w-full md:w-full w-full h-[calc(100vh-60px)] overflow-y-auto'} rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)] mr-[60px]`}>
          <MemoizedGraphVisualization
            setEdges={setEdges}
            edges={combinedEdges}
            setNodes={setNodes}
            nodes={combinedNodes}
            nvlRef={nvlRef}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            setnodetoshow={setnodetoshow}
            setPathEdges={setPathEdges}
            setPathNodes={setPathNodes}
            setIsBoxPath={setIsBoxPath}
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            ispath={true}
            setrelationtoshow={setrelationtoshow}
            setActiveAggregations={setActiveAggregations}
            selectedEdges={selectedEdges}
            setselectedEdges={setselectedEdges}
            setSubGrapgTable={setSubGrapgTable}
          />

          {isBoxPath > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg">
                <PathVisualization
                  setEdges={setEdges}
                  edges={pathEdges}
                  setNodes={setNodes}
                  nodes={pathNodes}
                  nvlRef={nvlRefPath}
                  nodetoshow={nodetoshow}
                  setnodetoshow={setnodetoshow}
                  setPathEdges={setPathEdges}
                  setPathNodes={setPathNodes}
                  setIsBoxPath={setIsBoxPath}
                  allPaths={allPaths}
                  currentPathIndex={currentPathIndex}
                  setCurrentPathIndex={setCurrentPathIndex}
                  selectednodes={selectedNodes}
                  setSelectedNodes={setSelectedNodes}
                  ispath={false}
                  setAllPaths={setAllPaths}
                  setPathisempty={setPathisempty}
                  pathisempty={pathisempty}
                  setrelationtoshow={setrelationtoshow}
                />
              </div>
            </div>
          )}

              
        </div>

        {true && (
          <div className="absolute right-0 top-0 bottom-0 w-[60px] flex flex-col z-50 p-0">
            <div className="flex flex-col h-full bg-[#E4EFE7] border-l border-black/10 overflow-y-auto justify-start pt-0 mt-0">
              {[
                t('Details'),
                t('Interrogation'),
                t('Contextualization'),
                t('Detection de Chemin'),
                t('Aggregation'),
                t('Analysis'),
              ].map((module) => (
                <div
                  key={module}
                  className={`flex items-center justify-center min-h-[100px] border-b border-white/10 text-gray-500 cursor-pointer transition-all writing-mode-vertical-rl px-3 py-4 ${
                    activeModule === module
                      ? 'bg-[#E6F0FA] border-l-4 border-cyan-500 text-blue-800 transform scale-105 shadow-md'
                      : ''
                  }`}
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  onClick={() => handleModuleClick(module)}
                >
                 {module}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModule && (
        <div
    className="absolute right-[60px] top-0 bottom-0 w-[700px] lg:w-[600px] md:w-[400px] sm:w-[300px] bg-white shadow-[-3px_0_10px_rgba(0,0,0,0.1)] z-20 overflow-y-auto p-5 border-l border-gray-200"
  >
    <div className="flex justify-between items-center border-b-2 border-[#3a4a66] pb-2 mb-4 sticky top-0 bg-white pt-1">
      <h5 className="text-gray-800 font-semibold m-0">{activeModule}</h5>
      <button className="text-gray-500 text-xl leading-none p-0" onClick={() => setActiveModule(null)}>
        ×
      </button>
    </div>
            <div className="bg-gray-50 rounded-lg">
              {activeModule === t('Contextualization') && (
                <Memoizedcontext
                  SubGrapgTable={SubGrapgTable}
                  setSubGrapgTable={setSubGrapgTable}
                  currentSubGraphIndex={currentSubGraphIndex}
                  setCurrentSubGraphIndex={setCurrentSubGraphIndex}
                  handleNextSubGraph={handleNextSubGraph}
                  handlePrevSubGraph={handlePrevSubGraph}
                />
              )}

             {activeModule === t('Detection de Chemin') && (
                <PathFinder
                  nvlRef={nvlRef}
                  setPathisempty={setPathisempty}
                  setPathEdges={setPathEdges}
                  setPathNodes={setPathNodes}
                  setAllPaths={setAllPaths}
                  setCurrentPathIndex={setCurrentPathIndex}
                  setIsBoxPath={setIsBoxPath}
                  selectednodes={selectedNodes}
                  onStartPathFinding={handleStartPathFinding}
                  onStartShortestPath={handleStartShortestPath}
                />
              )}

              {activeModule === t('Aggregation') && (
                <Aggregation
                  setEdges={setEdges}
                  setNodes={setNodes}
                  nodes={nodes}
                  edges={edges}
                  ColorPersonWithClass={ColorPersonWithClass}
                  drawCirclesOnPersonneNodes={drawCirclesOnPersonneNodes}
                  activeAggregations={activeAggregations}
                  setActiveAggregations={setActiveAggregations}
                />
              )}

              {activeModule === t('Details') && (
                <DetailsModule
                  visibleNodeTypes={visibleNodeTypes}
                  toggleNodeTypeVisibility={toggleNodeTypeVisibility}
                  nodetoshow={nodetoshow}
                  selectedNodeData={selectedNodeData}
                  combinedNodes={combinedNodes}
                  relationtoshow={relationtoshow}
                  SelectecRelationData={SelectecRelationData}
                  combinedEdges={combinedEdges}
                />
              )}

              {activeModule === t('Interrogation') && (
                <InterrogationModule
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                  nodes={nodes}
                  edges={edges}
                  setNodes={setNodes}
                  setEdges={setEdges}
                  selectedNodes={selectedNodes}
                />
              )}

              {activeModule === t('Analysis') && (
                <div className="p-4">
                  <Analysis
                    setEdges={setEdges}
                    setNodes={setNodes}
                    onNodeConfigChange={handleNodeConfigChange}
                    nodes={nodes}
                    edges={edges}
                    ColorPersonWithClass={ColorPersonWithClass}
                    drawCirclesOnPersonneNodes={drawCirclesOnPersonneNodes}
                    activeAggregations={activeAggregations}
                    setActiveAggregations={setActiveAggregations}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {SubGrapgTable.results.length > 0 && combinedNodes.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-2 bg-white/90 border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-[100]">
            <div className="container mx-auto px-2">
              <div className="flex">
                <div className="w-full">
                  <TimelineBar
                    data={extractAffaires()}
                    setItemsInRange={setAffairesInRange}
                    attributes={['Affaire_date']}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

Container_AlgorithmicAnalysis.propTypes = {
  selectedVisualization: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    file: PropTypes.string,
  }).isRequired,
  initialNodes: PropTypes.arrayOf(PropTypes.object),
  initialEdges: PropTypes.arrayOf(PropTypes.object),
  onBackToList: PropTypes.func.isRequired,
  addVisualization: PropTypes.func.isRequired,
};

Container_AlgorithmicAnalysis.defaultProps = {
  initialNodes: [],
  initialEdges: [],
};

export default Container_AlgorithmicAnalysis;
