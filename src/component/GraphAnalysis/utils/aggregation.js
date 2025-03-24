import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getNodeIcon, getNodeColor, parseAggregationResponse, parseAggregationResponse_advanced } from './Parser';
import { BASE_URL } from './Urls';
import { handleAggregation,getIntermediateTypes } from './aggregationUtils';
const Aggregation = ({
  setEdges,
  setNodes,
  nodes,
  edges,
  drawCirclesOnPersonneNodes,
  ColorPersonWithClass,
  activeAggregations,
  setActiveAggregations,
}) => {
  const [depth, setDepth] = useState(1);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [selectedAffaires, setSelectedAffaires] = useState([]);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    // Get unique node types, excluding those where any node has hidden: true
    const types = [...new Set(
      nodes
        .filter((node) => !node.aggregationType      ) // Only include nodes that aren't hidden
        .map((node) => node.group)
    )];
    setNodeTypes(types);
    console.log(nodes)
    // Set selected affaires (unchanged)
    const affids = nodes
      .filter((node) => node.group === "Affaire")
      .map((node) => parseInt(node.id, 10));
    setSelectedAffaires(affids);
  }, [nodes]);

  const handleTypeFilterChange = async (type) => {
    const aggregationTypeToCall = getAggregationPath(type);
    if (aggregationTypeToCall) {
      await handleAggregation(aggregationTypeToCall, type,setNodes,setEdges,nodes,setActiveAggregations);
    }
  };

  const getAggregationPath = (type) => {
    switch (type) {
      case "Phone":
        return ["Personne", "Proprietaire", "Phone", "Appel_telephone", "Phone", "Proprietaire", "Personne"];
       case "Affaire":
         return ["Personne", "Impliquer", "Affaire", "Impliquer", "Personne"];
      case "Personne":
        return ["Phone", "Proprietaire", "Personne", "Impliquer", "Affaire"];
      case "Unite":
        return ["Affaire", "Traiter", "Unite", "situer", "Commune"];
      case "Commune":
        return ["Affaire", "Traiter", "Unite", "situer", "Commune", "appartient", "Daira"];
      default:
        return null;
    }
  };

  

  const handleAdvancedAggregation = async (depth) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/aggregatehria/', {
        id_affaires: selectedAffaires,
        depth: depth,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const { nodes: parsedNodes, edges: parsedEdges } = await parseAggregationResponse_advanced(response.data[0].Result);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } else {
        console.error('Advanced aggregation failed.');
      }
    } catch (error) {
      console.error('Error during advanced aggregation:', error);
    }
  };

  const toggleAggregation = (type) => {
    if (activeAggregations[type]) {
      // Deaggregate: Remove edges tied to this aggregation and restore relevant edges/nodes
      setEdges((prevEdges) => {
        // Keep track of original edges and edges from other aggregations
        const filteredEdges = prevEdges.filter(edge => edge.aggregationType !== type);
        
        // Update hidden state for remaining edges
        return filteredEdges.map(edge => {
          const fromNode = nodes.find(node => node.id === edge.from);
          const toNode = nodes.find(node => node.id === edge.to);
          
          // Check if this edge should remain hidden due to other active aggregations
          const isHiddenByOtherAggregation = Object.keys(activeAggregations)
            .filter(t => t !== type && activeAggregations[t])
            .some(t => {
              const path = getAggregationPath(t);
              const intermediateTypes = getIntermediateTypes(path || []);
              return (
                intermediateTypes.includes(fromNode?.group) || 
                intermediateTypes.includes(toNode?.group)
              );
            });
          
          // If the edge was hidden by this aggregation, unhide it unless another aggregation keeps it hidden
          return {
            ...edge,
            hidden: isHiddenByOtherAggregation,
          };
        });
      });
  
      setNodes((prevNodes) => {
        return prevNodes.map(node => {
          // Remove nodes created by this aggregation
          if (node.aggregationType === type) {
            return null;
          }
          
          // Check if this node should remain hidden due to other active aggregations
          const isHiddenByOtherAggregation = Object.keys(activeAggregations)
            .filter(t => t !== type && activeAggregations[t])
            .some(t => {
              const path = getAggregationPath(t);
              const intermediateTypes = getIntermediateTypes(path || []);
              return intermediateTypes.includes(node.group);
            });
          
          // Restore visibility unless hidden by another aggregation
          return {
            ...node,
            hidden: isHiddenByOtherAggregation,
          };
        }).filter(node => node !== null); // Remove null nodes
      });
  
      setActiveAggregations((prev) => ({ ...prev, [type]: false }));
    } else {
      // Aggregate: Trigger the aggregation process
      handleTypeFilterChange(type);
    }
  };

  const renderIconWithBackground = (type) => {
    const iconUrl = getNodeIcon(type);
    const backgroundColor = getNodeColor(type);
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px', // Reduced size
          height: '20px', // Reduced size
          borderRadius: '50%',
          backgroundColor: backgroundColor,
          margin: '0 2px',
        }}
      >
        <img
          src={iconUrl}
          alt={type}
          style={{ width: '12px', height: '12px' }} // Reduced icon size
        />
      </span>
    );
  };


  
  const renderAggregationPath = (type) => {
    const path = getAggregationPath(type);
    if (!path || path.length < 1) return null;
  
    // Get start node (first element), middle relation (if exists), and end node (last element)
    const startNode = path[0];
    const endNode = path[path.length - 1];
    // Find middle relation (use first relation if path is short)
    const middleIndex = Math.floor(path.length / 2);
    const middleRelation = path.length > 2 && middleIndex % 2 === 0 
      ? path[1] 
      : path[middleIndex % 2 === 1 ? middleIndex : 1];
  
    return (
      <div
        className="aggregation-path mt-1"
        style={{
          whiteSpace: 'nowrap',
          fontSize: '12px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {/* Start Node */}
        <span className="path-step">
          <span style={{ display: 'inline-flex' }}>
            {startNode}
          </span>
        </span>
        
        {/* Arrow and Middle Relation */}
        {path.length > 1 && (
          <>
            <span style={{ margin: '0 2px' }}>→</span>
            <span className="path-step">
              <span
                style={{
                  color: '#666',
                  fontStyle: 'italic',
                  margin: '0 2px',
                }}
              >
                {middleRelation}
              </span>
            </span>
          </>
        )}
        
        {/* Arrow and End Node */}
        {path.length > 1 && (
          <>
            <span style={{ margin: '0 2px' }}>→</span>
            <span className="path-step">
              <span style={{ display: 'inline-flex' }}>
                {endNode}
              </span>
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="container-fluid p-3 bg-white shadow-sm rounded-lg">
  <h3 className="text-lg font-semibold text-gray-800 mb-3">Aggregation</h3>

  <div className="d-flex flex-wrap gap-2 mb-4">
    {nodeTypes.map((type) => (
      renderAggregationPath(type) ? (
        <div key={type} className="form-check form-switch" style={{ minWidth: '150px' }}>
          <input
            type="checkbox"
            className="form-check-input"
            role="switch"
            checked={!!activeAggregations[type]}
            onChange={() => toggleAggregation(type)}
            id={`switch-${type}`} // Unique ID for accessibility
          />
          <label className="form-check-label" htmlFor={`switch-${type}`}>
            {renderIconWithBackground(type)} {type}
          </label>
          <br />
          {/* Display the aggregation path below each type */}
          Result : {renderAggregationPath(type)}
        </div>
      ) : null
    ))}
  </div>

  {/* Rest of your code remains the same */}
  {/* <div className="d-flex flex-column gap-3">
    <button
      className="btn btn-primary w-100"
      onClick={() => handleAdvancedAggregation(depth)}
    >
      Advanced Aggregation
    </button>

    <input
      type="number"
      value={depth}
      onChange={(e) => setDepth(parseInt(e.target.value, 10))}
      min="1"
      placeholder="Enter depth"
      className="form-control"
    />
  </div> */}
</div>
  );
};

export default Aggregation;