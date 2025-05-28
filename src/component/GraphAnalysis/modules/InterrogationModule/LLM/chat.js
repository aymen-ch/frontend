import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import neo4j from 'neo4j-driver';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faCopy,
  faCheck,
  faTimes,
  faEye,
  faRedo,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import '@fontsource/fira-code';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { convertNeo4jToGraph, convertNeo4jToTable } from './ResultTransformer';
import ChatInput from './input';
import { useTranslation } from 'react-i18next';
import { URI, USER, PASSWORD } from '../../../Platforme/Urls';

const Chat = ({ nodes, edges, setNodes, setEdges, selectedNodes }) => {
  const { t } = useTranslation();
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
  const [maxCorrections, setMaxCorrections] = useState(1);
  const [hedeaerreponse, setheader] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest');
  const [collapsedTables, setCollapsedTables] = useState({});
  const chatWindowRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleTableCollapse = (messageId) => {
    setCollapsedTables((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleEditQuery = (messageId, currentQuery) => {
    setEditingQueryId(messageId);
    setEditedQuery(currentQuery);
  };

  const handleSaveQueryEdit = async (messageId) => {
    try {
      setIsLoading(true);
      const originalMessage = messages.find((msg) => msg.id === messageId);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, cypherQuery: editedQuery } : msg
        )
      );

      const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
      const nvlResult = await driver.executeQuery(
        editedQuery,
        {},
        { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
      );

      const originalResponseType = originalMessage.type === 'Table' ? 'Table' : 'Graph';
      if (originalResponseType === 'Graph') {
        try {
          const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlResult.records);
          if (newNodes.length > 0 || newEdges.length > 0) {
            setNodes([...nodes.filter((n) => !newNodes.some((nn) => nn.id === n.id)), ...newNodes]);
            setEdges([...edges.filter((e) => !newEdges.some((ne) => ne.id === e.id)), ...newEdges]);
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      text: 'تم تحديث الرسم البياني بالعقد والحواف الجديدة.',
                      cypherQuery: editedQuery,
                      sender: 'bot',
                    }
                  : msg
              )
            );
          } else {
            throw new Error('No valid graph data returned');
          }
        } catch (conversionError) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    text: 'لا يمكن تحويل نتيجة الاستعلام إلى رسم بياني. يرجى تصحيح استعلام Cypher لإرجاع العُقد والعلاقات.',
                    cypherQuery: editedQuery,
                    sender: 'bot',
                  }
                : msg
            )
          );
        }
      } else if (originalResponseType === 'Table') {
        const { columns, rows } = convertNeo4jToTable(nvlResult.records);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  text: JSON.stringify({ columns, rows }, null, 2),
                  cypherQuery: editedQuery,
                  sender: 'bot',
                  type: 'Table',
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

  const formatSelectedNodes = () => {
    if (selectedNodes.size === 0) return '';
    const selectedNodeObjects = Array.from(selectedNodes)
      .map((nodeId) => nodes.find((node) => node.id === nodeId))
      .filter((node) => node);
    return selectedNodeObjects
      .map((node) => `${node.group || 'Unknown'}:${node.id}`)
      .join(',');
  };

  useEffect(() => {
    const formattedNodes = formatSelectedNodes();
    if (formattedNodes) {
      setInputText(`محدد: ${formattedNodes}`);
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
    const formattedSelectedNodes = formatSelectedNodes();
    try {
      const response = await axios.post(
        BASE_URL_Backend + '/chatbot/',
        {
          question: inputText,
          answer_type: responseType,
          model: selectedModel,
          maxCorrections: maxCorrections,
          selected_nodes: formattedSelectedNodes,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const rawResponse = {
        ...response.data,
        question: inputText,
      };

      if (response.data.response === 'je ne peux pas répondre') {
        const botMessage = {
          id: messages.length + 2,
          text: 'je ne peux pas repondre. يرجى تصحيح استعلام Cypher أو تقديم سؤال أكثر تحديدًا.',
          sender: 'bot',
          type: responseType,
          cypherQuery: response.data.cypher || null,
          rawResponse,
          isResumed: false,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        return;
      }

      if (responseType === 'Graph') {
        const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
        const nvlGraph = await driver.executeQuery(
          response.data.cypher,
          {},
          { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
        );

        try {
          const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlGraph.records);
          if (newNodes.length > 0 || newEdges.length > 0) {
            const uniqueNewNodes = newNodes.filter(
              (newNode) => !nodes.some((existingNode) => existingNode.id === newNode.id)
            );
            const uniqueNewEdges = newEdges.filter(
              (newEdge) => !edges.some((existingEdge) => existingEdge.id === newEdge.id)
            );
            if (uniqueNewNodes.length > 0 || uniqueNewEdges.length > 0) {
              setNodes([...nodes, ...uniqueNewNodes]);
              setEdges([...edges, ...uniqueNewEdges]);
              const botMessage = {
                id: messages.length + 2,
                text: 'تم تحديث الرسم البياني بالعقد والحواف الجديدة.',
                sender: 'bot',
                type: 'Graph',
                cypherQuery: response.data.cypher,
                rawResponse,
                isResumed: false,
              };
              setMessages((prevMessages) => [...prevMessages, botMessage]);
            } else {
              throw new Error('No new unique nodes or edges to add');
            }
          } else {
            throw new Error('No valid graph data returned');
          }
        } catch (conversionError) {
          const botMessage = {
            id: messages.length + 2,
            text: 'لا يمكن تحويل نتيجة الاستعلام إلى رسم بياني. يرجى تصحيح استعلام Cypher لإرجاع العُقد والعلاقات.',
            type: 'Graph',
            cypherQuery: response.data.cypher,
            rawResponse,
            isResumed: false,
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
      } else if (responseType === 'Table') {
        const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
        const nvlTable = await driver.executeQuery(
          response.data.cypher,
          {},
          { database: 'dab', resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
        );
        try {
          const { columns, rows } = convertNeo4jToTable(nvlTable.records);
          const botMessage = {
            id: messages.length + 2,
            text: JSON.stringify({ columns, rows }, null, 2),
            sender: 'bot',
            cypherQuery: response.data.cypher,
            type: 'Table',
            rawResponse,
            isResumed: false,
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (conversionError) {
          const botMessage = {
            id: messages.length + 2,
            text: 'لا يمكن تحويل نتيجة الاستعلام إلى جدول. يرجى تصحيح استعلام Cypher لإرجاع بيانات صحيحة.',
            sender: 'bot',
            cypherQuery: response.data.cypher,
            rawResponse,
            isResumed: false,
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        }
      } else {
        const botMessage = {
          id: messages.length + 2,
          text:
            responseType === 'JSON'
              ? JSON.stringify(response.data, null, 2)
              : response.data.response.replace(/\n/g, '<br>'),
          sender: 'bot',
          cypherQuery: response.data.cypher || null,
          rawResponse,
          isResumed: false,
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

  const handleResumeResponse = async (messageId) => {
    const botMessage = messages.find((msg) => msg.id === messageId);
    if (!botMessage || !botMessage.rawResponse) {
      console.error('No raw response available for resuming');
      return;
    }

    const userMessage = messages
      .slice(0, messages.indexOf(botMessage))
      .reverse()
      .find((msg) => msg.sender === 'user');

    if (!userMessage) {
      console.error('No corresponding user message found for resuming');
      return;
    }

    setIsLoading(true);

    try {
      const resumeEndpoint = BASE_URL_Backend + '/chatbot/resume/';
      const response = await axios.post(
        resumeEndpoint,
        {
          raw_response: botMessage.rawResponse,
          model: selectedModel,
          question: userMessage.text,
          cypher_query: botMessage.cypherQuery || '',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const resumedResponse = response.data;
      const newBotMessage = {
        id: messages.length + 1,
        text: resumedResponse.response || 'Resumed response processed.',
        sender: 'bot',
        type: 'Text',
        cypherQuery: resumedResponse.cypher || null,
        rawResponse: resumedResponse,
        isResumed: true,
      };

      if (resumedResponse.cypher && (botMessage.type === 'Graph' || botMessage.type === 'Table')) {
        const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
        const nvlResult = await driver.executeQuery(
          resumedResponse.cypher,
          {},
          { resultTransformer: neo4j.resultTransformers.eagerResultTransformer() }
        );

        if (botMessage.type === 'Graph') {
          try {
            const { nodes: newNodes, edges: newEdges } = convertNeo4jToGraph(nvlResult.records);
            if (newNodes.length > 0 || newEdges.length > 0) {
              setNodes([...nodes, ...newNodes]);
              setEdges([...edges, ...newEdges]);
              newBotMessage.text = 'تم تحديث الرسم البياني بالعقد والحواف الجديدة (استئناف).';
            } else {
              throw new Error('No valid graph data returned');
            }
          } catch (conversionError) {
            newBotMessage.text =
              'لا يمكن تحويل نتيجة الاستعلام إلى رسم بياني. يرجى تصحيح استعلام Cypher.';
          }
        } else if (botMessage.type === 'Table') {
          try {
            const { columns, rows } = convertNeo4jToTable(nvlResult.records);
            newBotMessage.text = JSON.stringify({ columns, rows }, null, 2);
          } catch (conversionError) {
            newBotMessage.text =
              'لا يمكن تحويل نتيجة الاستعلام إلى جدول. يرجى تصحيح استعلام Cypher.';
          }
        }
      }

      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    } catch (error) {
      console.error('Error resuming response:', error);
      const errorMessage = {
        id: messages.length + 1,
        text: 'فشل في استئناف الرد: ' + error.message,
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
    <div className="flex flex-col h-screen overflow-hidden bg-white rounded-lg shadow-chat p-3">
      <div
        ref={chatWindowRef}
        className="h-[400px] sm:max-h-[calc(100vh-200px)] overflow-y-auto p-4 bg-chat-gray border border-gray-200 rounded-lg mb-5"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 p-3 rounded-lg max-w-[70%] w-full ${
              message.sender === 'user'
                ? 'bg-chat-user-bg ml-auto text-right'
                : 'bg-chat-bot-bg mr-auto text-left'
            }`}
          >
            {editingMessageId === message.id ? (
              <div className="flex flex-col gap-2.5">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md resize-y"
                />
                <div className="flex gap-2.5">
                  <button
                    className="bg-chat-success text-white px-3 py-1.5 rounded-md hover:bg-chat-success-hover flex items-center gap-1 text-sm"
                    onClick={() => handleSaveEdit(message.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Save
                  </button>
                  <button
                    className="bg-chat-error text-white px-3 py-1.5 rounded-md hover:bg-chat-error-hover flex items-center gap-1 text-sm"
                    onClick={handleCancelEdit}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <strong>{message.sender === 'user' ? 'Question posée:' : hedeaerreponse}</strong>{' '}
                {message.type === 'Table' ? (
                  <div className="mt-2.5">
                    <div className="flex justify-between items-center">
                      <span>Résultat:</span>
                      <button
                        className="flex items-center gap-1 text-chat-blue hover:text-chat-blue-hover bg-transparent border-none cursor-pointer"
                        onClick={() => toggleTableCollapse(message.id)}
                      >
                        <FontAwesomeIcon icon={collapsedTables[message.id] ? faChevronDown : faChevronUp} />
                        {collapsedTables[message.id] ? 'Afficher' : 'Masquer'}
                      </button>
                    </div>
                    {!collapsedTables[message.id] && (
                      (() => {
                        try {
                          const { columns, rows } = JSON.parse(message.text);
                          return (
                            <div className="w-full overflow-x-auto my-3.5 rounded-lg shadow-chat bg-white">
                              <table className="w-full border-collapse font-code text-sm text-gray-700">
                                <thead>
                                  <tr>
                                    {columns.map((col) => (
                                      <th
                                        key={col.key}
                                        className="bg-chat-dark text-gray-300 p-3 text-left font-medium uppercase tracking-wide border-b-2 border-chat-dark-border"
                                      >
                                        {col.label}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row, rowIndex) => (
                                    <tr
                                      key={rowIndex}
                                      className="hover:bg-gray-200 transition-colors even:bg-gray-50"
                                    >
                                      {columns.map((col) => (
                                        <td key={col.key} className="p-2.5 border-b border-gray-200">
                                          {row[col.key]}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        } catch (error) {
                          return (
                            <span
                              className="inline-block p-2 rounded-md text-sm text-gray-700"
                              dangerouslySetInnerHTML={{ __html: message.text }}
                            />
                          );
                        }
                      })()
                    )}
                  </div>
                ) : message.type === 'Text' ? (
                  <div className="mt-2.5">
                    <div className="flex justify-between items-center">
                      <span>Résumé</span>
                    </div>
                    <span
                      className="inline-block p-2 rounded-md text-sm text-gray-700"
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />
                  </div>
                ) : (
                  <span
                    className="inline-block p-2 rounded-md text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: message.text }}
                  />
                )}
                {message.cypherQuery && (
                  <button
                    className="text-chat-blue hover:text-chat-blue-hover bg-transparent border-none cursor-pointer ml-2.5 flex items-center gap-1 text-sm"
                    onClick={() => handleShowQueryModal(message.id)}
                  >
                    <FontAwesomeIcon icon={faEye} /> Afficher la requête Cypher
                  </button>
                )}
                {message.sender === 'bot' && message.rawResponse && !message.isResumed && (
                  <button
                    className="bg-chat-resume text-white px-2.5 py-1 rounded-md hover:bg-yellow-600 flex items-center gap-1 text-sm ml-1.5"
                    onClick={() => handleResumeResponse(message.id)}
                  >
                    <FontAwesomeIcon icon={faRedo} /> Résumer la réponse
                  </button>
                )}
                <div className="flex gap-2 mt-2">
                  {message.sender === 'user' && (
                    <button
                      className="text-gray-600 hover:text-chat-blue bg-transparent border-none cursor-pointer text-sm"
                      onClick={() => handleEditMessage(message.id, message.text)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  )}
                  <button
                    className="text-gray-600 hover:text-chat-blue bg-transparent border-none cursor-pointer text-sm"
                    onClick={() => handleCopyMessage(message.text)}
                  >
                    <FontAwesomeIcon icon={copiedMessageId === message.text ? faCheck : faCopy} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center mt-2.5">
            <div className="w-6 h-6 border-4 border-gray-200 border-t-chat-blue rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showQueryModal && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] backdrop-blur-sm"
          onClick={handleCloseQueryModal}
        >
          <div
            className="bg-white rounded-lg p-5 w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-modal relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-gray-200">
              <h4 className="text-gray-800 text-lg font-semibold">Requête Cypher</h4>
              <button
                className="text-gray-600 hover:text-gray-800 bg-transparent border-none cursor-pointer text-lg"
                onClick={handleCloseQueryModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {editingQueryId === showQueryModal ? (
              <div className="p-2.5">
                <textarea
                  className="w-full p-2.5 rounded-md bg-chat-dark border border-gray-300 text-gray-300 font-code text-sm resize-y mb-3.5"
                  value={editedQuery}
                  onChange={(e) => setEditedQuery(e.target.value)}
                  rows="6"
                  autoFocus
                />
                <div className="flex gap-2.5 justify-end">
                  <button
                    className="bg-chat-success text-white px-4 py-2 rounded-md hover:bg-chat-success-hover flex items-center gap-1.5"
                    onClick={() => handleSaveQueryEdit(showQueryModal)}
                  >
                    <FontAwesomeIcon icon={faCheck} /> Sauvegarder et Exécuter
                  </button>
                  <button
                    className="bg-chat-error text-white px-4 py-2 rounded-md hover:bg-chat-error-hover flex items-center gap-1.5"
                    onClick={handleCancelQueryEdit}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5">
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
                    border: '1px solid #3e3e3e',
                  }}
                  showLineNumbers
                >
                  {messages.find((msg) => msg.id === showQueryModal)?.cypherQuery || ''}
                </SyntaxHighlighter>
                <button
                  className="bg-chat-blue text-white px-4 py-2 rounded-md hover:bg-chat-blue-hover flex items-center gap-1.5"
                  onClick={() =>
                    handleEditQuery(
                      showQueryModal,
                      messages.find((msg) => msg.id === showQueryModal)?.cypherQuery
                    )
                  }
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