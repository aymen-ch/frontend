import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getNodeIcon, getNodeColor, parseAggregationResponse, parseAggregationResponse_advanced } from '../../utils/Parser';
import { BASE_URL } from '../../utils/Urls';
import { handleAggregation, getIntermediateTypes } from './aggregationUtils';
import virtualRelationsData from './aggregations.json'; // Adjust path according to your project structure

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
  const [virtualRelations,setVirtualRelations] = useState(virtualRelationsData); // Use imported JSON data
  const [selectedAffaires, setSelectedAffaires] = useState([]);

   useEffect(() => {
      const storedRelations = localStorage.getItem('virtualRelations');
      if (storedRelations) {
        setVirtualRelations(JSON.parse(storedRelations));
      }
    }, []);
  
  useEffect(() => {
    const affids = nodes
      .filter((node) => node.group === "Affaire")
      .map((node) => parseInt(node.id, 10));
    setSelectedAffaires(affids);
  }, [nodes]);

  const getAggregationPath = (relationName) => {
    const relation = virtualRelations.find((rel) => rel.name === relationName);
    return relation ? relation.path : null;
  };

  const handleTypeFilterChange = async (relationName) => {
    const aggregationPath = getAggregationPath(relationName);
    if (aggregationPath) {
      await handleAggregation(relationName, aggregationPath, relationName, setNodes, setEdges, nodes, setActiveAggregations);
    }
  };

  const toggleAggregation = (relationName) => {
    if (activeAggregations[relationName]) {
      setEdges((prevEdges) => {
        const filteredEdges = prevEdges.filter((edge) => edge.aggregationType !== relationName);
        return filteredEdges.map((edge) => {
          const fromNode = nodes.find((node) => node.id === edge.from);
          const toNode = nodes.find((node) => node.id === edge.to);
          const isHiddenByOtherAggregation = Object.keys(activeAggregations)
            .filter((t) => t !== relationName && activeAggregations[t])
            .some((t) => {
              const path = getAggregationPath(t);
              const intermediateTypes = getIntermediateTypes(path || []);
              return (
                intermediateTypes.includes(fromNode?.group) ||
                intermediateTypes.includes(toNode?.group)
              );
            });
          return { ...edge, hidden: isHiddenByOtherAggregation };
        });
      });

      setNodes((prevNodes) => {
        return prevNodes
          .map((node) => {
            if (node.aggregationType === relationName) return null;
            const isHiddenByOtherAggregation = Object.keys(activeAggregations)
              .filter((t) => t !== relationName && activeAggregations[t])
              .some((t) => {
                const path = getAggregationPath(t);
                const intermediateTypes = getIntermediateTypes(path || []);
                return intermediateTypes.includes(node.group);
              });
            return { ...node, hidden: isHiddenByOtherAggregation };
          })
          .filter((node) => node !== null);
      });

      setActiveAggregations((prev) => ({ ...prev, [relationName]: false }));
    } else {
      handleTypeFilterChange(relationName);
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
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: backgroundColor,
          margin: '0 2px',
        }}
      >
        <img src={iconUrl} alt={type} style={{ width: '12px', height: '12px' }} />
      </span>
    );
  };

  const renderAggregationPath = (relation) => {
    const { name, path } = relation;
    if (!path || path.length < 1) return null;

    const startNode = path[0];
    const endNode = path[path.length - 1];

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
        <span>{startNode}-{name}-{endNode}</span>
      </div>
    );
  };

  return (
    <div className="container-fluid p-3 bg-white shadow-sm rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Aggregation</h3>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {virtualRelations.map((relation) => (
          <div key={relation.name} className="form-check form-switch" style={{ minWidth: '150px' }}>
            <input
              type="checkbox"
              className="form-check-input"
              role="switch"
              checked={!!activeAggregations[relation.name]}
              onChange={() => toggleAggregation(relation.name)}
              id={`switch-${relation.name}`}
            />
            <label className="form-check-label" htmlFor={`switch-${relation.name}`}>
              {relation.name}
            </label>
            <br />
            Result: {renderAggregationPath(relation)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Aggregation;