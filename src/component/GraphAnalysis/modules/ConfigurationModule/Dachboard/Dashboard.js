import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Spinner,
  Table,
  Alert
} from 'react-bootstrap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Brush
} from 'recharts';
import './Dashboard.css';
import { BASE_URL_Backend } from '../../../Platforme/Urls';

const Dashboard = () => {
  // State for all data views
  const [stats, setStats] = useState({});
  const [nodeTypeCounts, setNodeTypeCounts] = useState({});
  const [affaireCountsByWilaya, setAffaireCountsByWilaya] = useState({});
  const [affaireCountsByDay, setAffaireCountsByDay] = useState({});
  const [topUnites, setTopUnites] = useState([]);
  const [relationshipTypeCounts, setRelationshipTypeCounts] = useState({});

  // Loading states
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingNodeTypes, setLoadingNodeTypes] = useState(false);
  const [loadingWilaya, setLoadingWilaya] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingTopUnites, setLoadingTopUnites] = useState(false);
  const [loadingRelationshipTypes, setLoadingRelationshipTypes] = useState(false);

  // Error states
  const [errorStats, setErrorStats] = useState('');
  const [errorNodeTypes, setErrorNodeTypes] = useState('');
  const [errorWilaya, setErrorWilaya] = useState('');
  const [errorDay, setErrorDay] = useState('');
  const [errorTopUnites, setErrorTopUnites] = useState('');
  const [errorRelationshipTypes, setErrorRelationshipTypes] = useState('');

  const token = localStorage.getItem('authToken');
  const { t } = useTranslation();

  // Format data for charts
  const formatWilayaData = () => {
    return Object.entries(affaireCountsByWilaya).map(([wilaya, count]) => ({
      name: wilaya,
      count: count
    }));
  };

  const formatDayData = () => {
    return Object.entries(affaireCountsByDay)
      .map(([date, count]) => ({
        date,
        count,
        parsedDate: parseDate(date), // Store parsed date for sorting
      }))
      .sort((a, b) => a.parsedDate - b.parsedDate) // Sort by parsed date
      .map(({ date, count }) => ({ date, count })); // Return only date and count
  };

  // Helper function to parse DD-MM-YYYY format
  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-based in JS Date
  };

  // Fetch data functions
  const fetchDatabaseStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axios.get(`${BASE_URL_Backend}/DashBoard_database_stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      setErrorStats(err.response?.data?.error || t('Failed to fetch database stats'));
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchNodeTypeCounts = async () => {
    setLoadingNodeTypes(true);
    try {
      const response = await axios.get(`${BASE_URL_Backend}/DashBoard_get_node_type_counts/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNodeTypeCounts(response.data.node_type_counts);
    } catch (err) {
      setErrorNodeTypes(err.response?.data?.error || t('Failed to fetch node type counts'));
    } finally {
      setLoadingNodeTypes(false);
    }
  };

  const fetchAffaireCountsByWilaya = async () => {
    setLoadingWilaya(true);
    try {
      const response = await axios.get(`${BASE_URL_Backend}/DashBoard_get_affaire_counts_by_wilaya/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAffaireCountsByWilaya(response.data.affaire_counts_by_wilaya);
    } catch (err) {
      setErrorWilaya(err.response?.data?.error || t('Failed to fetch affaire counts by wilaya'));
    } finally {
      setLoadingWilaya(false);
    }
  };

  const fetchAffaireCountsByDay = async () => {
    setLoadingDay(true);
    try {
      const response = await axios.get(`${BASE_URL_Backend}/DashBoard_get_affaire_counts_by_day/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAffaireCountsByDay(response.data.affaire_counts_by_day);
    } catch (err) {
      setErrorDay(err.response?.data?.error || t('Failed to fetch affaire counts by day'));
    } finally {
      setLoadingDay(false);
    }
  };

  const fetchTopUniteByAffaireCount = async () => {
    setLoadingTopUnites(true);
    try {
      const response = await axios.get(`${BASE_URL_Backend}/DashBoard_get_top_unite_by_affaire_count/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopUnites(response.data.top_unite_by_affaire_count);
    } catch (err) {
      setErrorTopUnites(err.response?.data?.error || t('Failed to fetch top unite by affaire count'));
    } finally {
      setLoadingTopUnites(false);
    }
  };

  const fetchRelationshipTypeCounts = async () => {
    setLoadingRelationshipTypes(true);
    try {
      const response = await axios.get(`${BASE_URL_Backend}/DashBoard_get_relationship_type_counts/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRelationshipTypeCounts(response.data.relationship_type_counts);
    } catch (err) {
      setErrorRelationshipTypes(err.response?.data?.error || t('Failed to fetch relationship type counts'));
    } finally {
      setLoadingRelationshipTypes(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDatabaseStats();
      fetchNodeTypeCounts();
      fetchAffaireCountsByWilaya();
      fetchAffaireCountsByDay();
      fetchTopUniteByAffaireCount();
      fetchRelationshipTypeCounts();
    }
  }, [token]);

  return (
    <Container fluid className="dashboard-container" style={{ 
        height: '100vh', 
        overflowY: 'auto',
        padding: '20px'
      }}>
      <h2 className="my-4" style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100, padding: '10px 0' }}>
        {t('Database Dashboard')}
      </h2>
      
      {/* Database Stats Card */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>{t('Database Statistics')}</Card.Header>
            <Card.Body>
              {loadingStats ? (
                <Spinner animation="border" />
              ) : errorStats ? (
                <Alert variant="danger">{errorStats}</Alert>
              ) : (
                <Row>
                  <Col md={6}>
                    <Table striped bordered hover>
                      <tbody>
                        <tr>
                          <td>{t('Total Nodes')}</td>
                          <td>{stats.nodes || 0}</td>
                        </tr>
                        <tr>
                          <td>{t('Total Relationships')}</td>
                          <td>{stats.relationships || 0}</td>
                        </tr>
                        <tr>
                          <td>{t('Labels')}</td>
                          <td>{stats.labels || 0}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <Table striped bordered hover>
                      <tbody>
                        <tr>
                          <td>{t('Relationship Types')}</td>
                          <td>{stats.relationship_types || 0}</td>
                        </tr>
                        <tr>
                          <td>{t('Property Keys')}</td>
                          <td>{stats.property_keys || 0}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

  
      {/* Additional Data Sections */}
      <Row className="mb-4">
        {/* Node Type Counts */}
        <Col md={6}>
          <Card>
            <Card.Header>{t('Node Type Counts')}</Card.Header>
            <Card.Body>
              {loadingNodeTypes ? (
                <Spinner animation="border" />
              ) : errorNodeTypes ? (
                <Alert variant="danger">{errorNodeTypes}</Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>{t('Node Type')}</th>
                      <th>{t('Count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(nodeTypeCounts).map(([type, count]) => (
                      <tr key={type}>
                        <td>{type}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Relationship Type Counts */}
        <Col md={6}>
          <Card>
            <Card.Header>{t('Relationship Type Counts')}</Card.Header>
            <Card.Body>
              {loadingRelationshipTypes ? (
                <Spinner animation="border" />
              ) : errorRelationshipTypes ? (
                <Alert variant="danger">{errorRelationshipTypes}</Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>{t('Relationship Type')}</th>
                      <th>{t('Count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(relationshipTypeCounts).map(([type, count]) => (
                      <tr key={type}>
                        <td>{type}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

    {/* Charts Row */}
    <Row className="mb-4">
        {/* Affaire Counts by Wilaya - Bar Chart */}
        <Col md={6}>
          <Card>
            <Card.Header>{t('Affaire Counts by Wilaya')}</Card.Header>
            <Card.Body>
              {loadingWilaya ? (
                <Spinner animation="border" />
              ) : errorWilaya ? (
                <Alert variant="danger">{errorWilaya}</Alert>
              )  : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={formatWilayaData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name={t('Affaire Count')} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Affaire Counts by Day - Line Chart */}
        <Col md={6}>
          <Card>
            <Card.Header>{t('Affaire Counts by Day')}</Card.Header>
            <Card.Body>
              {loadingDay ? (
                <Spinner animation="border" />
              ) : errorDay ? (
                <Alert variant="danger">{errorDay}</Alert>
              ) : (
                <div style={{ width: '100%', height: 500 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatDayData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ 
                          value: t('Count'), 
                          angle: -90, 
                          position: 'insideLeft',
                          fontSize: 14
                        }}
                      />
                      <Tooltip 
                        contentStyle={{
                          fontSize: 14,
                          padding: 10,
                          backgroundColor: '#fff',
                          border: '1px solid #ddd'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: 20,
                          fontSize: 14
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#82ca9d" 
                        name={t('Affaire Count')} 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                      <Brush 
                        dataKey="date"
                        height={30}
                        stroke="#8884d8"
                        travellerWidth={10}
                        startIndex={0}
                        endIndex={Math.min(30, formatDayData().length - 1)} // Show first 30 days by default
                        tickFormatter={(date) => {
                          // Format date for brush ticks (show only day/month)
                          const [day, month] = date.split('-');
                          return `${day}/${month}`;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>


      {/* Top Unites by Affaire Count */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Header>{t('Top 10 Unites by Affaire Count')}</Card.Header>
            <Card.Body>
              {loadingTopUnites ? (
                <Spinner animation="border" />
              ) : errorTopUnites ? (
                <Alert variant="danger">{errorTopUnites}</Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>{t('Unite')}</th>
                      <th>{t('Affaire Count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUnites.map((unite, index) => (
                      <tr key={index}>
                        <td>{unite.unite}</td>
                        <td>{unite.affaire_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;