import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Spinner, Form, Row, Col, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { CentralityByAttribute } from '../../HorizontalModules/containervisualization/function_container';
import TopKCentrality from './TopKCentrality';

import { useTranslation } from 'react-i18next';
import globalWindowState from '../../utils/globalWindowState';

import { Sliders, Zap, Activity, Target, BarChart2 } from 'lucide-react';


const Centrality = ({
  nodes,
  setNodes,
  selectedGroup,
  setSelectedGroup,
  selectedCentralityAttribute,
  setSelectedCentralityAttribute,
  isBetweennessLoading,
  setIsBetweennessLoading
}) => {
  const{t} = useTranslation()
  const centralityAttributes = [
    'degree_out', 'degree_in', '_betweennessCentrality',
    '_pagerank', '_articleRank', '_eigenvector', '_betweenness',
  ];

  const [nodeData, setNodeData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNodeTypes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(BASE_URL + '/node-types/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status !== 200) throw new Error('Network response was not ok');
        setNodeData(response.data.node_types);
        if (response.data.node_types.length > 0)
          setSelectedGroup(response.data.node_types[0].type);
      } catch (error) {
        setError(error.message || 'An error occurred');
      }
    };
    fetchNodeTypes();
  }, []);

  const handleCentralityBackend = async () => {
    try {
      setIsBetweennessLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/calculate_betweenness_centrality/', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        alert('Centrality calculated!');
      } else {
        console.error('Backend centrality failed.');
      }
    } catch (error) {
      console.error('Centrality calc error:', error);
    } finally {
      setIsBetweennessLoading(false);
    }
  };

  return (

  

    <Card className="p-3 shadow-sm rounded-3">
      <div className="d-flex align-items-center gap-2 mb-3">
      
      
        <Sliders size={18} /> <strong className="fs-5"> {t('Centrality Tools')}</strong>
      </div>

      {/* Node Group and Centrality Attribute Section */}
      {/* <OverlayTrigger
  placement="top"
  // overlay={<Tooltip id="stat-analysis-tooltip">Open statistical analysis for selected node group and centrality</Tooltip>}
> */}
  <Button
    size="sm"
    variant="info"
    className="w-100 d-flex align-items-center justify-content-center gap-1"
    onClick={() => globalWindowState.setWindow("analyse_statistique", { selectedCentralityAttribute, selectedGroup })}
    style={{ height: '50px' }} // Match height with other buttons
  >
    <BarChart2 size={14} className="me-1" /> {/* Adding BarChart2 icon for statistical analysis */}
    {t('Button Statistical Analysistton')}
  </Button>
{/* </OverlayTrigger> */}

      <Row className="g-2 mb-3">
        {/* Node Type Dropdown */}
        <Col xs={12}>
          <Form.Label>{t('Select Node Type')}</Form.Label>
          {/* <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="node-group-tooltip">{t('Select the group of nodes for analysis')}</Tooltip>}
          > */}
            <Form.Select
              size="sm"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {nodeData.map((node) => (
                <option key={node.type} value={node.type}>
                  <Target size={16} className="me-2" />
                  {node.type}
                </option>
              ))}
            </Form.Select>
          {/* </OverlayTrigger> */}
        </Col>

        {/* Centrality Attribute Dropdown */}
        <Col xs={12}>
          <Form.Label>{t('Select Centrality Algorithm')}</Form.Label>
          {/* <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="centrality-attribute-tooltip">{t('Choose the centrality attribute for calculation')}</Tooltip>}
          > */}
            <Form.Select
              size="sm"
              value={selectedCentralityAttribute}
              onChange={(e) => setSelectedCentralityAttribute(e.target.value)}
            >
              {centralityAttributes.map((attr) => (
                <option key={attr} value={attr}>
                  <BarChart2 size={16} className="me-2" />
                  {attr}
                </option>
              ))}
            </Form.Select>
          {/* </OverlayTrigger> */}
        </Col>
      </Row>

      {/* Buttons to trigger actions */}
      <Row className="g-2 mb-3">
  <Col xs={12} md={6}>
    {/* <OverlayTrigger
      placement="top"
      // overlay={<Tooltip id="frontend-tooltip">Calculate centrality  sur le graphe affiche</Tooltip>}
    > */}
      <Button
        size="sm"
        variant="warning"
        className="w-100 d-flex align-items-center justify-content-center"
        onClick={() =>
          CentralityByAttribute(nodes, setNodes, selectedCentralityAttribute, selectedGroup)
        }
        style={{ height: '50px' }} // Ensuring same height for buttons
      >
        <Zap size={14} className="me-1" />
        {t('Frontend')}
      </Button>
    {/* </OverlayTrigger> */}
  </Col>

  <Col xs={12} md={6}>
    {/* <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="backend-tooltip">Calculate centrality sur le graphe complete</Tooltip>}
    > */}
      <Button
        size="sm"
        variant="primary"
        className="w-100 d-flex align-items-center justify-content-center"
        onClick={handleCentralityBackend}
        disabled={isBetweennessLoading}
        style={{ height: '50px' }} // Ensuring same height for buttons
      >
        {isBetweennessLoading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-1"
            />
            Loading...
          </>
        ) : (
          <>
            <Activity size={14} className="me-1" />
           {t('Backend')}
          </>
        )}
      </Button>
    {/* </OverlayTrigger> */}
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


   
    </Card>

  );
};

export default Centrality;
