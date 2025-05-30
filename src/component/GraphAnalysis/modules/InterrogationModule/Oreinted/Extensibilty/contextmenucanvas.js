import React, { useState } from 'react';
import { FaEye, FaCog } from 'react-icons/fa';
import axios from 'axios';
import { handleNodeExpansion_selected } from './ContextMenuFunctions';
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
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-[1050] min-w-[220px] overflow-hidden"
      style={{
        top: `${ContextMenucanvas.y}px`,
        left: `${ContextMenucanvas.x}px`,
      }}
    >
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm">
        {t('Canvas Actions')}
      </div>
      <div className="py-1">
        {selectedNodes.size > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => handleContextMenuAction('Expand all selected nodes')}
              >
                <FaEye className="mr-2 text-blue-600" />
                {t('Expand all selected nodes')}
              </button>
              <button
                onClick={toggleExpandOptions}
                className={`p-1 rounded border border-gray-300 ${
                  showExpandOptions ? 'bg-blue-500' : 'bg-white'
                } hover:bg-blue-100 transition-colors`}
                title={t('Toggle expand options')}
              >
                <FaCog size={12} className={showExpandOptions ? 'text-white' : 'text-gray-700'} />
              </button>
            </div>
            {showExpandOptions && (
              <div
                className="flex flex-col gap-2 p-2 bg-white border border-gray-300 rounded"
              >
                <label className="flex items-center text-xs text-gray-700">
                  {t('Limit')}:
                  <input
                    type="number"
                    min="1"
                    value={expandLimit}
                    onChange={(e) => setExpandLimit(Number(e.target.value))}
                    className="w-10 h-5 ml-1 p-1 border border-gray-300 rounded text-xs"
                  />
                </label>
                <label className="flex items-center text-xs text-gray-700">
                  {t('Direction')}:
                  <select
                    value={expandDirection}
                    onChange={(e) => setExpandDirection(e.target.value)}
                    className="h-5 ml-1 p-1 border border-gray-300 rounded text-xs"
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
          className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => SetContextMenucanvas(null)}
        >
          <FaEye className="mr-2 text-gray-500" />
          {t('Dismiss')}
        </button>
        <hr className="my-1 border-gray-200" />
        {selectedNodes.size > 0 && (
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => handleContextMenuAction('Deselect all nodes')}
          >
            <FaEye className="mr-2 text-red-500" />
            {t('Deselect all nodes')}
          </button>
        )}
        <button
          className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => handleContextMenuAction('selecte all nodes')}
        >
          <FaEye className="mr-2 text-green-500" />
          {t('Select all nodes')}
        </button>
      </div>
    </div>
  );
};

export default ContextMenucanvas;