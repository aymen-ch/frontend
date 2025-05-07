import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  FaExpand,
  FaEdit,
  FaTrash,
  FaPowerOff,
  FaPlay,
  FaCheck,
  FaTimes,
  FaProjectDiagram,
  FaEye,
  FaNetworkWired,
  FaArrowRight,
  FaInfoCircle,
  FaTimesCircle,
  FaCog,
  FaSlidersH,
  FaPlus,
} from 'react-icons/fa';
import { FaLocationDot, FaCodeFork } from 'react-icons/fa6';
import './contextmenu.css';
import {
  fetchPossibleRelations,
  handleNodeExpansion,
  handleAllConnections,
  handleActionSelect,
  handleAdvancedExpand,
  handleNodeExpansion_selected,
} from './functions_node_click';
import { getNodeColor, getNodeIcon } from '../../utils/Parser';
import { BASE_URL } from '../../utils/Urls';

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
    direction: 'Both', // New field for direction
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

  // Fetch numeric node properties
  const fetchNodeProperties = useCallback(async (nodeType) => {
    if (!nodeType) return;
    setLoadingProperties(true);
    setErrorProperties(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${BASE_URL}/node-types/properties/`, {
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

  // Get numeric properties
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

  // Fetch relations, actions, and properties when context menu is visible

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
                  const response = await axios.post(`${BASE_URL}/get_virtual_relation_count/`, {
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
          .post(`${BASE_URL}/get_available_actions/`, { node_type: contextMenu.node.group })
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
        className="context-menu-container"
        style={{ '--context-menu-y': `${contextMenu.y}px`, '--context-menu-x': `${contextMenu.x}px` }}
      >
        <div className="menu-header">{t('Node Actions')}</div>
        <div className="menu-items">
          <button
            className="menu-item"
            onMouseEnter={handleMouseEnterExpand}
            onMouseLeave={handleMouseLeaveExpand}
            ref={expandButtonRef}
          >
            <FaExpand style={{ marginRight: '10px', color: '#4361ee' }} />
            {t('Expand')}
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          <button
            className="menu-item"
            onMouseEnter={handleMouseEnterActions}
            onMouseLeave={handleMouseLeaveActions}
            ref={actionsButtonRef}
          >
            <FaCog style={{ marginRight: '10px', color: '#4361ee' }} />
            {t('Actions')}
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          <button
            className="menu-item"
            onMouseEnter={handleMouseEnterAdvancedAggregation}
            onMouseLeave={handleMouseLeaveAdvancedAggregation}
            ref={advancedAggregationButtonRef}
          >
            <FaSlidersH style={{ marginRight: '10px', color: '#4361ee' }} />
            {t('Advanced Aggregation')}
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          {contextMenu.node?.selected ? (
            <button className="menu-item" onClick={() => handleContextMenuAction(t('Deselect Node'))}>
              <FaTimes style={{ marginRight: '10px', color: '#e63946' }} />
              {t('Deselect Node')}
            </button>
          ) : (
            <button className="menu-item" onClick={() => handleContextMenuAction(t('Select Node'))}>
              <FaCheck style={{ marginRight: '10px', color: '#38b000' }} />
              {t('Select Node')}
            </button>
          )}
          {contextMenu.node?.activated ? (
            <button className="menu-item" onClick={() => handleContextMenuAction(t('Deactivated'))}>
              <FaTimes style={{ marginRight: '10px', color: '#e63946' }} />
              {t('Deactivated')}
            </button>
          ) : (
            <button className="menu-item" onClick={() => handleContextMenuAction(t('Activated'))}>
              <FaPlay style={{ marginRight: '10px', color: '#38b000' }} />
              {t('Activated')}
            </button>
          )}
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => setContextMenu(null)}>
            <FaTimesCircle style={{ marginRight: '10px', color: '#6c757d' }} />
            {t('Dismiss')}
          </button>
          {selectedNodes.size > 0 && (
            <button
              className="menu-item danger"
              onClick={() => handleContextMenuAction(t('Delete Selected Nodes'))}
            >
              <FaTrash style={{ marginRight: '10px' }} />
              {t('Delete Selected Nodes')}
            </button>
          )}
          <button className="menu-item danger" onClick={() => handleContextMenuAction(t('Delete Node'))}>
            <FaTrash style={{ marginRight: '10px' }} />
            {t('Delete Node')}
          </button>
          <button className="menu-item danger" onClick={() => handleContextMenuAction(t('Disable Others'))}>
            <FaPowerOff style={{ marginRight: '10px' }} />
            {t('Disable Others')}
          </button>
        </div>
      </div>

      {subContextMenu?.visible && (
        <div
          className="sub-context-menu"
          style={{ '--sub-context-menu-y': `${subContextMenu.y}px`, '--sub-context-menu-x': `${subContextMenu.x}px` }}
          ref={subContextRef}
          onMouseLeave={() => setSubContextMenu(null)}
        >
          <div className="expand-options">
            <label>
              {t('Limit')}:
              <input
                type="number"
                min="1"
                value={expandLimit}
                onChange={(e) => setExpandLimit(Number(e.target.value))}
                style={{ width: '60px', marginLeft: '8px', marginRight: '16px' }}
              />
            </label>
            <label>
              {t('Direction')}:
              <select
                value={expandDirection}
                onChange={(e) => setExpandDirection(e.target.value)}
                style={{ marginLeft: '8px' }}
              >
                <option value="In">{t('In')}</option>
                <option value="Out">{t('Out')}</option>
                <option value="Both">{t('Both')}</option>
              </select>
            </label>
          </div>

          <div className="menu-header">{t('Expand Options')}</div>
          <div className="menu-items">

            <button
              className="menu-item"
              onClick={() => handleContextMenuAction(t('View Neighborhood'))}
            >

              <FaProjectDiagram style={{ marginRight: '10px', color: '#4361ee' }} />
              {t('Expand All')}
            </button>

            <div className="relations-section">
              <div className="section-header">{t('Normal Relations')}</div>

              {possibleRelations.filter((relation) => !relation.isVirtual).length > 0 ? (
                possibleRelations
                  .filter((relation) => !relation.isVirtual)

                  .map((relation, index) => {
                    const startIconPath = getNodeIcon(relation.startNode);
                    const endIconPath = getNodeIcon(relation.endNode);
                    return (
                      <button
                        key={`normal-${index}`}
                        className="menu-item"
                        onClick={() => handleContextMenuAction(t('Expand Specific Relation'), relation.name)}
                      >

                        <FaArrowRight
                          style={{ marginRight: '10px', color: '#4361ee' }}
                        />

                        <span className="relation-display">
                          <span className="node-start" style={{ color: getNodeColor(relation.startNode) }}>
                            {startIconPath && (
                              <span
                                className="icon-container"
                                style={{ backgroundColor: getNodeColor(relation.startNode) }}
                              >
                                <img
                                  src={startIconPath}
                                  alt={`${relation.startNode} icon`}
                                  className="node-icon"
                                />
                              </span>
                            )}
                            {relation.startNode}
                          </span>
                          <span className="relation-name"> ---- {relation.name} ----</span>
                          <span className="node-end" style={{ color: getNodeColor(relation.endNode) }}>
                            {endIconPath && (
                              <span
                                className="icon-container"
                                style={{ backgroundColor: getNodeColor(relation.endNode) }}
                              >
                                <img

                                  src={endIconPath}

                                  alt={`${relation.endNode} icon`}
                                  className="node-icon"
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
                <div className="no-relations">{t('No normal relations available')}</div>
              )}
            </div>

            <div className="relations-section">
              <div className="section-header">{t('Virtual Relations')}</div>

              {possibleRelations.filter((relation) => relation.isVirtual).length > 0 ? (
                possibleRelations
                  .filter((relation) => relation.isVirtual)

                  .map((relation, index) => {
                    const startIconPath = getNodeIcon(relation.startNode);
                    const endIconPath = getNodeIcon(relation.endNode);
                    return (
                      <button
                        key={`virtual-${index}`}
                        className="menu-item virtual-relation"
                        onClick={() => handleContextMenuAction(t('Expand Specific Relation'), relation.name)}
                      >

                        <FaArrowRight style={{ marginRight: '10px', color: '#38b000' }} />

                        <span className="relation-display">
                          <span className="node-start" style={{ color: getNodeColor(relation.startNode) }}>
                            {startIconPath && (
                              <span
                                className="icon-container"
                                style={{ backgroundColor: getNodeColor(relation.startNode) }}
                              >
                                <img
                                  src={startIconPath}
                                  alt={`${relation.startNode} icon`}
                                  className="node-icon"
                                />
                              </span>
                            )}
                            {relation.startNode}
                          </span>
                          <span className="relation-name"> ---- {relation.name} ----</span>
                          <span className="node-end" style={{ color: getNodeColor(relation.endNode) }}>
                            {endIconPath && (
                              <span
                                className="icon-container"
                                style={{ backgroundColor: getNodeColor(relation.endNode) }}
                              >
                                <img
                                  src={endIconPath}
                                  alt={`${relation.endNode} icon`}
                                  className="node-icon"
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
                <div className="no-relations">{t('No virtual relations available')}</div>
              )}
            </div>

            <hr />
            {selectedNodes.size > 0 && (

              <button
                className="menu-item"
                onClick={() => handleContextMenuAction(t('Expand All seleced nodes'))}
              >

                <FaProjectDiagram style={{ marginRight: '10px', color: '#4361ee' }} />
                {t('Expand All seleced nodes')}
              </button>
            )}
          </div>
        </div>
      )}

      {actionsSubMenu?.visible && (
        <div
          className="sub-context-menu"
          style={{
            '--sub-context-menu-y': `${actionsSubMenu.y}px`,
            '--sub-context-menu-x': `${actionsSubMenu.x}px`,
            minWidth: '200px',
          }}
          ref={actionsSubRef}
          onMouseLeave={() => setActionsSubMenu(null)}
        >
          <div className="menu-header">{t('Action Options')}</div>
          <div className="menu-items">
            {availableActions.length > 0 ? (
              availableActions.map((action, index) => {
                const Icon = actionIcons[action.name] || FaCog;
                return (
                  <div key={index} className="menu-item-wrapper">
                    <button
                      className="menu-item d-flex align-items-center justify-content-between w-100"
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
                      <div className="d-flex align-items-center">
                        <Icon style={{ marginRight: '10px', color: '#4361ee' }} />
                        {action.name}
                      </div>
                      <FaInfoCircle
                        title={t('Show Description')}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDescription(index);
                        }}
                        style={{ color: '#888', cursor: 'pointer' }}
                      />
                    </button>
                    {visibleDescriptions[index] && (

                      <div
                        className="action-description text-muted small px-3 pb-2"
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
              <div className="no-relations">{t('No actions available')}</div>
            )}
            <div className="menu-divider"></div>
            <button
              className="menu-item"
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
              <FaPlus style={{ marginRight: '10px', color: '#38b000' }} />
              {t('Add New Action')}
            </button>
          </div>
        </div>
      )}

      {advancedAggregationSubMenu?.visible && (
        <div
          className="sub-context-menu"
          style={{
            '--sub-context-menu-y': `${advancedAggregationSubMenu.y}px`,
            '--sub-context-menu-x': `${advancedAggregationSubMenu.x}px`,
          }}
          ref={advancedAggregationSubRef}
          onMouseLeave={() => setAdvancedAggregationSubMenu(null)}
        >
          <div className="menu-header">{t('Advanced Aggregation')}</div>
          <div className="menu-items" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loadingProperties ? (
              <div className="text-center">
                <FaCog className="fa-spin" />
                <span className="ms-2">{t('Loading properties...')}</span>
              </div>
            ) : errorProperties ? (
              <div className="text-danger">{errorProperties}</div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('Attribute')}:</label>
                  <select
                    value={advancedExpandParams.attribute}
                    onChange={(e) =>
                      setAdvancedExpandParams({ ...advancedExpandParams, attribute: e.target.value })
                    }
                    style={{ width: '100%', padding: '5px' }}
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
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('Threshold')}:</label>
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
                    style={{ width: '100%', padding: '5px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>{t('Max Level')}:</label>
                  <input
                    type="number"
                    value={advancedExpandParams.maxLevel}
                    onChange={(e) =>
                      setAdvancedExpandParams({
                        ...advancedExpandParams,
                        maxLevel: parseInt(e.target.value),
                      })
                    }
                    style={{ width: '100%', padding: '5px' }}
                  />
                </div>
                {advancedExpandParams.maxLevel === 1 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>{t('Direction')}:</label>
                    <select
                      value={advancedExpandParams.direction}
                      onChange={(e) =>
                        setAdvancedExpandParams({ ...advancedExpandParams, direction: e.target.value })
                      }
                      style={{ width: '100%', padding: '5px' }}
                    >
                      <option value="In">{t('In')}</option>
                      <option value="Out">{t('Out')}</option>
                      <option value="Both">{t('Both')}</option>
                    </select>
                  </div>
                )}
                <button
                  className="menu-item"
                  onClick={handleAdvancedExpandSubmit}
                  style={{
                    marginTop: '10px',
                    background: '#4361ee',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
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