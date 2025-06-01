import React, { useState, memo, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import ContextManagerComponent from '../../Modules/AnalysisModule/AnalyseTempSpatiale/ContextManager';
import GraphVisualization from '../../Modules/VisualisationModule/GraphVisualization';
import Aggregation from '../../Modules/AnalysisModule/Aggregation/aggregation';
import TimelineBar from '../../Modules/AnalysisModule/AnalyseTempSpatiale/BarScroll';
import PathVisualization from '../../Modules/AnalysisModule/PathDetection/pathvisualizationCanvas';
import PathFinder from '../../Modules/AnalysisModule/PathDetection/PathInput';
import Analysis from '../../Modules/AnalysisModule/AnalysisAlgorithms/analysis';
import DetailsModule from '../../Modules/InterrogationModule/Details/Details';
import InterrogationModule from '../../Modules/InterrogationModule/interrogation';
import { useAggregation, fetchNodeDetail, ColorPersonWithClass, fetchrelationDetail,fetchAggregations } from './function_container';
import { NODE_CONFIG } from '../VisualisationModule/Parser';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import { handleNextSubGraph,handlePrevSubGraph } from './function_container';
import { PathPrameter } from './PathPrameters';

const MemoizedGraphVisualization = memo(GraphVisualization);
const Memoizedcontext = memo(ContextManagerComponent);


// si la partie (visulisation dans le navbar horizontal) Contient les onglets, la visualisation du graphe et la visualisation des chemins affichée si isBoxPath est vrai

const Container_AlgorithmicAnalysis = ({ selectedVisualization,initialNodes, initialEdges, onBackToList, addVisualization }) => {
  const { t } = useTranslation();
  // Noeuds et relations
  const [nodes, setNodes] = useState(initialNodes || []);
  const [edges, setEdges] = useState(initialEdges || []);
 // Variables pour la contextualisation ; chaque affaire possède ses propres noeuds et relations 
  const [SubGrapgTable, setSubGrapgTable] = useState({ results: [] });
  const [currentSubGraphIndex, setCurrentSubGraphIndex] = useState(0);
  const [affairesInRange, setAffairesInRange] = useState([]); // Les affaires affichées par la barre de défilement
// Références pour la visualisation principale et la visualisation des chemins 
const nvlRef = useRef(null);
  const nvlRefPath = useRef(null);
// Contient les données des noeuds et relations cliqués pour affichage dans le composant de détails  
const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [SelectecRelationData, setSelectecRelationData] = useState(null);
  const [nodetoshow, setnodetoshow] = useState(); // ID du noeud à afficher
  const [relationtoshow, setrelationtoshow] = useState(null);// ID de la relation à afficher
// Pour les trois options d'interrogation : cible, question, chat
  const [selectedOption, setSelectedOption] = useState('option1');
// Pour la détection de chemins
  const [pathisempty, setPathisempty] = useState(false);
  const [pathNodes, setPathNodes] = useState([]);
  const [pathEdges, setPathEdges] = useState([]);
  const [isBoxPath, setIsBoxPath] = useState(false);
  const [allPaths, setAllPaths] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
// Noeuds et relations sélectionnés
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedEdges, setselectedEdges] = useState(new Set());

  const [activeModule, setActiveModule] = useState(null);// L'onglet actif
  const [isFullscreen, setIsFullscreen] = useState(false);// Mode plein écran
  const [activeAggregations, setActiveAggregations] = useState({});// Les agrégations actives
  const [virtualRelations, setVirtualRelations] = useState([]); // Les relations virtuelles utilisées dans l'agrégation
  const [visibleNodeTypes, setVisibleNodeTypes] = useState({}); // Types de noeuds visualisés, affichés dans l'onglet des détails
 

// Récupérer toutes les agrégations depuis le fichier d'agrégation du backend
 useEffect(() => {
    fetchAggregations(setVirtualRelations); 
  }, []);



// Récupérer les types de noeuds existants
  useEffect(() => {
    const nodeTypes = {};
    nodes.forEach((node) => {
      if (!nodeTypes[node.group]) {
        nodeTypes[node.group] = true;
      }
    });
    setVisibleNodeTypes(nodeTypes);
  }, [nodes]);

// Changer l'onglet actif
  const handleModuleClick = (module) => {
    setActiveModule(activeModule === module ? null : module);
  };

  // Activer/désactiver le mode plein écran
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };



  // Récupérer les informations d'un noeud si son ID n'est pas null
  useEffect(() => {
    if (nodetoshow) {
      fetchNodeDetail(nodetoshow, setSelectedNodeData);
    }
  }, [nodetoshow]);


// Récupérer les informations d'une relation si son ID n'est pas null
  useEffect(() => {
    if (relationtoshow) {
      fetchrelationDetail(relationtoshow, setSelectecRelationData);
      console.log(SelectecRelationData)
    }
  }, [relationtoshow]);



// Récupérer toutes les affaires retournées par l'onglet de contextualisation, utilisées par la barre de défilement
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

// Stocker la première affaire pour l'afficher
  useEffect(() => {
    if (SubGrapgTable.results.length > 0 && affairesInRange.length === 0) {
      setAffairesInRange([SubGrapgTable.results[0].affaire.id]);
      setCurrentSubGraphIndex(0);
    }
  }, [SubGrapgTable]);


  // Appliquer l'agrégation sur le graphe de contextualisation si elle est active, useffect difinier dans function_container
  useAggregation(affairesInRange, activeAggregations, SubGrapgTable, setNodes, setEdges,virtualRelations);

// Filtrer les noeuds avec la propriété "hidden" utilisée par l'agrégation pour masquer les noeuds intermédiaires
  const combinedNodes = [...nodes].filter((node) => !node.hidden);
  const combinedEdges = [...edges].filter((edge) => !edge.hidden);

  // Modifier automatiquement le style des noeuds, utilisé par l'onglet d'analyse des attributs
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
  // Contient les onglets, la visualisation du graphe et la visualisation des chemins affichée si isBoxPath est vrai
  return (
  <PathPrameter>
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
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            ispath={true}
            setrelationtoshow={setrelationtoshow}
            selectedEdges={selectedEdges}
            setselectedEdges={setselectedEdges}
            setSubGrapgTable={setSubGrapgTable}
            virtualRelations={virtualRelations}
            addVisualization={addVisualization}
            onBackToList={onBackToList}
          />


          {isBoxPath > 0 && (
            <div className="fixed inset-0 z-[300000] bg-black bg-opacity-50  flex items-center justify-center">
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
    className="absolute right-[60px] top-0 bottom-0 w-[700px] lg:w-[600px] md:w-[400px] sm:w-[300px] bg-white shadow-[-3px_0_10px_rgba(0,0,0,0.1)] z-[1000] overflow-y-auto p-5 border-l border-gray-200"
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
                  // setPathFindingParams={setPathFindingParams}
                  // setShortestPathParams={setShortestPathParams}
            
                />
                
              )}

              {activeModule === t('Aggregation') && (
                <Aggregation
                  setEdges={setEdges}
                  setNodes={setNodes}
                  nodes={nodes}
                  activeAggregations={activeAggregations}
                  setActiveAggregations={setActiveAggregations}
                  virtualRelations={virtualRelations}
                />
              )}

              {activeModule === t('Details') && (
                <DetailsModule
                  visibleNodeTypes={visibleNodeTypes}
                  nodetoshow={nodetoshow}
                  selectedNodeData={selectedNodeData}
                  nodes={combinedNodes}
                  relationtoshow={relationtoshow}
                  SelectecRelationData={SelectecRelationData}
                  edges={combinedEdges}
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
  </PathPrameter>
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
