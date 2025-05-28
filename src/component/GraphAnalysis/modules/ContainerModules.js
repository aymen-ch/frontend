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
    <div className="container-fluid test bg-gray-50 min-h-screen">

      <div className="row flex-grow-1 m-0 p-0">
        <div className={`col ${isFullscreen ? 'p-0' : 'col-lg-12 col-md-12 col-12'} flex-grow-1`}>
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
                {isBoxPath && (
        <div className="path-visualization-overlay">
          <div className="path-visualization-content">
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
              onStartPathFinding={pathFindingParams}
              onStartShortestPath={shortestPathParams}
            />
          </div>
        </div>
      )}
        </div>

        {true && (
          <div className="side-nav">
            <div className="side-nav-inner">
              {[
                t('Details'),
                t('interogation'),
                t('Contextualization'),
                t('Detection de Chemin'),
                t('Aggregation'),
                t('Analysis'),
              ].map((module) => (
                <div
                  key={module}
                  className={`side-nav-item ${activeModule === module ? 'active' : ''}`}
                  onClick={() => handleModuleClick(module)}
                >
                  {module}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModule && (
          <div className="module-panel">
            <div className="module-header">
              <h5 className="module-title">{activeModule}</h5>
              <button className="btn btn-sm module-close-btn" onClick={() => setActiveModule(null)}>
                ×
              </button>
            </div>

            <div className="module-content">
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
                  onNodeConfigChange={handleNodeConfigChange}
                />
              )}

              {activeModule === t('interogation') && (
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
                <div className="analysis-module">
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
      </div>

      {SubGrapgTable.results.length > 0 && combinedNodes.length > 0 && (
        <div className="timeline-container">
          <TimelineBar
            data={extractAffaires()}
            setItemsInRange={setAffairesInRange}
            attributes={['Affaire_date']}
          />
        </div>
      )}
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