import React, { useState } from 'react';
import { FaEye, FaCog } from 'react-icons/fa';
import './contextmenu.css';
import axios from 'axios';
import { handleNodeExpansion_selected } from './functions_node_click';
import { useTranslation } from 'react-i18next';

const ContextMenucanvas = ({
  ContextMenucanvas,
  SetContextMenucanvas,
  setNodes,
  setEdges,
  selectedNodes,
  setSelectedNodes,
  selectedEdges,
  setselectedEdges,
}) => {
  const { t } = useTranslation();
  const [expandLimit, setExpandLimit] = useState(10);
  const [expandDirection, setExpandDirection] = useState('Both');
  const [showExpandOptions, setShowExpandOptions] = useState(false);

  if (!ContextMenucanvas || !ContextMenucanvas.visible) return null;

  const handleContextMenuAction = (action) => {
    if (!ContextMenucanvas) return;

    if (action === 'Deselect all nodes') {
      setSelectedNodes(new Set());
      setselectedEdges(new Set());
    } else if (action === 'enable all') {
      setEdges((prevEdges) =>
        prevEdges.map((edge) => ({
          ...edge,
          disabled: false,
        }))
      );
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          disabled: false,
        }))
      );
    } else if (action === 'Expand all selected nodes') {
      handleNodeExpansion_selected(selectedNodes, setNodes, setEdges, expandLimit, expandDirection);
    } else if (action === 'selecte all nodes') {
      setSelectedNodes((prevSelected) => {
        const allNodeIds = new Set();
        setNodes((prevNodes) => {
          prevNodes.forEach((node) => allNodeIds.add(node.id));
          return prevNodes;
        });
        return allNodeIds;
      });
      setselectedEdges((prevSelected) => {
        const allEdgeIds = new Set();
        setEdges((prevEdges) => {
          prevEdges.forEach((edge) => allEdgeIds.add(edge.id));
          return prevEdges;
        });
        return allEdgeIds;
      });
    }

    SetContextMenucanvas(null);
  };

  const toggleExpandOptions = () => {
    setShowExpandOptions(!showExpandOptions);
  };

  return (
    <div
      className="context-menu-container"
      style={{
        '--context-menu-y': `${ContextMenucanvas.y}px`,
        '--context-menu-x': `${ContextMenucanvas.x}px`,
      }}
    >
      <div className="menu-header">{t('Canvas Actions')}</div>
      <div className="menu-items">
        {selectedNodes.size > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="menu-item"
                onClick={() => handleContextMenuAction('Expand all selected nodes')}
                style={{ flex: '1' }}
              >
                <FaEye style={{ marginRight: '10px', color: '#4361ee' }} />
                {t('Expand all selected nodes')}
              </button>
              <button
                onClick={toggleExpandOptions}
                style={{
                  padding: '5px',
                  backgroundColor: showExpandOptions ? 'rgba(66, 153, 225, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
                title={t('Toggle expand options')}
              >
                <FaCog size={12} color={showExpandOptions ? '#fff' : '#333'} />
              </button>
            </div>
            {showExpandOptions && (
              <div
                className="expand-options"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#333' }}>
                  {t('Limit')}:
                  <input
                    type="number"
                    min="1"
                    value={expandLimit}
                    onChange={(e) => setExpandLimit(Number(e.target.value))}
                    style={{
                      width: '40px',
                      height: '20px',
                      fontSize: '12px',
                      marginLeft: '4px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                    }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#333' }}>
                  {t('Direction')}:
                  <select
                    value={expandDirection}
                    onChange={(e) => setExpandDirection(e.target.value)}
                    style={{
                      height: '20px',
                      fontSize: '12px',
                      marginLeft: '4px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                    }}
                  >
                    <option value="In">{t('In')}</option>
                    <option value="Out">{t('Out')}</option>
                    <option value="Both">{t('Both')}</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        )}
        <button
          className="menu-item"
          onClick={() => handleContextMenuAction('enable all')}
        >
          <FaEye style={{ marginRight: '10px', color: 'green' }} />
          {t('Enable all')}
        </button>
        <button
          className="menu-item"
          onClick={() => SetContextMenucanvas(null)}
        >
          <FaEye style={{ marginRight: '10px', color: '#6c757d' }} />
          {t('Dismiss')}
        </button>
        <hr />
        {selectedNodes.size > 0 && (
          <button
            className="menu-item"
            onClick={() => handleContextMenuAction('Deselect all nodes')}
          >
            <FaEye style={{ marginRight: '10px', color: 'red' }} />
            {t('Deselect all nodes')}
          </button>
        )}
        <button
          className="menu-item"
          onClick={() => handleContextMenuAction('selecte all nodes')}
        >
          <FaEye style={{ marginRight: '10px', color: 'green' }} />
          {t('Select all nodes')}
        </button>
      </div>
    </div>
  );
};

export default ContextMenucanvas;