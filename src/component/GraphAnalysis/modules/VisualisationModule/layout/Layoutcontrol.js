import React from 'react';
import { FaProjectDiagram, FaLayerGroup, FaSitemap, FaStream } from 'react-icons/fa';
import { FaDiaspora } from 'react-icons/fa6';
import {
  d3ForceLayoutType,
  ForceDirectedLayoutType,
  HierarchicalLayoutType,
  GridLayoutType,
} from '@neo4j-nvl/base';
import { handleLayoutChange } from '../../ContainersModules/function_container';
////  afficher les diffrent layout disponible dans la visualsiation
const LayoutControl = ({ nvlRef, nodes, edges, layoutType, setLayoutType }) => {
  const layouts = [
    { type: d3ForceLayoutType, icon: <FaProjectDiagram size={16} />, title: 'd3ForceLayoutType' },
    { type: ForceDirectedLayoutType, icon: <FaDiaspora size={16} />, title: 'ForceDirectedLayoutType' },
    { type: GridLayoutType, icon: <FaLayerGroup size={16} />, title: 'GridLayoutType' },
    { type: 'Operationnelle_Soutien_Leader', icon: <FaSitemap size={16} />, title: 'Free Layout' },
    { type: HierarchicalLayoutType, icon: <FaStream size={16} />, title: 'Hierarchical' },
  ];

  const handleLayoutSelect = (type) => {
    handleLayoutChange(type, nvlRef, nodes, edges, setLayoutType);
  };

  return (
    <div className="flex flex-col md:flex-row gap-2">
      {layouts.map((layout) => (
        <button
          key={layout.type}
          className={`w-12 h-12 border border-gray-200 rounded p-2 hover:scale-105 transition-all flex items-center justify-center ${
            layoutType === layout.type
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-white/80 text-gray-600 hover:bg-white'
          }`}
          onClick={() => handleLayoutSelect(layout.type)}
          title={layout.title}
        >
          {layout.icon}
        </button>
      ))}
    </div>
  );
};

export default LayoutControl;
