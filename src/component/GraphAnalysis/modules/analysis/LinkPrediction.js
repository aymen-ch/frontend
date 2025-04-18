import React from 'react';
import axios from 'axios';
import { Button, Spinner } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { parseAggregationResponse_advanced } from '../../utils/Parser';
import NodeClasificationBackEnd from './NodeClasificationBackEnd/NodeClasificationBackEnd';

const LinkPrediction = ({ selectedAffaires, depth, setDepth, isAggLoading, setIsAggLoading, setNodes, setEdges, showNodeClassification, setShowNodeClassification }) => {
  const handleAggregationWithAlgorithm = async (depth) => {
    try {
      setIsAggLoading(true);
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
      setIsAggLoading(false);
    }
  };

  return (
    <div className="p-3 d-flex flex-column gap-3">
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
          'Aggregation with Algorithm'
        )}
      </Button>

      <input
        type="number"
        value={depth}
        onChange={(e) => setDepth(parseInt(e.target.value, 10))}
        min="1"
        placeholder="Enter depth"
        className="form-control"
      />

      <Button
        variant="danger"
        className="w-100"
        onClick={() => setShowNodeClassification(true)}
      >
        Node Classification (Backend)
      </Button>

      {showNodeClassification && (
        <NodeClasificationBackEnd
          onClose={() => setShowNodeClassification(false)}
        />
      )}
    </div>
  );
};

export default LinkPrediction;