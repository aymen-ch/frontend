// src/AddActionWindow.js
import React, { useState, useRef } from 'react';
import { Button, Card, Container, Form, Alert } from 'react-bootstrap';
import { XLg, Dash, Fullscreen, FullscreenExit, PlusCircle } from 'react-bootstrap-icons';
import Draggable from 'react-draggable';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css'; // Dark theme similar to Neo4j Browser
import './cyphermode'; // Import custom Cypher mode
import 'bootstrap/dist/css/bootstrap.min.css';
import './AddActionWindow.css';
import { BASE_URL } from '../../../../utils/Urls';

const AddActionWindow = ({ node, onClose }) => {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    node_type: node?.group || 'Personne',
    id_field: 'id',
    query: '',
    node_id: node?.id || '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const nodeRef = useRef(null);
  const token = localStorage.getItem('authToken');

  // List of available models
  const availableModels = ['llama3', 'mistral', 'grok'];

  if (!node) return null;

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };

  const generateCypherQuery = async () => {
    if (!selectedModel) {
      setError(t('add_action_window.error_no_model'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setValidationResult(null);

    try {
      const defaultQuestion = t('add_action_window.default_question', { nodeType: formData.node_type });
      const response = await axios.post(
        `${BASE_URL}/generate_cypher/`,
        {
          question: defaultQuestion,
          node_type: formData.node_type,
          model: selectedModel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.cypher) {
        setFormData({ ...formData, query: response.data.cypher });
        setSuccess(t('add_action_window.success_generated'));
      } else {
        setError(t('add_action_window.error_generate_failed'));
      }
    } catch (err) {
      setError(err.response?.data?.error || t('add_action_window.error_generate_failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyCypherQuery = async () => {
    if (!formData.query.trim()) {
      setError(t('add_action_window.error_no_query'));
      return;
    }

    setIsVerifying(true);
    setError(null);
    setValidationResult(null);

    try {
      const response = await axios.post(
        `${BASE_URL}/validate_cypher/`,
        {
          query: formData.query,
          node_type: formData.node_type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.isValid) {
        setValidationResult({
          isValid: true,
          message: t('add_action_window.validation_valid'),
          correctedQuery: response.data.correctedQuery || formData.query,
        });
        if (response.data.correctedQuery) {
          setFormData({ ...formData, query: response.data.correctedQuery });
        }
      } else {
        setValidationResult({
          isValid: false,
          message: response.data.error || t('add_action_window.validation_invalid'),
          correctedQuery: response.data.correctedQuery || null,
        });
        if (response.data.correctedQuery) {
          setFormData({ ...formData, query: response.data.correctedQuery });
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || t('add_action_window.error_verify_failed'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.name.length > 50) {
      setError(t('add_action_window.error_name_too_long'));
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/add_action/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 201) {
        setSuccess(t('add_action_window.success_added'));
        setFormData({
          name: '',
          description: '',
          node_type: node.group || 'Personne',
          id_field: 'id',
          query: '',
          node_id: node.id || '',
        });
        setSelectedModel('');
        setValidationResult(null);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('add_action_window.error_add_action_failed'));
    }
  };

  const windowContent = (
    <Card className={`action-window ${isMaximized ? 'maximized' : ''} shadow`}>
      <Card.Header className="window-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <PlusCircle size={20} className="me-2" />
          <span className="window-title">{t('add_action_window.title')}</span>
        </div>
        <div className="window-controls">
          <Button variant="link" className="control-button p-0 me-2" title={t('add_action_window.minimize')}>
            <Dash size={16} color="white" />
          </Button>
          <Button
            variant="link"
            className="control-button p-0 me-2"
            onClick={toggleMaximize}
            title={isMaximized ? t('add_action_window.restore') : t('add_action_window.maximize')}
          >
            {isMaximized ? <FullscreenExit size={16} color="white" /> : <Fullscreen size={16} color="white" />}
          </Button>
          <Button variant="link" className="control-button p-0" onClick={onClose} title={t('add_action_window.close')}>
            <XLg size={16} color="white" />
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="window-content p-3">
        <Container>
          <h4 className="mb-4">{t('add_action_window.header')}{node.group}</h4>
          <Form onSubmit={handleSubmit}>
            <Form.Control type="hidden" name="node_type" value={formData.node_type} />
            <Form.Control type="hidden" name="node_id" value={formData.node_id} />
            <Form.Control type="hidden" name="id_field" value={formData.id_field} />
            {error && (
              <Alert variant="danger" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                {success}
              </Alert>
            )}
            {validationResult && (
              <Alert
                variant={validationResult.isValid ? 'success' : 'warning'}
                onClose={() => setValidationResult(null)}
                dismissible
              >
                {validationResult.message}
                {validationResult.correctedQuery &&
                  validationResult.correctedQuery !== formData.query && (
                    <div>
                      <strong>{t('add_action_window.corrected_query')}:</strong> {validationResult.correctedQuery}
                    </div>
                  )}
              </Alert>
            )}
            <Form.Group className="mb-3" controlId="actionName">
              <Form.Label>{t('add_action_window.action_name_label')}</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('add_action_window.action_name_placeholder')}
                maxLength={50}
                required
              />
              <Form.Text className="text-muted">
                {t('add_action_window.name_length_info', { remaining: 50 - formData.name.length })}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3" controlId="actionDescription">
              <Form.Label>{t('add_action_window.action_description_label')}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('add_action_window.action_description_placeholder')}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="llmGenerate">
              <Form.Label>{t('add_action_window.llm_generate_label')}</Form.Label>
              <div className="d-flex align-items-center">
          
                <Button
                  variant="outline-primary"
                  onClick={generateCypherQuery}
                  disabled={isGenerating || !selectedModel}
                >
                  {isGenerating ? t('add_action_window.generating') : t('add_action_window.generate_button')}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3" controlId="query">
              <Form.Label>{t('add_action_window.query_label')}</Form.Label>
              <CodeMirror
                value={formData.query}
                options={{
                  mode: 'text/x-cypher',
                  theme: 'dracula',
                  lineNumbers: true,
                  lineWrapping: true,
                  tabSize: 2,
                  indentWithTabs: false,
                  smartIndent: true,
                  placeholder: t('add_action_window.query_placeholder'),
                }}
                onBeforeChange={(editor, data, value) => {
                  setFormData({ ...formData, query: value });
                }}
                editorDidMount={(editor) => {
                  editor.setSize('100%', '150px'); // Set editor height
                }}
              />
 
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={onClose} className="me-2">
                {t('add_action_window.cancel_button')}
              </Button>
              <Button variant="primary" type="submit">
                {t('add_action_window.save_button')}
              </Button>
            </div>
          </Form>
        </Container>
      </Card.Body>
    </Card>
  );

  return (
    <div className="action-window-overlay">
      {isMaximized ? (
        windowContent
      ) : (
        <Draggable nodeRef={nodeRef} handle=".window-header" bounds="parent">
          <div ref={nodeRef}>{windowContent}</div>
        </Draggable>
      )}
    </div>
  );
};

export default AddActionWindow;