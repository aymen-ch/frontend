import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Button, Spinner, Form } from 'react-bootstrap';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import { parsergraph } from '../../VisualisationModule/Parser';
import { useTranslation } from 'react-i18next';

const LinkPrediction = ({ setEdges, setNodes, nodes }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [depth, setDepth] = useState(1); // default depth

  const handleLinkPrediction = useCallback(async () => {
    // Extract IDs of nodes where type is 'Affaire'
    const affaireIds = nodes
      .filter((node) => node.group === 'Affaire')
      .map((node) => parseInt(node.id, 10));

    if (affaireIds.length === 0) {
      setError(t('No affaire nodes found'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${BASE_URL_Backend}/link_prediction/`,
        { affaireIds, depth },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Parse the response with parsergraph
      const graphData = parsergraph(response.data);

      // Update nodes and edges from parsergraph output
      if (graphData.nodes && graphData.edges) {
        setNodes(graphData.nodes);
        setEdges(graphData.edges);
      }
    } catch (err) {
      setError(t('error_fetching_link_prediction'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [nodes, setNodes, setEdges, depth, t]);

  return (
    <div className="p-3 d-flex flex-column gap-3">
      {error && <div className="text-danger">{error}</div>}

      <Form.Group>
        <Form.Label>{t('Select depth')}</Form.Label>
        <div>
          {[1, 2, 3].map((option) => (
            <Form.Check
              inline
              key={option}
              type="radio"
              id={`depth-${option}`}
              label={option}
              name="depth"
              value={option}
              checked={depth === option}
              onChange={() => setDepth(option)}
            />
          ))}
        </div>
      </Form.Group>

      <Button onClick={handleLinkPrediction} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : t('Run Link Prediction')}
      </Button>
    </div>
  );
};

export default LinkPrediction;
