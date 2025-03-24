// src/components/ContextMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-icons/fa';
import { FaLocationDot, FaCodeFork } from 'react-icons/fa6';
import './contextmenu.css';
import {
  fetchPossibleRelations,
  handleNodeExpansion,
  handleAllConnections,
  handleActionSelect,
} from './functions_node_click';

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
  const expandButtonRef = useRef(null);
  const actionsButtonRef = useRef(null);
  const subContextRef = useRef(null);
  const actionsSubRef = useRef(null);

  useEffect(() => {
    if (contextMenu?.node && contextMenu.visible) {
      fetchPossibleRelations(contextMenu.node, setPossibleRelations);
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
    }
  };

  const handleMouseLeaveActions = () => {
    if (!actionsSubRef.current || !actionsSubRef.current.matches(':hover')) {
      setActionsSubMenu(null);
    }
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
    } else if (action === 'Deactivated') { // New action for deactivation
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

    setContextMenu(null);
    setSubContextMenu(null);
    setActionsSubMenu(null);
  };

  if (!contextMenu || !contextMenu.visible) return null;

  return (
    <>
      <div
        className="context-menu-container"
        style={{ '--context-menu-y': `${contextMenu.y}px`, '--context-menu-x': `${contextMenu.x}px` }}
        ref={expandButtonRef}
      >
        <div className="menu-header">Node Actions</div>
        <div className="menu-items">
          <button
            className="menu-item"
            onMouseEnter={handleMouseEnterExpand}
            onMouseLeave={handleMouseLeaveExpand}
          >
            <FaExpand style={{ marginRight: '10px', color: '#4361ee' }} />
            Expand
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          <button
            ref={actionsButtonRef}
            className="menu-item"
            onMouseEnter={handleMouseEnterActions}
            onMouseLeave={handleMouseLeaveActions}
          >
            <FaCog style={{ marginRight: '10px', color: '#4361ee' }} />
            Actions
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
              possibleRelations.map((relation, index) => (
                <button
                  key={index}
                  className="menu-item"
                  onClick={() => handleContextMenuAction('Expand Specific Relation', relation)}
                >
                  <FaArrowRight style={{ marginRight: '10px', color: '#4361ee' }} />
                  {relation}
                </button>
              ))
            ) : (
              <div className="no-relations">No relations available</div>
            )}
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
          {contextMenu.node.group === 'Affaire' && (
            <button
              className="menu-item"
              onClick={() => handleActionSelect('Copy Node', contextMenu.node, setActionsSubMenu, setContextMenu , setNodes ,setEdges,setActiveAggregations)}
            >
              <FaLocationDot style={{ marginRight: '10px', color: '#4361ee' }} />
              Affaire dans la meme region
            </button>
          )}
            {contextMenu.node.group === 'Personne' && (
              <button
                className="menu-item"
                onClick={() => handleActionSelect('Show Person Profile', contextMenu.node, setActionsSubMenu, setContextMenu , setNodes ,setEdges,setActiveAggregations)}
              >
                <FaLocationDot style={{ marginRight: '10px', color: '#4361ee' }} />
                Show Person Profile
              </button>
            )}
             {contextMenu.node.group === 'Personne' && (
            <button
              className="menu-item"
  onClick={() => handleActionSelect('Show tree of criminal', contextMenu.node, setActionsSubMenu, setContextMenu , setNodes ,setEdges,setActiveAggregations )}
            >
              <FaCodeFork style={{ marginRight: '10px', color: '#4361ee' }} />
              Show tree of criminal
            </button>
               )}
          </div>
        </div>
      )}
    </>
  );
};

export default ContextMenu;