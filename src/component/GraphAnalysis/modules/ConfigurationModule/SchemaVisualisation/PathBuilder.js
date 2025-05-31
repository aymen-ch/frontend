import React, { useState, useEffect } from 'react';
import { createEdge, getNodeColor, getNodeIcon } from '../../VisualisationModule/Parser'; // Utility functions for edge creation and node styling
import { constructPath } from './cunstructpath'; // Path construction logic
import { useTranslation } from 'react-i18next'; // Translation hook for i18n
import axios from 'axios'; // HTTP client for API calls
import { BASE_URL_Backend } from '../../../Platforme/Urls'; // Backend API base URL
import { FaCircle, FaInfoCircle } from 'react-icons/fa'; // Icons for node display

// Styles object for component styling
const styles = {
  container: { marginTop: '20px', background: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  button: { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', transition: 'background-color 0.3s' },
  startButton: { backgroundColor: '#4CAF50' }, // Start button style
  verifyButton: { backgroundColor: '#2196F3' }, // Verify button style
  finishButton: { backgroundColor: '#FF5722' }, // Finish button style
  guidance: { background: '#e3f2fd', padding: '10px', borderRadius: '4px', marginBottom: '10px', color: '#0d47a1' }, // Guidance text style
  success: { background: '#4CAF50', color: '#fff', padding: '5px 10px', borderRadius: '4px' }, // Success message style
  section: { background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px' }, // Section container style
  nodeContainer: { display: 'flex', justifyContent: 'space-between', gap: '10px' }, // Node container style
  nodeItem: { flex: '1', minWidth: '0' }, // Individual node item style
  input: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }, // Input field style
  validText: { color: '#4CAF50', marginBottom: '10px', textAlign: 'center' }, // Valid path text style
  pathNameDisplay: { fontStyle: 'italic', color: '#333', marginTop: '5px', minHeight: '20px' }, // Path name display style
  nodeDetailContainer: { background: '#fff', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s', maxWidth: '300px' }, // Node detail container
  nodeDetailContainerHover: { transform: 'translateY(-0.125rem)' }, // Hover effect for node detail
  nodeTypeLabel: { fontWeight: '600', fontSize: '0.875rem', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }, // Node type label style
  nodeInfoContainer: { display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '0.375rem', gap: '0.5rem', minHeight: '36px' }, // Node info container style
  nodeIcon: { width: '1.25rem', height: '1.25rem', objectFit: 'contain' }, // Node icon style
  nodeGroupText: { color: '#fff', fontSize: '0.875rem', fontWeight: '500', textShadow: '0 1px 1px rgba(0,0,0,0.2)' }, // Node group text style
  edgeDetailSpan: { backgroundColor: '#FFD700', color: '#333', padding: '2px 8px', borderRadius: '3px', margin: '2px', display: 'inline-block' }, // Edge detail style
};

// Component to display node details
const NodeDetailsInline = ({ nodeId, nodes, t }) => {
  const node = nodes.find((n) => n.id === nodeId); // Find node by ID
  if (!node) return null;

  const { group, color, icon } = {
    group: node.group, // Node group
    color: getNodeColor(node.group), // Node color based on group
    icon: getNodeIcon(node.group), // Node icon based on group
  };

  const nodeTypeLabelText = nodeId.includes('_dup') ? t('Final Node') : t('Initial Node'); // Node type label

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
          <img src={icon} alt={`${group} icon`} style={styles.nodeIcon} />
        ) : (
          <FaCircle style={styles.nodeIcon} />
        )}
        <span style={styles.nodeGroupText}>{group}</span>
      </div>
    </div>
  );
};

// Component to display edge details
const EdgeDetailsInline = ({ edgeId, edges }) => {
  const edge = edges.find((e) => e.id === edgeId); // Find edge by ID
  if (!edge) return null;

  return (
    <span style={styles.edgeDetailSpan}>
      ➜ {edge.group}
    </span>
  );
};

