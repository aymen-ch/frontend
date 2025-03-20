import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getNodeIcon, getNodeColor, parseAggregationResponse, parseAggregationResponse_advanced } from '../../utils/Parser';
import { BASE_URL } from '../../utils/Urls';
import NodeClasificationBackEnd from './NodeClasificationBackEnd/NodeClasificationBackEnd'; // Import the new component

const Analysis = ({
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
  const [showNodeClassification, setShowNodeClassification] = useState(false); // State to control visibility of the pop-up

  useEffect(() => {
    const types = [...new Set(nodes.map((node) => node.group))];
    setNodeTypes(types);
    const affids = nodes
      .filter((node) => node.group === "Affaire")
      .map((node) => parseInt(node.id, 10));
    setSelectedAffaires(affids);
  }, [nodes]);

  const handleAggregationWithAlgorithm = async (depth) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/aggregate_with_algo/', {
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

  const handleSecteurActiviti = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/Secteur_Activite/', {
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
       console.error(response);
      } else {
        console.error('handleSecteurActiviti failed.');
      }
    } catch (error) {
      console.error('Error during handleSecteurActiviti:', error);
    }
  };

  return (
    <div className="container-fluid p-3 bg-white shadow-sm rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Aggregation</h3>

      <div className="d-flex flex-column gap-3">
        <button
          className="btn btn-info w-100"
          onClick={() => handleAggregationWithAlgorithm(depth)}
        >
          Aggregation with Algorithme
        </button>

        <button
          className="btn btn-warning w-100"
          onClick={() => ColorPersonWithClass(nodes, setNodes)}
        >
          Color node with class
        </button>

        <input
          type="number"
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))}
          min="1"
          placeholder="Enter depth"
          className="form-control"
        />

        {/* <button
          className="btn btn-danger w-100"
          onClick={() => drawCirclesOnPersonneNodes(nodes, setNodes)}
        >
          Highlight Personnes with Crimes
        </button> */}

        <button
          className="btn btn-danger w-100"
          onClick={() => setShowNodeClassification(true)}
        >
          NodeClasificationBackEnd
        </button>
      </div>

      {showNodeClassification && (
        <NodeClasificationBackEnd
          onClose={() => setShowNodeClassification(false)}
        />
      )}

        <button
          className="btn btn-secondary  w-100"
          onClick={() => handleSecteurActiviti()}
        >
          SecteurActiviti
        </button>

    </div>
  );
};

export default Analysis;