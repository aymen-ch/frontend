import React, { useEffect, useState, memo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchNodeProperties, submitSearch } from '../../utils/Urls';
import { getNodeIcon, getNodeColor, LabelManager, createNode,createEdge,parsergraph } from '../../utils/Parser';

const SearchComponent = ({ selectedNodeType, nodes, edges, setNodes, setEdges, setNodeTypes }) => {
  const [nodeProperties, setNodeProperties] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [operations, setOperations] = useState({});
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState('');

  useEffect(() => {
    setNodeProperties([]);
    setFormValues({});
    setOperations({});

    const getNodeProperties = async () => {
      try {
        const properties = await fetchNodeProperties(selectedNodeType);
        console.log('Fetched properties:', properties); // Debug log
        setNodeProperties(properties);
      } catch (error) {
        setError('Error fetching properties.');
      }
    };
    if (selectedNodeType) {
      getNodeProperties();
    }
  }, [selectedNodeType]);

  useEffect(() => {
    if (!searchResult) return;
    console.log(searchResult)
    const graphData = parsergraph(searchResult);
    setNodes((prevNodes) => {
      return [...prevNodes, ...graphData.nodes];
    });
    setEdges((prevEdges) => [...prevEdges, ...graphData.edges]);
  }, [searchResult]);

  const handleInputChange = (e, propertyName, propertyType) => {
    let value = e.target.value;
    if (propertyType === 'int') {
      value = value ? parseInt(value, 10) : '';
    }
    setFormValues({ ...formValues, [propertyName]: value });
  };

  const handleOperationChange = (propertyName, operation) => {
    setOperations({ ...operations, [propertyName]: operation });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const searchPayload = {
        values: formValues,
        operations: operations
      };
      const result = await submitSearch(selectedNodeType, searchPayload);
      setSearchResult(result);
    } catch (error) {
      setError('Error during submission.');
    }
  };

  const intOperationOptions = ['=', '!=', '>', '<', '>=', '<='];
  const stringOperationOptions = [ '=', 'contains','startswith', 'endswith'];

  const getOperationOptions = (propertyType) => {
    if (propertyType === 'int') return intOperationOptions;
    if (propertyType === 'str') return stringOperationOptions;
    return [];
  };

  return (
    <div className="container mt-4">
      {error && <div className="alert alert-danger">{error}</div>}
  
      {nodeProperties
        .filter((property) => !property.name.startsWith('_'))
        .length > 0 && (
        <div className="card shadow-sm" style={{ border: 'none', borderRadius: '10px', backgroundColor: '#f1f3f5' }}>
          <div className="card-header" style={{ backgroundColor: '#346478', color: '#ffffff', border: 'none', borderRadius: '10px 10px 0 0' }}>
            <h5 className="card-title mb-0 d-flex align-items-center">
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '10px',
                  backgroundColor: getNodeColor(selectedNodeType),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <img
                  src={getNodeIcon(selectedNodeType)}
                  alt="Node Type Icon"
                  style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }}
                />
              </div>
              Properties for {selectedNodeType}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {nodeProperties
                .filter((property) => !property.name.startsWith('_'))
                .map((property, index) => {
                  console.log(`Property: ${property.name}, Type: ${property.type}`); // Debug log
                  const showOperations = property.type === 'int' || property.type === 'str';
                  return (
                    <div key={index} className="mb-3">
                      <label className="form-label fw-bold d-flex align-items-center">
                        {property.name} ({property.type}):
                      </label>
                      <div className="input-group">
                        {showOperations && (
                          <select
                            className="form-select"
                            style={{ 
                              maxWidth: property.type === 'int' ? '90px' : '120px', 
                              borderRadius: '5px 0 0 5px' 
                            }}
                            value={operations[property.name] || (property.type === 'int' ? '=' : 'contains')}
                            onChange={(e) => handleOperationChange(property.name, e.target.value)}
                          >
                            {getOperationOptions(property.type).map((op) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        )}
                        <input
                          type={property.type === 'int' ? 'number' : 'text'}
                          className="form-control"
                          style={{
                            borderRadius: showOperations ? '0 5px 5px 0' : '5px',
                            border: '1px solid #ced4da'
                          }}
                          onChange={(e) => handleInputChange(e, property.name, property.type)}
                        />
                      </div>
                    </div>
                  );
                })}
              <div className="d-grid">
                <button
                  type="submit"
                  className="btn"
                  style={{ backgroundColor: '#346478', color: '#ffffff', borderRadius: '5px' }}
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SearchComponent);