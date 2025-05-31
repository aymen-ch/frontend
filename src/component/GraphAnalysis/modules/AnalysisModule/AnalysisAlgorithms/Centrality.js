import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import TopK_Nodes from './TopK_Nodes';
import { useTranslation } from 'react-i18next';
import globalWindowState from '../../VisualisationModule/globalWindowState';


const Centrality = ({
  setNodes,
}) => {
  const { t } = useTranslation();
  const [nodeData, setNodeData] = useState([]);
  const [nodeProperties, setNodeProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCentralityAttribute, setSelectedCentralityAttribute] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  // Fetch node types
  const fetchNodeTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${BASE_URL_Backend}/node-types/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nodeTypes = response.data.node_types || [];
      setNodeData(nodeTypes);
      if (nodeTypes.length > 0 && !selectedGroup) {
        setSelectedGroup(nodeTypes[0].type);
      }
    } catch (error) {
      setError(error.message || t('error_fetching_node_types'));
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, setSelectedGroup, t]);

  // Fetch node properties
  const fetchNodeProperties = useCallback(async (nodeType) => {
    if (!nodeType) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${BASE_URL_Backend}/node-types/properties_types/`, {
        params: { node_type: nodeType },
        headers: { Authorization: `Bearer ${token}` },
      });
      setNodeProperties(response.data.properties || []);
      setSelectedCentralityAttribute('');
    } catch (error) {
      setError(t('error_fetching_properties'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Get numeric properties starting with '_'
  const getNumericNodeProperties = useCallback(() => {
    if (!nodeProperties.length) return [];
    return nodeProperties
      .filter(
        (prop) =>
          (prop.type === 'int' || prop.type === 'float') &&
          prop.name.startsWith('_')
      )
      .map((prop) => prop.name);
  }, [nodeProperties]);

  // Fetch node types on mount
  useEffect(() => {
    fetchNodeTypes();
  }, [fetchNodeTypes]);

  // Fetch properties when selectedGroup changes
  useEffect(() => {
    fetchNodeProperties(selectedGroup);
  }, [selectedGroup, fetchNodeProperties]);

  // Set default centrality attribute when properties change
  // useEffect(() => {
  //   const numericProperties = getNumericNodeProperties();
  //   if (numericProperties.length > 0 && !selectedCentralityAttribute) {
  //     setSelectedCentralityAttribute(numericProperties[0]);
  //   }
  // }, [getNumericNodeProperties, selectedCentralityAttribute, setSelectedCentralityAttribute]);


  const centralityAttributes = getNumericNodeProperties();

return (
  <div className="p-3 bg-white rounded-2xl shadow-md">
    <div className="flex items-center gap-3 mb-4">
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
      </svg>
      <h2 className="text-lg font-semibold text-gray-800">{t('Centrality Tools')}</h2>
    </div>

    {loading && (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600">{t('Loading...')}</p>
      </div>
    )}
    {error && <p className="text-red-500 mt-3 text-center">{error}</p>}

    {/* Buttons to trigger actions part */}
    <div className="mb-6">
     
      <div className="grid grid-cols-1 gap-2">
        <button
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          onClick={() => globalWindowState.setWindow('Analyse_BackEnd', selectedGroup)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          {t('Add Centrality Attribute')}
        </button>
      </div>
    </div>

    {/* Divider for visual separation */}
    <hr className="my-6 border-gray-2000" />

    {/* Select Top k node based on an attribute Part */}

    {!loading && !error && (
      <div>
        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-3">{t('TOP K Node  Selector')}</h3>
        <div className="grid grid-cols-1 gap-4">
          {/* Node Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Select Node Type')}</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {nodeData.map((node) => (
                <option key={node.type} value={node.type} className="flex items-center gap-2">
                  {node.type}
                </option>
              ))}
            </select>
          </div>

 
          {/* Centrality Attribute Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Select Centrality Attribute')}</label> 
            <button
              className="w-full flex items-center justify-center gap-1 py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium disabled:bg-gray-400"
              onClick={() => fetchNodeProperties(selectedGroup)}
              disabled={!selectedGroup}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {t('Refresh Node Properties')}
            </button>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
              value={selectedCentralityAttribute}
              onChange={(e) => setSelectedCentralityAttribute(e.target.value)}
              disabled={centralityAttributes.length === 0}
            >
              <option value="">{t('Select an attribute')}</option>
              {centralityAttributes.length === 0 ? (
                <option value="" disabled>{t('No centrality attributes available')}</option>
              ) : (
                centralityAttributes.map((attr) => (
                  <option key={attr} value={attr}>
                    {attr}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* TopK Centrality Component */}
        <div className="mt-6">
          <TopK_Nodes
            setNodes={setNodes}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            selectedCentralityAttribute={selectedCentralityAttribute}
            setSelectedCentralityAttribute={setSelectedCentralityAttribute}
          />
        </div>
      </div>
    )}
  </div>
);
};

export default Centrality;