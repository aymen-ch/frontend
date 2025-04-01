import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  Spinner,
  Container,
  Card,
  ListGroup,
  Form,
  Alert,
} from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import './SettingsPage.css';

const SettingsPage = () => {
  const [currentDb, setCurrentDb] = useState('');
  const [databases, setDatabases] = useState([]);
  const [newDbName, setNewDbName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingCurrentDb, setLoadingCurrentDb] = useState(false);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [loadingCreateDb, setLoadingCreateDb] = useState(false);
  const [loadingSwitchDb, setLoadingSwitchDb] = useState(false);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchCurrentDatabase();
    fetchAllDatabases();
  }, []);

  const fetchCurrentDatabase = async () => {
    setLoadingCurrentDb(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/get_current_database/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setCurrentDb(response.data.current_database);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch current database');
    } finally {
      setLoadingCurrentDb(false);
    }
  };

  const fetchAllDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/list_all_databases/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setDatabases(response.data.databases);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch databases');
    } finally {
      setLoadingDatabases(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName) {
      setError('Please enter a database name');
      return;
    }
    setLoadingCreateDb(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/create_new_database/`,
        { db_name: newDbName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess(response.data.message);
      setError('');
      setNewDbName('');
      fetchAllDatabases();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create database');
      setSuccess('');
    } finally {
      setLoadingCreateDb(false);
    }
  };

  const handleSwitchDatabase = async (dbName) => {
    setLoadingSwitchDb(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/change_current_database/`,
        { db_name: dbName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess(response.data.message);
      setError('');
      setCurrentDb(response.data.current_database);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to switch database');
      setSuccess('');
    } finally {
      setLoadingSwitchDb(false);
    }
  };

  return (
    <Container className="settings-page my-4">
      <h2 className="mb-4">Settings</h2>

      {/* Create Database Section */}
      <Card className="settings-section mb-4">
        <Card.Header as="h4">Create New Database</Card.Header>
        <Card.Body>
          <Form.Group controlId="newDbName" className="mb-3">
            <Form.Control
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="Enter new database name"
              disabled={loadingCreateDb}
            />
          </Form.Group>
          <Button
            variant="success"
            className="w-100"
            onClick={handleCreateDatabase}
            disabled={loadingCreateDb}
          >
            {loadingCreateDb ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Creating...
              </>
            ) : (
              'Create Database'
            )}
          </Button>
        </Card.Body>
      </Card>

      {/* Databases Section */}
      <Card className="settings-section">
        <Card.Header as="h4">Databases</Card.Header>
        <Card.Body>
          {(loadingDatabases || loadingCurrentDb) && databases.length === 0 ? (
            <div className="text-center">
              <Spinner animation="border" role="status" aria-hidden="true" />
            </div>
          ) : (
            <ListGroup variant="flush">
              {databases.map((db) => (
                <ListGroup.Item
                  key={db.name}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    {db.name === currentDb && (
                      <span className="active-indicator me-2">●</span>
                    )}
                    <span>
                      {db.name} <small className="text-muted">({db.status})</small>
                    </span>
                  </div>
                  {db.name !== currentDb && db.name !== 'system' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSwitchDatabase(db.name)}
                      disabled={loadingSwitchDb || db.status !== 'online'}
                    >
                      {loadingSwitchDb ? (
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                      ) : (
                        'Switch'
                      )}
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Messages */}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {success && <Alert variant="success" className="mt-3">{success}</Alert>}
    </Container>
  );
};

export default SettingsPage;