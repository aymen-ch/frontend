import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { NODE_CONFIG } from '../../Parser';
import { Button, Spinner, Form, Row, Col, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import globalWindowState from '../../VisualisationModule/globalWindowState';
import { Sliders, Zap, Activity, Target, BarChart2 } from 'lucide-react';
import { BASE_URL_Backend } from '../../../Platforme/Urls';

const AttributeAnalysis = ({ combinedNodes, onNodeConfigChange }) => {
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [nodeSize, setNodeSize] = useState({});
  const [sizeProperty, setSizeProperty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('_betweenness');
  const [nodeData, setNodeData] = useState([]);
  const [nodeProperties, setNodeProperties] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // const centralityAttributes = [
  //   '_betweenness',
  //   '_degree',
  //   '_closeness',
  //   '_eigenvector',
  // ];

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

  return (
    <div className="p-3">
      <h5>{t('attribute_analysis')}</h5>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <Spinner animation="border" />}
      
      <div className="node-config-container" style={{ marginBottom: '20px' }}>
        <h6>{t('change_size_of_node_by')}</h6>
        <Form.Select 
          value={selectedNodeType || ''} 
          onChange={(e) => setSelectedNodeType(e.target.value)}
          style={{ marginBottom: '10px', width: '100%', padding: '5px' }}
        >
          <option value="">{t('select_node_type')}</option>
          {nodeTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Form.Select>

        {selectedNodeType && (
          <div className="config-controls">
            <div style={{ marginBottom: '10px' }}>
              <Form.Label>{t('size_by_property')}</Form.Label>
              <Form.Select
                value={sizeProperty}
                onChange={(e) => handleSizePropertyChange(selectedNodeType, e.target.value)}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              >
                <option value="">{t('manual_size')}</option>
                {getPropertiesForNodeType(selectedNodeType).map(prop => (
                  <option key={prop} value={prop}>{prop}</option>
                ))}
              </Form.Select>
            </div>

            {!sizeProperty && (
              <div style={{ marginBottom: '10px' }}>
                <Form.Label>{t('size')}: {nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize || 100}px</Form.Label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={nodeSize[selectedNodeType] || NODE_CONFIG.defaultNodeSize || 100}
                  onChange={(e) => handleSizeChange(selectedNodeType, e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Form.Label>{t('select_node_type')}</Form.Label>
        <Form.Select
          size="sm"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">{t('select_node_type')}</option>
          {nodeData.map((node) => (
            <option key={node.type} value={node.type}>
              <Target size={16} className="me-2" />
              {node.type}
            </option>
          ))}
        </Form.Select>

        <Form.Label>{t('numeric_properties')}</Form.Label>
        <Form.Select
          size="sm"
          value={selectedAttribute}
          onChange={(e) => setSelectedAttribute(e.target.value)}
        >
          <option value="">{t('select_attribute')}</option>
          {getNumericNodeProperties().map(prop => (
            <option key={prop} value={prop}>{prop}</option>
          ))}
        
        </Form.Select>

        <Button
          size="sm"
          variant="info"
          className="w-100 d-flex align-items-center justify-content-center gap-1 mt-3"
          onClick={() => globalWindowState.setWindow("analyse_statistique", { selectedAttribute, selectedGroup })}
          style={{ height: '50px' }}
        >
          <BarChart2 size={14} className="me-1" />
          {t('button_statistical_analysis')}
        </Button>
      </div>
    </div>
  );
};

export default AttributeAnalysis;