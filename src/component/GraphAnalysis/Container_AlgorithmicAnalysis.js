// Container_AlgorithmicAnalysis.js
import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Container_AlgorithmicAnalysis.css';
import ContextManagerComponent from './modules/contextualization/ContextManagerComponent';
import GraphVisualization from './utils/visualizationContainer/GraphVisualization';
import Aggregation from './utils/aggregation';
import TimelineBar from './utils/timline';
import PathVisualization from './modules/path/pathvisualization';
import PathFinder from './modules/path/pathfinding';
import LayoutControl from './modules/layout/Layoutcontrol';
import Analysis from './modules/analysis/analysis';
import DetailsModule from './modules/Details/Details';
import InterrogationModule from './modules/interogation/interrogation';
import { useAggregation, fetchNodeProperties,drawCirclesOnPersonneNodes, ColorPersonWithClass ,fetchNoderelation} from './utils/function_container';

const MemoizedGraphVisualization = memo(GraphVisualization);
const Memoizedcontext = memo(ContextManagerComponent);

const Container_AlgorithmicAnalysis = () => {
  const [SubGrapgTable, setSubGrapgTable] = useState({ results: [] });
  const [activeModule, setActiveModule] = useState(null);
  const nvlRef = useRef(null);
  const nvlRefPath = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
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

  useEffect(() => {
    const nodeTypes = {};
    nodes.forEach((node) => {
      if (!nodeTypes[node.group]) {
        nodeTypes[node.group] = true; // Default to visible
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
      console.log(nodetoshow)
      fetchNodeProperties(nodetoshow, setSelectedNodeData)
      console.log(selectedNodeData)
    }
  }, [nodetoshow]);

  useEffect(() => {
    if (relationtoshow) {
      fetchNoderelation(relationtoshow, setSelectecRelationData)
    }
  }, [relationtoshow]);

  const extractAffaires = () => {
    return SubGrapgTable.results.map((result, index) => ({
      id: result.affaire.identity, // Use index as a unique identifier
      type: result.affaire.Number, // Assuming `affaire.type` is the property you want to display
      date: result.affaire.date,
    }));
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
      setAffairesInRange([SubGrapgTable.results[0].affaire.identity]); // Automatically select the first affaire
      setCurrentSubGraphIndex(0); // Also ensure currentSubGraphIndex points to the first affaire
    }
  }, [SubGrapgTable]);

  useAggregation(affairesInRange, activeAggregations, SubGrapgTable, setNodes, setEdges);

  const combinedNodes = [...nodes].filter((node) => !node.hidden);
  const combinedEdges = [...edges].filter((edge) => !edge.hidden);

 
return (
    <div className="container-fluid test">
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
          />
          {isBoxPath > 0 && (
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
                  selectednodes={nvlRef.current?.getSelectedNodes()}
                  ispath={false}
                  setAllPaths={setAllPaths}
                  setPathisempty={setPathisempty}
                  setrelationtoshow={setrelationtoshow}
                />
              </div>
            </div>
          )}
        </div>

        {true && (
          <div className="side-nav">
            <div className="side-nav-inner">
              {['Details', 'interogation', 'Contextualization', 'Detection de Chemin', 'Aggregation', 'Analysis',].map((module) => (
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
              <button className="btn btn-sm module-close-btn" onClick={() => setActiveModule(null)}>×</button>
            </div>
            
            <div className="module-content">
              {activeModule === 'Contextualization' && (
                <Memoizedcontext
                  SubGrapgTable={SubGrapgTable}
                  setSubGrapgTable={setSubGrapgTable}
                  currentSubGraphIndex={currentSubGraphIndex}
                  setCurrentSubGraphIndex={setCurrentSubGraphIndex}
                  handleNextSubGraph={handleNextSubGraph}
                  handlePrevSubGraph={handlePrevSubGraph}
                />
              )}
              
              {activeModule === 'Detection de Chemin' && (
                <PathFinder
                  nvlRef={nvlRef}
                  setPathisempty={setPathisempty}
                  setPathEdges={setPathEdges}
                  setPathNodes={setPathNodes}
                  setAllPaths={setAllPaths}
                  setCurrentPathIndex={setCurrentPathIndex}
                  setIsBoxPath={setIsBoxPath}
                  selectednodes={nvlRef.current?.getSelectedNodes()}
                />
              )}
              
              {activeModule === 'Aggregation' && (
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
              
              {activeModule === 'Details' && (
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
              
              {activeModule === 'interogation' && (
                <InterrogationModule
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                  nodes={nodes}
                  edges={edges}
                  setNodes={setNodes}
                  setEdges={setEdges}
                  selectedNodes={nvlRef.current?.getSelectedNodes()}
                />
              )}
              
              {/* {activeModule === 'Layout' && (
                <LayoutControl
                  layoutType={layoutType}
                  handleLayoutChange={handleLayoutChange}
                  nvlRef={nvlRef}
                  combinedNodes={combinedNodes}
                  combinedEdges={combinedEdges}
                  setLayoutType={setLayoutType}
                />
              )} */}

              {activeModule === 'Analysis' && (
                <div className="analysis-module">
                  <h6 style={{ marginBottom: '15px', color: '#2c3e50' }}>Analysis Module</h6>
                  <Analysis
                    setEdges={setEdges}
                    setNodes={setNodes}
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
      
      {SubGrapgTable.results.length > 0 && combinedNodes.length>0 && (
        <div className="timeline-container">
          <TimelineBar 
            affaires={extractAffaires()}
            setAffairesInRange={setAffairesInRange}
          />
        </div>
      )}
    </div>
  );
};

export default Container_AlgorithmicAnalysis;