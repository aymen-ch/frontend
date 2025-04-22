import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Tab, Nav } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import DatabaseManager from './DatabaseManager';
import SettingsTabs from './SettingsTabs';
import './SettingsPage.css';
import { DatabaseProvider } from './DatabaseContext';

const SettingsPage = () => {
  // const [currentDb, setCurrentDb] = useState('');
  // const [databases, setDatabases] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = localStorage.getItem('authToken');

  return (
    <DatabaseProvider>
    <Container fluid className="settings-page my-4">
      <h2 className="mb-4">Settings</h2>
      <Row>
        <Col md={6} className="database-section">
          <DatabaseManager
            // currentDb={currentDb}
            // setCurrentDb={setCurrentDb}
            // databases={databases}
            // setDatabases={setDatabases}
            error={error}
            setError={setError}
            success={success}
            setSuccess={setSuccess}
            token={token}
            baseUrl={BASE_URL}
          />
        </Col>
        <Col md={6} className="tabs-section">
          <SettingsTabs />
        </Col>
      </Row>
    </Container>
    </DatabaseProvider>
  );
};

export default SettingsPage;