import React from 'react';
import axios from 'axios';
import { Button, Spinner } from 'react-bootstrap';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import { parsergraph} from '../../Parser';
import NodeClasificationBackEnd from './NodeClasificationBackEnd/NodeClasificationBackEnd';
import { useTranslation } from 'react-i18next';


const LinkPrediction = ({ selectedAffaires, depth, setDepth, isAggLoading, setIsAggLoading, setNodes, setEdges, showNodeClassification, setShowNodeClassification }) => {
  const handleAggregationWithAlgorithm = async (depth) => {
    try {
      setIsAggLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL_Backend + '/aggregate_with_algo/', {
        id_affaires: selectedAffaires,
        depth: depth,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log("agragte with algo" , response)
        
        
        const { nodes: expandedNodes, edges: expandedEdges } = parsergraph(response.data);
        
        // Update state with new nodes and edges
          // setNodes(prevNodes => [...prevNodes, ...expandedNodes]);
          // setEdges(prevEdges => [...prevEdges, ...expandedEdges]);
        // const { nodes: parsedNodes, edges: parsedEdges } = await parseAggregationResponse_advanced(response.data[0].Result);
        setNodes(expandedNodes);
        setEdges(expandedEdges);
      } else {
        console.error('Advanced aggregation failed.');
      }
    } catch (error) {
      console.error('Error during advanced aggregation:', error);
    } finally {
      setIsAggLoading(false);
    }
  };

    const{t} = useTranslation()
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
            {t('Loading...')}
          </>
        ) : (
          t('links pridiction with Algorithm')
        )}
      </Button>

      <input
        type="number"
        value={depth}
        onChange={(e) => setDepth(parseInt(e.target.value, 10))}
        min="1"
        placeholder={t('Enter depth')}
        className="form-control"
      />

      <Button
        variant="danger"
        className="w-100"
        onClick={() => setShowNodeClassification(true)}
      >
        {t('applicate the algorithme of links pridiciton')}
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