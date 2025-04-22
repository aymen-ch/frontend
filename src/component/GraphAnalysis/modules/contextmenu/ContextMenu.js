import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FaExpand,
  FaEdit,
  FaTrash,
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
  FaPlus, // Add this
} from 'react-icons/fa';
import { FaLocationDot, FaCodeFork } from 'react-icons/fa6';
import './contextmenu.css';
import {
  fetchPossibleRelations,
  handleNodeExpansion,
  handleAllConnections,
  handleActionSelect,
  handleAdvancedExpand,
  handleNodeExpansion_selected
 
} from './functions_node_click';
import { getNodeColor,getNodeIcon } from '../../utils/Parser';
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
  const [possibleRelations, setPossibleRelations] = useState([]);
  const [subContextMenu, setSubContextMenu] = useState(null);
  const [actionsSubMenu, setActionsSubMenu] = useState(null);
  const [advancedAggregationSubMenu, setAdvancedAggregationSubMenu] = useState(null);
  const expandButtonRef = useRef(null);
  const actionsButtonRef = useRef(null);
  const advancedAggregationButtonRef = useRef(null);
  const subContextRef = useRef(null);
  const actionsSubRef = useRef(null);
  const advancedAggregationSubRef = useRef(null);
  const [advancedExpandParams, setAdvancedExpandParams] = useState({
    attribute: '_betweenness',
    threshold: 0.01,
    maxLevel: 5,
  });
  const [availableActions, setAvailableActions] = useState([]);
  const actionIcons = {
    'Affaire dans la meme region': FaLocationDot,
    'Show Criminal Network': FaCodeFork,
    'Show Person Profile': FaInfoCircle,
    // Add more action-to-icon mappings as needed
  };
  const centralityAttributes = [
    'degree_out',
    'degree_in',
    '_betweennessCentrality',
    '_pagerank',
    '_articleRank',
    '_eigenvector',
    '_betweenness',
  ];

  useEffect(() => {
    if (contextMenu?.node && contextMenu.visible) {
      // Initialize possible relations
      let relations = [];

      // Fetch standard relations from backend
      fetchPossibleRelations(contextMenu.node, (backendRelations) => {
        // Map backend relations to include isVirtual: false
        relations = backendRelations.map((rel) => ({
          name: rel.name,
          startNode: rel.startNode,
          endNode: rel.endNode,
          isVirtual: false,
        }));

        // Get virtual relations from local storage
        const virtualRelations = JSON.parse(localStorage.getItem('virtualRelations')) || [];
        const nodeGroup = contextMenu.node.group; // e.g., 'Wilaya'
        console.log("virtuel", virtualRelations);

        // Filter virtual relations where node group matches the start of the path
        const matchingVirtualRelations = virtualRelations
          .filter((vr) => vr.path[0] === nodeGroup)
          .map((vr) => ({
            name: vr.name,
            startNode: vr.path[0],
            endNode: vr.path[vr.path.length - 1],
            isVirtual: true,
          }));

          
        // Combine backend and virtual relations, ensuring no duplicates by name
        const combinedRelations = [...relations, ...matchingVirtualRelations];
        const uniqueRelations = Array.from(
          new Map(combinedRelations.map((rel) => [rel.name, rel])).values()
        );

        setPossibleRelations(uniqueRelations);
      });

      axios
        .post(BASE_URL+'/get_available_actions/', { node_type: contextMenu.node.group })
        .then((response) => {
          setAvailableActions(response.data.actions || []);
        })
        .catch((error) => {
          console.error('Error fetching available actions:', error);
        });
    }
  }, [contextMenu]);

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

    await handleAdvancedExpand(
      contextMenu.node,
      setNodes,
      setEdges,
      advancedExpandParams
    );

    setContextMenu(null);
    setAdvancedAggregationSubMenu(null);
  };

  const handleContextMenuAction = (action, relationType = null) => {
    if (!contextMenu?.node) return;

    if (action === 'Delete Node') {
      const nodeIdToDelete = contextMenu.node.id;
      setNodes((prev) => prev.filter((node) => node.id !== nodeIdToDelete));
      setEdges((prev) => prev.filter((edge) => edge.from !== nodeIdToDelete && edge.to !== nodeIdToDelete));
    } else if (action === 'Delete Selected Nodes') {
      const selectedNodeIds = new Set(selectedNodes);
      setNodes((prev) => prev.filter((node) => !selectedNodeIds.has(node.id)));
      setEdges((prev) => prev.filter((edge) => !selectedNodeIds.has(edge.from) && !selectedNodeIds.has(edge.to)));
      setSelectedNodes(new Set());
    } else if (action === 'View Neighborhood' || action === 'Expand Specific Relation') {
      handleNodeExpansion(contextMenu.node, relationType, setNodes, setEdges);
    } else if (action === 'Select Node') {
      setSelectedNodes((prev) => new Set([...prev, contextMenu.node.id]));
    } else if (action === 'Activated') {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === contextMenu.node.id ? { ...node, activated: true } : node
        )
      );
    } else if (action === 'Deactivated') {
    } else if (action === 'Deactivated') {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === contextMenu.node.id ? { ...node, activated: false } : node
        )
      );
    } else if (action === 'Deselect Node') {
      setSelectedNodes((prev) => {
        const newSelected = new Set(prev);
        newSelected.delete(contextMenu.node.id);
        return newSelected;
      });
    } else if (action === 'Edit Node') {
      console.log('Edit Node:', contextMenu.node);
    } else if (action === 'all connections') {
      handleAllConnections(selectedNodes, setAllPaths, setCurrentPathIndex, setPathNodes, setPathEdges, setIsBoxPath);
    }
    else if (action === 'Disable Others') {
      const clickedNodeId = contextMenu.node.id;
      // Find all direct neighbors by checking edges
      const enabledNodeIds = new Set([clickedNodeId]); // Include clicked node
      setEdges((prevEdges) => {
        prevEdges.forEach((edge) => {
          if (edge.from === clickedNodeId) {
            enabledNodeIds.add(edge.to);
          } else if (edge.to === clickedNodeId) {
            enabledNodeIds.add(edge.from);
          }
        });
        // Update edges: enable only those where both nodes are enabled
        const updatedEdges = prevEdges.map((edge) => ({
          ...edge,
          disabled: !(enabledNodeIds.has(edge.from) && enabledNodeIds.has(edge.to)),
        }));
        return updatedEdges;
      });
      // Update nodes: enable only clicked node and neighbors
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          disabled: !enabledNodeIds.has(node.id),
        }))
      );
    }else if (action === 'Expand All seleced nodes'){
         //// add function 
         handleNodeExpansion_selected(selectedNodes, setNodes, setEdges);
    }

    setContextMenu(null);
    setSubContextMenu(null);
    setActionsSubMenu(null);
    setAdvancedAggregationSubMenu(null);
  };

  if (!contextMenu || !contextMenu.visible) return null;

  return (
    <>
      <div
        className="context-menu-container"
        style={{ '--context-menu-y': `${contextMenu.y}px`, '--context-menu-x': `${contextMenu.x}px` }}
      >
        <div className="menu-header">Node Actions</div>
        <div className="menu-items">
          <button
            className="menu-item"
            onMouseEnter={handleMouseEnterExpand}
            onMouseLeave={handleMouseLeaveExpand}
            ref={expandButtonRef}
          >
            <FaExpand style={{ marginRight: '10px', color: '#4361ee' }} />
            Expand
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          <button
            className="menu-item"
            onMouseEnter={handleMouseEnterActions}
            onMouseLeave={handleMouseLeaveActions}
            ref={actionsButtonRef}
          >
            <FaCog style={{ marginRight: '10px', color: '#4361ee' }} />
            Actions
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          <button
            className="menu-item"
            onMouseEnter={handleMouseEnterAdvancedAggregation}
            onMouseLeave={handleMouseLeaveAdvancedAggregation}
            ref={advancedAggregationButtonRef}
          >
            <FaSlidersH style={{ marginRight: '10px', color: '#4361ee' }} />
            Advanced Aggregation
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          {contextMenu.node?.selected ? (
            <button className="menu-item" onClick={() => handleContextMenuAction('Deselect Node')}>
              <FaTimes style={{ marginRight: '10px', color: '#e63946' }} />
              Deselect Node
            </button>
          ) : (
            <button className="menu-item" onClick={() => handleContextMenuAction('Select Node')}>
              <FaCheck style={{ marginRight: '10px', color: '#38b000' }} />
              Select Node
            </button>
          )}
              {contextMenu.node?.activated ? (
                      <button className="menu-item" onClick={() => handleContextMenuAction('Deactivated')}>
                        <FaTimes style={{ marginRight: '10px', color: '#e63946' }} />
                        Deactivate
                      </button>
                    ) : (
                      <button className="menu-item" onClick={() => handleContextMenuAction('Activated')}>
                        <FaCheck style={{ marginRight: '10px', color: '#38b000' }} />
                        Activate
                      </button>
                    )}
          <div className="menu-divider"></div>
          <button className="menu-item" onClick={() => setContextMenu(null)}>
            <FaTimesCircle style={{ marginRight: '10px', color: '#6c757d' }} />
            Dismiss
          </button>
          {selectedNodes.size > 0 && (
            <button className="menu-item danger" onClick={() => handleContextMenuAction('Delete Selected Nodes')}>
              <FaTrash style={{ marginRight: '10px' }} />
              Delete Selected Nodes
            </button>
          )}
          <button className="menu-item danger" onClick={() => handleContextMenuAction('Delete Node')}>
            <FaTrash style={{ marginRight: '10px' }} />
            Delete Node
          </button>
          <button className="menu-item danger" onClick={() => handleContextMenuAction('Disable Others')}>
            <FaTrash style={{ marginRight: '10px' }} />
            Disable Other
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
          <div className="menu-header">Expand Options</div>
          <div className="menu-items">
            <button className="menu-item" onClick={() => handleContextMenuAction('View Neighborhood')}>
              <FaProjectDiagram style={{ marginRight: '10px', color: '#4361ee' }} />
              Expand All
            </button>

            {possibleRelations.length > 0 ? (
              possibleRelations.map((relation, index) => {
                const startIconPath = getNodeIcon(relation.startNode);
                const endIconPath = getNodeIcon(relation.endNode);
                return (
                  <button
                    key={index}
                    className={`menu-item ${relation.isVirtual ? 'virtual-relation' : ''}`}
                    onClick={() => handleContextMenuAction('Expand Specific Relation', relation.name)}
                  >
                    <FaArrowRight
                      style={{ marginRight: '10px', color: relation.isVirtual ? '#38b000' : '#4361ee' }}
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
                      <span className="relation-name"> ---- {relation.name} ----{'>'} </span>
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
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="no-relations">No relations available</div>
            )}
            <hr></hr>
             {selectedNodes.size > 0 && (<button className="menu-item" onClick={() => handleContextMenuAction('Expand All seleced nodes')}>
              <FaProjectDiagram style={{ marginRight: '10px', color: '#4361ee' }} />
              Expand All seleced nodes
            </button>)}
          </div>
        </div>
      )}

{actionsSubMenu?.visible && (
  <div
    className="sub-context-menu"
    style={{ '--sub-context-menu-y': `${actionsSubMenu.y}px`, '--sub-context-menu-x': `${actionsSubMenu.x}px` }}
    ref={actionsSubRef}
    onMouseLeave={() => setActionsSubMenu(null)}
  >
    <div className="menu-header">Action Options</div>
    <div className="menu-items">
      {availableActions.length > 0 ? (
        availableActions.map((action, index) => {
          const Icon = actionIcons[action.name] || FaCog; // Fallback to FaCog if no icon defined
          return (
            <button
              key={index}
              className="menu-item"
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
              <Icon style={{ marginRight: '10px', color: '#4361ee' }} />
              {action.name}
            </button>
          );
        })
      ) : (
        <div className="no-relations">No actions available</div>
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
        Add New Action
      </button>
    </div>
  </div>
)}

      {advancedAggregationSubMenu?.visible && (
        <div
          className="sub-context-menu"
          style={{ '--sub-context-menu-y': `${advancedAggregationSubMenu.y}px`, '--sub-context-menu-x': `${advancedAggregationSubMenu.x}px` }}
          ref={advancedAggregationSubRef}
          onMouseLeave={() => setAdvancedAggregationSubMenu(null)}
        >
          <div className="menu-header">Advanced Aggregation</div>
          <div className="menu-items" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Attribute:</label>
              <select
                value={advancedExpandParams.attribute}
                onChange={(e) => setAdvancedExpandParams({ ...advancedExpandParams, attribute: e.target.value })}
                style={{ width: '100%', padding: '5px' }}
              >
                {centralityAttributes.map((attr) => (
                  <option key={attr} value={attr}>
                    {attr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Threshold:</label>
              <input
                type="number"
                step="0.001"
                value={advancedExpandParams.threshold}
                onChange={(e) => setAdvancedExpandParams({ ...advancedExpandParams, threshold: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Max Level:</label>
              <input
                type="number"
                value={advancedExpandParams.maxLevel}
                onChange={(e) => setAdvancedExpandParams({ ...advancedExpandParams, maxLevel: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <button
              className="menu-item"
              onClick={handleAdvancedExpandSubmit}
              style={{ marginTop: '10px', background: '#4361ee', color: 'white', padding: '8px', borderRadius: '4px' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextMenu;