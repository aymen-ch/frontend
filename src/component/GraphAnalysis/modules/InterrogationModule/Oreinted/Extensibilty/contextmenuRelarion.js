import React from 'react';
import { FaEye, FaExpand } from 'react-icons/fa';
import axios from 'axios';



/// Menu contextuel lors du clic sur une relation — aucune fonctionnalité n’est encore développée ici, reste à implémenter certaines fonctions.

const ContextMenuRel = ({
  contextMenuRel,
  setContextMenuRel,
}) => {
  if (!contextMenuRel || !contextMenuRel.visible) return null;

  const handleViewRelation = () => {
    console.log('Viewing relation:', contextMenuRel);
    setContextMenuRel(null);
  };


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