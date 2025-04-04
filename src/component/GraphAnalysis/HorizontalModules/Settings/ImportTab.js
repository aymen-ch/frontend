// ImportTab.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Dropdown,
} from 'react-bootstrap';
import { CheckCircleFill } from 'react-bootstrap-icons'; // Import icon for success indicator
import { BASE_URL } from '../../utils/Urls';
import './ImportTab.css';

const ImportTab = () => {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [config, setConfig] = useState('');
  const [nodes, setNodes] = useState('');
  const [relationships, setRelationships] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('authToken');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFileType(''); // Reset file type when new file is selected
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    if (fileType) formData.append('file_type', fileType);
    if (config) formData.append('config', config);
    if (nodes) formData.append('nodes', nodes);
    if (relationships) formData.append('relationships', relationships);

    try {
      const response = await axios.post(
        `${BASE_URL}/import_file_to_neo4j/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setSuccess(response.data.message);
      setFile(null);
      setConfig('');
      setNodes('');
      setRelationships('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import file');
    } finally {
      setLoading(false);
    }
  };

  const renderConfigFields = () => {
    switch (fileType) {
      case 'csv':
        return (
          <>
            <Form.Group controlId="nodes" className="mb-3">
              <Form.Label>Nodes Configuration (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={nodes}
                onChange={(e) => setNodes(e.target.value)}
                placeholder='e.g. [{"labels": ["Person"], "mapping": {"name": "name"}}]'
                disabled={loading}
              />
            </Form.Group>
            <Form.Group controlId="relationships" className="mb-3">
              <Form.Label>Relationships Configuration (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={relationships}
                onChange={(e) => setRelationships(e.target.value)}
                placeholder='e.g. [{"type": "KNOWS", "mapping": {"from": "source", "to": "target"}}]'
                disabled={loading}
              />
            </Form.Group>
            <Form.Group controlId="config" className="mb-3">
              <Form.Label>APOC Configuration (JSON)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder='e.g. {"delimiter": ",", "header": true}'
                disabled={loading}
              />
            </Form.Group>
          </>
        );
      case 'json':
        return (
          <Form.Group controlId="config" className="mb-3">
            <Form.Label>APOC Configuration (JSON)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder='e.g. {"write": true}'
              disabled={loading}
            />
          </Form.Group>
        );
      case 'cypher':
        return null; // No additional config needed for Cypher
      default:
        return null;
    }
  };

  return (
    <Card className="import-card">
      <Card.Header as="h4">Import File to Neo4j</Card.Header>
      <Card.Body className="scrollable-body">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group controlId="file" className="mb-3">
                <Form.Label>Select File</Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                  accept=".csv,.json,.cypher"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="fileType" className="mb-3">
                <Form.Label>File Type</Form.Label>
                <Dropdown onSelect={(key) => setFileType(key)}>
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-file-type" disabled={loading}>
                    {fileType ? fileType.toUpperCase() : 'Select File Type'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="csv">CSV</Dropdown.Item>
                    <Dropdown.Item eventKey="json">JSON</Dropdown.Item>
                    <Dropdown.Item eventKey="cypher">Cypher</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Form.Group>
            </Col>
          </Row>
          {fileType && renderConfigFields()}
          <Button
            variant="primary"
            type="submit"
            className="w-100 mt-3"
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Importing...
              </>
            ) : (
              'Import File'
            )}
          </Button>
        </Form>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        {success && (
          <Alert variant="success" className="mt-3 d-flex align-items-center">
            <CheckCircleFill className="me-2 success-indicator" />
            {success}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default ImportTab;