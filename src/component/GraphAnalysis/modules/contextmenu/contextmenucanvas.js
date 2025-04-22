// src/components/ContextMenucanvas.jsx
import React from 'react';
import { FaEye } from 'react-icons/fa';
import { FaExpand } from 'react-icons/fa'; // Added for the expand icon
import './contextmenu.css';
import axios from 'axios';
import { handleNodeExpansion_selected } from './functions_node_click';
const ContextMenucanvas = ({
ContextMenucanvas,
SetContextMenucanvas,
  setNodes,
  setEdges,
  selectedNodes,
  setSelectedNodes,
  selectedEdges,
  setselectedEdges
}) => {
  if (!ContextMenucanvas || !ContextMenucanvas.visible) return null;

  

const handleContextMenuAction = (action) => {
    if (!ContextMenucanvas) return;

    if (action === 'Deselect all nodes') {
        setSelectedNodes(new Set());
        setselectedEdges(new Set())
    }
    else if (action === 'enable all') {
       
        setEdges((prevEdges) => prevEdges.map((edge) => ({
            ...edge,
            disabled:false,
          }))
      
        );
        // Update nodes: enable only clicked node and neighbors
        setNodes((prevNodes) =>
          prevNodes.map((node) => ({
            ...node,
            disabled: false,
          }))
        );
    }else if (action === 'Expan all selected nodes'){
         //// add function 
         handleNodeExpansion_selected(selectedNodes, setNodes, setEdges);
    } 
    else if (action === 'selecte all nodes'){
        setSelectedNodes((prevSelected) => {
            const allNodeIds = new Set();
            setNodes((prevNodes) => {
              prevNodes.forEach((node) => allNodeIds.add(node.id));
              return prevNodes; // No change to nodes
            });
            return allNodeIds;
          });
       
          setselectedEdges((prevSelected) => {
            const allNodeIds = new Set();
            setEdges((prevNodes) => {
              prevNodes.forEach((node) => allNodeIds.add(node.id));
              return prevNodes; // No change to nodes
            });
            return allNodeIds;
          });
   } 
      

    SetContextMenucanvas(null);

   
  };
  return (
    <div
      className="context-menu-container"
      style={{ 
        '--context-menu-y': `${ContextMenucanvas.y}px`, 
        '--context-menu-x': `${ContextMenucanvas.x}px` 
      }}
    >
      <div className="menu-header">Canvas Actions</div>
      <div className="menu-items">
       {
          selectedNodes.size>0 &&
        ( <button 
            className="menu-item"
            onClick={() =>handleContextMenuAction("Expan all selected nodes")}
          >
            <FaEye style={{ marginRight: '10px', color: '#4361ee' }} />
              Expan all selected nodes
          </button>)
       }
      <button 
          className="menu-item"
          onClick={() =>handleContextMenuAction("enable all")}
        >
          <FaEye style={{ marginRight: '10px', color: 'green' }} />
          enable all
        </button>
        <button 
          className="menu-item"
          onClick={() => SetContextMenucanvas(null)}
        >
          <FaEye style={{ marginRight: '10px', color: '#6c757d' }} />
          Dismiss
        </button>
        <hr></hr>
{ selectedNodes.size>0 && (  <button 
          className="menu-item"
          onClick={() =>handleContextMenuAction("Deselect all nodes")}
        >
          <FaEye style={{ marginRight: '10px', color: 'red' }} />
          Deselect all nodes
        </button>)}
        <button 
          className="menu-item"
          onClick={() => handleContextMenuAction('selecte all nodes')}
        >
          <FaEye style={{ marginRight: '10px', color: 'green' }} />
          selecte all nodes
        </button>
        
      </div>
    </div>
  );
};

export default ContextMenucanvas;