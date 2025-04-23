import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Spinner, Form, Row, Col, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { CentralityByAttribute } from '../../HorizontalModules/containervisualization/function_container';
import TopKCentrality from './TopKCentrality';


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
      <Button
        variant="success"
        className="w-100"
        onClick={() => globalWindowState.setWindow("analyse_statistique", {selectedCentralityAttribute ,selectedGroup} )}
      >
        Open Statistical Analysis
      </Button>
      
        <Sliders size={18} /> <strong className="fs-5">Centrality Tools</strong>
      </div>

      {/* Node Group and Centrality Attribute Section */}
      <Row className="g-2 mb-3">
        {/* Node Type Dropdown */}
        <Col xs={12}>
          <Form.Label>Select Node Type</Form.Label>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="node-group-tooltip">Select the group of nodes for analysis</Tooltip>}
          >
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
          </OverlayTrigger>
        </Col>

        {/* Centrality Attribute Dropdown */}
        <Col xs={12}>
          <Form.Label>Select Centrality Algorithm</Form.Label>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="centrality-attribute-tooltip">Choose the centrality attribute for calculation</Tooltip>}
          >
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
          </OverlayTrigger>
        </Col>
      </Row>

      {/* Buttons to trigger actions */}
      <Row className="g-2 mb-3">
  <Col xs={12} md={6}>
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="frontend-tooltip">Calculate centrality  sur le graphe affiche</Tooltip>}
    >
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
        Frontend
      </Button>
    </OverlayTrigger>
  </Col>

  <Col xs={12} md={6}>
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="backend-tooltip">Calculate centrality sur le graphe complete</Tooltip>}
    >
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
            Backend
          </>
        )}
      </Button>
    </OverlayTrigger>
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
