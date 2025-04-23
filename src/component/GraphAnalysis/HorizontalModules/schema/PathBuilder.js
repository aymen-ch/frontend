import React from 'react';
import NodeDetails from './NodeDetails';
import EdgeDetails from './EdgeDetails';
import { createEdge } from '../../utils/Parser';
import { constructPath } from './cunstructpath';
import { useTranslation } from 'react-i18next';

const PathBuilder = ({
  isPathBuilding,
  setIsPathBuilding,
  selectedNodes,
  selectedEdges,
  nodes,
  edges,
  pathName,
  setPathName,
  isPathValid,
  setIsPathValid,
  pathResult,
  setPathResult,
  virtualRelations,
  setVirtualRelations,
  setEdges,
  nvlRef,
}) => {
  const { t } = useTranslation();

  const handleBuildPath = () => {
    const selectedRels = nvlRef.current?.getSelectedRelationships() || [];
    const selectedNodesArray = nvlRef.current?.getSelectedNodes() || [];
    const result = constructPath(selectedNodesArray, selectedRels, nodes);

    const pathExists = virtualRelations.some((relation) =>
      JSON.stringify(relation.path) === JSON.stringify(result)
    );

    if (Array.isArray(result) && !pathExists) {
      setPathResult(result);
      setIsPathValid(true);
      console.log('Valid Path:', result);
    } else {
      setIsPathValid(false);
      setPathResult(null);
      alert(
        result === 'Incomplete selection'
          ? t('Please select at least one node and one relationship.')
          : t('No valid path connects the selected nodes and relationships.')
      );
    }
  };

  const handleCreatePath = () => {
    if (!pathName.trim()) {
      alert(t('Please enter a path name.'));
      return;
    }

    const pathExists = virtualRelations.some((relation) =>
      JSON.stringify(relation.path) === JSON.stringify(pathResult)
    );

    if (!pathExists) {
      const newRelation = {
        name: pathName,
        path: pathResult,
      };
      const startNodeId = [...selectedNodes][0];
      const endNodeId = selectedNodes.size > 1 ? [...selectedNodes][1] : startNodeId;
      const startNode = nodes.find((n) => n.id === startNodeId);
      const endNode = nodes.find((n) => n.id === endNodeId) || startNode;

      const newEdge = createEdge(
        { type: pathName, identity: `virtual_${pathName}_${startNodeId}_${endNodeId}` },
        startNodeId,
        endNodeId,
        'green'
      );

      setEdges((prevEdges) => [...prevEdges, newEdge]);
      setVirtualRelations((prev) => [...prev, newRelation]);
      localStorage.setItem('virtualRelations', JSON.stringify([...virtualRelations, newRelation]));

      setIsPathBuilding(false);
      setPathName('');
      setIsPathValid(false);
      setPathResult(null);
      console.log('New path saved:', newRelation);
    } else {
      console.log('Path already exists in virtualRelations');
    }
  };

  return (
    <div
      style={{
        marginTop: '20px',
        background: '#ffffff',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <button
        onClick={() => setIsPathBuilding(true)}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '15px',
          transition: 'background-color 0.3s',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
      >
        {t('Start Path Building')}
      </button>

      {isPathBuilding && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{t('Path Construction')}</h4>

          {selectedNodes.size > 0 && (
            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
              {[...selectedNodes].map((nodeId) => (
                <NodeDetails key={nodeId} nodeId={nodeId} nodes={nodes} />
              ))}
            </div>
          )}

          {selectedEdges.size > 0 && (
            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#0066cc', marginRight: '5px' }}>
                {t('Selected Relations')}:
              </span>
              <div>
                {[...selectedEdges].map((edgeId) => (
                  <EdgeDetails key={edgeId} edgeId={edgeId} edges={edges} />
                ))}
              </div>
            </div>
          )}

          {(selectedNodes.size > 0 || selectedEdges.size > 0) && !isPathValid && (
            <button
              onClick={handleBuildPath}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px',
                transition: 'background-color 0.3s',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#1e87db')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#2196F3')}
            >
              {t('Build Path')}
            </button>
          )}

          {isPathValid && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
                {t('Path Relationship Name')}:
              </label>
              <input
                type="text"
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                placeholder={t('Enter path name (e.g., CONNECTED_BY)')}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  marginBottom: '10px',
                }}
              />
              <button
                onClick={handleCreatePath}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#FF5722',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#e64a19')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#FF5722')}
              >
                {t('Confirm Creation')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PathBuilder;
