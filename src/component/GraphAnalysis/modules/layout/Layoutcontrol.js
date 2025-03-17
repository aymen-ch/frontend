import React from 'react';
import { d3ForceLayoutType, ForceDirectedLayoutType, FreeLayoutType, HierarchicalLayoutType } from '@neo4j-nvl/base';

const LayoutControl = ({ layoutType, handleLayoutChange, nvlRef, combinedNodes, combinedEdges, setLayoutType }) => {
  return (
    <div>
      <h3>Layout Configuration</h3>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Layout Type:
          <select
            value={layoutType}
            onChange={(e) => handleLayoutChange(e.target.value, nvlRef, combinedNodes, combinedEdges, setLayoutType)}
            style={{ width: '100%', padding: '5px', borderRadius: '4px' }}
          >
            <option value="Operationnelle_Soutien_Leader">Operationnelle_Soutien_Leader</option>
            <option value="dagre">Dagre</option>
            <option value="elk">ELK</option>
            <option value="computeCytoscapeLayout">computeCytoscapeLayout</option>
            <option value={d3ForceLayoutType}>d3</option>
            <option value={ForceDirectedLayoutType}>force direct</option>
            <option value={FreeLayoutType}>Free Layout</option>
            <option value={HierarchicalLayoutType}>Hierarchical Layout</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default LayoutControl;