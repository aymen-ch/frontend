import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
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
import { useTranslation } from 'react-i18next';
import './DatabaseManager.css';


////******
//  This component is responsible for : 
//  1- creating a new database 
//  2- changing the current database
//  3- deleting a database
// 
// 
// 
// 
//  */

const DatabaseManager = ({
  error,
  setError,
  success,
  setSuccess,
  token,
  baseUrl,
}) => {
  const { t } = useTranslation();
  const [newDbName, setNewDbName] = useState('');
  const [loadingCurrentDb, setLoadingCurrentDb] = useState(false);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [loadingCreateDb, setLoadingCreateDb] = useState(false);
  const [loadingSwitchDb, setLoadingSwitchDb] = useState(false);
  const [loadingDeleteDb, setLoadingDeleteDb] = useState(false); 
  const [loadingRefresh, setLoadingRefresh] = useState(false); // New state for refresh button
  const { currentDb, setCurrentDb, databases, setDatabases } = useDatabase();

  useEffect(() => {
    fetchCurrentDatabase();
    fetchAllDatabases();
  }, []);

  const fetchCurrentDatabase = async () => { //// Get the current database that  i am currently connecting at form bakend
    setLoadingCurrentDb(true);
    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/get_current_database/`,
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
      setError(err.response?.data?.error || t('databaseManager.errorFetchCurrentDb'));
    } finally {
      setLoadingCurrentDb(false);
    }
  };

  const fetchAllDatabases = async () => { /// Get all the dataBases that exist in the neo4j driver
    setLoadingDatabases(true);
    setLoadingRefresh(true); // Set refresh loading state
    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/list_all_databases/`,
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
      setError(err.response?.data?.error || t('databaseManager.errorFetchDatabases'));
    } finally {
      setLoadingDatabases(false);
      setLoadingRefresh(false); // Clear refresh loading state
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName) {
      setError(t('databaseManager.errorNoDbName'));
      return;
    }
    setLoadingCreateDb(true);
    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/create_new_database/`,
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
      setError(err.response?.data?.error || t('databaseManager.errorCreateDb'));
      setSuccess('');
    } finally {
      setLoadingCreateDb(false);
    }
  };

  const handleSwitchDatabase = async (dbName) => {
    setLoadingSwitchDb(true);
    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/change_current_database/`,
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
      setError(err.response?.data?.error || t('databaseManager.errorSwitchDb'));
      setSuccess('');
    } finally {
      setLoadingSwitchDb(false);
    }
  };

  const handleDeleteDatabase = async (dbName) => {
    if (!window.confirm(t('databaseManager.confirmDeleteDb') + ` "${dbName}"? ${t('databaseManager.actionIrreversible')}`)) {
      return;
    }
    setLoadingDeleteDb(true);
    try {
      const response = await axios.delete(
        `${BASE_URL_Backend}/delete_database/`,
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
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('databaseManager.errorDeleteDb'));
      setSuccess('');
    } finally {
      setLoadingDeleteDb(false);
    }
  };

  const handleRefreshDatabases = async () => {
    await fetchAllDatabases(); // Trigger re-fetch of databases
    await fetchCurrentDatabase(); // Trigger re-fetch of current database
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header as="h4">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          {t('databaseManager.createNewDb')}
        </Card.Header>
        <Card.Body>
          <Form.Group controlId="newDbName" className="mb-3">
            <Form.Control
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder={t('databaseManager.enterDbName')}
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
                {t('databaseManager.creating')}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                {t('databaseManager.createDb')}
              </>
            )}
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header as="h4" className="d-flex justify-content-between align-items-center">
          <span>
            <FontAwesomeIcon icon={faDatabase} className="me-2" />
            {t('databaseManager.databases')}
          </span>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleRefreshDatabases}
            disabled={loadingRefresh || loadingDatabases}
            title={t('databaseManager.refreshDatabases')}
          >
            {loadingRefresh ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSync} className="me-1" />
            )}
            <span className="ms-1">{t('databaseManager.refresh')}</span>
          </Button>
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
                              {t('databaseManager.switch')}
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
                              {t('databaseManager.delete')}
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

      {error && (
        <Alert variant="danger" className="mt-3 d-flex align-items-center">
          <span className="me-2 fs-5">⚠️</span>
          <span>{error}</span>
        </Alert>
      )}
      {success && <Alert variant="success" className="mt-3">{success}</Alert>}
    </>
  );
};

export default DatabaseManager;