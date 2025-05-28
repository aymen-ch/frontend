import React from 'react';
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
    { value: 'tomasonjo/codestral-text2cypher:latest', label: 'text2cypher 22.2b' },
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
    <div className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow-chat">
      <textarea
        className="w-full p-2.5 rounded-md border border-gray-300 text-sm resize-none min-h-[60px] leading-relaxed disabled:bg-gray-200 disabled:cursor-not-allowed focus:border-chat-blue focus:outline-none"
        placeholder="Tapez un message..."
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

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-sm text-gray-600">Vue :</label>
          <select
            className="p-1 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-200 disabled:cursor-not-allowed focus:border-chat-blue focus:outline-none"
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            disabled={isLoading}
          >
            <option value="Graph">Graphique</option>
            <option value="Table">Tableau</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-sm text-gray-600">Modèle:</label>
          <select
            className="p-1 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-200 disabled:cursor-not-allowed focus:border-chat-blue focus:outline-none"
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

        <button
          className="bg-chat-blue text-white px-3.5 py-2 rounded-md font-medium hover:bg-chat-blue-hover disabled:bg-chat-disabled disabled:cursor-not-allowed transition-colors"
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default ChatInput;