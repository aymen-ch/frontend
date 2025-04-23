import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/Urls';
import { useDatabase } from './DatabaseContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDatabase, faSync, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import {
  Card,
  Form,
  Button,
  ListGroup,
  Alert,
} from 'react-bootstrap';
import './DatabaseManager.css'; // Optional: For custom styles

const DatabaseManager = ({
  error,
  setError,
  success,
  setSuccess,
  token,
  baseUrl,
}) => {
  const [newDbName, setNewDbName] = useState('');
  const [loadingCurrentDb, setLoadingCurrentDb] = useState(false);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [loadingCreateDb, setLoadingCreateDb] = useState(false);
  const [loadingSwitchDb, setLoadingSwitchDb] = useState(false);
  const [loadingDeleteDb, setLoadingDeleteDb] = useState(false);
  const { currentDb, setCurrentDb, databases, setDatabases } = useDatabase();

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
      setDatabases((prevDatabases) => [
        ...prevDatabases,
        { name: newDbName, status: 'online' },
      ]);
      setNewDbName('');
      setTimeout(() => {
        fetchAllDatabases();
      }, 1000);
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

  const handleDeleteDatabase = async (dbName) => {
    if (!window.confirm(`Are you sure you want to delete the database "${dbName}"? This action cannot be undone.`)) {
      return;
    }
    setLoadingDeleteDb(true);
    try {
      const response = await axios.delete(
        `${BASE_URL}/delete_database/`,
        {
          data: { db_name: dbName },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess(response.data.message);
      setError('');
      setDatabases((prevDatabases) => prevDatabases.filter((db) => db.name !== dbName));
      setTimeout(() => {
        fetchAllDatabases();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete database');
      setSuccess('');
    } finally {
      setLoadingDeleteDb(false);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header as="h4">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create New Database
        </Card.Header>
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
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="me-2"
                />
                Creating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Create Database
              </>
            )}
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header as="h4">
          <FontAwesomeIcon icon={faDatabase} className="me-2" />
          Databases
        </Card.Header>
        <Card.Body>
          {(loadingDatabases || loadingCurrentDb) && databases.length === 0 ? (
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
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
                      <FontAwesomeIcon icon={faDatabase} className="me-2" />
                      {db.name}{' '}
                      <small className="text-muted">({db.status})</small>
                    </span>
                  </div>
                  <div>
                    {db.name !== currentDb && db.name !== 'system' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSwitchDatabase(db.name)}
                          disabled={loadingSwitchDb || db.status !== 'online'}
                          className="me-2"
                        >
                          {loadingSwitchDb ? (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              spin
                            />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faSync} className="me-1" />
                              Switch
                            </>
                          )}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteDatabase(db.name)}
                          disabled={loadingDeleteDb || db.status !== 'online'}
                        >
                          {loadingDeleteDb ? (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              spin
                            />
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faTrash} className="me-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {success && <Alert variant="success" className="mt-3">{success}</Alert>}
    </>
  );
};

export default DatabaseManager;