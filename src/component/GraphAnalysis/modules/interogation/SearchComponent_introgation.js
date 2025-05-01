import React, { useEffect, useState, memo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchNodeProperties, submitSearch } from '../../utils/Urls';
import { getNodeIcon, getNodeColor, LabelManager, createNode, createEdge, parsergraph } from '../../utils/Parser';
import { useTranslation } from 'react-i18next'; // Import the translation hook

const SearchComponent = ({ selectedNodeType, nodes, edges, setNodes, setEdges, setNodeTypes }) => {
  const [nodeProperties, setNodeProperties] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [operations, setOperations] = useState({});
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState('');
  
  const { t } = useTranslation(); // Initialize the translation hook

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
        setError(t('Error fetching properties.'));
      }
    };
    if (selectedNodeType) {
      getNodeProperties();
    }
  }, [selectedNodeType, t]);

  useEffect(() => {
    if (!searchResult) return;
    console.log(searchResult);
    const graphData = parsergraph(searchResult);
    setNodes((prevNodes) => {
      return [...prevNodes, ...graphData.nodes];
    });
    setEdges((prevEdges) => [...prevEdges, ...graphData.edges]);
  }, [searchResult, setNodes, setEdges]);

  const handleInputChange = (e, propertyName, propertyType) => {
    let value = e.target.value;
    if (propertyType === 'int') {
      value = value ? parseInt(value, 10) : '';
    } else if (propertyName.toLowerCase() === 'date') {
      // Convert YYYY-MM-DD to MM-DD-YYYY
      if (value) {
        const [year, month, day] = value.split('-');
        value = `${month}-${day}-${year}`;
      }
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
        operations: operations,
      };
      const result = await submitSearch(selectedNodeType, searchPayload);
      setSearchResult(result);
    } catch (error) {
      setError(t('Error during submission.'));
    }
  };

  const intOperationOptions = ['=', '!=', '>', '<', '>=', '<='];
  const stringOperationOptions = ['=', 'contains', 'startswith', 'endswith'];
  const dateOperationOptions = ['=', '!=', '>', '<', '>=', '<='];

  const getOperationOptions = (propertyType, propertyName) => {
    if (propertyName.toLowerCase() === 'date') return dateOperationOptions;
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
              {t('Properties for')} {selectedNodeType}
            </h5>
          </div>
          <div className="card-body">
          <form onSubmit={handleSubmit}>
  {nodeProperties
    .filter((property) => !property.name.startsWith('_'))
    .map((property, index) => {
      const isDate = property.name.toLowerCase() === 'date';
      const showOp = property.type === 'int' || property.type === 'str' || isDate;

      return (
        <div className="d-flex align-items-center mb-2" key={index} style={{ gap: '8px' }}>
          <label className="form-label mb-0 fw-semibold small" style={{ minWidth: '140px' }}>
            {property.name} ({isDate ? t('date') : t(property.type)}):
          </label>

          {showOp && (
            <select
              className="form-select form-select-sm"
              style={{ width: '90px' }}
              value={operations[property.name] || (isDate || property.type === 'int' ? '=' : 'contains')}
              onChange={(e) => handleOperationChange(property.name, e.target.value)}
            >
              {getOperationOptions(property.type, property.name).map((op) => (
                <option key={op} value={op}>{t(op)}</option>
              ))}
            </select>
          )}

          <input
            type={isDate ? 'date' : property.type === 'int' ? 'number' : 'text'}
            className="form-control form-control-sm"
            style={{ flex: 1 }}
            onChange={(e) => handleInputChange(e, property.name, isDate ? 'date' : property.type)}
          />
        </div>
      );
    })}

  <div className="d-grid mt-3">
    <button
      type="submit"
      className="btn btn-sm text-white"
      style={{ backgroundColor: '#346478', borderRadius: '5px' }}
    >
      {t('Search')}
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
