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
import { useTranslation } from 'react-i18next';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import './ImportTab.css';

const ImportTab = () => {
  const { t } = useTranslation();
  const [jsonFile, setJsonFile] = useState(null);
  const [fileType, setFileType] = useState('json');
  const [config, setConfig] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('authToken');

  const handleJsonFileChange = (e) => {
    setJsonFile(e.target.files[0]);
    setFileType('json');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jsonFile) {
      setError(t('Please select at least one file'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    if (jsonFile) formData.append('json_file', jsonFile);
    if (fileType) formData.append('file_type', fileType);
    if (config) formData.append('config', config);

    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/import_file_to_neo4j/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setSuccess(response.data.message);
      setJsonFile(null);
      setFileType('json');
      setConfig('');
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to import file'));
    } finally {
      setLoading(false);
    }
  };

  const renderFileInputs = () => {
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
  };

  const renderConfigFields = () => {
    return (
      <></>
    );
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
                    <Dropdown.Item eventKey="json">{t('JSON')}</Dropdown.Item>
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
            disabled={loading || !jsonFile}
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