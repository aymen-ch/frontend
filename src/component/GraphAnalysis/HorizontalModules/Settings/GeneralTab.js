// src/components/GeneralTab.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../utils/Urls'; // Adjust path as needed
import { Card, Table, Spinner, Alert } from 'react-bootstrap';
import { useDatabase } from './DatabaseContext';

const GeneralTab = () => {
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
      setError(err.response?.data?.error || 'Failed to fetch database stats');
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <Card>
      <Card.Header as="h4">Database Statistics</Card.Header>
      <Card.Body>
        {loadingStats ? (
          <div className="text-center">
            <Spinner animation="border" role="status" aria-hidden="true" />
          </div>
        ) : stats ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nodes</td>
                <td>{stats.nodes}</td>
              </tr>
              <tr>
                <td>Relationships</td>
                <td>{stats.relationships}</td>
              </tr>
              <tr>
                <td>Labels</td>
                <td>{stats.labels}</td>
              </tr>
              <tr>
                <td>Relationship Types</td>
                <td>{stats.relationship_types}</td>
              </tr>
              <tr>
                <td>Property Keys</td>
                <td>{stats.property_keys}</td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <p>No statistics available.</p>
        )}
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Card.Body>
    </Card>
  );
};

export default GeneralTab;