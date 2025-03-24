import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Chat.css';
import { BASE_URL } from '../../../utils/Urls';
import neo4j from "neo4j-driver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faCopy,
  faCheck,
  faTimes,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { convertNeo4jToGraph,convertNeo4jToTable } from './graphconvertor';
const Chat = ({ nodes, edges, setNodes, setEdges, selectedNodes }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseType, setResponseType] = useState('Text');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(null); // Tracks which message ID's query is shown in modal
  const [editingQueryId, setEditingQueryId] = useState(null);
  const [editedQuery, setEditedQuery] = useState('');

  const handleEditQuery = (messageId, currentQuery) => {
    setEditingQueryId(messageId);
    setEditedQuery(currentQuery);
  };

  const handleSaveQueryEdit = async (messageId) => {
    try {
      const response = await axios.post(
        BASE_URL + '/chatbot/',
        {
          question: messages.find(msg => msg.id === messageId).text,
          answer_type: 'graph',
          cypher_query: editedQuery
        }
      );

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, cypherQuery: editedQuery } : msg
        )
      );

      const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "12345678"));
      const nvlGraph = await driver.executeQuery(
        editedQuery,
        {},
        { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
      );

      const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlGraph.records);
      setNodes([...nodes, ...newNodes]);
      setEdges([...edges, ...newEdges]);

    } catch (error) {
      console.error('Error updating query:', error);
    } finally {
      setEditingQueryId(null);
      setEditedQuery('');
    }
  };

  const handleCancelQueryEdit = () => {
    setEditingQueryId(null);
    setEditedQuery('');
  };

  const handleShowQueryModal = (messageId) => {
    setShowQueryModal(messageId);
  };

  const handleCloseQueryModal = () => {
    setShowQueryModal(null);
    setEditingQueryId(null);
    setEditedQuery('');
  };

  useEffect(() => {
    if (selectedNodes.length > 0) {
      const selectedNodeIds = selectedNodes.map(node => node.id).join(', ');
      setInputText(`لقد قمت بتحديد العقد التالية بالمعرفات: ${selectedNodeIds}`);
    } else {
      setInputText('');
    }
  }, [selectedNodes]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = { id: messages.length + 1, text: inputText, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        BASE_URL + '/chatbot/',
        {
          question: inputText,
          answer_type: responseType,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (responseType === 'graph') {
        const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "12345678"));
        const nvlGraph = await driver.executeQuery(
          response.data.cypher,
          {},
          { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
        );

        console.log(nvlGraph)
        const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlGraph.records);
      setNodes([...nodes, ...newNodes]);
      setEdges([...edges, ...newEdges]);

        const botMessage = {
          id: messages.length + 2,
          text: 'تم تحديث الرسم البياني بالعقد والحواف الجديدة.',
          sender: 'bot',
          cypherQuery: response.data.cypher
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }else if (responseType === 'table') {
        const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "12345678"));
        const nvlTable = await driver.executeQuery(
          response.data.cypher, // Assuming the backend returns a cypher query for tables
          {},
          { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
        );
        const { columns, rows } = convertNeo4jToTable(nvlTable.records);
        console.log(columns,rows)
        const botMessage = {
          id: messages.length + 2,
          text: JSON.stringify({ columns, rows }, null, 2), // For simplicity, display as JSON
          sender: 'bot',
          cypherQuery: response.data.cypher,
          type: 'table', // Optional: to render as a table in UI
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        const botMessage = {
          id: messages.length + 2,
          text: responseType === 'JSON'
            ? JSON.stringify(response.data, null, 2)
            : response.data.response.replace(/\n/g, '<br>'),
          sender: 'bot',
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: 'Failed to get a response from the chatbot.',
        sender: 'error',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = (messageId, currentText) => {
    setEditingMessageId(messageId);
    setEditedText(currentText);
  };

  const handleSaveEdit = (messageId) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, text: editedText } : msg
      )
    );
    setEditingMessageId(null);
    setEditedText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedText('');
  };

  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(text);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };
  return (
    <div className="chat-container">
      <h3 className="chat-header">Chat</h3>
      <p className="chat-subheader">Interact with the graph using the chat.</p>

      <div className="chat-window">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {editingMessageId === message.id ? (
              <div className="edit-message">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="edit-textarea"
                />
                <div className="edit-actions">
                  <button
                    className="save-button"
                    onClick={() => handleSaveEdit(message.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Save
                  </button>
                  <button className="cancel-button" onClick={handleCancelEdit}>
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <strong>{message.sender === 'user' ? 'You:' : 'Bot:'}</strong>{' '}
                {message.type === 'table' ? (
                  (() => {
                    const { columns, rows } = JSON.parse(message.text);
                    return (
                      <div className="table-wrapper">
                        <table className="styled-table">
                          <thead>
                            <tr>
                              {columns.map(col => (
                                <th key={col.key}>{col.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {columns.map(col => (
                                  <td key={col.key}>{row[col.key]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                ) : (
                  <span className="message-text">{message.text}</span>
                )}
                {message.cypherQuery && (
                  <button
                    className="toggle-query-button"
                    onClick={() => handleShowQueryModal(message.id)}
                  >
                    <FontAwesomeIcon icon={faEye} /> Show Query
                  </button>
                )}
                <div className="message-actions">
                  {message.sender === 'user' && (
                    <button
                      className="edit-button"
                      onClick={() => handleEditMessage(message.id, message.text)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  )}
                  <button
                    className="copy-button"
                    onClick={() => handleCopyMessage(message.text)}
                  >
                    <FontAwesomeIcon
                      icon={copiedMessageId === message.text ? faCheck : faCopy}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {/* ... Query Modal ... */}

      <div className="input-group">
        <textarea
          className="chat-input"
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
        <select
          className="response-type-dropdown"
          value={responseType}
          onChange={(e) => setResponseType(e.target.value)}
          disabled={isLoading}
        >
          <option value="Text">Text</option>
          <option value="JSON">JSON</option>
          <option value="graph">Graph</option>
          <option value="table">Table</option>
        </select>
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;