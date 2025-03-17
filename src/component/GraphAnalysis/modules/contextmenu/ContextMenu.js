import React, { useState, useEffect , useRef } from 'react';
import axios from 'axios';
import { AddNeighborhoodParser, parsePath } from '../../utils/Parser';
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
  FaTimesCircle
} from 'react-icons/fa'; 
import { BASE_URL } from '../../utils/Urls';
import './contextmenu.css'; // Import the CSS file

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
}) => {
  const [possibleRelations, setPossibleRelations] = useState([]);
  const [subContextMenu, setSubContextMenu] = useState(null);
  const expandButtonRef = useRef(null);
  useEffect(() => {
    if (contextMenu && contextMenu.node && contextMenu.visible) {
      fetchPossibleRelations(contextMenu.node);
    }
  }, [contextMenu]);

  if (!contextMenu || !contextMenu.visible) return null;

  const fetchPossibleRelations = async (node) => {
    const token = localStorage.getItem('authToken');
    const node_type = node.group;
    const properties = {
      identity: parseInt(node.id, 10),
    };

    try {
      const response = await axios.post(
        BASE_URL + '/get_possible_relations/',
        { node_type, properties },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setPossibleRelations(response.data.relations);
      } else {
        console.error('Failed to fetch possible relations.');
      }
    } catch (error) {
      console.error('Error fetching possible relations:', error);
    }
  };

  const handleContextMenuAction = async (action, relationType = null) => {
    if (contextMenu && contextMenu.node) {
      if (action === 'Delete Node') {
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== contextMenu.node.id));
      }
      if (action === 'Delete Selected Nodes') {
        setNodes((prevNodes) => prevNodes.filter((node) => !selectedNodes.has(node.id)));
        setSelectedNodes(new Set());
      }
      if (action === 'View Neighborhood' || action === 'Expand Specific Relation') {
        const token = localStorage.getItem('authToken');
        const node_type = contextMenu.node.group;
        const properties = {
          identity: parseInt(contextMenu.node.id, 10),
        };

        try {
          const response = await axios.post(
            BASE_URL + '/get_node_relationships/',
            {
              node_type,
              properties,
              relation_type: relationType,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.status === 200) {
            const { nodes: neighborhoodNodes, edges: neighborhoodEdges } = AddNeighborhoodParser(
              response.data,
              { id: contextMenu.node.id }
            );
            setNodes((prevNodes) => [...prevNodes, ...neighborhoodNodes]);
            setEdges((prevEdges) => [...prevEdges, ...neighborhoodEdges]);
          } else {
            console.error('Submission failed.');
          }
        } catch (error) {
          console.error('Error during submission:', error);
        }
      }
      if (action === 'Select Node') {
        setSelectedNodes((prevSelected) => new Set([...prevSelected, contextMenu.node.id]));
    
      }
      if (action === 'Deselect Node') {
        setSelectedNodes((prevSelected) => {
          const newSelected = new Set(prevSelected);
          newSelected.delete(contextMenu.node.id);
          return newSelected;
        });
      }
      if (action === 'Edit Node') {
        console.log('Edit Node:', contextMenu.node);
      }

      if (action === 'all connections') {
        setIsBoxPath(true);
        if (true) {
          const nodeIds = Array.from(selectedNodes).map((id) => parseInt(id, 10));

          try {
            const response = await axios.post(
              BASE_URL + '/get_all_connections/',
              { ids: nodeIds },
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.status === 200) {
              const paths = response.data.paths;
              setAllPaths(paths);
              setCurrentPathIndex(0);
              updatePathNodesAndEdges(paths[0]);
            } else {
              console.error('Failed to fetch all connections.');
            }
          } catch (error) {
            console.error('Error fetching all connections:', error);
          }
        }
      }

      setContextMenu(null);
      setSubContextMenu(null);
    }
  };

  const updatePathNodesAndEdges = (path) => {
    const { nodes: formattedNodes, edges: formattedEdges } = parsePath(path);
    setPathNodes(formattedNodes);
    setPathEdges(formattedEdges);
  };

  const handleExpandAll = () => {
    handleContextMenuAction('View Neighborhood');
  };

  const handleExpandSpecific = (relationType) => {
    handleContextMenuAction('Expand Specific Relation', relationType);
  };

  const handleExpandClick = (event) => {
    if (expandButtonRef.current) {
      const buttonRect = expandButtonRef.current.getBoundingClientRect();
      console.log('Button position:', buttonRect);
  
      // You can use buttonRect to set the sub-context menu position
      setSubContextMenu({
        x: buttonRect.x +140 , // or buttonRect.left, depending on where you want the sub-menu
        y: buttonRect.y -90, // or buttonRect.top
        visible: true,
      });
    }
  };

  const handleInspectNode = () => {
    console.log('Inspect Node:', contextMenu.node);
    // Implementation for node inspection
  };

  return (
    <>
      {/* Main Context Menu */}
      <div
        className="context-menu-container"
        style={{
          '--context-menu-y': `${contextMenu.y}px`,
          '--context-menu-x': `${contextMenu.x}px`,
        }}
      >
        <div className="menu-header">
          Node Actions
        </div>
        
        <div className="menu-items">
        <button
            ref={expandButtonRef} // Attach the ref here
            className="menu-item"
            onClick={handleExpandClick}
          >
            <FaExpand style={{ marginRight: '10px', color: '#4361ee' }} />
            Expand
            <FaArrowRight style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }} />
          </button>
          
          <button
            className="menu-item"
            onClick={() => handleContextMenuAction('Edit Node')}
          >
            <FaEdit style={{ marginRight: '10px', color: '#4361ee' }} />
            Edit Node
          </button>
          
          {contextMenu.node?.selected ? (
            <button
              className="menu-item"
              onClick={() => handleContextMenuAction('Deselect Node')}
            >
              <FaTimes style={{ marginRight: '10px', color: '#e63946' }} />
              Deselect Node
            </button>
          ) : (
            <button
              className="menu-item"
              onClick={() => handleContextMenuAction('Select Node')}
            >
              <FaCheck style={{ marginRight: '10px', color: '#38b000' }} />
              Select Node
            </button>
          )}

          {contextMenu.node.selected ? (
            <button
              className="menu-item"
              onClick={() => handleContextMenuAction('all connections')}
            >
              <FaNetworkWired style={{ marginRight: '10px', color: '#4361ee' }} />
              All Connections
            </button>
          ) : null}
          
          <button
            className="menu-item"
            onClick={handleInspectNode}
          >
            <FaInfoCircle style={{ marginRight: '10px', color: '#4361ee' }} />
            Inspect Node Details
          </button>

          <div className="menu-divider"></div>

          <button
            className="menu-item"
            onClick={() => setContextMenu(null)}
          >
            <FaTimesCircle style={{ marginRight: '10px', color: '#6c757d' }} />
            Dismiss
          </button>

          {selectedNodes.size > 0 && (
            <button
              className="menu-item danger"
              onClick={() => handleContextMenuAction('Delete Selected Nodes')}
            >
              <FaTrash style={{ marginRight: '10px' }} />
              Delete Selected Nodes
            </button>
          )}

          <button
            className="menu-item danger"
            onClick={() => handleContextMenuAction('Delete Node')}
          >
            <FaTrash style={{ marginRight: '10px' }} />
            Delete Node
          </button>
        </div>
      </div>

      {/* Sub-Context Menu */}
      {subContextMenu && subContextMenu.visible && (
        <div
          className="sub-context-menu"
          style={{
            '--sub-context-menu-y': `${subContextMenu.y}px`,
            '--sub-context-menu-x': `${subContextMenu.x}px`,
          }}
        >
          <div className="menu-header">
            Expand Options
          </div>

          <div className="menu-items">
            <button
              className="menu-item"
              onClick={handleExpandAll}
            >
              <FaProjectDiagram style={{ marginRight: '10px', color: '#4361ee' }} />
              Expand All
            </button>
            
            {possibleRelations.length > 0 ? (
              possibleRelations.map((relation, index) => (
                <button
                  key={index}
                  className="menu-item"
                  onClick={() => handleExpandSpecific(relation)}
                >
                  <FaArrowRight style={{ marginRight: '10px', color: '#4361ee' }} />
                  {relation}
                </button>
              ))
            ) : (
              <div className="no-relations">
                No relations available
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ContextMenu;