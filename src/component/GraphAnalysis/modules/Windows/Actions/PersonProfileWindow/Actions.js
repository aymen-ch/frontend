
import React, { useState, useRef } from 'react';
import { Button, Card, Container, Form, Alert } from 'react-bootstrap';
import { XLg, Dash, Fullscreen, FullscreenExit, PlusCircle } from 'react-bootstrap-icons';
import Draggable from 'react-draggable';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AddActionWindow.css';
import { BASE_URL } from '../../../../utils/Urls';
const AddActionWindow = ({ node, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    node_type: node?.group || 'Personne', // Set to node.group
    id_field: 'id',
    query: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const nodeRef = useRef(null);
  const token = localStorage.getItem('authToken');

  if (!node) return null;

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
        setSuccess('Action added successfully!');
        setFormData({
          name: '',
          node_type: node.group || 'Personne',
          id_field: 'id',
          query: '',
        });
        setTimeout(() => onClose(), 1500); // Close after 1.5s
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add action');
    }
  };

  const windowContent = (
    <Card className={`action-window ${isMaximized ? 'maximized' : ''} shadow`}>
      <Card.Header className="window-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <PlusCircle size={20} className="me-2" />
          <span className="window-title">Add New Action</span>
        </div>
        <div className="window-controls">
          <Button variant="link" className="control-button p-0 me-2" title="Minimize">
            <Dash size={16} color="white" />
          </Button>
          <Button
            variant="link"
            className="control-button p-0 me-2"
            onClick={toggleMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <FullscreenExit size={16} color="white" /> : <Fullscreen size={16} color="white" />}
          </Button>
          <Button variant="link" className="control-button p-0" onClick={onClose} title="Close">
            <XLg size={16} color="white" />
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="window-content p-3">
        <Container>
          <h4 className="mb-4">Add action for {node.group} node</h4>
          <Form onSubmit={handleSubmit}>
            <Form.Control
              type="hidden"
              name="node_type"
              value={formData.node_type}
            />
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
            <Form.Group className="mb-3" controlId="actionName">
              <Form.Label>Action Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Show Related Documents"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="idField">
              <Form.Label>ID Field</Form.Label>
              <Form.Control
                as="select"
                name="id_field"
                value={formData.id_field}
                onChange={handleChange}
                required
              >
                <option value="id">Neo4j ID (id)</option>
                <option value="identity">Identity</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3" controlId="query">
              <Form.Label>Cypher Query</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="query"
                value={formData.query}
                onChange={handleChange}
                placeholder="e.g., MATCH (n:Personne) WHERE id(n) = $id MATCH (n)-[:RELATED_TO]->(m) RETURN m"
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={onClose} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Action
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
