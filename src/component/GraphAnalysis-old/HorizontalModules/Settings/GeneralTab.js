import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/Urls'; // Adjust path as needed
import { Card, Table, Spinner, Alert } from 'react-bootstrap';
import { useDatabase } from './DatabaseContext';
import { useTranslation } from 'react-i18next'; // Importing the translation hook


const GeneralTab = () => {
  const { t } = useTranslation(); // Initialize the translation hook
  const { currentDb, databases } = useDatabase();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchDatabaseStats();
  }, []);
  
  useEffect(() => {
    fetchDatabaseStats();
  }, [currentDb]);

  const fetchDatabaseStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get(`${BASE_URL}/database_stats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setStats(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || t('Failed to fetch database stats'));
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <Card>
      <Card.Header as="h4">{t('Database Statistics')}</Card.Header>
      <Card.Body>
        {loadingStats ? (
          <div className="text-center">
            <Spinner animation="border" role="status" aria-hidden="true" />
          </div>
        ) : stats ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>{t('Metric')}</th>
                <th>{t('Count')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('Nodes')}</td>
                <td>{stats.nodes}</td>
              </tr>
              <tr>
                <td>{t('Relationships')}</td>
                <td>{stats.relationships}</td>
              </tr>
              <tr>
                <td>{t('Labels')}</td>
                <td>{stats.labels}</td>
              </tr>
              <tr>
                <td>{t('Relationship Types')}</td>
                <td>{stats.relationship_types}</td>
              </tr>
              <tr>
                <td>{t('Property Keys')}</td>
                <td>{stats.property_keys}</td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <p>{t('No statistics available.')}</p>
        )}
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Card.Body>
    </Card>
  );
};

export default GeneralTab;
