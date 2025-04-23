// src/components/PersonProfileWindow.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Card, Container, Row, Col, Badge, Tabs, Tab, Spinner, Form } from 'react-bootstrap';
import { 
  XLg, 
  Dash, 
  Fullscreen, 
  FullscreenExit, 
  Person, 
  InfoCircle,
  GeoAlt,
  Clock
} from 'react-bootstrap-icons';
import Draggable from 'react-draggable';
import axios from 'axios';
import { BASE_URL } from '../../../../utils/Urls';
import './PersonProfileWindow.css';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush,
  PieChart, 
  Pie,
  Sector,
  Cell
} from 'recharts';

const CustomActiveShapePieChart = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(0);
  
    const onPieEnter = (_, index) => {
      setActiveIndex(index);
    };
  
    const renderActiveShape = (props) => {
      const RADIAN = Math.PI / 180;
      const { 
        cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value, name 
      } = props;
      const sin = Math.sin(-RADIAN * midAngle);
      const cos = Math.cos(-RADIAN * midAngle);
      const sx = cx + (outerRadius + 40) * cos;  // Increased to 40
      const sy = cy + (outerRadius + 40) * sin;  // Increased to 40
      const mx = cx + (outerRadius + 80) * cos;  // Increased to 80
      const my = cy + (outerRadius + 80) * sin;  // Increased to 80
      const ex = mx + (cos >= 0 ? 1 : -1) * 50;  // Increased to 50
      const ey = my;
      const textAnchor = cos >= 0 ? 'start' : 'end';
  
      return (
        <g>
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 30}  // Increased to 30
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
          />
          <path 
            d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} 
            stroke={fill} 
            fill="none" 
            strokeWidth={3}  // Increased to 3
          />
          <circle cx={ex} cy={ey} r={6} fill={fill} stroke="none" /> {/* Increased to 6 */}
          <text 
            x={ex + (cos >= 0 ? 1 : -1) * 12} 
            y={ey} 
            textAnchor={textAnchor} 
            fill="#111"  // Darker color
            fontSize={20}  // Increased to 20
            fontWeight="bold"
            fontFamily="Arial, sans-serif"  // Added font family
          >
            {`${name}`}
          </text>
          <text 
            x={ex + (cos >= 0 ? 1 : -1) * 12} 
            y={ey} 
            dy={30}  // Increased to 30
            textAnchor={textAnchor} 
            fill="#444"
            fontSize={18}  // Increased to 18
            fontFamily="Arial, sans-serif"
          >
            {`${value} (${(percent * 100).toFixed(2)}%)`}
          </text>
        </g>
      );
    };
  
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
    const pieData = data
      .sort((a, b) => b.count - a.count)
      // .slice(0, 6)
      .map(item => ({
        name: item.label,
        value: item.count
      }));
  
    return (
      <div style={{ 
        width: '100%', 
        height: '600px',  // Increased to 600px
        padding: '20px',  // Added padding
        backgroundColor: '#f8f9fa',  // Light background
        borderRadius: '10px'  // Rounded corners
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={140}  // Increased to 140
              outerRadius={200}  // Increased to 200
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              paddingAngle={5}  // Increased to 5
              animationDuration={500}  // Slower animation
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="#fff"  // White border
                  strokeWidth={2}  // Border width
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                <span style={{ fontSize: '16px' }}>{value}</span>, 
                <span style={{ fontSize: '16px' }}>{`${name} (${(props.payload.percent * 100).toFixed(2)}%)`}</span>
              ]}
              contentStyle={{
                fontSize: '16px',  // Increased to 16px
                padding: '15px',   // Increased padding
                border: '2px solid #ddd',  // Added border
                borderRadius: '5px',
                backgroundColor: '#fff'
              }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              wrapperStyle={{
                fontSize: '16px',  // Increased to 16px
                paddingLeft: '30px',  // Increased padding
                lineHeight: '24px'  // Added line height
              }}
              iconSize={20}  // Increased icon size
              formatter={(value, entry, index) => {
                const percent = (entry.payload.percent * 100).toFixed(2);
                return (
                  <span style={{ fontSize: '16px', display: 'inline-block', margin: '5px 0' }}>
                    {`${value}: ${entry.payload.value} (${percent}%)`}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

const Analyse_statistique = ({ data, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('distribution');
  const [rawValues, setRawValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [numBins, setNumBins] = useState(10);
  const [brushIndex, setBrushIndex] = useState({ startIndex: 0, endIndex: 9 });
  const nodeRef = useRef(null);
  const { selectedCentralityAttribute, selectedGroup } = data;
  const token = localStorage.getItem('authToken');

  // Calculate binned data
  const binnedData = useMemo(() => {
    if (rawValues.length === 0) return [];

    const values = rawValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (values.length === 0) return [];

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const binSize = (maxVal - minVal) / numBins;

    // Create bins
    const bins = Array(numBins).fill().map((_, i) => {
      const binStart = minVal + (i * binSize);
      const binEnd = binStart + binSize;
      return {
        name: i+1,
        binStart,
        binEnd,
        count: 0,
        label: `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`
      };
    });

    // Count values in each bin
    values.forEach(value => {
      if (value === maxVal) {
        bins[numBins - 1].count++;
      } else {
        const binIndex = Math.floor((value - minVal) / binSize);
        if (binIndex >= 0 && binIndex < numBins) {
          bins[binIndex].count++;
        }
      }
    });

    return bins;
  }, [rawValues, numBins]);

  // Handle brush change
  const handleBrushChange = ({ startIndex, endIndex }) => {
    setBrushIndex({ startIndex, endIndex });
  };

  // Get the subset of data based on brush selection
  const brushedData = useMemo(() => {
    return binnedData.slice(brushIndex.startIndex, brushIndex.endIndex + 1);
  }, [binnedData, brushIndex]);

  useEffect(() => {
    const fetchAttributeValues = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(BASE_URL + '/get_attribute_values_for_node_type/', {
          params: {
            selectedGroup: selectedGroup,
            selectedCentralityAttribute: selectedCentralityAttribute
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setRawValues(response.data.values);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (selectedGroup && selectedCentralityAttribute) {
      fetchAttributeValues();
    }
  }, [selectedGroup, selectedCentralityAttribute, token]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const calculateStatistics = () => {
    const values = rawValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return {
      count: values.length,
      unique: new Set(values).size,
      mean: parseFloat(mean.toFixed(4)),
      median: parseFloat(median.toFixed(4)),
      min: parseFloat(min.toFixed(4)),
      max: parseFloat(max.toFixed(4)),
      stdDev: parseFloat(Math.sqrt(
        values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / values.length
      ).toFixed(4))
    };
  };

  const stats = calculateStatistics();

  const windowContent = (
    <Card className={`profile-window ${isMaximized ? 'maximized' : ''} shadow`}>
      <Card.Header className="window-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <Person className="me-2" />
          <span>Statistical Analysis: {selectedGroup} - {selectedCentralityAttribute}</span>
        </div>
        <div className="window-controls">
          <Button variant="link" className="control-button p-0 me-2" title="Minimize">
            <Dash size={16} color="white" />
          </Button>
          <Button 
            variant="link" 
            className="control-button p-0 me-2" 
            onClick={toggleMaximize} 
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <FullscreenExit size={16} color="white" /> : <Fullscreen size={16} color="white" />}
          </Button>
          <Button 
            variant="link" 
            className="control-button p-0" 
            onClick={onClose} 
            title="Close"
          >
            <XLg size={16} color="white" />
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="distribution" title="Distribution">
                <Form.Group controlId="numBins" className="mb-3">
                  <Form.Label>Number of bins: {numBins}</Form.Label>
                  <Form.Range 
                    min="5" 
                    max="50" 
                    value={numBins} 
                    onChange={(e) => setNumBins(parseInt(e.target.value))}
                  />
                </Form.Group>
                
                <div style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart
                      data={brushedData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="label" 
                        label={{ value: `${selectedCentralityAttribute} (binned)`, position: 'insideBottomRight', offset: -10 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value) => [value, 'Count']}
                        labelFormatter={(label) => `Range: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Frequency" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ height: 80 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={binnedData}
                        margin={{
                          top: 0,
                          right: 30,
                          left: 20,
                          bottom: 0,
                        }}
                      >
                        <XAxis 
                          dataKey="name" 
                          scale="point" 
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis hide={true} domain={[0, 'dataMax']} />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" name="Frequency" />
                        <Brush
                          dataKey="name"
                          height={30}
                          stroke="#8884d8"
                          startIndex={brushIndex.startIndex}
                          endIndex={brushIndex.endIndex}
                          onChange={handleBrushChange}
                          alwaysShowText={true}
                          travellerWidth={10}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Tab>
              <Tab eventKey="statistics" title="Statistics">
                {stats && (
                  <div className="mt-3">
                    <h5>Summary Statistics</h5>
                    <table className="table table-bordered">
                      <tbody>
                        <tr>
                          <th>Total Values</th>
                          <td>{stats.count}</td>
                        </tr>
                        <tr>
                          <th>Unique Values</th>
                          <td>{stats.unique}</td>
                        </tr>
                        <tr>
                          <th>Minimum</th>
                          <td>{stats.min}</td>
                        </tr>
                        <tr>
                          <th>Maximum</th>
                          <td>{stats.max}</td>
                        </tr>
                        <tr>
                          <th>Mean (Average)</th>
                          <td>{stats.mean}</td>
                        </tr>
                        <tr>
                          <th>Median</th>
                          <td>{stats.median}</td>
                        </tr>
                        <tr>
                          <th>Standard Deviation</th>
                          <td>{stats.stdDev}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Tab>
              <Tab eventKey="pieChart" title="Distribution Pie">
                <div style={{ height: 400 }}>
                  <CustomActiveShapePieChart data={binnedData} />
                </div>
              </Tab>
            </Tabs>
          </>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="profile-window-overlay">
      {isMaximized ? (
        windowContent
      ) : (
        <Draggable nodeRef={nodeRef} handle=".window-header" bounds="parent">
          <div ref={nodeRef}>
            {windowContent}
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default Analyse_statistique;