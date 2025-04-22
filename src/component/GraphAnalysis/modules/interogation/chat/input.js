import React from 'react';
import './Chat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const ChatInput = ({
  inputText,
  setInputText,
  responseType,
  setResponseType,
  isLoading,
  handleSendMessage,
  maxCorrections,
  setMaxCorrections,
  selectedModel,
  setSelectedModel,
}) => {
  const modelOptions = [
    { value: 'hf.co/DavidLanz/text2cypher-gemma-2-9b-it-finetuned-2024v1:latest', label: 'text2cypher9b' },
    { value: 'codestral text2cypher 12b', label: 'text2cypher12b' },
    { value: 'llama3.2:latest', label: 'llama 3b' },
  ];

  const handleIncrement = () => setMaxCorrections((prev) => prev + 1);
  const handleDecrement = () => setMaxCorrections((prev) => (prev > 0 ? prev - 1 : 0));
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === '') setMaxCorrections('');
    else if (!isNaN(Number(value)) && Number(value) >= 0) setMaxCorrections(Number(value));
  };
  const handleBlur = () => {
    if (maxCorrections === '' || isNaN(maxCorrections)) setMaxCorrections(0);
  };

  return (
    <div className="chat-container">
      <textarea
        className="chat-input-area"
        placeholder="Type a message..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        disabled={isLoading}
        rows="3"
      />

      <div className="chat-toolbar">
        <div className="toolbar-group">
          <label className="toolbar-label">View:</label>
          <select
            className="toolbar-select"
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            disabled={isLoading}
          >
            <option value="Graph">Graph</option>
            <option value="Table">Table</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">Corrections:</label>
          <div className="correction-input">
            <button
              className="icon-button"
              onClick={handleDecrement}
              disabled={isLoading || maxCorrections <= 0}
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <input
              type="number"
              className="corrections-number"
              value={maxCorrections}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={isLoading}
              min="0"
            />
            <button
              className="icon-button"
              onClick={handleIncrement}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label">Model:</label>
          <select
            className="toolbar-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
          >
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button className="send-button" onClick={handleSendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
