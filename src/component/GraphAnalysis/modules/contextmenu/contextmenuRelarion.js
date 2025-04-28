// src/components/ContextMenuRel.jsx
import React from 'react';
import { FaEye } from 'react-icons/fa';
import { FaExpand } from 'react-icons/fa'; // Added for the expand icon
import './contextmenu.css';
import axios from 'axios';
const ContextMenuRel = ({
  contextMenuRel,
  setContextMenuRel,
  setNodes,
  setEdges,
}) => {
  if (!contextMenuRel || !contextMenuRel.visible) return null;

  const handleViewRelation = () => {
    console.log('Viewing relation:', contextMenuRel);
    setContextMenuRel(null);
  };

  const handleExpandRelation = async () => {
    const edge = contextMenuRel.edge;
    if (!edge?.aggregationpath || !edge.from || !edge.to) {
      console.error('Missing required edge properties for expansion');
      setContextMenuRel(null);
      return;
    }

    try {
      // Prepare the request payload
      const payload = {
        node_ids: [parseInt(edge.from), parseInt(edge.to)], // Assuming from/to are node IDs
        aggregationpath: edge.aggregationpath, // Use the aggregation path from the edge
      };

      // Make the POST request to the Django aggregate endpoint
      const response = await axios.post('http://127.0.0.1:8000/api/ExpandAggregation/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Assuming the response contains a 'path' array
      const { path } = response.data;

    


      console.log('Relation expanded successfully:', path);
    } catch (error) {
      console.error('Error expanding relation:', error);
      alert('Failed to expand the relation. Please try again.');
    } finally {
      setContextMenuRel(null); // Close the context menu
    }
  };

  // Check if the edge has an aggregationPath property that's not null
  const hasAggregationPath = contextMenuRel.edge?.aggregationpath != null;

  return (
    <div
      className="context-menu-container"
      style={{ 
        '--context-menu-y': `${contextMenuRel.y}px`, 
        '--context-menu-x': `${contextMenuRel.x}px` 
      }}
    >
      <div className="menu-header">Relation Actions</div>
      <div className="menu-items">
        <button 
          className="menu-item"
          onClick={handleViewRelation}
        >
          <FaEye style={{ marginRight: '10px', color: '#4361ee' }} />
          Detail Relation
        </button>
        <div className="menu-divider"></div>
        {hasAggregationPath && (
          <button 
            className="menu-item"
            onClick={handleExpandRelation}
          >
            <FaExpand style={{ marginRight: '10px', color: '#4361ee' }} />
            Expand
          </button>
        )}
        <button 
          className="menu-item"
          onClick={() => setContextMenuRel(null)}
        >
          <FaEye style={{ marginRight: '10px', color: '#6c757d' }} />
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ContextMenuRel;