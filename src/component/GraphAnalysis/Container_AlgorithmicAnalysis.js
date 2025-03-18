import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Container_AlgorithmicAnalysis.css'; // Import the CSS file
import ContextManagerComponent from './modules/contextualization/ContextManagerComponent'
import GraphVisualization from './utils/GraphVisualization';
import { d3ForceLayoutType, ForceDirectedLayoutType, FreeLayoutType, HierarchicalLayoutType } from '@neo4j-nvl/base';
import Aggregation from './utils/aggregation'
import Properties_introgation from './modules/interogation/Properties_introgation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faListAlt, faComments } from '@fortawesome/free-solid-svg-icons';
import Template from './modules/interogation/tamplate';
import Chat from './modules/interogation/chat';
import TimelineBar from './utils/timline'
import PathVisualization from './modules/path/pathvisualization';
import PathFinder from './modules/path/pathfinding';
import LayoutControl from './modules/layout/Layoutcontrol';
import Analysis from './modules/analysis/analysis';
import { NodeTypeVisibilityControl } from './utils/NodeTypeVisibilityControl';
import { getNodeColor,getNodeIcon } from './utils/Parser';
import { useAggregation, fetchNodeProperties, handleLayoutChange,drawCirclesOnPersonneNodes , ColorPersonWithClass} from './utils/function_container';
const MemoizedGraphVisualization = memo(GraphVisualization);
const Memoizedcontext = memo(ContextManagerComponent);

const Container_AlgorithmicAnalysis = () => {
  const [SubGrapgTable, setSubGrapgTable] = useState({ results: [] });
  const [isGraphOnlyMode, setIsGraphOnlyMode] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const nvlRef = useRef(null);
  const nvlRefPath = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [aggregationType, setAggregationType] = useState(null);
  const [layoutType, setLayoutType] = useState(ForceDirectedLayoutType);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState("null");
  const [nodetoshow, setnodetoshow] = useState(null);
  const [selectedOption, setSelectedOption] = useState('option1');
  const [pathNodes, setPathNodes] = useState([]);
  const [pathEdges, setPathEdges] = useState([]);
  const [currentSubGraphIndex, setCurrentSubGraphIndex] = useState(0);
  const [isBoxPath, setIsBoxPath] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [affairesInRange, setAffairesInRange] = useState([]); // Track affaires in range
  const [allPaths, setAllPaths] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [activeAggregations, setActiveAggregations] = useState({}); // Lift this state up
  const [visibleNodeTypes, setVisibleNodeTypes] = useState({});

  // Dynamically initialize visibleNodeTypes based on existing nodes
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
      fetchNodeProperties(nodetoshow, setSelectedNodeData)
      console.log(selectedNodeData)
    }
  }, [nodetoshow]);

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

  useEffect(() => {
    handleLayoutChange(layoutType, nvlRef, combinedNodes, combinedEdges, setLayoutType)
    console.log(combinedNodes.length)
    console.log(combinedEdges.length)
  }, [combinedNodes.length]);

  return (
    <div className="container-fluid test">
      {/* Horizontal Navbar */}


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
            nodetoshow={nodetoshow}
            setnodetoshow={setnodetoshow}
            setPathEdges={setPathEdges}
            setPathNodes={setPathNodes}
            setIsBoxPath={setIsBoxPath}
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            ispath={true}
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
                />
              </div>
            </div>
          )}
        </div>

        {!isGraphOnlyMode && (
          <div className="side-nav">
            <div className="side-nav-inner">
              {['Details','interogation', 'Detection de Chemin', 'Aggregation', 'Contextualization','Analysis','Layout'].map((module) => (
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
                <>
                 
                  <NodeTypeVisibilityControl 
                    visibleNodeTypes={visibleNodeTypes} 
                    toggleNodeTypeVisibility={toggleNodeTypeVisibility} 
                  />

{nodetoshow && (
  <div className="properties-container">
    {(() => {
      const matchedNode = combinedNodes.find(node => 
        node.id === selectedNodeData.identity.toString()
      );
      const nodeGroup = matchedNode ? matchedNode.group : 'Unknown';
      const nodeColor = getNodeColor(nodeGroup);
      const nodeIcon = getNodeIcon(nodeGroup);

      return (
        <div 
          className="node-type-header" 
          style={{ 
            backgroundColor: nodeColor,
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            color: '#fff'
          }}
        >
          {/* Circular node with icon */}
          <div
            style={{
              width: '24px', // Adjust size as needed
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px',
              overflow: 'hidden',
            }}
          >
            <img
              src={nodeIcon}
              alt={`${nodeGroup} icon`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover', // Ensures the image fills the circle
              }}
            />
          </div>
          
          {/* Node type text */}
          <span>{nodeGroup}</span>
        </div>
      );
    })()}
    
    <ul className="list-group properties-list">
      {Object.entries(selectedNodeData).map(([key, value], index) => (
        <li key={key} className="list-group-item property-item">
          <strong className="property-key">{key}:</strong> 
          <span className="property-value">
            {typeof value === 'object' ? JSON.stringify(value) : value}
          </span>
        </li>
      ))}
    </ul>
  </div>
)}
                </>
              )}
              
              {activeModule === 'interogation' && (
                <>
                  <div className="option-tabs">
                    <button
                      className={`btn option-tab ${selectedOption === 'option1' ? 'btn-info active' : 'btn-light'}`}
                      onClick={() => setSelectedOption('option1')}
                    >
                      <FontAwesomeIcon icon={faCogs} className="me-2" />
                      Properties
                    </button>
                    <button
                      className={`btn option-tab ${selectedOption === 'option2' ? 'btn-info active' : 'btn-light'}`}
                      onClick={() => setSelectedOption('option2')}
                    >
                      <FontAwesomeIcon icon={faListAlt} className="me-2" />
                      Template
                    </button>
                    <button
                      className={`btn option-tab ${selectedOption === 'option3' ? 'btn-info active' : 'btn-light'}`}
                      onClick={() => setSelectedOption('option3')}
                    >
                      <FontAwesomeIcon icon={faComments} className="me-2" />
                      Chat
                    </button>
                  </div>
                  
                  <div className="option-content">
                    {selectedOption === 'option1' && (
                      <Properties_introgation
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                      />
                    )}
                    {selectedOption === 'option2' && (
                      <Template
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                      />
                    )}
                    {selectedOption === 'option3' && (
                      <Chat
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        selectedNodes={nvlRef.current?.getSelectedNodes()}
                      />
                    )}
                  </div>
                </>
              )}
              
              {activeModule === 'Layout' && (
                <LayoutControl
                  layoutType={layoutType}
                  handleLayoutChange={handleLayoutChange}
                  nvlRef={nvlRef}
                  combinedNodes={combinedNodes} 
                  combinedEdges={combinedEdges} 
                  setLayoutType={setLayoutType}
                />
              )}

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
      
      {SubGrapgTable.results.length > 0 && (
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