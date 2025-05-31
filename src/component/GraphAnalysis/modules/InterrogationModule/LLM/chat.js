import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
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
import ChatInput from './input';
import { useTranslation } from 'react-i18next';
import { parsergraph } from '../../VisualisationModule/Parser';

const Chat = ({ nodes, edges, setNodes, setEdges, selectedNodes }) => {
 
  const { t } = useTranslation(); // Fonction de traduction
  const [messages, setMessages] = useState([]); // État pour stocker les messages du chat
  const [inputText, setInputText] = useState('');// État pour stocker le texte saisi par l'utilisateur
  const [isLoading, setIsLoading] = useState(false); // État pour indiquer si une requête est en cours de chargement
  const [responseType, setResponseType] = useState('Graph');   // État pour le type de réponse attendu (Graphe ou Tableau)
  const [editingMessageId, setEditingMessageId] = useState(null);   // État pour l'ID du message en cours d'édition (question utilisateur)
  const [editedText, setEditedText] = useState('');  // État pour le texte édité de la question utilisateur
  const [copiedMessageId, setCopiedMessageId] = useState(null);  // État pour l'ID du message dont le texte a été copié
  const [showQueryModal, setShowQueryModal] = useState(null);  // État pour l'ID du message dont la modale de requête est affichée
  const [editingQueryId, setEditingQueryId] = useState(null);   // État pour l'ID du message dont la requête Cypher est en cours d'édition
  const [editedQuery, setEditedQuery] = useState('');   // État pour le texte de la requête Cypher éditée
  const [maxCorrections, setMaxCorrections] = useState(1); // État pour le nombre maximum de corrections de requête Cypher autorisées
  const [hedeaerreponse, setheader] = useState(''); // TODO: État pour stocker une information d'en-tête , de la reponse
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest'); // État pour le modèle d'IA sélectionné
  const [collapsedTables, setCollapsedTables] = useState({});  // État pour suivre l'état (replié/déplié) des tableaux dans les messages
  const chatWindowRef = useRef(null);  // Référence à l'élément DOM de la fenêtre de chat pour le défilement

  // Effet pour faire défiler vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Fonction pour convertir les résultats Neo4j en format tableau
  const convertNeo4jToTable = (records) => {
    // Si pas de données, retourne un tableau vide
    if (!records || records.length === 0) {
      return { columns: [], rows: [] };
    }
    // Utilise les clés du premier enregistrement pour définir les colonnes
    const firstRecord = records[0];
    // Crée les définitions de colonnes
    const columns = Object.keys(firstRecord).map(key => ({
      key,
      label: key, // Peut être personnalisé si nécessaire
    }));

    // Convertit les enregistrements en lignes
    const rows = records.map(record => {
      const row = {};
      for (const key of Object.keys(record)) {
        const value = record[key];
        // Convertit la valeur en chaîne (ou chaîne vide si null/undefined)
        row[key] = value !== null && value !== undefined ? value.toString() : '';
      }
      return row;
    });

    // Retourne les colonnes et les lignes
    return { columns, rows };
  };

  // Fonction pour basculer l'état replié/déplié d'un tableau dans un message
  const toggleTableCollapse = (messageId) => {
    setCollapsedTables((prev) => ({
      ...prev,
      [messageId]: !prev[messageId], // Inverse l'état actuel
    }));
  };

  // Fonction pour démarrer l'édition d'une requête Cypher
  const handleEditQuery = (messageId, currentQuery) => {
    setEditingQueryId(messageId); // Stocke l'ID du message
    setEditedQuery(currentQuery); // Stocke la requête actuelle
  };

  // Fonction pour sauvegarder la requête Cypher éditée et ré-exécuter
  const handleSaveQueryEdit = async (messageId) => {
    try {
      setIsLoading(true); // Active l'indicateur de chargement
      // Trouve le message original
      const originalMessage = messages.find((msg) => msg.id === messageId);
      // Met à jour la requête Cypher dans le message (localement d'abord)
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, cypherQuery: editedQuery } : msg
        )
      );

      // Détermine le type de réponse original (Graph ou Table)
      const originalResponseType = originalMessage.type === 'Table' ? 'Table' : 'Graph';
      // Si le type original était 'Graph'
      if (originalResponseType === 'Graph') {
        // Exécute la requête éditée pour obtenir des données de graphe
        const chatresult = await axios.post(BASE_URL_Backend + '/execute_query_graph/', {
          query: editedQuery,
          parameters: {},
        });

        const nvlResult = chatresult.data; // Récupère les données du graphe
        console.log(nvlResult);
        try {
          // Parse les données pour obtenir les nœuds et arêtes
          const { nodes: newNodes, edges: newEdges } = parsergraph(nvlResult);
          // Si des nœuds ou arêtes sont retournés
          if (newNodes.length > 0 || newEdges.length > 0) {
            // Met à jour les nœuds et arêtes globaux (en filtrant les doublons potentiels)
            setNodes([...nodes.filter((n) => !newNodes.some((nn) => nn.id === n.id)), ...newNodes]);
            setEdges([...edges.filter((e) => !newEdges.some((ne) => ne.id === e.id)), ...newEdges]);
            // Met à jour le message du bot pour indiquer le succès
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      text: 'Le graphe a été mis à jour avec les nouveaux nœuds et arêtes.', // Texte mis à jour
                      cypherQuery: editedQuery, // Requête mise à jour
                      sender: 'bot',
                    }
                  : msg
              )
            );
          } else {
            // Si aucune donnée de graphe valide n'est retournée
            throw new Error('Aucune donnée de graphe valide retournée');
          }
        } catch (conversionError) {
          // En cas d'erreur lors du parsing du graphe
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    text: 'Impossible de convertir le résultat en graphe. Corrigez la requête Cypher.', // Message d'erreur
                    cypherQuery: editedQuery,
                    sender: 'bot',
                  }
                : msg
            )
          );
        }
      // Si le type original était 'Table'
      } else if (originalResponseType === 'Table') {
        // Exécute la requête éditée pour obtenir des données de tableau
        const chatresult = await axios.post(BASE_URL_Backend + '/execute_query_table/', {
          query: editedQuery,
          parameters: {},
        });

        const nvlResult = chatresult.data.result; // Récupère les résultats bruts
        // Convertit les résultats en format tableau
        const { columns, rows } = convertNeo4jToTable(nvlResult);
        // Met à jour le message du bot avec le nouveau tableau
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  text: JSON.stringify({ columns, rows }, null, 2), // Tableau en JSON
                  cypherQuery: editedQuery, // Requête mise à jour
                  sender: 'bot',
                  type: 'Table', // Confirme le type
                }
              : msg
          )
        );
      }
    } catch (error) {
      // En cas d'erreur lors de l'exécution de la requête
      console.error('Erreur lors de la mise à jour et exécution de la requête:', error);
      // Met à jour le message pour afficher l'erreur
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: 'Erreur exécution requête: ' + error.message, sender: 'error' }
            : msg
        )
      );
    } finally {
      // Réinitialise les états d'édition et de chargement
      setEditingQueryId(null);
      setEditedQuery('');
      setShowQueryModal(null);
      setIsLoading(false);
    }
  };

  // Fonction pour annuler l'édition de la requête Cypher
  const handleCancelQueryEdit = () => {
    setEditingQueryId(null); // Réinitialise l'ID
    setEditedQuery(''); // Réinitialise le texte
  };

  // Fonction pour afficher la modale de la requête Cypher
  const handleShowQueryModal = (messageId) => {
    setShowQueryModal(messageId); // Stocke l'ID du message pour la modale
  };

  // Fonction pour fermer la modale de la requête Cypher
  const handleCloseQueryModal = () => {
    setShowQueryModal(null); // Cache la modale
    setEditingQueryId(null); // Annule l'édition si elle était en cours
    setEditedQuery('');
  };

  // Fonction pour formater les nœuds sélectionnés en chaîne de caractères, utiliser en interaction avec le chat
  const formatSelectedNodes = () => {
    if (selectedNodes.size === 0) return ''; // Retourne vide si aucun nœud sélectionné
    // Trouve les objets nœuds correspondants aux IDs sélectionnés
    const selectedNodeObjects = Array.from(selectedNodes)
      .map((nodeId) => nodes.find((node) => node.id === nodeId))
      .filter((node) => node); // Filtre au cas où un nœud n'est pas trouvé
    // Formate chaque nœud en 'Type:ID'
    return selectedNodeObjects
      .map((node) => `${node.group || 'Unknown'}:${node.id}`)
      .join(','); // Joint les chaînes avec une virgule
  };

  // Effet pour mettre à jour le champ de saisie lorsque la sélection de nœuds change
  useEffect(() => {
    const formattedNodes = formatSelectedNodes(); // Obtient la chaîne formatée
    if (formattedNodes) {
      // Pré-remplit le champ de saisie avec les nœuds sélectionnés
      setInputText(`Sélectionné: ${formattedNodes}`);
    } else {
      // Vide le champ de saisie si aucune sélection
      setInputText('');
    }
  }, [selectedNodes, nodes]); // Dépend de la sélection et de la liste des nœuds

  // Fonction pour envoyer le message de l'utilisateur au backend
  const handleSendMessage = async () => {
    // Ne fait rien si le champ de saisie est vide
    if (!inputText.trim()) return;

    // Crée l'objet message utilisateur
    const userMessage = { id: messages.length + 1, text: inputText, sender: 'user' };
    // Ajoute le message utilisateur à la liste
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInputText = inputText; // Sauvegarde l'input avant de le vider
    setInputText(''); // Vide le champ de saisie
    setIsLoading(true); // Active l'indicateur de chargement
    const formattedSelectedNodes = formatSelectedNodes(); // Récupère les nœuds sélectionnés formatés

    try {
      // Envoie la question au backend (chatbot)
      const response = await axios.post(
        BASE_URL_Backend + '/chatbot/',
        {
          question: currentInputText, // Utilise l'input sauvegardé
          answer_type: responseType, // Type de réponse attendu
          model: selectedModel, // Modèle d'IA à utiliser
          maxCorrections: maxCorrections, // Max corrections Cypher
          selected_nodes: formattedSelectedNodes, // Nœuds sélectionnés
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Stocke la réponse brute avec la question originale
      const rawResponse = {
        ...response.data,
        question: currentInputText,
      };

      // Gère le cas où le bot ne peut pas répondre
      if (response.data.response === 'je ne peux pas répondre') {
        const botMessage = {
          id: messages.length + 2, // ID unique
          text: 'Je ne peux pas répondre. Veuillez corriger la requête Cypher ou préciser la question.', // Message d'erreur
          sender: 'bot',
          type: responseType,
          cypherQuery: response.data.cypher || null, // Requête Cypher (si disponible)
          rawResponse, // Réponse brute
          isResumed: false, // Non issue d'une reprise
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]); // Ajoute le message d'erreur
        return; // Arrête le traitement
      }

      // Si le type de réponse attendu est 'Graph'
      if (responseType === 'Graph') {
        // Exécute la requête Cypher retournée par le bot
        const chatresult = await axios.post(BASE_URL_Backend + '/execute_query_graph/', {
          query: response.data.cypher,
          parameters: {},
        });

        const nvlResult = chatresult.data; // Récupère les données du graphe
        console.log(nvlResult);
        try {
          // Parse les données du graphe
          const { nodes: newNodes, edges: newEdges } = parsergraph(nvlResult);
          // Si des nœuds ou arêtes sont retournés
          if (newNodes.length > 0 || newEdges.length > 0) {
            // Filtre pour ne garder que les nouveaux nœuds/arêtes uniques
            const uniqueNewNodes = newNodes.filter(
              (newNode) => !nodes.some((existingNode) => existingNode.id === newNode.id)
            );
            const uniqueNewEdges = newEdges.filter(
              (newEdge) => !edges.some((existingEdge) => existingEdge.id === newEdge.id)
            );
            // Si de nouveaux éléments uniques existent
            if (uniqueNewNodes.length > 0 || uniqueNewEdges.length > 0) {
              // Met à jour l'état global des nœuds et arêtes
              setNodes([...nodes, ...uniqueNewNodes]);
              setEdges([...edges, ...uniqueNewEdges]);
              // Crée le message de succès pour le chat
              const botMessage = {
                id: messages.length + 2,
                text: 'Le graphe a été mis à jour avec les nouveaux nœuds et arêtes.', // Message de succès
                sender: 'bot',
                type: 'Graph',
                cypherQuery: response.data.cypher, // Requête utilisée
                rawResponse, // Réponse brute
                isResumed: false,
              };
              setMessages((prevMessages) => [...prevMessages, botMessage]); // Ajoute le message
            } else {
              // Si aucun nouvel élément unique n'est trouvé
              throw new Error('Aucun nouveau nœud ou arête unique à ajouter');
            }
          } else {
            // Si le parsing ne retourne aucune donnée de graphe valide
            throw new Error('Aucune donnée de graphe valide retournée');
          }
        } catch (conversionError) {
          // En cas d'erreur lors du parsing ou si aucun nouveau nœud/arête
          const botMessage = {
            id: messages.length + 2,
            text: 'Impossible de convertir le résultat en graphe ou aucun nouvel élément trouvé. Vérifiez la requête Cypher.', // Message d'erreur
            sender: 'bot', // Expéditeur bot
            type: 'Graph',
            cypherQuery: response.data.cypher,
            rawResponse,
            isResumed: false,
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]); // Ajoute le message d'erreur
        }
      // Si le type de réponse attendu est 'Table'
      } else if (responseType === 'Table') {
        // Exécute la requête Cypher pour obtenir des données de tableau
        const chatresult = await axios.post(BASE_URL_Backend + '/execute_query_table/', {
          query: response.data.cypher,
          parameters: {},
        });

        const nvlResult = chatresult.data.result; // Récupère les résultats bruts
        console.log(nvlResult);
        try {
          // Convertit les résultats en format tableau
          const { columns, rows } = convertNeo4jToTable(nvlResult);
          // Crée le message du bot avec le tableau
          const botMessage = {
            id: messages.length + 2,
            text: JSON.stringify({ columns, rows }, null, 2), // Tableau en JSON
            sender: 'bot',
            cypherQuery: response.data.cypher, // Requête utilisée
            type: 'Table',
            rawResponse, // Réponse brute
            isResumed: false,
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]); // Ajoute le message
        } catch (conversionError) {
          // En cas d'erreur lors de la conversion en tableau
          const botMessage = {
            id: messages.length + 2,
            text: 'Impossible de convertir le résultat en tableau. Vérifiez la requête Cypher.', // Message d'erreur
            sender: 'bot',
            cypherQuery: response.data.cypher,
            type: 'Table', // Type Table même en cas d'erreur
            rawResponse,
            isResumed: false,
          };
          setMessages((prevMessages) => [...prevMessages, botMessage]); // Ajoute le message d'erreur
        }
      // Pour les autres types de réponse (JSON, Text)
      } else {
        // Crée le message du bot avec la réponse texte ou JSON
        const botMessage = {
          id: messages.length + 2,
          text:
            responseType === 'JSON'
              ? JSON.stringify(response.data, null, 2) // Réponse JSON formatée
              : response.data.response.replace(/\n/g, '<br>'), // Réponse texte avec sauts de ligne HTML
          sender: 'bot',
          cypherQuery: response.data.cypher || null, // Requête Cypher (si applicable)
          rawResponse, // Réponse brute
          isResumed: false,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]); // Ajoute le message
      }
    } catch (error) {
      // En cas d'erreur lors de l'appel au chatbot
      console.error('Erreur envoi message:', error);
      // Crée un message d'erreur pour le chat
      const errorMessage = {
        id: messages.length + 2,
        text: 'Échec de la récupération de la réponse du chatbot: ' + error.message,
        sender: 'error',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]); // Ajoute le message d'erreur
    } finally {
      setIsLoading(false); // Désactive l'indicateur de chargement
    }
  };

  // Fonction pour demander une reprise/élaboration d'une réponse précédente du bot
  const handleResumeResponse = async (messageId) => {
    // Trouve le message original du bot
    const botMessage = messages.find((msg) => msg.id === messageId);
    // Vérifie si la réponse brute est disponible
    if (!botMessage || !botMessage.rawResponse) {
      console.error('Aucune réponse brute disponible pour la reprise');
      return;
    }

    // Trouve le message utilisateur précédent correspondant
    const userMessage = messages
      .slice(0, messages.indexOf(botMessage)) // Prend les messages avant celui du bot
      .reverse() // Inverse pour trouver le plus récent
      .find((msg) => msg.sender === 'user'); // Trouve le dernier message utilisateur

    // Vérifie si un message utilisateur correspondant a été trouvé
    if (!userMessage) {
      console.error('Aucun message utilisateur correspondant trouvé pour la reprise');
      return;
    }

    setIsLoading(true); // Active l'indicateur de chargement

    try {
      // Définit l'URL de l'endpoint de reprise
      const resumeEndpoint = BASE_URL_Backend + '/chatbot/resume/';
      // Envoie la requête de reprise au backend
      const response = await axios.post(
        resumeEndpoint,
        {
          raw_response: botMessage.rawResponse, // Réponse brute originale
          model: selectedModel, // Modèle d'IA
          question: userMessage.text, // Question originale de l'utilisateur
          cypher_query: botMessage.cypherQuery || '', // Requête Cypher originale
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const resumedResponse = response.data; // Récupère la réponse de reprise
      // Crée le nouveau message du bot avec la réponse de reprise
      const newBotMessage = {
        id: messages.length + 1, // ID unique
        text: resumedResponse.response || 'Réponse reprise traitée.', // Texte de la réponse
        sender: 'bot',
        type: 'Text', // Type par défaut pour la reprise (peut être ajusté si nécessaire)
        cypherQuery: resumedResponse.cypher || null, // Nouvelle requête Cypher (si générée)
        rawResponse: resumedResponse, // Nouvelle réponse brute
        isResumed: true, // Indique que c'est une réponse reprise
      };

      setMessages((prevMessages) => [...prevMessages, newBotMessage]); // Ajoute le nouveau message
    } catch (error) {
      // En cas d'erreur lors de la reprise
      console.error('Erreur lors de la reprise de la réponse:', error);
      // Crée un message d'erreur
      const errorMessage = {
        id: messages.length + 1,
        text: 'Échec de la reprise de la réponse: ' + error.message,
        sender: 'error',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]); // Ajoute le message d'erreur
    } finally {
      setIsLoading(false); // Désactive l'indicateur de chargement
    }
  };

  // Fonction pour démarrer l'édition du texte d'un message utilisateur
  const handleEditMessage = (messageId, currentText) => {
    setEditingMessageId(messageId); // Stocke l'ID du message
    setEditedText(currentText); // Stocke le texte actuel
  };

  // Fonction pour sauvegarder le texte édité d'un message utilisateur
  const handleSaveEdit = (messageId) => {
    // Met à jour le texte du message dans la liste
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, text: editedText } : msg
      )
    );
    setEditingMessageId(null); // Réinitialise l'ID d'édition
    setEditedText(''); // Réinitialise le texte édité
  };

  // Fonction pour annuler l'édition du texte d'un message utilisateur
  const handleCancelEdit = () => {
    setEditingMessageId(null); // Réinitialise l'ID d'édition
    setEditedText(''); // Réinitialise le texte édité
  };

  // Fonction pour copier le texte d'un message dans le presse-papiers
  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text); // Copie le texte
      setCopiedMessageId(text); // Indique que ce texte est copié (pour feedback visuel)
      // Réinitialise l'indicateur de copie après 2 secondes
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Échec de la copie du texte:', error);
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
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
};

export default Chat;