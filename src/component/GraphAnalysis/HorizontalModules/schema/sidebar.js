import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getNodeColor, getNodeIcon } from '../../utils/Parser';
import { useTranslation } from 'react-i18next';
import './sidebar.css';
import axios from 'axios';
import { BASE_URL } from '../../utils/Urls';

const Sidebar = ({ selectedItem }) => {
  const { t } = useTranslation();
  const [showNodeDetails, setShowNodeDetails] = useState(true);
  const [analysisMessage, setAnalysisMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [relAttributes, setRelAttributes] = useState([]);
  const [direction, setDirection] = useState('in');
  const [calcType, setCalcType] = useState('degree_in');
  const [aggregation, setAggregation] = useState('sum');
  const [selectedRelAttribute, setSelectedRelAttribute] = useState('');
  const [attributeName, setAttributeName] = useState('degree_in');
  const [nodeProperties, setNodeProperties] = useState('');
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [showProperties, setShowProperties] = useState(true);

  useEffect(() => {
    if (selectedItem?.isnode) {
      fetchRelationshipAttributes();
      setAttributeName(
        calcType === 'degree_in' || calcType === 'degree_out'
          ? calcType
          : calcType === 'sum_degree_in'
          ? 'sum_degree_in'
          : 'sum_degree_out'
      );
    }
  }, [selectedItem, calcType, direction]);

  const fetchNodeProperties = async () => {
    if (selectedItem?.isnode && selectedItem.group) {
      try {
        const response = await axios.post(`${BASE_URL}/get_node_properties/`, {
          node_type: selectedItem.group,
        });
        setNodeProperties(response.data.properties);
      } catch (error) {
        console.error('Error fetching node properties:', error);
        setNodeProperties([]);
      }
    } else {
      setNodeProperties('');
    }
  };

  useEffect(() => {
    fetchNodeProperties();
  }, [selectedItem]);

  const fetchRelationshipAttributes = async () => {
    try {
      const endpoint =
        direction === 'in'
          ? `${BASE_URL}/get_incoming_relationship_attributes/`
          : `${BASE_URL}/get_outgoing_relationship_attributes/`;
      const response = await axios.post(endpoint, {
        node_type: selectedItem.group,
      });
      setRelAttributes(response.data.attributes);
      if (response.data.attributes.length > 0) {
        setSelectedRelAttribute(response.data.attributes[0]);
      }
    } catch (error) {
      console.error('Error fetching relationship attributes:', error);
      setRelAttributes([]);
    }
  };

  useEffect(() => {
    if (selectedItem?.isnode) {
      fetchRelationshipAttributes();
    }
  }, [direction, selectedItem]);

  if (!selectedItem) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">{t('sidebar.detailsTitle')}</h3>
        <p className="sidebar-placeholder">{t('sidebar.placeholder')}</p>
      </div>
    );
  }

  const isNode = selectedItem.isnode;

  const renderProperties = (properties) => {
    let fields = [];
  
    if (Array.isArray(properties) && properties.length === 1 && typeof properties[0] === 'string') {
      fields = properties[0].split(',').map(f => f.trim()).filter(f => f && !f.startsWith('_'));
    } else if (typeof properties === 'string') {
      fields = properties.split(',').map(f => f.trim()).filter(f => f && !f.startsWith('_'));
    } else if (Array.isArray(properties)) {
      fields = properties.filter(f => typeof f === 'string' && !f.startsWith('_'));
    } else {
      return (
        <ul className="properties-list">
          {Object.entries(properties || {})
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, value]) => (
              <li key={key} className="property-item">
                <span className="property-key">{key}:</span>
                <span className="property-value">{String(value)}</span>
              </li>
            ))}
        </ul>
      );
    }
  
    return (
      <ul className="properties-list">
        {fields.map((field, index) => (
          <li key={index} className="property-item">• {field}</li>
        ))}
      </ul>
    );
  };

  const toggleNodeDetails = () => setShowNodeDetails(!showNodeDetails);
  const toggleAttributeForm = () => setShowAttributeForm(!showAttributeForm);
  const toggleProperties = () => setShowProperties(!showProperties);

  const handleInsertAttributes = async () => {
    if (!isNode) {
      setAnalysisMessage(t('sidebar.errorNodeRequired'));
      return;
    }
  
    setIsLoading(true);
    setAnalysisMessage(null);
  
    try {
      const response = await axios.post(`${BASE_URL}/insert_node_attribute/`, {
        node_type: selectedItem.group,
        calc_type: calcType,
        attribute_name: attributeName,
        rel_attribute: selectedRelAttribute,
        aggregation: aggregation,
      });
      setAnalysisMessage(response.data.message);
      await fetchNodeProperties();
    } catch (error) {
      setAnalysisMessage(
        error.response?.data?.error || t('sidebar.errorAnalysisFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sidebar-container">
      <h3 className="sidebar-title">
        {isNode ? t('sidebar.nodeDetails') : t('sidebar.relationshipDetails')}
      </h3>

      {isNode ? (
        <div className="details-section">
          <div className="toggle-header" onClick={toggleNodeDetails}>
            <div
              className="icon-badge"
              style={{ backgroundColor: getNodeColor(selectedItem.group) }}
            >
              <img
                src={getNodeIcon(selectedItem.group)}
                alt={selectedItem.group}
                className="node-icon-img"
              />
            </div>
            <span className="toggle-title">{selectedItem.group}</span>
            {showNodeDetails ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {showNodeDetails && (
            <div className="details-card">
              <div className="detail-item">
                <span className="detail-label">{t('sidebar.id')}:</span>
                <span className="detail-value">{selectedItem.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('sidebar.type')}:</span>
                <span className="detail-value">{selectedItem.group}</span>
              </div>
              <div className="properties-section">
                <div className="properties-header" onClick={toggleProperties}>
                  <span className="properties-title">{t('sidebar.properties')}</span>
                  {showProperties ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {showProperties && (
                  <div className="properties-content">
                    {renderProperties(nodeProperties)}
                  </div>
                )}
              </div>

              <div className="attribute-form-container">
                <button
                  className="toggle-form-btn"
                  onClick={toggleAttributeForm}
                  aria-expanded={showAttributeForm}
                >
                  {showAttributeForm ? t('sidebar.hideAttributeForm') : t('sidebar.showAttributeForm')}
                  {showAttributeForm ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {showAttributeForm && (
                  <div className="attribute-form">
                    <div className="form-grid">
                      <div className="form-field">
                        <label>
                          {t('sidebar.direction')}
                          <select
                            value={direction}
                            onChange={(e) => {
                              setDirection(e.target.value);
                              setCalcType(e.target.value === 'in' ? 'degree_in' : 'degree_out');
                              setSelectedRelAttribute('');
                              setAggregation('sum');
                            }}
                            disabled={isLoading}
                          >
                            <option value="in">{t('sidebar.incoming')}</option>
                            <option value="out">{t('sidebar.outgoing')}</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-field">
                        <label>
                          {t('sidebar.calcType')}
                          <select
                            value={calcType}
                            onChange={(e) => setCalcType(e.target.value)}
                            disabled={isLoading}
                          >
                            {direction === 'in' ? (
                              <>
                                <option value="degree_in">{t('sidebar.degreeIn')}</option>
                                <option value="sum_degree_in">{t('sidebar.sumDegreeIn')}</option>
                              </>
                            ) : (
                              <>
                                <option value="degree_out">{t('sidebar.degreeOut')}</option>
                                <option value="sum_degree_out">{t('sidebar.sumDegreeOut')}</option>
                              </>
                            )}
                          </select>
                        </label>
                      </div>
                      {(calcType === 'sum_degree_in' || calcType === 'sum_degree_out') && (
                        <>
                          <div className="form-field">
                            <label>
                              {t('sidebar.relAttribute')}
                              <select
                                value={selectedRelAttribute}
                                onChange={(e) => setSelectedRelAttribute(e.target.value)}
                                disabled={isLoading}
                              >
                                {relAttributes.map((attr) => (
                                  <option key={attr} value={attr}>
                                    {attr}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <div className="form-field">
                            <label>
                              {t('sidebar.aggregation')}
                              <select
                                value={aggregation}
                                onChange={(e) => setAggregation(e.target.value)}
                                disabled={isLoading}
                              >
                                <option value="sum">{t('sidebar.sum')}</option>
                                <option value="multiplication">{t('sidebar.multiplication')}</option>
                              </select>
                            </label>
                          </div>
                        </>
                      )}
                      <div className="form-field">
                        <label>
                          {t('sidebar.attributeName')}
                          <input
                            type="text"
                            value={attributeName}
                            onChange={(e) => setAttributeName(e.target.value)}
                            disabled={isLoading}
                            placeholder={
                              calcType === 'degree_in'
                                ? 'degree_in'
                                : calcType === 'degree_out'
                                ? 'degree_out'
                                : calcType === 'sum_degree_in'
                                ? 'sum_degree_in'
                                : 'sum_degree_out'
                            }
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      className="insert-attributes-btn"
                      onClick={handleInsertAttributes}
                      disabled={isLoading || !attributeName.trim()}
                      aria-busy={isLoading}
                      aria-label={isLoading ? t('sidebar.insertingAttributes') : t('sidebar.insertNewAttribute')}
                    >
                      {isLoading ? (
                        <span className="loading-spinner" aria-hidden="true"></span>
                      ) : (
                        t('sidebar.insertNewAttribute')
                      )}
                    </button>
                    {analysisMessage && (
                      <p className="analysis-message">{analysisMessage}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="details-card">
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.type')}:</span>
            <span className="detail-value">{selectedItem.group}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.from')}:</span>
            <span className="detail-value">{selectedItem.from}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.to')}:</span>
            <span className="detail-value">{selectedItem.to}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.properties')}:</span>
            {renderProperties("Count : total number of relation between the start and the end")}
          </div>

          {selectedItem.virtual && (
            <>
              <hr />
              <div className="detail-item">
                <span className="detail-label">Virtual Path:</span>
                <div className="virtual-path-container">
                  {selectedItem.path?.map((step, index) => {
                    const isNode = index % 2 === 0;
                    return (
                      <div
                        key={index}
                        className={`path-step ${isNode ? 'node-step' : 'relation-step'}`}
                      >
                        {isNode ? (
                          <div
                            className="node-badge"
                            title={step}
                            style={{ backgroundColor: getNodeColor(step) }}
                          >
                            <img
                              src={getNodeIcon(step)}
                              alt={step}
                              className="node-icon-img"
                            />
                            <span className="node-text">{step}</span>
                          </div>
                        ) : (
                          <span className="relation-label">➝ {step}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">Final Relation:</span>
                <div className="virtual-path-container final-summary">
                  <div
                    className="node-badge"
                    title={selectedItem.path?.[0]}
                    style={{ backgroundColor: getNodeColor(selectedItem.path?.[0]) }}
                  >
                    <img
                      src={getNodeIcon(selectedItem.path?.[0])}
                      alt={selectedItem.path?.[0]}
                      className="node-icon-img"
                    />
                    <span className="node-text">{selectedItem.path?.[0]}</span>
                  </div>
                  <span className="relation-label">➝ {selectedItem.group}</span>
                  <div
                    className="node-badge"
                    title={selectedItem.path?.[selectedItem.path.length - 1]}
                    style={{
                      backgroundColor: getNodeColor(
                        selectedItem.path?.[selectedItem.path.length - 1]
                      ),
                    }}
                  >
                    <img
                      src={getNodeIcon(selectedItem.path?.[selectedItem.path.length - 1])}
                      alt={selectedItem.path?.[selectedItem.path.length - 1]}
                      className="node-icon-img"
                    />
                    <span className="node-text">
                      {selectedItem.path?.[selectedItem.path.length - 1]}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;