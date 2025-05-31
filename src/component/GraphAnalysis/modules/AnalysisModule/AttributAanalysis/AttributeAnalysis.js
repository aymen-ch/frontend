import  { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { NODE_CONFIG } from '../../VisualisationModule/Parser';
import { Button, Spinner, Form  ,Alert} from 'react-bootstrap';
import globalWindowState from '../../VisualisationModule/globalWindowState';
import {  Target, BarChart2 } from 'lucide-react';
import { BASE_URL_Backend } from '../../../Platforme/Urls';


////******
// This analyse module used to  analyse the attributes of the nodes.
// 
// it have two use case :
// 1- change the size of a node by attribute 
// 2- show the distribution of of an attribute of a node type 
// 
// 
//  */

const AttributeAnalysis = ({ combinedNodes, onNodeConfigChange }) => {
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [nodeSize, setNodeSize] = useState({});
  const [sizeProperty, setSizeProperty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [nodeData, setNodeData] = useState([]);
  const [nodeProperties, setNodeProperties] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(null); // New state for warning message
  const { t } = useTranslation();

  // This will return the properties of the node type
  const fetchNodeProperties = async (nodeType) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await axios.get(`${BASE_URL_Backend}/node-types/properties_types/`, {
        params: { node_type: nodeType },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.properties || [];
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(t('error_fetching_properties'));
    }
  };

  useEffect(() => {
    const fetchNodeTypes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${BASE_URL_Backend}/node-types/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNodeData(response.data.node_types || []);
        if (response.data.node_types?.length > 0) {
          setSelectedGroup(response.data.node_types[0].type);
        }
      } catch (error) {
        setError(error.message || t('error_fetching_node_types'));
      } finally {
        setLoading(false);
      }
    };
    fetchNodeTypes();
  }, [t]);

  useEffect(() => {
    const getNodeProperties = async () => {
      if (!selectedGroup) return;
      setLoading(true);
      try {
        const properties = await fetchNodeProperties(selectedGroup);
        setNodeProperties(properties || []);
      } catch (error) {
        setError(t('error_fetching_properties'));
      } finally {
        setLoading(false);
      }
    };
    getNodeProperties();
  }, [selectedGroup, t]);

  const nodeTypes = [...new Set(combinedNodes.map(node => node.group))];

  const getPropertiesForNodeType = (nodeType) => {
    const nodesOfType = combinedNodes.filter(node => node.group === nodeType);
    if (nodesOfType.length === 0) return [];
    
    const sampleNode = nodesOfType[0];
    const numericProperties = [];

    if (sampleNode.properties) {
      Object.keys(sampleNode.properties).forEach(key => {
        if (typeof sampleNode.properties[key] === 'number') {
          numericProperties.push(`properties.${key}`);
        }
      });
    }

    if (sampleNode.properties_analyse) {
      Object.keys(sampleNode.properties_analyse).forEach(key => {
        if (typeof sampleNode.properties_analyse[key] === 'number') {
          numericProperties.push(`properties_analyse.${key}`);
        }
      });
    }

    return numericProperties;
  };

  // Updated function to filter numeric properties (int and float) from nodeProperties
  const getNumericNodeProperties = () => {
    if (!nodeProperties.length) return [];

    const numericProperties = nodeProperties
      .filter(prop => prop.type === 'int' || prop.type === 'float')
      .map(prop => prop.name);

    return numericProperties;
  };


  /// this will resize the nodes solon a properties 
  const handleSizeChange = (nodeType, newSize) => {
    const size = Math.max(50, parseInt(newSize) || NODE_CONFIG.defaultNodeSize || 100);
    const updatedSizes = {};
    combinedNodes.forEach(node => {
      updatedSizes[node.id] = node.group === nodeType 
        ? size 
        : nodeSize[node.id] || NODE_CONFIG.defaultNodeSize || 100;
    });
    setNodeSize(updatedSizes);
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'size',
        nodeType,
        value: updatedSizes,
      });
    }
  };

  const handleSizePropertyChange = (nodeType, property) => {
    setSizeProperty(property);
    const defaultSize = NODE_CONFIG.defaultNodeSize || 100;
    const updatedSizes = {};

    combinedNodes.forEach(node => {
      updatedSizes[node.id] = nodeSize[node.id] || defaultSize;
    });

    if (property) {
      const nodesOfType = combinedNodes.filter(node => node.group === nodeType);
      const values = nodesOfType.map(node => {
        let value = 0;
        if (property.startsWith('properties.')) {
          const propKey = property.split('.')[1];
          value = node.properties?.[propKey] || 0;
        } else if (property.startsWith('properties_analyse.')) {
          const propKey = property.split('.')[1];
          value = node.properties_analyse?.[propKey] || 0;
        }
        return value;
      });

      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const minSize = 150;
      const maxSize = 500;

      nodesOfType.forEach(node => {
        const value = property.startsWith('properties.')
          ? node.properties?.[property.split('.')[1]] || 0
          : node.properties_analyse?.[property.split('.')[1]] || 0;
        
        let normalizedSize = maxValue === minValue || maxValue === 0
          ? minSize
          : minSize + ((value - minValue) / (maxValue - minValue)) * (maxSize - minSize);
        
        normalizedSize = Math.max(minSize, Math.round(normalizedSize || minSize));
        updatedSizes[node.id] = normalizedSize;
      });
    }

    setNodeSize(updatedSizes);
    if (onNodeConfigChange) {
      onNodeConfigChange({
        type: 'size',
        nodeType,
        property,
        value: updatedSizes,
      });
    }
  };

  useEffect(() => {
    const defaultSize = NODE_CONFIG.defaultNodeSize || 100;
    const initialSizes = {};
    combinedNodes.forEach(node => {
      initialSizes[node.id] = nodeSize[node.id] || defaultSize;
    });
    setNodeSize(initialSizes);
  }, [combinedNodes]);

  ////*****
  // 
  // handleStatisticalAnalysisClick will activate te window of statistical analysis
  // 
  // 
  // 
  //  */
  const handleStatisticalAnalysisClick = () => {
    console.log('selectedAttribute:', selectedAttribute);
    if (!selectedGroup || !selectedAttribute) {
      setWarning(t('warning_select_both node type and attribute')); // Show warning if either is not selected
      return;
    }
    setWarning(null); // Clear warning if both are selected
    globalWindowState.setWindow("analyse_statistique", { selectedAttribute, selectedGroup });
  };
 return (
  <div className="p-4 bg-gray-100 rounded-lg shadow-md">
    <h5 className="text-lg font-semibold text-gray-800 mb-4">{t('attribute_analysis')}</h5>
    {error && <div className="alert alert-danger mb-4">{error}</div>}
 
    {loading && <Spinner animation="border" className="mb-4" />}

    {/* Change Node Size Part */}
    <div className="node-config-container mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h6 className="text-md font-medium text-gray-700 mb-3">{t('change_node_size')}</h6>
      <Form.Select
        value={selectedNodeType || ''}
        onChange={(e) => setSelectedNodeType(e.target.value)}
        className="mb-3 w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{t('select_node_type')}</option>
        {nodeTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </Form.Select>

      {selectedNodeType && (
        <div className="config-controls space-y-4">
          <div>
            <Form.Label className="text-sm text-gray-600">{t('size_by_property')}</Form.Label>
            <Form.Select
              value={sizeProperty}
              onChange={(e) => handleSizePropertyChange(selectedNodeType, e.target.value)}
              className="w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('manual_size')}</option>
              {getPropertiesForNodeType(selectedNodeType).map(prop => (
                <option key={prop} value={prop}>{prop}</option>
              ))}
            </Form.Select>
          </div>

          {!sizeProperty && (
            <div>
              <Form.Label className="text-sm text-gray-600">
                {t('size')}: {nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize || 100}px
              </Form.Label>
              <input
                type="range"
                min="50"
                max="500"
                value={nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize || 100}
                onChange={(e) => handleSizeChange(selectedNodeType, e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      )}
    </div>

    {/* Visual Separator */}
    <div className="border-t border-gray-300 my-6"></div>
         {warning && (
        <Alert variant="warning" className="mb-4">
          ⚠️ {warning}
        </Alert>
      )}
    {/* Statistics Part */}
    <div className="statistics-container p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h6 className="text-md font-medium text-gray-700 mb-3">{t('statistics')}</h6>
      <Form.Label className="text-sm text-gray-600">{t('select_node_type')}</Form.Label>
      <Form.Select
        size="sm"
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        className="mb-3 w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">{t('select_node_type')}</option>
        {nodeData.map((node) => (
          <option key={node.type} value={node.type}>
            <Target size={16} className="inline-block mr-2" />
            {node.type}
          </option>
        ))}
      </Form.Select>

      <Form.Label className="text-sm text-gray-600">{t('numeric_properties')}</Form.Label>
      <Form.Select
        size="sm"
        value={selectedAttribute}
        onChange={(e) => setSelectedAttribute(e.target.value)}
        className="mb-3 w-full p-2 border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">{t('select_attribute')}</option>
        {getNumericNodeProperties().map(prop => (
          <option key={prop} value={prop}>{prop}</option>
        ))}
      </Form.Select>

        <Button
          size="sm"
          variant="info"
          className="w-full flex items-center justify-center gap-2 mt-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md p-3"
          onClick={handleStatisticalAnalysisClick} // Updated to use new handler
        >
          <BarChart2 size={14} className="inline-block" />
          {t('button_statistical_analysis')}
        </Button>
    </div>
  </div>
);
};

export default AttributeAnalysis;