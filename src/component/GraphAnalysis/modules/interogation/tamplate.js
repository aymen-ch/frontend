import React, { useState } from 'react';
import './Template.css'; // Import the CSS file for styling
import { BASE_URL } from '../../utils/Urls';
import { arabicQuestions } from './tamplate_question';

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
  const [customQuestions, setCustomQuestions] = useState([]);

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

    setQueryParameters((prevParams) => ({
      ...prevParams,
      [paramName]: parsedValue,
    }));
  };

  const executeQuery = async () => {
    if (selectedQuestion) {
      setIsLoading(true);
      setError('');
      setQueryResult('');

      try {
        const payload = {
          query: selectedQuestion.query,
          parameters: queryParameters,
        };

        const response = await fetch(BASE_URL + '/run/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to execute query');

        const data = await response.json();
        const formattedResult = formatQueryResult(data.result);
        setQueryResult(formattedResult);
      } catch (error) {
        console.error('Error executing query:', error);
        setError(`خطأ: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatQueryResult = (result) => {
    if (!result || result.length === 0) return 'لا توجد بيانات.';
    return result
      .map((item, index) => {
        const properties = Object.entries(item)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        return `النتيجة ${index + 1}:\n${properties}`;
      })
      .join('\n\n');
  };

  const handleNewTemplateChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addNewParameter = () => {
    const paramName = prompt('أدخل اسم المتغير (بالإنجليزية):');
    const paramDescription = prompt('أدخل وصف المتغير (بالعربية):');
    const paramType = prompt('أدخل نوع المتغير (int أو string):');

    if (paramName && paramDescription && (paramType === 'int' || paramType === 'string')) {
      setNewTemplate((prev) => ({
        ...prev,
        parameters: { ...prev.parameters, [paramName]: paramDescription },
        parameterTypes: { ...prev.parameterTypes, [paramName]: paramType },
      }));
    } else {
      alert('يرجى إدخال بيانات صحيحة للمتغير!');
    }
  };

  const saveNewTemplate = () => {
    if (!newTemplate.question || !newTemplate.query) {
      alert('يرجى ملء جميع الحقول المطلوبة!');
      return;
    }

    const newId = Math.max(...arabicQuestions.map((q) => q.id), ...customQuestions.map((q) => q.id), 0) + 1;
    const newQuestion = { id: newId, ...newTemplate };
    setCustomQuestions((prev) => [...prev, newQuestion]);
    setNewTemplate({ question: '', query: '', parameters: {}, parameterTypes: {} });
    setShowNewTemplateForm(false);
  };

  return (
    <div className="template-container">
      <h3 className="header">إدارة القوالب والاستعلامات</h3>
      <p className="subheader">اختر سؤالًا مسبقًا لمساعدتك في استعلام قاعدة البيانات:</p>

      <select onChange={handleQuestionSelect} className="question-select">
        <option value="">اختر سؤالًا...</option>
        {[...arabicQuestions, ...customQuestions].map((q) => (
          <option key={q.id} value={q.id}>
            {q.question}
          </option>
        ))}
      </select>

      <button
        className="add-template-button"
        onClick={() => setShowNewTemplateForm(true)}
      >
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
            <textarea
              name="query"
              value={newTemplate.query}
              onChange={handleNewTemplateChange}
              placeholder="أدخل استعلام Cypher"
              className="new-template-textarea"
            />
            <div>
              <h6>المتغيرات:</h6>
              {Object.entries(newTemplate.parameters).map(([paramName, paramDescription]) => (
                <p key={paramName}>
                  {paramDescription} ({paramName}): {newTemplate.parameterTypes[paramName]}
                </p>
              ))}
              <button onClick={addNewParameter}>إضافة متغير</button>
            </div>
            <div className="modal-buttons">
              <button onClick={saveNewTemplate}>حفظ القالب</button>
              <button onClick={() => setShowNewTemplateForm(false)}>إلغاء</button>
            </div>
          </div>
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