// Main PathBuilder component
const PathBuilder = ({
  isPathBuilding, // Flag for path building state
  setIsPathBuilding, // Function to toggle path building
  selectedNodes, // Selected nodes set
  selectedEdges, // Selected edges set
  nodes, // All nodes data
  edges, // All edges data
  pathName, // Path name input
  setPathName, // Function to set path name
  isPathValid, // Flag for path validity
  setIsPathValid, // Function to set path validity
  pathResult, // Resulting path
  setPathResult, // Function to set path result
  virtualRelations, // Virtual relations list
  setVirtualRelations, // Function to update virtual relations
  setEdges, // Function to update edges
  nvlRef, // Reference for visualization
}) => {
  const { t } = useTranslation(); // Translation function
  const [currentStep, setCurrentStep] = useState(0); // Current step in path building
  const steps = [t('Start Node'), t('End Node'), t('Relationships'), t('Validate Path'), t('Name Path'), t('Finish Path')]; // Steps for path building

  // Effect to manage step progression
  useEffect(() => {
    if (!isPathBuilding) {
      setCurrentStep(0); // Reset step
      setPathName(''); // Clear path name
      setIsPathValid(false); // Reset path validity
      setPathResult(null); // Clear path result
      return;
    }
    const nodesArray = selectedNodes || []; // Selected nodes array
    const rels = selectedEdges || []; // Selected edges array
    if (currentStep === 0 && nodesArray.size >= 1) setCurrentStep(1); // Move to end node selection
    else if (currentStep === 1 && nodesArray.size >= 2) setCurrentStep(2); // Move to relationship selection
    else if (currentStep === 2 && rels.size >= 1) setCurrentStep(3); // Move to path validation
  }, [selectedNodes, selectedEdges, isPathBuilding, currentStep, nvlRef]);

  // Function to validate and build path
  const handleBuildPath = () => {
    const nodesArray = selectedNodes || []; // Selected nodes
    const rels = selectedEdges || []; // Selected edges
    const result = constructPath(nodesArray, rels, nodes, edges); // Construct path
    if (Array.isArray(result) && !virtualRelations.some((r) => JSON.stringify(r.path) === JSON.stringify(result))) {
      setPathResult(result); // Set path result
      setIsPathValid(true); // Mark path as valid
      setCurrentStep(4); // Move to name path step
      console.log('Valid Path:', result);
    } else {
      setIsPathValid(false); // Mark path as invalid
      setPathResult(null); // Clear path result
      alert(
        result === 'Incomplete selection'
          ? t('Please select at least one node and one relationship.')
          : t('No valid path connects the selected nodes and relationships.')
      );
    }
  };

  // Function to create and save path
  const handleCreatePath = async () => {
    if (!pathName.trim()) return alert(t('Please enter a path name.')); // Check for path name
    if (virtualRelations.some((r) => JSON.stringify(r.path) === JSON.stringify(pathResult)))
      return alert(t('This path already exists.')); // Check for duplicate path

    const newRelation = { name: pathName, path: pathResult }; // New relation object

    try {
      // Save path to backend
      const response = await axios.post(BASE_URL_Backend+'/add_aggregation/', {
        name: pathName,
        path: pathResult
      });

      if (response.status === 201) {
        const startId = [...selectedNodes][0]; // Start node ID
        const endId = selectedNodes.size > 1 ? [...selectedNodes][1] : startId; // End node ID
        const startNode = nodes.find((n) => n.id === startId); // Start node data
        const endNode = nodes.find((n) => n.id === endId) || startNode; // End node data
        setEdges((prev) => [
          ...prev,
          createEdge({ type: pathName, identity: `virtual_${pathName}_${startId}_${endId}` }, startId, endId, 'green'), // Add new edge
        ]);
        setVirtualRelations((prev) => [...prev, newRelation]); // Add new relation
        setCurrentStep(5); // Move to finish step
        console.log('New path saved to backend:', newRelation);
        setTimeout(() => setIsPathBuilding(false), 1000); // End path building
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
        onClick={() => setIsPathBuilding(true)} // Start path building
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
                <EdgeDetailsInline key={edgeId} edgeId={edgeId} edges={edges} /> // Display edge details
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <button
              style={{ ...styles.button, ...styles.verifyButton }}
              onClick={handleBuildPath} // Verify path
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
                onChange={(e) => setPathName(e.target.value)} // Update path name
                placeholder={t('Enter path name (e.g., CONNECTED_BY)')}
                style={styles.input}
              />
              <button
                style={{ ...styles.button, ...styles.finishButton }}
                onClick={handleCreatePath} // Create path
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