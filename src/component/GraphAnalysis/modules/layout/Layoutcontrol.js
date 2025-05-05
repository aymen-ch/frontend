
import React, { useState } from 'react';
import { FaProjectDiagram, FaLayerGroup, FaSitemap, FaMapMarkedAlt ,FaStream} from 'react-icons/fa';
import { FaDiaspora } from 'react-icons/fa6';
import { d3ForceLayoutType, ForceDirectedLayoutType, HierarchicalLayoutType,GridLayoutType } from '@neo4j-nvl/base';
import { buttonStyle, activeButtonStyle, layoutControlStyle } from '../../HorizontalModules/visualization/GraphVisualizationStyles';
import { handleLayoutChange } from '../../HorizontalModules/containervisualization/function_container';

const LayoutControl = ({ nvlRef, nodes, edges,layoutType,setLayoutType}) => {

  const layouts = [
    { type: d3ForceLayoutType, icon: <FaProjectDiagram size={16} />, title: 'd3ForceLayoutType' },
    { type: ForceDirectedLayoutType, icon: <FaDiaspora size={16} />, title: 'ForceDirectedLayoutType' },
    { type: GridLayoutType, icon: <FaLayerGroup size={16} />, title: 'GridLayoutType' },
    // { type: 'dagre', icon: <FaSitemap size={16} />, title: 'Hierarchical Layout' },
    { type: 'Operationnelle_Soutien_Leader', icon: <FaSitemap size={16} />, title: 'Free Layout' },
    { type: HierarchicalLayoutType, icon: <FaStream size={16} />, title: 'Hierarchical' },
    // { type: 'geospatial', icon: <FaMapMarkedAlt size={16} />, title: 'Geospatial Layout' },
  ];

  const handleLayoutSelect = (type) => {
    handleLayoutChange(type, nvlRef, nodes, edges, setLayoutType);
  };

  return (
    <div style={layoutControlStyle}>
      {layouts.map((layout) => (
        <button
          key={layout.type}
          style={layoutType === layout.type ? activeButtonStyle : buttonStyle}
          onClick={() => handleLayoutSelect(layout.type)}
          title={layout.title}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)')}
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor =
              layoutType === layout.type ? 'rgba(66, 153, 225, 0.8)' : 'rgba(255, 255, 255, 0.8)')
          }
        >
          {layout.icon}
        </button>
      ))}
    </div>
  );
};

export default LayoutControl;
