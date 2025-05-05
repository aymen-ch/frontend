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
import { CheckCircleFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next'; // Importing the translation hook
import { BASE_URL } from '../../utils/Urls';
import './ImportTab.css';

const ImportTab = () => {
  const { t } = useTranslation(); // Initialize the translation hook
  const [nodesFile, setNodesFile] = useState(null);
  const [relationshipsFile, setRelationshipsFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [cypherFile, setCypherFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [config, setConfig] = useState('');
  const [nodes, setNodes] = useState('');
  const [relationships, setRelationships] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('authToken');

  const handleNodesFileChange = (e) => {
    setNodesFile(e.target.files[0]);
    if (!fileType) setFileType('csv');
  };

  const handleRelationshipsFileChange = (e) => {
    setRelationshipsFile(e.target.files[0]);
    if (!fileType) setFileType('csv');
  };

  const handleJsonFileChange = (e) => {
    setJsonFile(e.target.files[0]);
    if (!fileType) setFileType('json');
  };

  const handleCypherFileChange = (e) => {
    setCypherFile(e.target.files[0]);
    if (!fileType) setFileType('cypher');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nodesFile && !relationshipsFile && !jsonFile && !cypherFile) {
      setError(t('Please select at least one file'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    if (nodesFile) formData.append('nodes_file', nodesFile);
    if (relationshipsFile) formData.append('relationships_file', relationshipsFile);
    if (jsonFile) formData.append('json_file', jsonFile);
    if (cypherFile) formData.append('cypher_file', cypherFile);
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
      setNodesFile(null);
      setRelationshipsFile(null);
      setJsonFile(null);
      setCypherFile(null);
      setFileType('');
      setConfig('');
      setNodes('');
      setRelationships('');
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to import file'));
    } finally {
      setLoading(false);
    }
  };

  const renderFileInputs = () => {
    switch (fileType) {
      case 'csv':
        return (
          <>
            <Form.Group controlId="nodesFile" className="mb-3">
              <Form.Label>{t('Nodes File (CSV)')}</Form.Label>
              <Form.Control
                type="file"
                onChange={handleNodesFileChange}
                disabled={loading}
                accept=".csv"
              />
            </Form.Group>
            <Form.Group controlId="relationshipsFile" className="mb-3">
              <Form.Label>{t('Relationships File (CSV)')}</Form.Label>
              <Form.Control
                type="file"
                onChange={handleRelationshipsFileChange}
                disabled={loading}
                accept=".csv"
              />
            </Form.Group>
          </>
        );
      case 'json':
        return (
          <Form.Group controlId="jsonFile" className="mb-3">
            <Form.Label>{t('JSON File')}</Form.Label>
            <Form.Control
              type="file"
              onChange={handleJsonFileChange}
              disabled={loading}
              accept=".json"
              
             
            />
            
       
          </Form.Group>
        );
      case 'cypher':
        return (
          <Form.Group controlId="cypherFile" className="mb-3">
            <Form.Label>{t('Cypher File')}</Form.Label>
            <Form.Control
              type="file"
              onChange={handleCypherFileChange}
              disabled={loading}
              accept=".cypher"
            />
          </Form.Group>
        );
      default:
        return null;
    }
  };

  const renderConfigFields = () => {
    switch (fileType) {
      case 'csv':
        return (
          <>
            <Form.Group controlId="nodes" className="mb-3">
              <Form.Label>{t('Nodes Configuration (JSON)')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={nodes}
                onChange={(e) => setNodes(e.target.value)}
                placeholder={t('e.g. [{"labels": ["Person"], "mapping": {"name": "name"}, "header": true}]')}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group controlId="relationships" className="mb-3">
              <Form.Label>{t('Relationships Configuration (JSON)')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={relationships}
                onChange={(e) => setRelationships(e.target.value)}
                placeholder={t('e.g. [{"type": "KNOWS", "mapping": {"from": "source", "to": "target"}, "header": true}]')}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group controlId="config" className="mb-3">
              <Form.Label>{t('APOC Configuration (JSON)')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder={t('e.g. {"delimiter": ",", "header": true}')}
                disabled={loading}
              />
            </Form.Group>
          </>
        );
      case 'json':
        return (
          <></>
          // <Form.Group controlId="config" className="mb-3">
          //   <Form.Label>{t('APOC Configuration (JSON)')}</Form.Label>
          //   <Form.Control
          //     as="textarea"
          //     rows={3}
          //     value={config}
          //     onChange={(e) => setConfig(e.target.value)}
          //     placeholder={t('e.g. {"write": true}')}
          //     disabled={loading}
          //   />
          // </Form.Group>
        );
      case 'cypher':
        return null;
      default:
        return null;
    }
  };

  
  return (
    <Card className="import-card">
      <Card.Header as="h4">{t('Import File to Neo4j')}</Card.Header>
      <Card.Body className="scrollable-body">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={12}>
              <Form.Group controlId="fileType" className="mb-3">
                <Form.Label>{t('File Type')}</Form.Label>
                <Dropdown onSelect={(key) => setFileType(key)}>
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-file-type" disabled={loading}>
                    {fileType ? fileType.toUpperCase() : t('Select File Type')}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="csv">{t('CSV')}</Dropdown.Item>
                    <Dropdown.Item eventKey="json">{t('JSON')}</Dropdown.Item>
                    <Dropdown.Item eventKey="cypher">{t('Cypher')}</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Form.Group>
            </Col>
          </Row>
          {renderFileInputs()}
          {renderConfigFields()}
          <Button
            variant="primary"
            type="submit"
            className="w-100 mt-3"
            disabled={loading || (!nodesFile && !relationshipsFile && !jsonFile && !cypherFile)}
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
                {t('Importing...')}
              </>
            ) : (
              t('Import File')
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
