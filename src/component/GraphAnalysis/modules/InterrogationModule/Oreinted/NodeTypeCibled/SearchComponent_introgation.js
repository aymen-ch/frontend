import React, { useEffect, useState, memo } from 'react';
import { getNodeIcon, getNodeColor, parsergraph } from '../../../VisualisationModule/Parser';
import { useTranslation } from 'react-i18next';
import { getAuthToken,BASE_URL_Backend } from '../../../../Platforme/Urls'
import axios from 'axios';
const SearchComponent = ({ selectedNodeType, setNodes, setEdges }) => {
  const [nodeProperties, setNodeProperties] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [operations, setOperations] = useState({});
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [remainingNodes, setRemainingNodes] = useState([]);
  const [remainingEdges, setRemainingEdges] = useState([]);
  const [showLoadMore, setShowLoadMore] = useState(false);

  const { t } = useTranslation();


   const fetchNodeProperties = async (nodeType) => {
  const token = getAuthToken();
  try {
    const response = await axios.get(`${BASE_URL_Backend}/node-types/properties_types/`, {
      params: { node_type: nodeType },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return response.data.properties;
    } else {
      throw new Error('Error fetching properties');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


// Utility function to submit search form
 const submitSearch = async (nodeType, formValues) => {
  const token = getAuthToken();
  const filteredFormValues = Object.fromEntries(
    Object.entries(formValues).filter(([key, value]) => value !== '' && value !== null)
  );

  const payload = {
    node_type: nodeType,
    properties: { ...filteredFormValues },
  };

  try {
    const response = await axios.post(
      `${BASE_URL_Backend}/search-nodes/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Submission failed.');
    }
  } catch (error) {
    console.error('Error during submission:', error);
    throw error;
  }
};


  useEffect(() => {
    setNodeProperties([]);
    setFormValues({});
    setOperations({});
    setRemainingNodes([]);
    setRemainingEdges([]);
    setShowLoadMore(false);
    setFeedbackMessage('');
    const getNodeProperties = async () => {
      try {
        const properties = await fetchNodeProperties(selectedNodeType);
        setNodeProperties(properties);
      } catch (error) {
        setError(t('Error retrieving properties.'));
      }
    };
    if (selectedNodeType) {
      getNodeProperties();
    }
  }, [selectedNodeType, t]);

  useEffect(() => {
    if (!searchResult) return;
    const graphData = parsergraph(searchResult);

    if (graphData.nodes.length === 0) {
    setFeedbackMessage(t('⚠️ No results found for the search criteria.'));
    }
    else if (graphData.nodes.length > 1000) {
      // Keep first 1000 nodes/edges displayed
      const firstNodes = graphData.nodes.slice(0, 1000);
      const firstEdges = graphData.edges.filter(edge =>
        firstNodes.some(node => node.id === edge.source) &&
        firstNodes.some(node => node.id === edge.target)
      );
      // Store remaining nodes and edges for later
      const extraNodes = graphData.nodes.slice(1000);
      const extraEdges = graphData.edges.filter(edge =>
        !firstNodes.some(node => node.id === edge.source) ||
        !firstNodes.some(node => node.id === edge.target)
      );

      setNodes((prevNodes) => [...prevNodes, ...firstNodes]);
      setEdges((prevEdges) => [...prevEdges, ...firstEdges]);

      setRemainingNodes(extraNodes);
      setRemainingEdges(extraEdges);

      setShowLoadMore(true);
      setFeedbackMessage(
        t(
          '⚠️ The result contains more than 1000 nodes; only the first 1000 are displayed. You can add the others manually or activate the WebGL option for better performance.'
        )
      );
    } else {
      setNodes((prevNodes) => [...prevNodes, ...graphData.nodes]);
      setEdges((prevEdges) => [...prevEdges, ...graphData.edges]);
      setFeedbackMessage(t('✅ Successfully retrieved the result.'));
      setShowLoadMore(false);
      setRemainingNodes([]);
      setRemainingEdges([]);
    }
  }, [searchResult, setNodes, setEdges, t]);

  const handleLoadMore = () => {
    setNodes((prevNodes) => [...prevNodes, ...remainingNodes]);
    setEdges((prevEdges) => [...prevEdges, ...remainingEdges]);
    setShowLoadMore(false);
    setFeedbackMessage(t('✅ All remaining nodes have been added.'));
    setRemainingNodes([]);
    setRemainingEdges([]);
  };

  const handleInputChange = (e, propertyName, propertyType) => {
    let value = e.target.value;
    if (propertyType === 'int') {
      value = value ? parseInt(value, 10) : '';
    } else if (propertyType === 'float') {
      value = value ? parseFloat(value) : '';
    } else if (propertyType === 'date') {
      if (value) {
        const [year, month, day] = value.split('-');
        value = `${month}-${day}-${year}`;
      }
    }

    setFormValues({ ...formValues, [propertyName]: value });

    // Clear feedback message if input is emptied
    if (value === '' || value === null) {
      setFeedbackMessage('');
      setShowLoadMore(false);
      setRemainingNodes([]);
      setRemainingEdges([]);
    }
  };

  const handleOperationChange = (e, propertyName) => {
    setOperations({ ...operations, [propertyName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMessage('');
    setShowLoadMore(false);
    setRemainingNodes([]);
    setRemainingEdges([]);
    setError(null);

    // Validate that at least one property is filled
    const hasValidProperty = Object.values(formValues).some(
      (value) => value !== '' && value !== null && value !== undefined
    );

    if (!hasValidProperty) {
      setError(t('searchComponent.errorNoProperties'));
      return;
    }
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
    const type = propertyType?.toLowerCase();
    if (propertyName.toLowerCase().includes('date')) return dateOperationOptions;
    if (['int', 'float'].includes(type)) return intOperationOptions;
    if (type === 'str' || type === 'string') return stringOperationOptions;
    return [];
  };
  return (
    <div className="flex-1">
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded">{error}</div>}

      {nodeProperties.filter((property) => !property.name.startsWith('_')).length > 0 && (
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="bg-blue-100 text-blue-900 rounded-t flex items-center px-3 py-2">
            <div
              className="w-6 h-6 flex items-center justify-center rounded-full mr-2"
              style={{ backgroundColor: getNodeColor(selectedNodeType) }}
            >
              <img
                src={getNodeIcon(selectedNodeType)}
                alt="Node Type Icon"
                className="w-4 h-4 brightness-0 invert"
              />
            </div>
            <h6 className="text-sm font-semibold m-0">
              {t('Properties for')} {selectedNodeType}
            </h6>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              {nodeProperties
                .filter((property) => !property.name.startsWith('_'))
                .map((property, index) => {
                  const propertyName = property.name;
                  const rawType = property.type?.toLowerCase();
                  const isDate = propertyName.toLowerCase().includes('date');
                  const showOp = ['int', 'float', 'str', 'string'].includes(rawType) || isDate;

                  return (
                    <div key={index} className="flex items-center px-3 py-1 gap-2">
                      <label className="text-sm font-medium min-w-[140px]">
                        {propertyName} ({isDate ? t('date') : t(rawType)}):
                      </label>
                      {showOp && (
                        <select
                          className="border rounded text-sm px-2 py-1 w-[100px]"
                          value={
                            operations[propertyName] ??
                            (isDate || ['int', 'float'].includes(rawType) ? '=' : 'contains')
                          }
                          onChange={(e) => handleOperationChange(e, propertyName)}
                        >
                          {getOperationOptions(rawType, propertyName).map((op) => (
                            <option key={op} value={op}>
                              {t(op)}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type={
                          isDate
                            ? 'date'
                            : ['int', 'float'].includes(rawType)
                            ? 'number'
                            : 'text'
                        }
                        className="border rounded text-sm px-2 py-1 flex-1"
                        onChange={(e) =>
                          handleInputChange(e, propertyName, isDate ? 'date' : rawType)
                        }
                        step={rawType === 'float' ? 'any' : undefined}
                      />
                    </div>
                  );
                })}
              <div className="px-3 pb-3">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded w-full transition-colors"
                >
                  {t('Search')}
                </button>
              </div>
            </form>

            {feedbackMessage && (
              <div
                className={`text-sm px-3 py-2 rounded ${
                  feedbackMessage.includes('Successfully')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {feedbackMessage}
              </div>
            )}

            {showLoadMore && (
              <div className="px-3 pb-3">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded w-full transition-colors"
                  onClick={handleLoadMore}
                >
                  {t('Load remaining nodes')}
                </button>
                <p className="text-xs mt-1 text-yellow-700">
                  {t('Tip: Activate WebGL option for better performance with large graphs.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SearchComponent);
