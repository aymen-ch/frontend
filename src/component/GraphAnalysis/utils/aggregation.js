import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getNodeIcon, getNodeColor, parseAggregationResponse, parseAggregationResponse_advanced } from './Parser';
import { BASE_URL } from './Urls';

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
    const types = [...new Set(nodes.map((node) => node.group))];
    setNodeTypes(types);
    const affids = nodes
      .filter((node) => node.group === "Affaire")
      .map((node) => parseInt(node.id, 10));
    setSelectedAffaires(affids);
  }, [nodes]);

  const handleTypeFilterChange = async (type) => {
    const aggregationTypeToCall = getAggregationPath(type);
    if (aggregationTypeToCall) {
      await handleAggregation(aggregationTypeToCall, type);
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

  const getIntermediateTypes = (aggregationPath) => {
    const intermediateTypes = [];
    for (let i = 2; i < aggregationPath.length - 2; i += 2) {
      intermediateTypes.push(aggregationPath[i]);
    }
    return intermediateTypes;
  };

  const handleAggregation = async (type, aggregationType) => {
    const nodeIds = nodes
      .filter((node) => type.includes(node.group))
      .map((node) => parseInt(node.id, 10));

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/agregate/', {
        node_ids: nodeIds,
        aggregation_type: [type],
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const { nodes: parsedNodes, edges: parsedEdges } = parseAggregationResponse(response.data);
        const updatedEdges = parsedEdges.map(edge => ({
          ...edge,
          aggregationType: aggregationType,
        }));

        const updatedNodes = parsedNodes.map(edge => ({
          ...edge,
          aggregationType: aggregationType,
        }));
        
        const intermediateTypes = getIntermediateTypes(type);        
        setNodes((prevNodes) =>
          prevNodes.map((node) => ({
            ...node,
            hidden: intermediateTypes.includes(node.group) || node.hidden,
          }))
        );
        setEdges((prevEdges) => {
          const combinedEdges = [...prevEdges, ...updatedEdges];
          const edgesWithHiddenState = combinedEdges.map((edge) => {
            const isFromHidden = nodes.some(
              (node) => node.id === edge.from && intermediateTypes.includes(node.group)
            );
            const isToHidden = nodes.some(
              (node) => node.id === edge.to && intermediateTypes.includes(node.group)
            );
            return {
              ...edge,
              hidden: isFromHidden || isToHidden || edge.hidden,
            };
          });
          return edgesWithHiddenState;
        });
        setEdges((prevEdges) => [...prevEdges, ...updatedEdges]);
        setNodes((prevNodes) => [...prevNodes, ...updatedNodes]);
        setActiveAggregations((prev) => ({ ...prev, [aggregationType]: true }));
      } else {
        console.error('Aggregation failed.');
      }
    } catch (error) {
      console.error('Error during aggregation:', error);
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
      setEdges((prevEdges) => {
        const combinedEdges = [...prevEdges, ...edges];
        const filteredEdges = combinedEdges.filter(edge => edge.aggregationType !== type);
        const nodeIdsWithType = nodes
          .filter(node => node.group === type)
          .map(node => node.id);
        const updatedEdges = filteredEdges.map(edge => ({
          ...edge,
          hidden: nodeIdsWithType.includes(edge.from) || nodeIdsWithType.includes(edge.to) ? false : edge.hidden,
        }));
        return updatedEdges;
      });
  
      setNodes((prevNodes) =>
        prevNodes.map(node => 
          node.group === type 
            ? { ...node, hidden: false } 
            : { ...node, hidden: node.aggregationType == type }
        )
      );
  
      setActiveAggregations((prev) => ({ ...prev, [type]: false }));
    } else {
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

  // Updated function to render the aggregation path in a single line
  const renderAggregationPath = (type) => {
    const path = getAggregationPath(type);
    if (!path) return null;

    return (
      <div
        className="aggregation-path mt-1"
        style={{
          whiteSpace: 'nowrap', // Prevents wrapping to a new line
          fontSize: '12px', // Smaller font size
          display: 'inline-flex', // Keeps everything inline
          alignItems: 'center',
        }}
      >
        {path.map((step, index) => (
          <span key={index} className="path-step">
            {index % 2 === 0 ? (
              // Node step
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 4px', // Reduced padding
                  backgroundColor: getNodeColor(step),
                  borderRadius: '8px', // Slightly smaller radius
                  color: '#fff',
                  fontWeight: 'bold',
                  margin: '0 2px', // Reduced margin
                }}
              >
                {renderIconWithBackground(step)} {step}
              </span>
            ) : (
              // Relation step
              <span
                style={{
                  color: '#666',
                  fontStyle: 'italic',
                  margin: '0 2px', // Reduced margin
                }}
              >
                {step}
              </span>
            )}
            {index < path.length - 1 && (
              <span style={{ margin: '0 2px' }}>→</span> // Reduced margin
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="container-fluid p-3 bg-white shadow-sm rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Aggregation</h3>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {nodeTypes.map((type) => (
          <div key={type} className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={!!activeAggregations[type]}
              onChange={() => toggleAggregation(type)}
            />
            <label className="form-check-label">
              {renderIconWithBackground(type)} {type}
            </label> <br/>
            {/* Display the aggregation path below each type */}
            {renderAggregationPath(type)}
          </div>
        ))}
      </div>

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