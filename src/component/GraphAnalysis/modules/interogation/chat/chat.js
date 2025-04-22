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
import "@fontsource/fira-code"; // Fira Code font
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Using Dracula theme
import { convertNeo4jToGraph, convertNeo4jToTable } from './graphconvertor';
import ChatInput from './input';

const Chat = ({ nodes, edges, setNodes, setEdges, selectedNodes }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseType, setResponseType] = useState('Graph');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(null);
  const [editingQueryId, setEditingQueryId] = useState(null);
  const [editedQuery, setEditedQuery] = useState('');
  const [maxCorrections, setMaxCorrections] = useState(3); // Default max corrections
  const [selectedModel, setSelectedModel] = useState('hf.co/DavidLanz/text2cypher-gemma-2-9b-it-finetuned-2024v1:latest'); // Default model
  const handleEditQuery = (messageId, currentQuery) => {
    setEditingQueryId(messageId);
    setEditedQuery(currentQuery);
  };

  const handleSaveQueryEdit = async (messageId) => {
    try {
      setIsLoading(true);
      const originalMessage = messages.find(msg => msg.id === messageId);
      console.log(originalMessage)
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, cypherQuery: editedQuery } : msg
        )
      );
  
      const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "12345678"));
      const nvlResult = await driver.executeQuery(
        editedQuery,
        {},
        { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
      );
  
      const originalResponseType = originalMessage.type === 'Table' ? 'Table' : 'Graph';
      console.log(originalResponseType)
      if (originalResponseType === 'Graph') {
        try {
          const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlResult.records);
          
          if (newNodes.length > 0 || newEdges.length > 0) {
            setNodes([...nodes.filter(n => !newNodes.some(nn => nn.id === n.id)), ...newNodes]);
            setEdges([...edges.filter(e => !newEdges.some(ne => ne.id === e.id)), ...newEdges]);
            
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === messageId
                  ? { 
                      ...msg, 
                      text: 'تم تحديث الرسم البياني بالعقد والحواف الجديدة.',
                      cypherQuery: editedQuery,
                      sender: 'bot'
                    }
                  : msg
              )
            );
          } else {
            throw new Error("No valid graph data returned");
          }
        } catch (conversionError) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === messageId
                ? { 
                    ...msg, 
                    text: 'لا يمكن تحويل نتيجة الاستعلام إلى رسم بياني. يرجى تصحيح استعلام Cypher لإرجاع العُقد والعلاقات.',
                    cypherQuery: editedQuery,
                    sender: 'bot'
                  }
                : msg
            )
          );
        }
      } else if (originalResponseType === 'Table') {
        const { columns, rows } = convertNeo4jToTable(nvlResult.records);
        console.log("him")
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? { 
                  ...msg, 
                  text: JSON.stringify({ columns, rows }, null, 2),
                  cypherQuery: editedQuery,
                  sender: 'bot',
                  type: 'Table'
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error updating and executing query:', error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: 'Error executing query: ' + error.message, sender: 'error' }
            : msg
        )
      );
    } finally {
      setEditingQueryId(null);
      setEditedQuery('');
      setShowQueryModal(null);
      setIsLoading(false);
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
    console.log('selectedNodes:', selectedNodes);
    if (selectedNodes.size > 0) {
      const selectedNodeObjects = Array.from(selectedNodes)
        .map(nodeId => nodes.find(node => node.id === nodeId))
        .filter(node => node);

      if (selectedNodeObjects.length > 0) {
        const formattedText = selectedNodeObjects
          .map(node => `${node.group || 'Unknown'}: ${node.id}`)
          .join(', ');

        setInputText(`Selected: ${formattedText}`);
      } else {
        setInputText('No valid nodes found');
      }
    } else {
      setInputText('');
    }
  }, [selectedNodes, nodes]);

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
          model:selectedModel,
          maxCorrections:maxCorrections
          
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      // Check if the API response is "je ne peux pas repondre"
      if (response.data.response === "je ne peux pas répondre") {
        const botMessage = {
          id: messages.length + 2,
          text: 'je ne peux pas repondre. يرجى تصحيح استعلام Cypher أو تقديم سؤال أكثر تحديدًا.',
          sender: 'bot',
          type:responseType,
          cypherQuery: response.data.cypher || null, // Always include cypherQuery if available
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        return;
      }
  
      if (responseType === 'Graph') {
        const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "12345678"));
        const nvlGraph = await driver.executeQuery(
          response.data.cypher,
          {},
          { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
        );
  
        try {
          const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlGraph.records);
          
          if (newNodes.length > 0 || newEdges.length > 0) {
            setNodes([...nodes, ...newNodes]);
            setEdges([...edges, ...newEdges]);
            
            const botMessage = {
              id: messages.length + 2,
              text: 'تم تحديث الرسم البياني بالعقد والحواف الجديدة.',
              sender: 'bot',
              type:"graph",
              cypherQuery: response.data.cypher // Always include cypherQuery
            };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
          } else {
            throw new Error("No valid graph data returned");
          }
        } catch (conversionError) {
          const botMessage = {
            id: messages.length + 2,
            text: 'لا يمكن تحويل نتيجة الاستعلام إلى رسم بياني. يرجى تصحيح استعلام Cypher لإرجاع العُقد والعلاقات.',
            sender: 'bot',
            type: 'Graph',
            cypherQuery: response.data.cypher // Always include cypherQuery
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
      } else if (responseType === 'Table') {
        const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "12345678"));
        const nvlTable = await driver.executeQuery(
          response.data.cypher,
          {},
          { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
        );
        try {
          const { columns, rows } = convertNeo4jToTable(nvlTable.records);
          const botMessage = {
            id: messages.length + 2,
            text: JSON.stringify({ columns, rows }, null, 2),
            sender: 'bot',
            cypherQuery: response.data.cypher, // Always include cypherQuery
            type: 'Table',
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (conversionError) {
          const botMessage = {
            id: messages.length + 2,
            text: 'لا يمكن تحويل نتيجة الاستعلام إلى جدول. يرجى تصحيح استعلام Cypher لإرجاع بيانات صحيحة.',
            sender: 'bot',
            cypherQuery: response.data.cypher // Always include cypherQuery
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
      } else {
        const botMessage = {
          id: messages.length + 2,
          text: responseType === 'JSON'
            ? JSON.stringify(response.data, null, 2)
            : response.data.response.replace(/\n/g, '<br>'),
          sender: 'bot',
          cypherQuery: response.data.cypher || null // Include cypherQuery if available
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: 'فشل في الحصول على رد من الشات بوت: ' + error.message,
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
                {message.type === 'Table' ? (
                  (() => {
                    try {
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
                    } catch (error) {
                      return (
                        <span className="message-text" dangerouslySetInnerHTML={{ __html: message.text }} />
                      );
                    }
                  })()
                ) : (
                  <span className="message-text" dangerouslySetInnerHTML={{ __html: message.text }} />
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

      {showQueryModal && (
        <div className="query-modal-overlay" onClick={handleCloseQueryModal}>
          <div 
            className="query-modal" 
            onClick={e => e.stopPropagation()}
          >
            <div className="query-modal-header">
              <h4>Cypher Query</h4>
              <button 
                className="close-modal-button" 
                onClick={handleCloseQueryModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {editingQueryId === showQueryModal ? (
              <div className="query-edit-container">
                <textarea
                  className="query-edit-textarea"
                  value={editedQuery}
                  onChange={(e) => setEditedQuery(e.target.value)}
                  rows="6"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    background: '#2d2d2d',
                    color: '#d4d4d4',
                    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
                    fontSize: '14px',
                    resize: 'vertical',
                    marginBottom: '15px',
                    border: '1px solid #3e3e3e'
                  }}
                />
                <div className="query-edit-actions">
                  <button
                    className="save-query-button"
                    onClick={() => handleSaveQueryEdit(showQueryModal)}
                    style={{
                      background: '#2ecc71',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Save & Execute
                  </button>
                  <button
                    className="cancel-query-button"
                    onClick={handleCancelQueryEdit}
                    style={{
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="query-view-container">
                <SyntaxHighlighter
                  language="cypher"
                  style={dracula}
                  customStyle={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginBottom: '15px',
                    borderRadius: '4px',
                    padding: '15px',
                    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
                    fontSize: '14px',
                    border: '1px solid #3e3e3e'
                  }}
                  showLineNumbers
                >
                  {messages.find(msg => msg.id === showQueryModal)?.cypherQuery || ''}
                </SyntaxHighlighter>
                <button
                  className="edit-query-button"
                  onClick={() => handleEditQuery(
                    showQueryModal,
                    messages.find(msg => msg.id === showQueryModal)?.cypherQuery
                  )}
                  style={{
                    background: '#4a90e2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit Query
                </button>
              </div>
            )}
          </div>
        </div>
      )}

<ChatInput
        inputText={inputText}
        setInputText={setInputText}
        responseType={responseType}
        setResponseType={setResponseType}
        isLoading={isLoading}
        handleSendMessage={handleSendMessage}
        maxCorrections={maxCorrections}
        setMaxCorrections={setMaxCorrections}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
};

export default Chat;