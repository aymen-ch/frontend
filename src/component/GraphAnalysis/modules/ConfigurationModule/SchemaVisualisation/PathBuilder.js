import React, { useState, useEffect } from 'react';

import { createEdge, getNodeColor, getNodeIcon } from '../../VisualisationModule/Parser'; // Added getNodeColor, getNodeIcon
import { constructPath } from './cunstructpath';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import { FaCircle, FaInfoCircle } from 'react-icons/fa'; // Added FaCircle, FaInfoCircle

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
  // Styles from NodeDetails (using Tailwind classes converted conceptually or kept as inline)
  nodeDetailContainer: { background: '#fff', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s', maxWidth: '300px' }, // Simplified from Tailwind
  nodeDetailContainerHover: { transform: 'translateY(-0.125rem)' }, // Simplified hover effect
  nodeTypeLabel: { fontWeight: '600', fontSize: '0.875rem', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' },
  nodeInfoContainer: { display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '0.375rem', gap: '0.5rem', minHeight: '36px' },
  nodeIcon: { width: '1.25rem', height: '1.25rem', objectFit: 'contain' },
  nodeGroupText: { color: '#fff', fontSize: '0.875rem', fontWeight: '500', textShadow: '0 1px 1px rgba(0,0,0,0.2)' },
  // Styles from EdgeDetails (inline)
  edgeDetailSpan: {
    backgroundColor: '#FFD700',
    color: '#333',
    padding: '2px 8px',
    borderRadius: '3px',
    margin: '2px',
    display: 'inline-block',
  }
};

// Inline NodeDetails Component Logic
const NodeDetailsInline = ({ nodeId, nodes, t }) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const { group, color, icon } = {
    group: node.group,
    color: getNodeColor(node.group),
    icon: getNodeIcon(node.group),
  };

  const nodeTypeLabelText = nodeId.includes('_dup')
    ? t('Final Node')
    : t('Initial Node');

  // Using inline styles based on the extracted Tailwind/CSS logic
  return (
    <div style={styles.nodeDetailContainer} 
         onMouseOver={(e) => e.currentTarget.style.transform = styles.nodeDetailContainerHover.transform}
         onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
      <div style={styles.nodeTypeLabel}>
        <FaInfoCircle />
        {nodeTypeLabelText}
      </div>
      <div style={{ ...styles.nodeInfoContainer, backgroundColor: color }}>
        {icon ? (
          <img
            src={icon}
            alt={`${group} icon`}
            style={styles.nodeIcon}
          />
        ) : (
          <FaCircle style={styles.nodeIcon} /> // Use style object
        )}
        <span style={styles.nodeGroupText}>{group}</span>
      </div>
    </div>
  );
};

// Inline EdgeDetails Component Logic
const EdgeDetailsInline = ({ edgeId, edges }) => {
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return null;

  return (
    <span style={styles.edgeDetailSpan}>
      ➜ {edge.group}
    </span>
  );
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

  const handleCreatePath = async () => {
    if (!pathName.trim()) return alert(t('Please enter a path name.'));
    if (virtualRelations.some((r) => JSON.stringify(r.path) === JSON.stringify(pathResult)))
      return alert(t('This path already exists.'));

    const newRelation = { name: pathName, path: pathResult };

    try {
      // Save to backend
      const response = await axios.post(BASE_URL_Backend+'/add_aggregation/', {
        name: pathName,
        path: pathResult
      });

      if (response.status === 201) {
        const startId = [...selectedNodes][0];
        const endId = selectedNodes.size > 1 ? [...selectedNodes][1] : startId;
        const startNode = nodes.find((n) => n.id === startId);
        const endNode = nodes.find((n) => n.id === endId) || startNode;
        setEdges((prev) => [
          ...prev,
          createEdge({ type: pathName, identity: `virtual_${pathName}_${startId}_${endId}` }, startId, endId, 'green'),
        ]);
        setVirtualRelations((prev) => [...prev, newRelation]);
        setCurrentStep(5);
        console.log('New path saved to backend:', newRelation);
        setTimeout(() => setIsPathBuilding(false), 1000);
      } else {
        alert(t('Failed to save path to backend: ') + response.data.error);
      }
    } catch (error) {
      console.error('Error saving path to backend:', error);
      alert(t('Error saving path to backend: ') + (error.response?.data?.error || error.message));
    }
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
                    {/* Replaced NodeDetails with NodeDetailsInline */}
                    <NodeDetailsInline nodeId={nodeId} nodes={nodes} t={t} />
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
                /* Replaced EdgeDetails with EdgeDetailsInline */
                <EdgeDetailsInline key={edgeId} edgeId={edgeId} edges={edges} />
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
