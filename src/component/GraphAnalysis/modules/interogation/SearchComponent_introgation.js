import React, { useEffect, useState, memo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchNodeProperties, submitSearch } from '../../utils/Urls'; // Import utility functions
import { getNodeIcon, getNodeColor, LabelManager, createNode } from '../../utils/Parser';// Ensure getNodeColor is imported


const SearchComponent = ({ selectedNodeType, nodes, edges, setNodes, setEdges, setNodeTypes }) => {
  const [nodeProperties, setNodeProperties] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState('');

  useEffect(() => {
    setNodeProperties([]);
    setFormValues({});

    const getNodeProperties = async () => {
      try {
        const properties = await fetchNodeProperties(selectedNodeType);
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
    if (!searchResult || typeof searchResult !== 'object' || !searchResult.results) return;
    const nodes1 = [];
    // Iterate over each object in the searchResult.results array
    console.log(searchResult)
    searchResult.results.forEach((object) => {
      nodes1.push(createNode(object, selectedNodeType, object,false));
    });
    setNodes([...nodes, ...nodes1]);
  }, [searchResult]);

  const handleInputChange = (e, propertyName, propertyType) => {
    let value = e.target.value;
    if (propertyType === 'int') {
      value = value ? parseInt(value, 10) : '';
    }
    setFormValues({ ...formValues, [propertyName]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await submitSearch(selectedNodeType, formValues);
      setSearchResult(result);
    } catch (error) {
      setError('Error during submission.');
    }
  };

  return (
    <div className="container mt-4">
      {error && <div className="alert alert-danger">{error}</div>}
  
      {/* Filter out properties that start with '_' */}
      {nodeProperties
        .filter((property) => !property.name.startsWith('_')) // Exclude properties starting with '_'
        .length > 0 && (
        <div className="card shadow-sm" style={{ border: 'none', borderRadius: '10px', backgroundColor: '#f1f3f5' }}>
          <div className="card-header" style={{ backgroundColor: '#346478', color: '#ffffff', border: 'none', borderRadius: '10px 10px 0 0' }}>
            <h5 className="card-title mb-0 d-flex align-items-center">
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '10px',
                  backgroundColor: getNodeColor(selectedNodeType), // Apply color here
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%', // Make it circular
                }}
              >
                <img
                  src={getNodeIcon(selectedNodeType)}
                  alt="Node Type Icon"
                  style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} // Ensure icon is visible on colored background
                />
              </div>
              Properties for {selectedNodeType}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {nodeProperties
                .filter((property) => !property.name.startsWith('_')) // Exclude properties starting with '_'
                .map((property, index) => (
                  <div key={index} className="mb-3">
                    <label className="form-label fw-bold d-flex align-items-center">
                      {property.name} ({property.type}):
                    </label>
                    <input
                      type={property.type === 'int' ? 'number' : 'text'}
                      className="form-control"
                      style={{ borderRadius: '5px', border: '1px solid #ced4da' }}
                      onChange={(e) => handleInputChange(e, property.name, property.type)}
                    />
                  </div>
                ))}
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