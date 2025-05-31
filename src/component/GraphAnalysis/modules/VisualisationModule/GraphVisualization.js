import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import ContextMenu from '../../Modules/InterrogationModule/Oreinted/Extensibilty/NodeContextMenu';
import GraphCanvas from '../VisualisationModule/GraphCanvas';
import AddActionWindow from "../Windows/Actions";
import Analyse_statistique from "../Windows/Statisics_Window";
import Analyse_BackEnd from "../Windows/Centrality_Window";
import Community_BackEnd from "../Windows/Community_Window";
import { FaExpand, FaCompress, FaSave, FaTrash, FaSearch, FaTimes, FaSpinner } from 'react-icons/fa';
import { MdOutlineTabUnselected } from "react-icons/md";
import { ForceDirectedLayoutType } from '@neo4j-nvl/base';
import { handleLayoutChange } from '../ContainersModules/function_container';
import globalWindowState from './globalWindowState';
import { useTranslation } from 'react-i18next';
import { BASE_URL_Backend } from '../../Platforme/Urls';
import { getNodeColor, getNodeIcon, createNode } from '../VisualisationModule/Parser';
import LayoutControl from '../VisualisationModule/layout/Layoutcontrol';
import ContextMenuRel from '../InterrogationModule/Oreinted/Extensibilty/contextmenuRelarion';
import ContextMenucanvas from '../InterrogationModule/Oreinted/Extensibilty/contextmenucanvas';
import PropTypes from 'prop-types';

