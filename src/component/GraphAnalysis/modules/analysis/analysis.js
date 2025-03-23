import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Spinner, Container } from 'react-bootstrap';
import { getNodeIcon, getNodeColor, parseAggregationResponse, parseAggregationResponse_advanced } from '../../utils/Parser';
import { BASE_URL } from '../../utils/Urls';
import NodeClasificationBackEnd from './NodeClasificationBackEnd/NodeClasificationBackEnd';

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
  const [showNodeClassification, setShowNodeClassification] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For SecteurActiviti
  const [isAggLoading, setIsAggLoading] = useState(false); // For Aggregation with Algorithm

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
      setIsAggLoading(true); // Set aggregation-specific loading state
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
    } finally {
      setIsAggLoading(false); // Reset aggregation-specific loading state
    }
  };

  const handleSecteurActiviti = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/Secteur_Activite/', {
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log(response.data);
      } else {
        console.error('handleSecteurActiviti failed.');
      }
    } catch (error) {
      console.error('Error during handleSecteurActiviti:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles for the divs
  const primarySectionStyle = {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    marginBottom: '20px'
  };

  const secondarySectionStyle = {
    backgroundColor: '#e9ecef',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ced4da'
  };

  return (
    <Container fluid className="p-3 bg-white shadow-sm rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
      Analysis Module</h3>

      {/* First div with Aggregation with Algorithme, Color node with class, and input */}
      <div style={primarySectionStyle} className="d-flex flex-column gap-3">
        <Button
          variant="info"
          className="w-100"
          onClick={() => handleAggregationWithAlgorithm(depth)}
          disabled={isAggLoading}
        >
          {isAggLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Loading...
            </>
          ) : (
            'Aggregation with Algorithme'
          )}
        </Button>

        <Button
          variant="warning"
          className="w-100"
          onClick={() => ColorPersonWithClass(nodes, setNodes)}
        >
          Color node with class
        </Button>

        <input
          type="number"
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))}
          min="1"
          placeholder="Enter depth"
          className="form-control"
        />
      </div>

      {/* Second div with NodeClasificationBackEnd and SecteurActiviti */}
      <div style={secondarySectionStyle} className="d-flex flex-column gap-3">
        <Button
          variant="danger"
          className="w-100"
          onClick={() => setShowNodeClassification(true)}
        >
          NodeClasificationBackEnd
        </Button>

        {showNodeClassification && (
          <NodeClasificationBackEnd
            onClose={() => setShowNodeClassification(false)}
          />
        )}

        <Button
          variant="secondary"
          className="w-100"
          onClick={() => handleSecteurActiviti()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Loading...
            </>
          ) : (
            'SecteurActivitiBackEnd'
          )}
        </Button>
      </div>
    </Container>
  );
};

export default Analysis;