import React, { useState, useEffect } from 'react';
import NodeDetails from './NodeDetails';
import EdgeDetails from './EdgeDetails';
import { createEdge } from '../../utils/Parser';
import { constructPath } from './cunstructpath';
import { useTranslation } from 'react-i18next';
import { handleLayoutChange } from '../containervisualization/function_container';
import { d3ForceLayoutType, ForceDirectedLayoutType,FreeLayoutType } from '@neo4j-nvl/base'; 
const styles = {
  container: { marginTop: '20px', background: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  button: { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', transition: 'background-color 0.3s' },
  startButton: { backgroundColor: '#4CAF50' },
  verifyButton: { backgroundColor: '#2196F3' },
  finishButton: { backgroundColor: '#FF5722' },
  guidance: { background: '#e3f2fd', padding: '10px', borderRadius: '4px', marginBottom: '10px', color: '#0d47a1' },
  success: { background: '#4CAF50', color: '#fff', padding: '5px 10px', borderRadius: '4px' },
  section: { background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' },
  nodeContainer: { display: 'flex', justifyContent: 'space-between', gap: '10px' },
  nodeItem: { flex: '1', minWidth: '0' },
  input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' },
  validText: { color: '#4CAF50', marginBottom: '10px', textAlign: 'center' },
  pathNameDisplay: { fontStyle: 'italic', color: '#333', marginTop: '5px', minHeight: '20px' },
};

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
  setLayoutType
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [t('Start Node'), t('End Node'), t('Relationships'), t('Validate Path'), t('Name Path'), t('Finish Path')];

  useEffect(() => {
    if (!isPathBuilding) {
      setCurrentStep(0);
      setPathName('');
      setIsPathValid(false);
      setPathResult(null);
      return;
    }
    const nodesArray = nvlRef.current?.getSelectedNodes() || [];
    const rels = nvlRef.current?.getSelectedRelationships() || [];
    if (currentStep === 0 && nodesArray.length >= 1) setCurrentStep(1);
    else if (currentStep === 1 && nodesArray.length >= 2) setCurrentStep(2);
    else if (currentStep === 2 && rels.length >= 1) setCurrentStep(3);
  }, [selectedNodes, selectedEdges, isPathBuilding, currentStep, nvlRef]);

  const handleBuildPath = () => {
    const nodesArray = nvlRef.current?.getSelectedNodes() || [];
    const rels = nvlRef.current?.getSelectedRelationships() || [];
    const result = constructPath(nodesArray, rels, nodes);
    if (Array.isArray(result) && !virtualRelations.some((r) => JSON.stringify(r.path) === JSON.stringify(result))) {
      setPathResult(result);
      setIsPathValid(true);
      setCurrentStep(4);
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
    if (!pathName.trim()) return alert(t('Please enter a path name.'));
    if (virtualRelations.some((r) => JSON.stringify(r.path) === JSON.stringify(pathResult)))
      return alert(t('This path already exists.'));
    const newRelation = { name: pathName, path: pathResult };
    const startId = [...selectedNodes][0];
    const endId = selectedNodes.size > 1 ? [...selectedNodes][1] : startId;
    const startNode = nodes.find((n) => n.id === startId);
    const endNode = nodes.find((n) => n.id === endId) || startNode;
    setEdges((prev) => [
      ...prev,
      createEdge({ type: pathName, identity: `virtual_${pathName}_${startId}_${endId}` }, startId, endId, 'green'),
    ]);
    setVirtualRelations((prev) => [...prev, newRelation]);
    localStorage.setItem('virtualRelations', JSON.stringify([...virtualRelations, newRelation]));
    setCurrentStep(5);
    // handleLayoutChange(FreeLayoutType,nvlRef,nodes,edges,setLayoutType)
    console.log('New path saved:', newRelation);
    setTimeout(() => setIsPathBuilding(false), 1000);
  };

  return (
    <div style={styles.container}>
      <button
        style={{ ...styles.button, ...styles.startButton }}
        onClick={() => setIsPathBuilding(true)}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
      >
        {t('Start Path Building')}
      </button>

      {isPathBuilding && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 10px', color: '#333' }}>{t('Path Construction')}</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <svg width="40" height="40">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill={i < currentStep ? '#4CAF50' : i === currentStep ? '#2196F3' : '#ccc'}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text x="20" y="25" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">
                    {i + 1}
                  </text>
                </svg>
                <div style={{ fontSize: '12px', color: '#333', marginTop: '5px' }}>{step}</div>
              </div>
            ))}
          </div>

          <div style={styles.guidance}>
            {currentStep === 0 && t('Please select the starting node for your path.')}
            {currentStep === 1 && t('Please select the ending node for your path.')}
            {currentStep === 2 && t('Please select the relationships connecting the nodes.')}
            {currentStep === 3 && t('Click "Verify Path" to validate the selected path.')}
            {currentStep === 4 && t('Enter a name for the path and confirm creation.')}
            {currentStep === 5 && <span style={styles.success}>{t('The path was created successfully!')}</span>}
          </div>

          {selectedNodes.size > 0 && (
            <div style={styles.section}>
              <span style={{ fontWeight: 'bold', color: '#0066cc', marginRight: '5px' }}>{t('Selected Nodes')}:</span>
              <div style={styles.nodeContainer}>
                {[...selectedNodes].slice(0, 2).map((nodeId, index) => (
                  <div key={nodeId} style={styles.nodeItem}>
                    <NodeDetails nodeId={nodeId} nodes={nodes} />
                    <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                      {index === 0 ? t('Start Node') : t('End Node')}
                    </div>
                  </div>
                ))}
              </div>
              {currentStep >= 4 && (
                <div style={styles.pathNameDisplay}>
                  {pathName ? `Relationship Name: ${pathName}` : 'Enter relationship name below...'}
                </div>
              )}
            </div>
          )}

          {selectedEdges.size > 0 && currentStep >= 2 && (
            <div style={styles.section}>
              <span style={{ fontWeight: 'bold', color: '#0066cc', marginRight: '5px' }}>{t('Selected Relations')}:</span>
              {[...selectedEdges].map((edgeId) => (
                <EdgeDetails key={edgeId} edgeId={edgeId} edges={edges} />
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <button
              style={{ ...styles.button, ...styles.verifyButton }}
              onClick={handleBuildPath}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#1e87db')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#2196F3')}
            >
              {t('Verify Path')}
            </button>
          )}

          {currentStep === 4 && isPathValid && <div style={styles.validText}>{t('The path is valid')}</div>}

          {currentStep === 4 && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>{t('Path Relationship Name')}:</label>
              <input
                type="text"
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                placeholder={t('Enter path name (e.g., CONNECTED_BY)')}
                style={styles.input}
              />
              <button
                style={{ ...styles.button, ...styles.finishButton }}
                onClick={handleCreatePath}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#e64a19')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#FF5722')}
              >
                {t('Finish Building')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PathBuilder;