// Ce composant est le conteneur de la visualisation : il contient le canevas de visualisation, les options de mise en page, de sauvegarde, de mode plein écran, ainsi qu'une barre de recherche.
// Il inclut également les différents menus contextuels qui seront affichés lors des interactions de l'utilisateur.
const GraphVisualization = React.memo(({
  setEdges, // Fonction pour mettre à jour les arêtes
  edges, // Liste des arêtes du graphe
  setNodes, // Fonction pour mettre à jour les nœuds
  nodes, // Liste des nœuds du graphe
  nvlRef, // Référence au canevas de visualisation
  isFullscreen, // État du mode plein écran
  toggleFullscreen, // Fonction pour basculer le mode plein écran
  setnodetoshow, // Fonction pour définir les nœuds à afficher
  selectedNodes, // Nœuds actuellement sélectionnés
  setSelectedNodes, // Fonction pour mettre à jour les nœuds sélectionnés
  ispath, // Indicateur si un chemin est affiché
  setrelationtoshow, // Fonction pour définir les relations à afficher
  selectedEdges, // Arêtes actuellement sélectionnées
  setselectedEdges, // Fonction pour mettre à jour les arêtes sélectionnées
  setSubGrapgTable, // Fonction pour mettre à jour la table du sous-graphe
  virtualRelations // Relations virtuelles du graphe
}) => {
  const [contextMenu, setContextMenu] = useState(null); // État pour gérer le menu contextuel des nœuds
  const [contextMenuRel, setContextMenuRel] = useState(null);  // État pour gérer le menu contextuel des relations
  const [ContextMenucanvass, SetContextMenucanvass] = useState(null); // État pour gérer le menu contextuel du canevas
  const { t } = useTranslation();  // Hook pour la gestion des traduction
  const [render, setRenderer] = useState("canvas");  // Type de rendu (par défaut : canvas)
  const [layoutType, setLayoutType] = useState(ForceDirectedLayoutType); // Type de mise en page (par défaut : ForceDirectedLayoutType)
  const [searchtype, setsearchtype] = useState("current_graph");  // Type de recherche (par défaut : graphe actuel)
  const [activeWindow, setActiveWindow] = useState(null); // Fenêtre actuellement active
  const [inputValue, setInputValue] = useState(''); // Valeur de l'entrée de recherche
  const [searchResults, setSearchResults] = useState([]); // Résultats de la recherche
  const [isLoading, setIsLoading] = useState(false);// État de chargement pour la recherche
  const [multiselecte, setmultiselecte] = useState(false); // Indicateur pour la sélection multiple
  const [showSaveModal, setShowSaveModal] = useState(false);  // État pour afficher la modale de sauvegarde
  const [saveType, setSaveType] = useState('png');// Type de fichier pour la sauvegarde (par défaut : png)
  const [fileName, setFileName] = useState('');  // Nom du fichier pour la sauvegarde
  const searchRef = useRef(null);  // Référence pour le champ de recherche
  const resultsRef = useRef(null); // Référence pour les résultats de recherche

  // Met à jour la mise en page lorsque le nombre de nœuds change
  useEffect(() => {
    handleLayoutChange(layoutType, nvlRef, nodes, edges, setLayoutType);
  }, [nodes.length]);

  // Surveille l'état de la fenêtre active
  useEffect(() => {
    const checkWindowState = () => {
      setActiveWindow(globalWindowState.activeWindow);
    };
    checkWindowState();
    const interval = setInterval(checkWindowState, 100);
    return () => clearInterval(interval);
  }, []);

  // Filtre les nœuds selon la requête de recherche
  const filterNodesByQuery = (nodes, query) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return nodes.filter(node =>
      node.properties &&
      Object.values(node.properties).some(value =>
        value &&
        value.toString().toLowerCase().includes(lowerQuery)
      )
    );
  };

  // Gère le clic sur le bouton de recherche,
  /// la recherche dans la base de donnees peut prend de temp il peut aussi returner 
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
        const limitedResults = response.data.slice(0, 50);/// on a limit a 50 premier valeur 
        setSearchResults(limitedResults);
      } catch (error) {
        console.error('Erreur lors de la recherche dans la base de données :', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Ajoute un nœud de recherche au canevas
  const handleAddNodeToCanvas = (result) => {
    setNodes(prevNodes => {
      const node = createNode(result.id, result.properties.type, result.properties);
      if (prevNodes.some(n => n.id === node.id)) {
        return prevNodes;
      }
      return [...prevNodes, { ...node }];
    });
  };

  // Réinitialise la recherche
  const handleClearSearch = () => {
    setSearchResults([]);
    setInputValue('');
  };

  // Change le type de recherche
  const handleSearchTypeChange = (e) => {
    setsearchtype(e.target.value);
    setSearchResults([]);
  };

  // Gère les changements dans le champ de recherche
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Ouvre la modale de sauvegarde
  const handleSave = () => {
    setShowSaveModal(true);
  };

  // Confirme la sauvegarde du graphe
  const handleSaveConfirm = async () => {
    if (!fileName.trim()) {
      alert(t('Veuillez entrer un nom de fichier'));
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

  // Annule la sauvegarde
  const handleSaveCancel = () => {
    setShowSaveModal(false);
    setFileName('');
    setSaveType('json');
  };

  // Supprime les nœuds et arêtes sélectionnés
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

  // Gère le changement de rendu (canvas ou WebGL)
  const handlewebgl = (e) => {
    const selectedRenderer = e.target.value;
    if (selectedRenderer === 'Thershold') {
      setRenderer(selectedRenderer);
      nvlRef.current.setRenderer('canvas');
      const currentOptions = nvlRef.current.getCurrentOptions();
      const updatedOptions = { ...currentOptions, relationshipThreshold: 1 };
      console.log(updatedOptions);
      nvlRef.current.setLayoutOptions(updatedOptions);
      nvlRef.current.restart(updatedOptions);
    } else if (selectedRenderer === 'canvas') {
      setRenderer(selectedRenderer);
      nvlRef.current.setRenderer('canvas');
      const currentOptions = nvlRef.current.getCurrentOptions();
      const updatedOptions = { ...currentOptions, relationshipThreshold: 0 };
      console.log(updatedOptions);
      nvlRef.current.setLayoutOptions(updatedOptions);
      nvlRef.current.restart(updatedOptions);
    } else {
      setRenderer(selectedRenderer);
      nvlRef.current.setRenderer(selectedRenderer.toLowerCase());
    }
  };

  // Active ou désactive la sélection multiple
  const hanldemultiselecte = () => {
    setmultiselecte(!multiselecte);
  };

  // Ferme la fenêtre active
  const handleCloseWindow = () => {
    globalWindowState.clearWindow();
    setActiveWindow(null);
  };


  return (
    <div className={`w-full h-full ${isFullscreen ? 'fixed inset-0 z-[20000] bg-white' : 'relative border border-gray-300'}`}>
      {/* Search Bar - Hidden on small screens, visible on md and above */}
  <div
  ref={searchRef}
  className="hidden 2xl:flex absolute top-2 left-1/2 transform -translate-x-1/2 z-[100] items-center bg-white/95 rounded-full px-4 py-2 shadow-md border border-gray-200/30 hover:shadow-lg hover:scale-[1.02] transition-all max-w-sm w-[400px]"
>
  <FaSearch
    className="min-w-[20px] mr-2 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
    onClick={handleSearchClick}
  />
  <input
    type="text"
    value={inputValue}
    onChange={handleInputChange}
    placeholder={t("Search nodes by any property")}
    className="flex-grow min-w-0 border-none outline-none bg-transparent text-gray-800 text-sm placeholder-gray-500"
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
  <div className="ml-2 max-w-[150px]">
    <select
      value={searchtype}
      onChange={handleSearchTypeChange}
      className="w-full p-1 border border-gray-200 rounded bg-white/90 text-sm cursor-pointer hover:bg-white hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
    >
      <option value="current_graph">{t('Current Graph')}</option>
      <option value="database">{t('Database')}</option>
    </select>
  </div>
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
  <option value="Thershold">{t('Moyenne')}</option>
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
          virtualRelations={virtualRelations}
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
      {console.log(activeWindow, 'activeWindow')}
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