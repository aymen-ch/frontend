import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-monokai';
import './Predifinedquestions.css';
import { convertNeo4jToGraph } from '../../LLM/graphconvertor';
import neo4j from 'neo4j-driver';
import { BASE_URL_Backend } from '../../../../Platforme/Urls';
import { useTranslation } from 'react-i18next';
import {URI,USER,PASSWORD}  from '../../../../Platforme/Urls'


const Template = ({ nodes, setNodes, edges, setEdges }) => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState([]); // State for all questions (fetched from backend)
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [queryParameters, setQueryParameters] = useState({});
  const [queryResult, setQueryResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    question: '',
    query: '',
    parameters: {},
    parameterTypes: {},
  });
  const [templateError, setTemplateError] = useState('');
  const [newParam, setNewParam] = useState({ name: '', description: '', type: 'string' });
  const [detectedParams, setDetectedParams] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch predefined questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${BASE_URL_Backend}/get_predefined_questions`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError(`${t('Error fetching questions')}: ${err.message}`);
      }
    };
    fetchQuestions();
  }, [t]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleQuestionSelect = (e) => {
    const questionId = e.target.value;
    const selected = questions.find((q) => q.id === parseInt(questionId));
    setSelectedQuestion(selected);
    setQueryParameters({});
    setQueryResult('');
    setError('');
  };

  const handleParameterChange = (e, paramName) => {
    const value = e.target.value;
    const type = selectedQuestion?.parameterTypes[paramName];
    const parsedValue = type === 'int' ? parseInt(value, 10) : value;
    setQueryParameters((prev) => ({ ...prev, [paramName]: parsedValue }));
  };

  const executeQuery = async () => {
    if (!selectedQuestion) return;

    setIsLoading(true);
    setError('');
    setQueryResult('');

    try {
      const driver = neo4j.driver(URI, neo4j.auth.basic(USER,PASSWORD));
      const nvlResult = await driver.executeQuery(
        selectedQuestion.query,
        queryParameters,
        { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
      );
      try {
        const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlResult.records);
        if (newNodes.length > 0 || newEdges.length > 0) {
          setNodes([...nodes, ...newNodes]);
          setEdges([...edges, ...newEdges]);
          setQueryResult(t('Graph updated'));
        } else {
          setQueryResult(t('Empty result'));
          throw new Error(t('Empty result'));
        }
      } catch (graphError) {
        setQueryResult(t('Invalid query result'));
      } finally {
        await driver.close();
      }
    } catch (error) {
      setError(`${t('Query execution error')}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatQueryResult = (result) => {
    if (!result || result.length === 0) return t('No data');
    return result
      .map((item, index) => {
        const properties = Object.entries(item).map(([key, value]) => `${key}: ${value}`).join('\n');
        return `${t('Query Result')} ${index + 1}:\n${properties}`;
      })
      .join('\n\n');
  };

  const handleNewTemplateChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewParamChange = (e) => {
    const { name, value } = e.target;
    setNewParam((prev) => ({ ...prev, [name]: value }));
  };

  const handleQueryChange = (value) => {
    setNewTemplate((prev) => ({ ...prev, query: value }));
    detectQueryParameters(value);
  };

  const detectQueryParameters = (query) => {
    const paramRegex = /\$([a-zA-Z][a-zA-Z0-9]*)/g;
    const detected = [...new Set(query.match(paramRegex)?.map((p) => p.slice(1)) || [])];
    setDetectedParams(detected);
    if (!newParam.name && detected.length > 0) {
      setNewParam((prev) => ({ ...prev, name: detected[0] }));
    }
  };

  const selectDetectedParam = (paramName) => {
    setNewParam((prev) => ({ ...prev, name: paramName, description: '', type: 'string' }));
  };

  const addNewParameter = () => {
    const { name, description, type } = newParam;
    if (name && description && (type === 'int' || type === 'string')) {
      setNewTemplate((prev) => ({
        ...prev,
        parameters: { ...prev.parameters, [name]: description },
        parameterTypes: { ...prev.parameterTypes, [name]: type },
      }));
      setNewParam({ name: detectedParams.find((p) => p !== name) || '', description: '', type: 'string' });
      setTemplateError('');
      setDetectedParams((prev) => prev.filter((p) => p !== name));
    } else {
      setTemplateError(t('Invalid parameter'));
    }
  };

  const removeParameter = (paramName) => {
    setNewTemplate((prev) => {
      const { [paramName]: _, ...remainingParams } = prev.parameters;
      const { [paramName]: __, ...remainingTypes } = prev.parameterTypes;
      return { ...prev, parameters: remainingParams, parameterTypes: remainingTypes };
    });
    if (detectedParams.includes(paramName) || newTemplate.query.includes(`$${paramName}`)) {
      setDetectedParams((prev) => [...new Set([...prev, paramName])]);
    }
  };

  const generateRandomParameters = (parameterTypes) => {
    const randomParams = {};
    Object.entries(parameterTypes).forEach(([paramName, type]) => {
      if (type === 'int') {
        randomParams[paramName] = Math.floor(Math.random() * 100);
      } else {
        randomParams[paramName] = `test_${paramName}_${Math.random().toString(36).substring(2, 8)}`;
      }
    });
    return randomParams;
  };

  const verifyQuery = async (query, parameters, parameterTypes) => {
    const driver = neo4j.driver(URI, neo4j.auth.basic(USER,PASSWORD));
    try {
      const randomParams = generateRandomParameters(parameterTypes);
      const nvlResult = await driver.executeQuery(query, randomParams, {
        resultTransformer: neo4j.resultTransformers.eagerResultTransformer(),
      });
      const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlResult.records);
      if (newNodes.length === 0 && newEdges.length === 0) {
        throw new Error(t('Empty result'));
      }
      return true;
    } catch (error) {
      throw new Error(`${t('Query verification failed')}: ${error.message}`);
    } finally {
      await driver.close();
    }
  };

  const addAbstractQuestionTemplate = async (userTemplate) => {
    const requiredFields = ['question', 'query', 'parameters', 'parameterTypes'];
    for (const field of requiredFields) {
      if (!(field in userTemplate) || !userTemplate[field]) {
        throw new Error(`${t('Missing field')}: ${field}`);
      }
    }
    const paramKeys = Object.keys(userTemplate.parameters);
    const typeKeys = Object.keys(userTemplate.parameterTypes);
    if (paramKeys.length !== typeKeys.length || !paramKeys.every((key) => typeKeys.includes(key))) {
      throw new Error(t('Parameter mismatch'));
    }
    const validTypes = ['string', 'int'];
    for (const type of Object.values(userTemplate.parameterTypes)) {
      if (!validTypes.includes(type)) {
        throw new Error(`${t('Invalid parameter type')}: ${type}. ${t('Must be string or int')}`);
      }
    }
    const query = userTemplate.query.toLowerCase();
    if (!query.includes('match') || !query.includes('return')) {
      throw new Error(t('Invalid query'));
    }

    await verifyQuery(userTemplate.query, userTemplate.parameters, userTemplate.parameterTypes);

    // Send new template to backend
    try {
      const response = await fetch(`${BASE_URL_Backend}/add_predefined_question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userTemplate),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Add new question to state
      setQuestions((prev) => [...prev, { id: data.id, ...userTemplate }]);
      setNewTemplate({ question: '', query: '', parameters: {}, parameterTypes: {} });
      setShowNewTemplateForm(false);
      setTemplateError('');
      setSuccessMessage(t('Template saved successfully'));
    } catch (error) {
      throw new Error(`${t('Error saving template')}: ${error.message}`);
    }
  };

  const saveNewTemplate = async () => {
    try {
      await addAbstractQuestionTemplate(newTemplate);
    } catch (error) {
      setTemplateError(error.message);
    }
  };

  return (
    <div className="template-container">
      <h3 className="header">{t('Manage Templates and Queries')}</h3>
      <p className="subheader">{t('Select a predefined question to query the database')}</p>

      <select onChange={handleQuestionSelect} className="question-select">
        <option value="">{t('Choose a question')}</option>
        {questions.map((q) => (
          <option key={q.id} value={q.id}>{q.question}</option>
        ))}
      </select>

      <button className="add-template-button" onClick={() => setShowNewTemplateForm(true)}>
        {t('Add New Template')}
      </button>

      {showNewTemplateForm && (
        <div className="modal-overlay">
          <div className="new-template-modal">
            <h5>{t('Add New Template Title')}</h5>
            <input
              type="text"
              name="question"
              value={newTemplate.question}
              onChange={handleNewTemplateChange}
              placeholder={t('Enter question in Arabic')}
              className="new-template-input"
            />
            <AceEditor
              mode="sql"
              theme="monokai"
              value={newTemplate.query}
              onChange={handleQueryChange}
              name="query-editor"
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                fontSize: 14,
                showGutter: true,
                showPrintMargin: false,
                tabSize: 2,
                wrap: true,
              }}
              style={{
                width: '100%',
                height: '150px',
                borderRadius: '8px',
                marginBottom: '15px',
              }}
              placeholder={t('Enter Cypher query')}
            />
            <h6>{t('Parameters')}</h6>
            {detectedParams.length > 0 && (
              <div className="detected-params">
                <p>{t('Detected Parameters')}:</p>
                {detectedParams.map((param) => (
                  <button
                    key={param}
                    className="detected-param-button"
                    onClick={() => selectDetectedParam(param)}
                  >
                    {param}
                  </button>
                ))}
              </div>
            )}
            <div className="parameter-form">
              <input
                type="text"
                name="name"
                value={newParam.name}
                onChange={handleNewParamChange}
                placeholder={t('Parameter Name')}
              />
              <input
                type="text"
                name="description"
                value={newParam.description}
                onChange={handleNewParamChange}
                placeholder={t('Parameter Description')}
              />
              <select name="type" value={newParam.type} onChange={handleNewParamChange}>
                <option value="string">String</option>
                <option value="int">Int</option>
              </select>
              <button className="add-parameter-button" onClick={addNewParameter}>
                {t('Add')}
              </button>
            </div>
            <div className="parameter-list">
              {Object.entries(newTemplate.parameters).map(([paramName, paramDescription]) => (
                <div key={paramName} className="parameter-item">
                  <span>{paramDescription} ({paramName}): {newTemplate.parameterTypes[paramName]}</span>
                  <button onClick={() => removeParameter(paramName)}>{t('Remove')}</button>
                </div>
              ))}
            </div>
            {templateError && <p className="error-text">{templateError}</p>}
            <div className="modal-buttons">
              <button className="save-button" onClick={saveNewTemplate}>{t('Save Template')}</button>
              <button className="cancel-button" onClick={() => setShowNewTemplateForm(false)}>{t('Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      {selectedQuestion && (
        <div className="query-section">
          <h5 className="section-title">{t('Selected Question')}:</h5>
          <p className="selected-question">{selectedQuestion.question}</p>
          {Object.entries(selectedQuestion.parameters).map(([paramName, paramDescription]) => (
            <div key={paramName} className="parameter-input">
              <label className="parameter-label">{paramDescription}:</label>
              <input
                type="text"
                value={queryParameters[paramName] || ''}
                onChange={(e) => handleParameterChange(e, paramName)}
                placeholder={`${t('Enter')} ${paramDescription}`}
                className="parameter-field"
              />
            </div>
          ))}
          <button className="execute-button" onClick={executeQuery} disabled={isLoading}>
            {isLoading ? t('Executing') : t('Execute Query')}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <h5 className="error-title">{t('Error')}:</h5>
          <p className="error-text">{error}</p>
        </div>
      )}

      {queryResult && (
        <div className="result-section">
          <h5 className="section-title">{t('Query Result')}:</h5>
          <pre className="result-pre">{queryResult}</pre>
        </div>
      )}
    </div>
  );
};

export default Template;