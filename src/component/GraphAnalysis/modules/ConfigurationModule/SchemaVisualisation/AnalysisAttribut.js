import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import axios from 'axios';
import { BASE_URL_Backend } from '../../../Platforme/Urls';

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
          ? `${BASE_URL_Backend}/get_incoming_relationship_attributes/`
          : `${BASE_URL_Backend}/get_outgoing_relationship_attributes/`;
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
      const response = await axios.post(`${BASE_URL_Backend}/get_node_properties/`, {
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
      const response = await axios.post(`${BASE_URL_Backend}/insert_node_attribute/`, {
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

  // Render analysis properties, removing leading underscore
  const renderAnalysisProperties = () => {
    if (!analysisProperties.length) {
      return <p className="text-sm text-gray-600 m-0">{t('sidebar.noAnalysisProperties')}</p>;
    }

    return (
      <ul className="list-none p-0 m-0">
        {analysisProperties.map((prop, index) => (
          <li key={index} className="py-1 text-sm text-gray-700">
            • {prop.startsWith('_') ? prop.substring(1) : prop}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mt-4">
      {/* Analysis Properties Section */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between p-2 bg-gray-100 rounded cursor-pointer text-gray-700 hover:bg-gray-200 transition-colors duration-200"
          onClick={toggleAnalysisProperties}
        >
          <span className="font-bold">{t('sidebar.analysisProperties')}</span>
          {showAnalysisProperties ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        {showAnalysisProperties && (
          <div className="mt-2 p-2 bg-white border border-gray-300 rounded">
            {renderAnalysisProperties()}
          </div>
        )}
      </div>

      {/* Attribute Form Section */}
      <button
        className="flex items-center justify-between w-full p-2 bg-gray-100 border-none rounded text-gray-700 hover:bg-gray-200 transition-colors duration-200 text-base"
        onClick={toggleAttributeForm}
        aria-expanded={showAttributeForm}
      >
        {showAttributeForm
          ? t('sidebar.hideAttributeForm')
          : t('sidebar.showAttributeForm')}
        {showAttributeForm ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {showAttributeForm && (
        <div className="mt-4 p-4 bg-white border border-gray-300 rounded">
          <div className="grid gap-4">
            <div className="flex flex-col">
              <label className="font-bold mb-1">
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
                  className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="in">{t('sidebar.incoming')}</option>
                  <option value="out">{t('sidebar.outgoing')}</option>
                </select>
              </label>
            </div>
            <div className="flex flex-col">
              <label className="font-bold mb-1">
                {t('sidebar.calcType')}
                <select
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)}
                  disabled={isLoading}
                  className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                <div className="flex flex-col">
                  <label className="font-bold mb-1">
                    {t('sidebar.relAttribute')}
                    <select
                      value={selectedRelAttribute}
                      onChange={(e) => setSelectedRelAttribute(e.target.value)}
                      disabled={isLoading}
                      className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {relAttributes.map((attr) => (
                        <option key={attr} value={attr}>
                          {attr}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-col">
                  <label className="font-bold mb-1">
                    {t('sidebar.aggregation')}
                    <select
                      value={aggregation}
                      onChange={(e) => setAggregation(e.target.value)}
                      disabled={isLoading}
                      className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="sum">{t('sidebar.sum')}</option>
                      <option value="multiplication">{t('sidebar.multiplication')}</option>
                    </select>
                  </label>
                </div>
              </>
            )}
            <div className="flex flex-col">
              <label className="font-bold mb-1">
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
                  className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </div>
          <button
            className="mt-4 p-2 bg-blue-500 text-white border-none rounded flex items-center justify-center text-base disabled:bg-gray-500 disabled:cursor-not-allowed"
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
              <span
                className="inline-block w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"
                aria-hidden="true"
              ></span>
            ) : (
              t('sidebar.insertNewAttribute')
            )}
          </button>
          {analysisMessage && (
            <p className="mt-4 p-2 bg-gray-200 rounded text-sm">{analysisMessage}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisAttributeForm;