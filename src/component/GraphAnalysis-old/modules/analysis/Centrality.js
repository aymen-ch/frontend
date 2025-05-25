import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Button, Spinner, Form, Row, Col, Card } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { CentralityByAttribute } from '../../HorizontalModules/containervisualization/function_container';
import TopKCentrality from './TopKCentrality';
import { useTranslation } from 'react-i18next';
import globalWindowState from '../../utils/globalWindowState';
import { Sliders, Zap, Activity, BarChart2 } from 'lucide-react';

const Centrality = ({
  nodes,
  setNodes,
  selectedGroup,
  setSelectedGroup,
  selectedCentralityAttribute,
  setSelectedCentralityAttribute,
  isBetweennessLoading,
  setIsBetweennessLoading,
}) => {
  const { t } = useTranslation();
  const [nodeData, setNodeData] = useState([]);
  const [nodeProperties, setNodeProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch node types
  const fetchNodeTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${BASE_URL}/node-types/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nodeTypes = response.data.node_types || [];
      setNodeData(nodeTypes);
      if (nodeTypes.length > 0 && !selectedGroup) {
        setSelectedGroup(nodeTypes[0].type);
      }
    } catch (error) {
      setError(error.message || t('error_fetching_node_types'));
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, setSelectedGroup, t]);

  // Fetch node properties
  const fetchNodeProperties = useCallback(async (nodeType) => {
    if (!nodeType) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${BASE_URL}/node-types/properties/`, {
        params: { node_type: nodeType },
        headers: { Authorization: `Bearer ${token}` },
      });
      setNodeProperties(response.data.properties || []);
    } catch (error) {
      setError(t('error_fetching_properties'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Get numeric properties starting with '_'
  const getNumericNodeProperties = useCallback(() => {
    if (!nodeProperties.length) return [];
    return nodeProperties
      .filter(
        (prop) =>
          (prop.type === 'int' || prop.type === 'float') &&
          prop.name.startsWith('_')
      )
      .map((prop) => prop.name);
  }, [nodeProperties]);

  // Fetch node types on mount
  useEffect(() => {
    fetchNodeTypes();
  }, [fetchNodeTypes]);

  // Fetch properties when selectedGroup changes
  useEffect(() => {
    fetchNodeProperties(selectedGroup);
  }, [selectedGroup, fetchNodeProperties]);

  // Set default centrality attribute when properties change
  useEffect(() => {
    const numericProperties = getNumericNodeProperties();
    if (numericProperties.length > 0 && !selectedCentralityAttribute) {
      setSelectedCentralityAttribute(numericProperties[0]);
    }
  }, [getNumericNodeProperties, selectedCentralityAttribute, setSelectedCentralityAttribute]);

  const handleCentralityBackend = async () => {
    setIsBetweennessLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${BASE_URL}/calculate_betweenness_centrality/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        alert(t('centrality_calculated'));
      } else {
        throw new Error(t('backend_centrality_failed'));
      }
    } catch (error) {
      setError(error.message || t('centrality_calc_error'));
    } finally {
      setIsBetweennessLoading(false);
    }
  };

  const centralityAttributes = getNumericNodeProperties();

  return (
    <Card className="p-3 shadow-sm rounded-3">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Sliders size={18} />
        <strong className="fs-5">{t('Centrality Tools')}</strong>
      </div>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p>{t('Loading...')}</p>
        </div>
      )}
      {error && <p className="text-danger mt-3">{error}</p>}
       {/* Buttons to trigger actions */}
       <Row className="g-2 mb-3">
            <Col xs={12} md={12}>
              <Button
                size="sm"
                variant="info"
                className="w-100 d-flex align-items-center justify-content-center gap-1"
                onClick={() => globalWindowState.setWindow('Analyse_BackEnd', selectedGroup)}
                style={{ height: '50px' }}
              >
                <BarChart2 size={14} className="me-1" />
                {t('add Centrality attribute  ')}
              </Button>
            </Col>
          </Row>

      {!loading && !error && (
        <>
          <Row className="g-2 mb-3">
            {/* Node Type Dropdown */}
            <Col xs={12}>
              <Form.Label>{t('Select Node Type')}</Form.Label>
              <Form.Select
                size="sm"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                {nodeData.map((node) => (
                  <option key={node.type} value={node.type}>
                    <BarChart2 size={16} className="me-2" />
                    {node.type}
                  </option>
                ))}
              </Form.Select>
            </Col>

            {/* Centrality Attribute Dropdown */}
            <Col xs={12}>
              <Form.Label>{t('Select Centrality Attribute')}</Form.Label>
              <Form.Select
                size="sm"
                value={selectedCentralityAttribute}
                onChange={(e) => setSelectedCentralityAttribute(e.target.value)}
                disabled={centralityAttributes.length === 0}
              >
                {centralityAttributes.length === 0 ? (
                  <option value="">{t('No centrality attributes available')}</option>
                ) : (
                  centralityAttributes.map((attr) => (
                    <option key={attr} value={attr}>
                      <BarChart2 size={16} className="me-2" />
                      {attr}
                    </option>
                  ))
                )}
              </Form.Select>
            </Col>
          </Row>

         

          {/* TopK Centrality Component */}
          <TopKCentrality
            setNodes={setNodes}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            selectedCentralityAttribute={selectedCentralityAttribute}
            setSelectedCentralityAttribute={setSelectedCentralityAttribute}
          />
        </>
      )}
    </Card>
  );
};

export default Centrality;