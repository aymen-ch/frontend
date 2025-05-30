import React from 'react';
import { FaEye, FaExpand } from 'react-icons/fa';
import axios from 'axios';

const ContextMenuRel = ({
  contextMenuRel,
  setContextMenuRel,
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
      const payload = {
        node_ids: [parseInt(edge.from), parseInt(edge.to)],
        aggregationpath: edge.aggregationpath,
      };

      const response = await axios.post('http://127.0.0.1:8000/api/ExpandAggregation/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { path } = response.data;

      console.log('Relation expanded successfully:', path);
    } catch (error) {
      console.error('Error expanding relation:', error);
      alert('Failed to expand the relation. Please try again.');
    } finally {
      setContextMenuRel(null);
    }
  };

  const hasAggregationPath = contextMenuRel.edge?.aggregationpath != null;

  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-[1050] min-w-[220px] overflow-hidden"
      style={{
        top: `${contextMenuRel.y}px`,
        left: `${contextMenuRel.x}px`,
      }}
    >
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm">
        Relation Actions
      </div>
      <div className="py-1">
        <button
          className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={handleViewRelation}
        >
          <FaEye className="mr-2 text-blue-600" />
          Detail Relation
        </button>
        <hr className="my-1 border-gray-200" />
        {hasAggregationPath && (
          <button
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={handleExpandRelation}
          >
            <FaExpand className="mr-2 text-blue-600" />
            Expand
          </button>
        )}
        <button
          className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          onClick={() => setContextMenuRel(null)}
        >
          <FaEye className="mr-2 text-gray-500" />
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ContextMenuRel;