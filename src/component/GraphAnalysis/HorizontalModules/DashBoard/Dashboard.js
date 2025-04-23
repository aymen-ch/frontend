import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Line
} from 'recharts';
import './Dashboard.css';
import { BASE_URL } from '../../utils/Urls';

const Dashboard = () => {
  // State for all data views
  const [stats, setStats] = useState({});
  const [nodeTypeCounts, setNodeTypeCounts] = useState({});
  const [affaireCountsByWilaya, setAffaireCountsByWilaya] = useState({});
  const [affaireCountsByDay, setAffaireCountsByDay] = useState({});
  const [topUnites, setTopUnites] = useState([]);
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingNodeTypes, setLoadingNodeTypes] = useState(false);
  const [loadingWilaya, setLoadingWilaya] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingTopUnites, setLoadingTopUnites] = useState(false);
  
  // Error states
  const [errorStats, setErrorStats] = useState('');
  const [errorNodeTypes, setErrorNodeTypes] = useState('');
  const [errorWilaya, setErrorWilaya] = useState('');
  const [errorDay, setErrorDay] = useState('');
  const [errorTopUnites, setErrorTopUnites] = useState('');

  const token = localStorage.getItem('authToken');

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
      const response = await axios.get(`${BASE_URL}/DashBoard_database_stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      setErrorStats(err.response?.data?.error || 'Failed to fetch database stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchNodeTypeCounts = async () => {
    setLoadingNodeTypes(true);
    try {
      const response = await axios.get(`${BASE_URL}/DashBoard_get_node_type_counts/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNodeTypeCounts(response.data.node_type_counts);
    } catch (err) {
      setErrorNodeTypes(err.response?.data?.error || 'Failed to fetch node type counts');
    } finally {
      setLoadingNodeTypes(false);
    }
  };

  const fetchAffaireCountsByWilaya = async () => {
    setLoadingWilaya(true);
    try {
      const response = await axios.get(`${BASE_URL}/DashBoard_get_affaire_counts_by_wilaya/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('response' , response)
      setAffaireCountsByWilaya(response.data.affaire_counts_by_wilaya);
    } catch (err) {
      setErrorWilaya(err.response?.data?.error || 'Failed to fetch affaire counts by wilaya');
    } finally {
      setLoadingWilaya(false);
    }
  };

  const fetchAffaireCountsByDay = async () => {
    setLoadingDay(true);
    try {
      const response = await axios.get(`${BASE_URL}/DashBoard_get_affaire_counts_by_day/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAffaireCountsByDay(response.data.affaire_counts_by_day);
    } catch (err) {
      setErrorDay(err.response?.data?.error || 'Failed to fetch affaire counts by day');
    } finally {
      setLoadingDay(false);
    }
  };

  const fetchTopUniteByAffaireCount = async () => {
    setLoadingTopUnites(true);
    try {
      const response = await axios.get(`${BASE_URL}/DashBoard_get_top_unite_by_affaire_count/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopUnites(response.data.top_unite_by_affaire_count);
    } catch (err) {
      setErrorTopUnites(err.response?.data?.error || 'Failed to fetch top unite by affaire count');
    } finally {
      setLoadingTopUnites(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDatabaseStats();
      fetchNodeTypeCounts();
      fetchAffaireCountsByWilaya();
      fetchAffaireCountsByDay();
      fetchTopUniteByAffaireCount();
    }
  }, [token]);

  return (
    <Container fluid className="dashboard-container" style={{ 
        height: '100vh', 
        overflowY: 'auto',
        padding: '20px'
      }}>
        <h2 className="my-4" style={{ position: 'sticky', top: 0, background: 'white', zIndex: 100, padding: '10px 0' }}>
          Database Dashboard
        </h2>
      
      {/* Database Stats Card */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Database Statistics</Card.Header>
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
                          <td>Total Nodes</td>
                          <td>{stats.nodes || 0}</td>
                        </tr>
                        <tr>
                          <td>Total Relationships</td>
                          <td>{stats.relationships || 0}</td>
                        </tr>
                        <tr>
                          <td>Labels</td>
                          <td>{stats.labels || 0}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <Table striped bordered hover>
                      <tbody>
                        <tr>
                          <td>Relationship Types</td>
                          <td>{stats.relationship_types || 0}</td>
                        </tr>
                        <tr>
                          <td>Property Keys</td>
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

      {/* Charts Row */}
      <Row className="mb-4">
        {/* Affaire Counts by Wilaya - Bar Chart */}
        <Col md={6}>
          <Card>
            <Card.Header>Affaire Counts by Wilaya</Card.Header>
            <Card.Body>
              {loadingWilaya ? (
                <Spinner animation="border" />
              ) : errorWilaya ? (
                <Alert variant="danger">{errorWilaya}</Alert>
              ) : (
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
                    <Bar dataKey="count" fill="#8884d8" name="Affaire Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Affaire Counts by Day - Line Chart */}
    {/* Affaire Counts by Day - Line Chart */}
<Col md={6}>
  <Card>
    <Card.Header>Affaire Counts by Day</Card.Header>
    <Card.Body>
      {loadingDay ? (
        <Spinner animation="border" />
      ) : errorDay ? (
        <Alert variant="danger">{errorDay}</Alert>
      ) : (
        <div className="chart-scroll-container">
          <ResponsiveContainer width={formatDayData().length * 100} height={400}>
            <LineChart
              data={formatDayData()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#82ca9d" 
                name="Affaire Count" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
            <Card.Header>Node Type Counts</Card.Header>
            <Card.Body>
              {loadingNodeTypes ? (
                <Spinner animation="border" />
              ) : errorNodeTypes ? (
                <Alert variant="danger">{errorNodeTypes}</Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Node Type</th>
                      <th>Count</th>
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

        {/* Top Unites by Affaire Count */}
        <Col md={6}>
          <Card>
            <Card.Header>Top 10 Unites by Affaire Count</Card.Header>
            <Card.Body>
              {loadingTopUnites ? (
                <Spinner animation="border" />
              ) : errorTopUnites ? (
                <Alert variant="danger">{errorTopUnites}</Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Unite</th>
                      <th>Affaire Count</th>
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