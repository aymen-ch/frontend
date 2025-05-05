import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import axios from 'axios';
import { BASE_URL } from '../../utils/Urls';
import './analysisAttribut.css';

const AnalysisAttributeForm = ({ selectedItem }) => {
  const { t } = useTranslation();
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [showAnalysisProperties, setShowAnalysisProperties] = useState(true);
  const [analysisMessage, setAnalysisMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [relAttributes, setRelAttributes] = useState([]);
  const [analysisProperties, setAnalysisProperties] = useState([]);
  const [direction, setDirection] = useState('in');
  const [calcType, setCalcType] = useState('degree_in');
  const [aggregation, setAggregation] = useState('sum');
  const [selectedRelAttribute, setSelectedRelAttribute] = useState('');
  const [attributeName, setAttributeName] = useState('degree_in');

  // Fetch relationship attributes when direction or selectedItem changes
  const fetchRelationshipAttributes = async () => {
    if (!selectedItem?.isnode || !selectedItem.group) {
      setRelAttributes([]);
      return;
    }

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
      } else {
        setSelectedRelAttribute('');
      }
    } catch (error) {
      console.error('Error fetching relationship attributes:', error);
      setRelAttributes([]);
    }
  };

  // Fetch analysis properties (only those starting with '_')
  const fetchNodeProperties = async () => {
    if (!selectedItem?.isnode || !selectedItem.group) {
      setAnalysisProperties([]);
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/get_node_properties/`, {
        node_type: selectedItem.group,
      });
      let properties = response.data.properties;

      // Handle different formats of properties
      let analysisFields = [];

      if (Array.isArray(properties) && properties.length === 1 && typeof properties[0] === 'string') {
        analysisFields = properties[0]
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f && f.startsWith('_'));
      } else if (typeof properties === 'string') {
        analysisFields = properties
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f && f.startsWith('_'));
      } else if (Array.isArray(properties)) {
        analysisFields = properties.filter((f) => typeof f === 'string' && f.startsWith('_'));
      } else if (typeof properties === 'object') {
        analysisFields = Object.keys(properties).filter((key) => key.startsWith('_'));
      }

      setAnalysisProperties(analysisFields);
    } catch (error) {
      console.error('Error fetching analysis properties:', error);
      setAnalysisProperties([]);
    }
  };

  useEffect(() => {
    fetchRelationshipAttributes();
    fetchNodeProperties();
  }, [direction, selectedItem]);

  // Update attributeName based on calcType
  useEffect(() => {
    setAttributeName(
      calcType === 'degree_in'
        ? 'degree_in'
        : calcType === 'degree_out'
        ? 'degree_out'
        : calcType === 'sum_degree_in'
        ? 'sum_degree_in'
        : 'sum_degree_out'
    );
  }, [calcType]);

  const toggleAttributeForm = () => setShowAttributeForm(!showAttributeForm);
  const toggleAnalysisProperties = () => setShowAnalysisProperties(!showAnalysisProperties);

  const handleInsertAttributes = async () => {
    if (!selectedItem?.isnode) {
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
      fetchNodeProperties(); // Refresh analysis properties after insertion
    } catch (error) {
      setAnalysisMessage(
        error.response?.data?.error || t('sidebar.errorAnalysisFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedItem?.isnode) {
    return null; // Don't render the form if the selected item is not a node
  }

  // Render analysis properties, removing leading underscore
  const renderAnalysisProperties = () => {
    if (!analysisProperties.length) {
      return <p className="no-properties">{t('sidebar.noAnalysisProperties')}</p>;
    }

    return (
      <ul className="analysis-properties-list">
        {analysisProperties.map((prop, index) => (
          <li key={index} className="analysis-property-item">
            • {prop.startsWith('_') ? prop.substring(1) : prop}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="attribute-form-container">
      {/* Analysis Properties Section */}
      <div className="analysis-properties-section">
        <div className="analysis-properties-header" onClick={toggleAnalysisProperties}>
          <span className="analysis-properties-title">{t('sidebar.analysisProperties')}</span>
          {showAnalysisProperties ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        {showAnalysisProperties && (
          <div className="analysis-properties-content">
            {renderAnalysisProperties()}
          </div>
        )}
      </div>

      {/* Attribute Form Section */}
      <button
        className="toggle-form-btn"
        onClick={toggleAttributeForm}
        aria-expanded={showAttributeForm}
      >
        {showAttributeForm
          ? t('sidebar.hideAttributeForm')
          : t('sidebar.showAttributeForm')}
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
            aria-label={
              isLoading
                ? t('sidebar.insertingAttributes')
                : t('sidebar.insertNewAttribute')
            }
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
  );
};

export default AnalysisAttributeForm;