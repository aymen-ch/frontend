import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  FaExpand,
  FaTrash,
  FaPowerOff,
  FaPlay,
  FaCheck,
  FaTimes,
  FaProjectDiagram,
  FaArrowRight,
  FaInfoCircle,
  FaTimesCircle,
  FaCog,
  FaSlidersH,
  FaPlus,
} from 'react-icons/fa';
import { FaLocationDot, FaCodeFork } from 'react-icons/fa6';
import {
  fetchPossibleRelations,
  handleNodeExpansion,
  handleAllConnections,
  handleActionSelect,
  handleAdvancedExpand,
  handleNodeExpansion_selected,
} from './ContextMenuFunctions';
import { getNodeColor, getNodeIcon } from '../../../VisualisationModule/Parser';
import { BASE_URL_Backend } from '../../../../Platforme/Urls';

const ContextMenu = ({
  contextMenu,
  setContextMenu,
  setNodes,
  setEdges,
  setSelectedNodes,
  selectedNodes,
  setPathEdges,
  setPathNodes,
  setAllPaths,
  setCurrentPathIndex,
  setIsBoxPath,
  setActiveAggregations,
}) => {
  const { t } = useTranslation();
  const [possibleRelations, setPossibleRelations] = useState([]);
  const [subContextMenu, setSubContextMenu] = useState(null);
  const [actionsSubMenu, setActionsSubMenu] = useState(null);
  const [advancedAggregationSubMenu, setAdvancedAggregationSubMenu] = useState(null);
  const [nodeProperties, setNodeProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [errorProperties, setErrorProperties] = useState(null);
  const expandButtonRef = useRef(null);
  const actionsButtonRef = useRef(null);
  const advancedAggregationButtonRef = useRef(null);
  const subContextRef = useRef(null);
  const actionsSubRef = useRef(null);
  const advancedAggregationSubRef = useRef(null);
  const [advancedExpandParams, setAdvancedExpandParams] = useState({
    attribute: '',
    threshold: 0.01,
    maxLevel: 5,
    direction: 'Both',
  });
  const [availableActions, setAvailableActions] = useState([]);
  const actionIcons = {
    [t('Affaire dans la meme region')]: FaLocationDot,
    [t('Show Criminal Network')]: FaCodeFork,
    [t('Show Person Profile')]: FaInfoCircle,
  };
  const [visibleDescriptions, setVisibleDescriptions] = useState({});

  const [expandLimit, setExpandLimit] = useState(10);
  const [expandDirection, setExpandDirection] = useState('Both');

  const fetchNodeProperties = useCallback(async (nodeType) => {
    if (!nodeType) return;
    setLoadingProperties(true);
    setErrorProperties(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${BASE_URL_Backend}/node-types/properties_types/`, {
        params: { node_type: nodeType },
        headers: { Authorization: `Bearer ${token}` },
      });
      const properties = response.data.properties || [];
      setNodeProperties(properties);
      const numericProperties = properties.filter(
        (prop) => prop.type === 'int' || prop.type === 'float'
      );
      if (numericProperties.length > 0 && !advancedExpandParams.attribute) {
        setAdvancedExpandParams((prev) => ({
          ...prev,
          attribute: numericProperties[0].name,
        }));
      }
    } catch (error) {
      setErrorProperties(t('error_fetching_properties'));
    } finally {
      setLoadingProperties(false);
    }
  }, [t]);

  const getNumericNodeProperties = useCallback(() => {
    return nodeProperties
      .filter((prop) => prop.type === 'int' || prop.type === 'float')
      .map((prop) => prop.name);
  }, [nodeProperties]);

  const toggleDescription = (index) => {
    setVisibleDescriptions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    if (contextMenu?.node && contextMenu.visible) {
      fetchNodeProperties(contextMenu.node.group);
      fetchPossibleRelations(contextMenu.node, (backendRelations) => {
        const relations = backendRelations.map((rel) => ({
          name: rel.name,
          startNode: rel.startNode,
          endNode: rel.endNode,
          isVirtual: false,
          count: rel.count,
        }));

        let virtualRelations = [];
        try {
          const stored = JSON.parse(localStorage.getItem('virtualRelations'));
          if (Array.isArray(stored)) {
            virtualRelations = stored;
          }
        } catch (err) {
          console.warn('Invalid virtualRelations data in localStorage', err);
        }

        const nodeGroup = contextMenu.node.group;

        const fetchVirtualRelationCounts = async () => {
          const matchingVirtualRelations = await Promise.all(
            virtualRelations
              .filter((vr) => vr.path[0] === nodeGroup)
              .map(async (vr) => {
                try {
                  const response = await axios.post(`${BASE_URL_Backend}/get_virtual_relation_count/`, {
                    node_type: nodeGroup,
                    node_id: contextMenu.node.id,
                    path: vr.path,
                  });
                  return {
                    name: vr.name,
                    startNode: vr.path[0],
                    endNode: vr.path[vr.path.length - 1],
                    isVirtual: true,
                    count: response.data.count,
                  };
                } catch (error) {
                  console.error(`Error fetching count for virtual relation ${vr.name}:`, error);
                  return {
                    name: vr.name,
                    startNode: vr.path[0],
                    endNode: vr.path[vr.path.length - 1],
                    isVirtual: true,
                    count: 0,
                  };
                }
              })
          );

          const combinedRelations = [...relations, ...matchingVirtualRelations];
          const uniqueRelations = Array.from(
            new Map(combinedRelations.map((rel) => [rel.name, rel])).values()
          );
          setPossibleRelations(uniqueRelations);
        };

        fetchVirtualRelationCounts();

        axios
          .post(`${BASE_URL_Backend}/get_available_actions/`, { node_type: contextMenu.node.group })
          .then((response) => {
            setAvailableActions(response.data.actions || []);
          })
          .catch((error) => {
            console.error('Error fetching available actions:', error);
          });
      });
    }
  }, [contextMenu, fetchNodeProperties]);

  const handleMouseEnterExpand = () => {
    if (expandButtonRef.current) {
      const buttonRect = expandButtonRef.current.getBoundingClientRect();
      setSubContextMenu({
        x: contextMenu.x + buttonRect.width,
        y: contextMenu.y,
        visible: true,
      });
      setActionsSubMenu(null);
      setAdvancedAggregationSubMenu(null);
    }
  };

  const handleMouseLeaveExpand = () => {
    if (!subContextRef.current || !subContextRef.current.matches(':hover')) {
      setSubContextMenu(null);
    }
  };

  const handleMouseEnterActions = () => {
    if (actionsButtonRef.current) {
      const buttonRect = actionsButtonRef.current.getBoundingClientRect();
      setActionsSubMenu({
        x: contextMenu.x + buttonRect.width,
        y: contextMenu.y,
        visible: true,
      });
      setSubContextMenu(null);
      setAdvancedAggregationSubMenu(null);
    }
  };

  const handleMouseLeaveActions = () => {
    if (!actionsSubRef.current || !actionsSubRef.current.matches(':hover')) {
      setActionsSubMenu(null);
    }
  };

  const handleMouseEnterAdvancedAggregation = () => {
    if (advancedAggregationButtonRef.current) {
      const buttonRect = advancedAggregationButtonRef.current.getBoundingClientRect();
      setAdvancedAggregationSubMenu({
        x: contextMenu.x + buttonRect.width,
        y: contextMenu.y,
        visible: true,
      });
      setSubContextMenu(null);
      setActionsSubMenu(null);
    }
  };

  const handleMouseLeaveAdvancedAggregation = () => {
    if (!advancedAggregationSubRef.current || !advancedAggregationSubRef.current.matches(':hover')) {
      setAdvancedAggregationSubMenu(null);
    }
  };

  const handleAdvancedExpandSubmit = async () => {
    if (!contextMenu?.node) return;

    await handleAdvancedExpand(contextMenu.node, setNodes, setEdges, advancedExpandParams);

    setContextMenu(null);
    setAdvancedAggregationSubMenu(null);
  };

  const handleContextMenuAction = (action, relationType = null) => {
    if (!contextMenu?.node) return;

    if (action === t('Delete Node')) {
      const nodeIdToDelete = contextMenu.node.id;
      setNodes((prev) => prev.filter((node) => node.id !== nodeIdToDelete));
      setEdges((prev) => prev.filter((edge) => edge.from !== nodeIdToDelete && edge.to !== nodeIdToDelete));
    } else if (action === t('Delete Selected Nodes')) {
      const selectedNodeIds = new Set(selectedNodes);
      setNodes((prev) => prev.filter((node) => !selectedNodeIds.has(node.id)));
      setEdges((prev) => prev.filter((edge) => !selectedNodeIds.has(edge.from) && !selectedNodeIds.has(edge.to)));
      setSelectedNodes(new Set());
    } else if (action === t('View Neighborhood') || action === t('Expand Specific Relation')) {
      handleNodeExpansion(contextMenu.node, relationType, setNodes, setEdges, expandLimit, expandDirection);
    } else if (action === t('Select Node')) {
      setSelectedNodes((prev) => new Set([...prev, contextMenu.node.id]));
    } else if (action === t('Activated')) {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === contextMenu.node.id ? { ...node, activated: true } : node
        )
      );
    } else if (action === t('Deactivated')) {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === contextMenu.node.id ? { ...node, activated: false } : node
        )
      );
    } else if (action === t('Deselect Node')) {
      setSelectedNodes((prev) => {
        const newSelected = new Set(prev);
        newSelected.delete(contextMenu.node.id);
        return newSelected;
      });
    } else if (action === t('Edit Node')) {
      console.log('Edit Node:', contextMenu.node);
    } else if (action === t('all connections')) {
      handleAllConnections(selectedNodes, setAllPaths, setCurrentPathIndex, setPathNodes, setPathEdges, setIsBoxPath);
    } else if (action === t('Disable Others')) {
      const clickedNodeId = contextMenu.node.id;
      const enabledNodeIds = new Set([clickedNodeId]);
      setEdges((prevEdges) => {
        prevEdges.forEach((edge) => {
          if (edge.from === clickedNodeId) {
            enabledNodeIds.add(edge.to);
          } else if (edge.to === clickedNodeId) {
            enabledNodeIds.add(edge.from);
          }
        });
        const updatedEdges = prevEdges.map((edge) => ({
          ...edge,
          disabled: !(enabledNodeIds.has(edge.from) && enabledNodeIds.has(edge.to)),
        }));
        return updatedEdges;
      });
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          disabled: !enabledNodeIds.has(node.id),
        }))
      );
    } else if (action === t('Expand All seleced nodes')) {
      handleNodeExpansion_selected(selectedNodes, setNodes, setEdges);
    }

    setContextMenu(null);
    setSubContextMenu(null);
    setActionsSubMenu(null);
    setAdvancedAggregationSubMenu(null);
  };

  if (!contextMenu || !contextMenu.visible) return null;

  const centralityAttributes = getNumericNodeProperties();

  return (
    <>
      <div
        className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-[1000] min-w-[220px] overflow-hidden"
        style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
      >
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm">
          {t('Node Actions')}
        </div>
        <div className="py-1 flex flex-col">
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onMouseEnter={handleMouseEnterExpand}
            onMouseLeave={handleMouseLeaveExpand}
            ref={expandButtonRef}
          >
            <FaExpand className="mr-2 text-blue-600" />
            {t('Expand')}
            <FaArrowRight className="ml-auto text-gray-500 text-xs" />
          </button>
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onMouseEnter={handleMouseEnterActions}
            onMouseLeave={handleMouseLeaveActions}
            ref={actionsButtonRef}
          >
            <FaCog className="mr-2 text-blue-600" />
            {t('Actions')}
            <FaArrowRight className="ml-auto text-gray-500 text-xs" />
          </button>
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onMouseEnter={handleMouseEnterAdvancedAggregation}
            onMouseLeave={handleMouseLeaveAdvancedAggregation}
            ref={advancedAggregationButtonRef}
          >
            <FaSlidersH className="mr-2 text-blue-600" />
            {t('Advanced Expention')}
            <FaArrowRight className="ml-auto text-gray-500 text-xs" />
          </button>
          {contextMenu.node?.selected ? (
            <button
              className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => handleContextMenuAction(t('Deselect Node'))}
            >
              <FaTimes className="mr-2" />
              {t('Deselect Node')}
            </button>
          ) : (
            <button
              className="flex items-center w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors"
              onClick={() => handleContextMenuAction(t('Select Node'))}
            >
              <FaCheck className="mr-2" />
              {t('Select Node')}
            </button>
          )}
          {contextMenu.node?.activated ? (
            <button
              className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => handleContextMenuAction(t('Deactivated'))}
            >
              <FaTimes className="mr-2" />
              {t('Deactivated')}
            </button>
          ) : (
            <button
              className="flex items-center w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors"
              onClick={() => handleContextMenuAction(t('Activated'))}
            >
              <FaPlay className="mr-2" />
              {t('Activated')}
            </button>
          )}
          <hr className="my-1 border-gray-200" />
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setContextMenu(null)}
          >
            <FaTimesCircle className="mr-2 text-gray-500" />
            {t('Dismiss')}
          </button>
          {selectedNodes.size > 0 && (
            <button
              className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => handleContextMenuAction(t('Delete Selected Nodes'))}
            >
              <FaTrash className="mr-2" />
              {t('Delete Selected Nodes')}
            </button>
          )}
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => handleContextMenuAction(t('Delete Node'))}
          >
            <FaTrash className="mr-2" />
            {t('Delete Node')}
          </button>
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => handleContextMenuAction(t('Disable Others'))}
          >
            <FaPowerOff className="mr-2" />
            {t('Disable Others')}
          </button>
        </div>
      </div>

      {subContextMenu?.visible && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-[1001] min-w-[220px] overflow-hidden"
          style={{ top: `${subContextMenu.y}px`, left: `${subContextMenu.x}px` }}
          ref={subContextRef}
          onMouseLeave={() => setSubContextMenu(null)}
        >
          <div className="flex flex-col gap-2 p-2 bg-white">
            <label className="flex items-center text-sm text-gray-700">
              {t('Limit')}:
              <input
                type="number"
                min="1"
                value={expandLimit}
                onChange={(e) => setExpandLimit(Number(e.target.value))}
                className="w-16 ml-2 mr-4 p-1 border border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center text-sm text-gray-700">
              {t('Direction')}:
              <select
                value={expandDirection}
                onChange={(e) => setExpandDirection(e.target.value)}
                className="ml-2 p-1 border border-gray-300 rounded"
              >
                <option value="In">{t('In')}</option>
                <option value="Out">{t('Out')}</option>
                <option value="Both">{t('Both')}</option>
              </select>
            </label>
          </div>

          <div className="px-4 py-2 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm">
            {t('Expand Options')}
          </div>
          <div className="py-1 flex flex-col">
            <button
              className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => handleContextMenuAction(t('View Neighborhood'))}
            >
              <FaProjectDiagram className="mr-2 text-blue-600" />
              {t('Expand All')}
            </button>

            <div className="px-4 py-2">
              <div className="font-bold text-gray-700 text-sm">{t('Normal Relations')}</div>
              {possibleRelations.filter((relation) => !relation.isVirtual).length > 0 ? (
                possibleRelations
                  .filter((relation) => !relation.isVirtual)
                  .map((relation, index) => {
                    const startIconPath = getNodeIcon(relation.startNode);
                    const endIconPath = getNodeIcon(relation.endNode);
                    return (
                      <button
                        key={`normal-${index}`}
                        className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => handleContextMenuAction(t('Expand Specific Relation'), relation.name)}
                      >
                        <FaArrowRight className="mr-2 text-blue-600" />
                        <span className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 font-medium" style={{ color: getNodeColor(relation.startNode) }}>
                            {startIconPath && (
                              <span className="inline-flex items-center justify-center p-0.5 rounded" style={{ backgroundColor: getNodeColor(relation.startNode) }}>
                                <img
                                  src={startIconPath}
                                  alt={`${relation.startNode} icon`}
                                  className="w-4 h-4 object-contain"
                                />
                              </span>
                            )}
                            {relation.startNode}
                          </span>
                          <span className="italic"> ---- {relation.name} ----</span>
                          <span className="flex items-center gap-1 font-medium" style={{ color: getNodeColor(relation.endNode) }}>
                            {endIconPath && (
                              <span className="inline-flex items-center justify-center p-0.5 rounded" style={{ backgroundColor: getNodeColor(relation.endNode) }}>
                                <img
                                  src={endIconPath}
                                  alt={`${relation.endNode} icon`}
                                  className="w-4 h-4 object-contain"
                                />
                              </span>
                            )}
                            {relation.endNode}
                          </span>
                          x {relation.count}
                        </span>
                      </button>
                    );
                  })
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm italic">{t('No normal relations available')}</div>
              )}
            </div>

            <div className="px-4 py-2">
              <div className="font-bold text-gray-700 text-sm">{t('Virtual Relations')}</div>
              {possibleRelations.filter((relation) => relation.isVirtual).length > 0 ? (
                possibleRelations
                  .filter((relation) => relation.isVirtual)
                  .map((relation, index) => {
                    const startIconPath = getNodeIcon(relation.startNode);
                    const endIconPath = getNodeIcon(relation.endNode);
                    return (
                      <button
                        key={`virtual-${index}`}
                        className="flex items-center w-full px-4 py-2 text-left text-sm text-green-600 font-bold hover:bg-green-50 transition-colors"
                        onClick={() => handleContextMenuAction(t('Expand Specific Relation'), relation.name)}
                      >
                        <FaArrowRight className="mr-2 text-green-600" />
                        <span className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 font-medium" style={{ color: getNodeColor(relation.startNode) }}>
                            {startIconPath && (
                              <span className="inline-flex items-center justify-center p-0.5 rounded" style={{ backgroundColor: getNodeColor(relation.startNode) }}>
                                <img
                                  src={startIconPath}
                                  alt={`${relation.startNode} icon`}
                                  className="w-4 h-4 object-contain"
                                />
                              </span>
                            )}
                            {relation.startNode}
                          </span>
                          <span className="italic"> ---- {relation.name} ----</span>
                          <span className="flex items-center gap-1 font-medium" style={{ color: getNodeColor(relation.endNode) }}>
                            {endIconPath && (
                              <span className="inline-flex items-center justify-center p-0.5 rounded" style={{ backgroundColor: getNodeColor(relation.endNode) }}>
                                <img
                                  src={endIconPath}
                                  alt={`${relation.endNode} icon`}
                                  className="w-4 h-4 object-contain"
                                />
                              </span>
                            )}
                            {relation.endNode}
                          </span>
                          x {relation.count}
                        </span>
                      </button>
                    );
                  })
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm italic">{t('No virtual relations available')}</div>
              )}
            </div>

            <hr className="my-1 border-gray-200" />
            {selectedNodes.size > 0 && (
              <button
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => handleContextMenuAction(t('Expand All seleced nodes'))}
              >
                <FaProjectDiagram className="mr-2 text-blue-600" />
                {t('Expand All seleced nodes')}
              </button>
            )}
          </div>
        </div>
      )}

      {actionsSubMenu?.visible && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-[1001] min-w-[200px] overflow-hidden"
          style={{ top: `${actionsSubMenu.y}px`, left: `${actionsSubMenu.x}px` }}
          ref={actionsSubRef}
          onMouseLeave={() => setActionsSubMenu(null)}
        >
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm">
            {t('Action Options')}
          </div>
          <div className="py-1 flex flex-col">
            {availableActions.length > 0 ? (
              availableActions.map((action, index) => {
                const Icon = actionIcons[action.name] || FaCog;
                return (
                  <div key={index} className="mb-1.5">
                    <button
                      className="flex items-center justify-between w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() =>
                        handleActionSelect(
                          action.name,
                          contextMenu.node,
                          setActionsSubMenu,
                          setContextMenu,
                          setNodes,
                          setEdges,
                          setActiveAggregations
                        )
                      }
                    >
                      <div className="flex items-center">
                        <Icon className="mr-2 text-blue-600" />
                        {action.name}
                      </div>
                      <FaInfoCircle
                        title={t('Show Description')}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDescription(index);
                        }}
                        className="text-gray-500 cursor-pointer"
                      />
                    </button>
                    {visibleDescriptions[index] && (
                      <div
                        className="px-3 pb-2 text-gray-500 text-xs"
                        style={{
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          maxWidth: '180px',
                          lineHeight: '1.4',
                        }}
                      >
                        {action.description}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm italic">{t('No actions available')}</div>
            )}
            <hr className="my-1 border-gray-200" />
            <button
              className="flex items-center w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors"
              onClick={() =>
                handleActionSelect(
                  'add_action',
                  contextMenu.node,
                  setActionsSubMenu,
                  setContextMenu,
                  setNodes,
                  setEdges,
                  setActiveAggregations
                )
              }
            >
              <FaPlus className="mr-2" />
              {t('Add New Action')}
            </button>
          </div>
        </div>
      )}

      {advancedAggregationSubMenu?.visible && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-[1001] min-w-[220px] overflow-hidden"
          style={{ top: `${advancedAggregationSubMenu.y}px`, left: `${advancedAggregationSubMenu.x}px` }}
          ref={advancedAggregationSubRef}
          onMouseLeave={() => setAdvancedAggregationSubMenu(null)}
        >
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm">
            {t('Advanced Expention')}
          </div>
          <div className="p-2.5 flex flex-col gap-2.5">
            {loadingProperties ? (
              <div className="text-center">
                <FaCog className="animate-spin inline-block mr-2" />
                <span>{t('Loading properties...')}</span>
              </div>
            ) : errorProperties ? (
              <div className="text-red-500">{errorProperties}</div>
            ) : (
              <>
                <div>
                  <label className="block mb-1 text-sm">{t('Attribute')}:</label>
                  <select
                    value={advancedExpandParams.attribute}
                    onChange={(e) =>
                      setAdvancedExpandParams({ ...advancedExpandParams, attribute: e.target.value })
                    }
                    className="w-full p-1.5 border border-gray-300 rounded"
                    disabled={centralityAttributes.length === 0}
                  >
                    {centralityAttributes.length === 0 ? (
                      <option value="">{t('No numeric attributes available')}</option>
                    ) : (
                      centralityAttributes.map((attr) => (
                        <option key={attr} value={attr}>
                          {attr}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm">{t('Threshold')}:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={advancedExpandParams.threshold}
                    onChange={(e) =>
                      setAdvancedExpandParams({
                        ...advancedExpandParams,
                        threshold: parseFloat(e.target.value),
                      })
                    }
                    className="w-full p-1.5 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">{t('Max Level')}:</label>
                  <input
                    type="number"
                    value={advancedExpandParams.maxLevel}
                    onChange={(e) =>
                      setAdvancedExpandParams({
                        ...advancedExpandParams,
                        maxLevel: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-1.5 border border-gray-300 rounded"
                  />
                </div>
                {advancedExpandParams.maxLevel === 1 && (
                  <div>
                    <label className="block mb-1 text-sm">{t('Direction')}:</label>
                    <select
                      value={advancedExpandParams.direction}
                      onChange={(e) =>
                        setAdvancedExpandParams({ ...advancedExpandParams, direction: e.target.value })
                      }
                      className="w-full p-1.5 border border-gray-300 rounded"
                    >
                      <option value="In">{t('In')}</option>
                      <option value="Out">{t('Out')}</option>
                      <option value="Both">{t('Both')}</option>
                    </select>
                  </div>
                )}
                <button
                  className="mt-2.5 bg-blue-600 text-white px-2 py-1.5 rounded hover:bg-blue-700 transition-colors"
                  onClick={handleAdvancedExpandSubmit}
                >
                  {t('Apply')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ContextMenu;