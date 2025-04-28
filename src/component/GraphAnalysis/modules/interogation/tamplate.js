import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-monokai';
import './Template.css';
import { BASE_URL } from '../../utils/Urls';
import { arabicQuestions } from './tamplate_question';
import { convertNeo4jToGraph } from './chat/graphconvertor';
import neo4j from 'neo4j-driver';
import { useGlobalContext } from '../../GlobalVariables';

const Template = () => {
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
  const [customQuestions, setCustomQuestions] = useState(() => {
    const savedQuestions = localStorage.getItem('customQuestions');
    return savedQuestions ? JSON.parse(savedQuestions) : [];
  });
  const [templateError, setTemplateError] = useState('');
  const [newParam, setNewParam] = useState({ name: '', description: '', type: 'string' });
  const [detectedParams, setDetectedParams] = useState([]); // Store detected parameters
  const [successMessage, setSuccessMessage] = useState('');
  const { nodes, setNodes, edges, setEdges } = useGlobalContext();

  // Effect to clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Effect to save customQuestions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('customQuestions', JSON.stringify(customQuestions));
  }, [customQuestions]);

  const handleQuestionSelect = (e) => {
    const questionId = e.target.value;
    const allQuestions = [...arabicQuestions, ...customQuestions];
    const selected = allQuestions.find((q) => q.id === parseInt(questionId));
    setSelectedQuestion(selected);
    setQueryParameters({});
    setQueryResult('');
    setError('');
  };

  const handleParameterChange = (e, paramName) => {
    const value = e.target.value;
    const type = selectedQuestion.parameterTypes[paramName];
    const parsedValue = type === 'int' ? parseInt(value, 10) : value;
    setQueryParameters((prev) => ({ ...prev, [paramName]: parsedValue }));
  };

  const executeQuery = async () => {
    if (!selectedQuestion) return;

    setIsLoading(true);
    setError('');
    setQueryResult('');

    try {
      const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', '12345678'));
      const nvlResult = await driver.executeQuery(
        selectedQuestion.query,
        queryParameters,
        { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
      );
      try {
        const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlResult.records);
        if (newNodes.length > 0 || newEdges.length > 0) {
          setNodes([...nodes.filter((n) => !newNodes.some((nn) => nn.id === n.id)), ...newNodes]);
          setEdges([...edges.filter((e) => !newEdges.some((ne) => ne.id === e.id)), ...newEdges]);
          setQueryResult('تم تحديث الرسم البياني بالعقد والحواف الجديدة.');
        } else {
          setQueryResult('النتيجة فارغة.');
          throw new Error('النتيجة فارغة');
        }
      } catch (graphError) {
        setQueryResult(
          'لا يمكن تحويل نتيجة الاستعلام إلى رسم بياني. قد لا يُرجع الاستعلام العُقد والعلاقات. يرجى تعديل استعلام Cypher لإرجاع بيانات متوافقة مع الرسم البياني (العُقد والعلاقات).'
        );
      } finally {
        await driver.close();
      }
    } catch (error) {
      setError(`خطأ في تنفيذ الاستعلام: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatQueryResult = (result) => {
    if (!result || result.length === 0) return 'لا توجد بيانات.';
    return result
      .map((item, index) => {
        const properties = Object.entries(item).map(([key, value]) => `${key}: ${value}`).join('\n');
        return `النتيجة ${index + 1}:\n${properties}`;
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
    // Detect parameters from the query
    detectQueryParameters(value);
  };

  const detectQueryParameters = (query) => {
    // Match parameters like $paramName in the query
    const paramRegex = /\$([a-zA-Z][a-zA-Z0-9]*)/g;
    const detected = [...new Set(query.match(paramRegex)?.map((p) => p.slice(1)) || [])];
    setDetectedParams(detected);

    // If no parameter is currently being edited, set the first detected parameter
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
      // Update detectedParams to remove the added parameter
      setDetectedParams((prev) => prev.filter((p) => p !== name));
    } else {
      setTemplateError('يرجى إدخل اسم ووصف ونوع صالح للمتغير!');
    }
  };

  const removeParameter = (paramName) => {
    setNewTemplate((prev) => {
      const { [paramName]: _, ...remainingParams } = prev.parameters;
      const { [paramName]: __, ...remainingTypes } = prev.parameterTypes;
      return { ...prev, parameters: remainingParams, parameterTypes: remainingTypes };
    });
    // Re-add the removed parameter to detectedParams if it was detected
    if (detectedParams.includes(paramName) || newTemplate.query.includes(`$${paramName}`)) {
      setDetectedParams((prev) => [...new Set([...prev, paramName])]);
    }
  };

  const generateRandomParameters = (parameterTypes) => {
    const randomParams = {};
    Object.entries(parameterTypes).forEach(([paramName, type]) => {
      if (type === 'int') {
        randomParams[paramName] = Math.floor(Math.random() * 100); // Random integer between 0 and 99
      } else {
        randomParams[paramName] = `test_${paramName}_${Math.random().toString(36).substring(2, 8)}`; // Random string
      }
    });
    return randomParams;
  };

  const verifyQuery = async (query, parameters, parameterTypes) => {
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', '12345678'));
    try {
      const randomParams = generateRandomParameters(parameterTypes);
      const nvlResult = await driver.executeQuery(query, randomParams, {
        resultTransformer: neo4j.resultTransformers.eagerResultTransformer(),
      });
      const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlResult.records);
      if (newNodes.length === 0 && newEdges.length === 0) {
        throw new Error('الاستعلام لا يُرجع عُقد أو علاقات.');
      }
      return true;
    } catch (error) {
      throw new Error(`فشل التحقق من الاستعلام: ${error.message}`);
    } finally {
      await driver.close();
    }
  };

  const addAbstractQuestionTemplate = async (userTemplate) => {
    const requiredFields = ['question', 'query', 'parameters', 'parameterTypes'];
    for (const field of requiredFields) {
      if (!(field in userTemplate) || !userTemplate[field]) {
        throw new Error(`الحقل المطلوب مفقود أو فارغ: ${field}`);
      }
    }
    const paramKeys = Object.keys(userTemplate.parameters);
    const typeKeys = Object.keys(userTemplate.parameterTypes);
    if (paramKeys.length !== typeKeys.length || !paramKeys.every((key) => typeKeys.includes(key))) {
      throw new Error('عدم تطابق بين المتغيرات وأنواعها');
    }
    const validTypes = ['string', 'int'];
    for (const type of Object.values(userTemplate.parameterTypes)) {
      if (!validTypes.includes(type)) {
        throw new Error(`نوع متغير غير صالح: ${type}. يجب أن يكون string أو int`);
      }
    }
    const query = userTemplate.query.toLowerCase();
    if (!query.includes('match') || !query.includes('return')) {
      throw new Error('استعلام Cypher غير صالح: يجب أن يحتوي على MATCH و RETURN');
    }

    // Verify query by executing with random parameters
    await verifyQuery(userTemplate.query, userTemplate.parameters, userTemplate.parameterTypes);

    const newId = Math.max(...arabicQuestions.map((q) => q.id), ...customQuestions.map((q) => q.id), 0) + 1;
    const newQuestion = { id: newId, ...userTemplate };
    setCustomQuestions((prev) => [...prev, newQuestion]);
    setNewTemplate({ question: '', query: '', parameters: {}, parameterTypes: {} });
    setShowNewTemplateForm(false);
    setTemplateError('');
    setSuccessMessage('تم إضافة القالب بنجاح!');
  };

  const saveNewTemplate = async () => {
    try {
      await addAbstractQuestionTemplate(newTemplate);
    } catch (error) {
      setTemplateError(`خطأ في حفظ القالب: ${error.message}`);
    }
  };

  return (
    <div className="template-container">
      <h3 className="header">إدارة القوالب والاستعلامات</h3>
      <p className="subheader">اختر سؤالًا مسبقًا لمساعدتك في استعلام قاعدة البيانات:</p>

      <select onChange={handleQuestionSelect} className="question-select">
        <option value="">اختر سؤالًا...</option>
        {[...arabicQuestions, ...customQuestions].map((q) => (
          <option key={q.id} value={q.id}>{q.question}</option>
        ))}
      </select>

      <button className="add-template-button" onClick={() => setShowNewTemplateForm(true)}>
        إضافة قالب جديد
      </button>

      {showNewTemplateForm && (
        <div className="modal-overlay">
          <div className="new-template-modal">
            <h5>إضافة قالب جديد</h5>
            <input
              type="text"
              name="question"
              value={newTemplate.question}
              onChange={handleNewTemplateChange}
              placeholder="أدخل السؤال (بالعربية)"
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
              placeholder="أدخل استعلام Cypher"
            />
            <h6>المتغيرات</h6>
            {detectedParams.length > 0 && (
              <div className="detected-params">
                <p>المتغيرات المكتشفة:</p>
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
                placeholder="اسم المتغير (بالإنجليزية)"
              />
              <input
                type="text"
                name="description"
                value={newParam.description}
                onChange={handleNewParamChange}
                placeholder="وصف المتغير (بالعربية)"
              />
              <select name="type" value={newParam.type} onChange={handleNewParamChange}>
                <option value="string">String</option>
                <option value="int">Int</option>
              </select>
              <button className="add-parameter-button" onClick={addNewParameter}>
                إضافة
              </button>
            </div>
            <div className="parameter-list">
              {Object.entries(newTemplate.parameters).map(([paramName, paramDescription]) => (
                <div key={paramName} className="parameter-item">
                  <span>{paramDescription} ({paramName}): {newTemplate.parameterTypes[paramName]}</span>
                  <button onClick={() => removeParameter(paramName)}>حذف</button>
                </div>
              ))}
            </div>
            {templateError && <p className="error-text">{templateError}</p>}
            <div className="modal-buttons">
              <button className="save-button" onClick={saveNewTemplate}>حفظ القالب</button>
              <button className="cancel-button" onClick={() => setShowNewTemplateForm(false)}>إلغاء</button>
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
          <h5 className="section-title">السؤال المحدد:</h5>
          <p className="selected-question">{selectedQuestion.question}</p>
          {Object.entries(selectedQuestion.parameters).map(([paramName, paramDescription]) => (
            <div key={paramName} className="parameter-input">
              <label className="parameter-label">{paramDescription}:</label>
              <input
                type="text"
                value={queryParameters[paramName] || ''}
                onChange={(e) => handleParameterChange(e, paramName)}
                placeholder={`أدخل ${paramDescription}`}
                className="parameter-field"
              />
            </div>
          ))}
          <button className="execute-button" onClick={executeQuery} disabled={isLoading}>
            {isLoading ? 'جاري التنفيذ...' : 'تنفيذ الاستعلام'}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <h5 className="error-title">خطأ:</h5>
          <p className="error-text">{error}</p>
        </div>
      )}

      {queryResult && (
        <div className="result-section">
          <h5 className="section-title">نتيجة الاستعلام:</h5>
          <pre className="result-pre">{queryResult}</pre>
        </div>
      )}
    </div>
  );
};

export default Template;