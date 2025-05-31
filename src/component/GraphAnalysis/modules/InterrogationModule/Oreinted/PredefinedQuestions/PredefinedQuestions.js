import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-monokai';
import { parsergraph } from '../../../VisualisationModule/Parser'
import { BASE_URL_Backend } from '../../../../Platforme/Urls';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Composant pour gérer les modèles de questions prédéfinies et l'exécution de requêtes
const Template = ({ nodes, setNodes, edges, setEdges }) => {
  const { t } = useTranslation(); // Hook de traduction
  const [questions, setQuestions] = useState([]); // État pour stocker la liste des questions prédéfinies
  const [selectedQuestion, setSelectedQuestion] = useState('');// État pour stocker la question prédéfinie actuellement sélectionnée
  const [queryParameters, setQueryParameters] = useState({});  // État pour stocker les valeurs des paramètres saisis par l'utilisateur pour la requête sélectionnée
  const [queryResult, setQueryResult] = useState('');// État pour stocker le résultat textuel ou le statut de l'exécution de la requête
  const [isLoading, setIsLoading] = useState(false);// État pour indiquer si une opération (fetch, exécution) est en cours
  const [error, setError] = useState('');// État pour stocker les messages d'erreur généraux
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);// État pour contrôler la visibilité du formulaire d'ajout de nouveau modèle
  // État pour stocker les informations du nouveau modèle en cours de création
  const [newTemplate, setNewTemplate] = useState({
    question: '', // Texte de la question
    query: '', // Requête Cypher
    parameters: {}, // Descriptions des paramètres {nom: description}
    parameterTypes: {}, // Types des paramètres {nom: type}
  });
  const [templateError, setTemplateError] = useState('');// État pour stocker les messages d'erreur spécifiques au formulaire d'ajout
  const [newParam, setNewParam] = useState({ name: '', description: '', type: 'string' });// État pour stocker les informations du paramètre en cours d'ajout au nouveau modèle
  const [detectedParams, setDetectedParams] = useState([]);// État pour stocker les noms des paramètres détectés dans la requête Cypher saisie
  const [successMessage, setSuccessMessage] = useState(''); // État pour afficher un message de succès temporaire



  // Effet pour récupérer les questions prédéfinies
  useEffect(() => {
    // Fonction asynchrone pour fetch les questions
    const fetchQuestions = async () => {
      try {
        // Appel API GET pour obtenir les questions
        const response = await fetch(`${BASE_URL_Backend}/get_predefined_questions/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        // Vérifie si la réponse est OK
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse la réponse JSON
        const data = await response.json();
        // Met à jour l'état avec les questions reçues
        setQuestions(data);
      } catch (err) {
        // Gère les erreurs de fetch
        setError(`${t('Error fetching questions')}: ${err.message}`);
      }
    };
    // Appelle la fonction de fetch
    fetchQuestions();
  }, [t]); // Dépendance: t (fonction de traduction)

  // Effet pour masquer le message de succès après 3 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      // Nettoyage du timer si le composant est démonté ou si successMessage change
      return () => clearTimeout(timer);
    }
  }, [successMessage]); // Dépendance: successMessage

  // Gestionnaire pour la sélection d'une question dans le dropdown
  const handleQuestionSelect = (e) => {
    const questionId = e.target.value;
    // Trouve la question sélectionnée dans la liste
    const selected = questions.find((q) => q.id === parseInt(questionId));
    // Met à jour l'état de la question sélectionnée
    setSelectedQuestion(selected);
    // Réinitialise les paramètres et le résultat de la requête précédente
    setQueryParameters({});
    setQueryResult('');
    setError('');
  };

  // Gestionnaire pour la modification de la valeur d'un paramètre de requête
  const handleParameterChange = (e, paramName) => {
    const value = e.target.value;
    // Récupère le type attendu du paramètre
    const type = selectedQuestion?.parameterTypes[paramName];
    // Parse la valeur en entier si le type est 'int'
    const parsedValue = type === 'int' ? parseInt(value, 10) : value;
    // Met à jour l'état des paramètres de requête
    setQueryParameters((prev) => ({ ...prev, [paramName]: parsedValue }));
  };

  // Fonction pour exécuter la requête Cypher sélectionnée
  const executeQuery = async () => {
    // Ne fait rien si aucune question n'est sélectionnée
    if (!selectedQuestion) return;

    // Active l'indicateur de chargement et réinitialise les erreurs/résultats
    setIsLoading(true);
    setError('');
    setQueryResult('');

    try {
      // Appel API POST pour exécuter la requête avec les paramètres fournis
      const response = await axios.post(BASE_URL_Backend + '/execute_query_graph/', {
        query: selectedQuestion.query,
        parameters: queryParameters
      });

      // Récupère les données brutes du résultat
      const nvlResult = response.data;

      try {
        // Parse le résultat pour obtenir les nœuds et arêtes
        const { nodes: newNodes, edges: newEdges } = parsergraph(nvlResult);

        // Vérifie si des nœuds ou arêtes ont été retournés
        if (newNodes.length > 0 || newEdges.length > 0) {
          // Met à jour les états globaux des nœuds et arêtes (potentiellement en ajoutant)
          // Note: La logique actuelle ajoute simplement, pourrait nécessiter un remplacement ou une fusion plus complexe
          setNodes([...nodes, ...newNodes]);
          setEdges([...edges, ...newEdges]);
          // Affiche un message de succès
          setQueryResult(t('Graph updated'));
        } else {
          // Affiche un message si le résultat est vide
          setQueryResult(t('Empty result'));
          throw new Error(t('Empty result')); // Peut-être redondant
        }
      } catch (graphError) {
        // Gère les erreurs de parsing du graphe
        setQueryResult(t('Invalid query result'));
      }
    } catch (error) {
      // Gère les erreurs d'exécution de la requête
      setError(`${t('Query execution error')}: ${error.message}`);
    } finally {
      // Désactive l'indicateur de chargement
      setIsLoading(false);
    }
  };

  // Gestionnaire pour les changements dans les champs du nouveau modèle (sauf AceEditor)
  const handleNewTemplateChange = (e) => {
    const { name, value } = e.target;
    // Met à jour l'état du nouveau modèle
    setNewTemplate((prev) => ({ ...prev, [name]: value }));
  };

  // Gestionnaire pour les changements dans les champs du nouveau paramètre
  const handleNewParamChange = (e) => {
    const { name, value } = e.target;
    // Met à jour l'état du nouveau paramètre
    setNewParam((prev) => ({ ...prev, [name]: value }));
  };

  // Gestionnaire pour les changements dans l'éditeur Ace (requête Cypher)
  const handleQueryChange = (value) => {
    // Met à jour la requête dans l'état du nouveau modèle
    setNewTemplate((prev) => ({ ...prev, query: value }));
    // Détecte les paramètres dans la requête mise à jour
    detectQueryParameters(value);
  };

  // Fonction pour détecter les paramètres (ex: $nomParam) dans une requête Cypher
  const detectQueryParameters = (query) => {
    // Regex pour trouver les paramètres commençant par $
    const paramRegex = /\$([a-zA-Z][a-zA-Z0-9]*)/g;
    // Extrait les noms uniques des paramètres trouvés
    const detected = [...new Set(query.match(paramRegex)?.map((p) => p.slice(1)) || [])];
    // Met à jour l'état des paramètres détectés
    setDetectedParams(detected);
    // Pré-remplit le champ nom du nouveau paramètre si vide et si des paramètres sont détectés
    if (!newParam.name && detected.length > 0) {
      setNewParam((prev) => ({ ...prev, name: detected[0] }));
    }
  };

  // Fonction appelée lorsqu'un bouton de paramètre détecté est cliqué
  const selectDetectedParam = (paramName) => {
    // Met à jour l'état du nouveau paramètre avec le nom sélectionné
    setNewParam((prev) => ({ ...prev, name: paramName, description: '', type: 'string' }));
  };

  // Fonction pour ajouter le paramètre défini dans newParam au newTemplate
  const addNewParameter = () => {
    const { name, description, type } = newParam;
    // Vérifie si les informations du paramètre sont valides
    if (name && description && (type === 'int' || type === 'string')) {
      // Ajoute le paramètre aux listes 'parameters' et 'parameterTypes' du nouveau modèle
      setNewTemplate((prev) => ({
        ...prev,
        parameters: { ...prev.parameters, [name]: description },
        parameterTypes: { ...prev.parameterTypes, [name]: type },
      }));
      // Réinitialise le formulaire d'ajout de paramètre (suggère le prochain paramètre détecté non ajouté)
      setNewParam({ name: detectedParams.find((p) => p !== name) || '', description: '', type: 'string' });
      setTemplateError('');
      // Retire le paramètre ajouté de la liste des paramètres détectés
      setDetectedParams((prev) => prev.filter((p) => p !== name));
    } else {
      // Affiche une erreur si le paramètre est invalide
      setTemplateError(t('Invalid parameter'));
    }
  };

  // Fonction pour supprimer un paramètre du nouveau modèle en cours de création
  const removeParameter = (paramName) => {
    setNewTemplate((prev) => {
      // Crée de nouveaux objets sans le paramètre à supprimer
      const { [paramName]: _, ...remainingParams } = prev.parameters;
      const { [paramName]: __, ...remainingTypes } = prev.parameterTypes;
      // Retourne le nouvel état du modèle
      return { ...prev, parameters: remainingParams, parameterTypes: remainingTypes };
    });
    // Ré-ajoute le paramètre à la liste des détectés s'il est toujours présent dans la requête
    if (detectedParams.includes(paramName) || newTemplate.query.includes(`$${paramName}`)) {
        // Utilise un Set pour éviter les doublons au cas où il serait déjà là
        setDetectedParams((prev) => [...new Set([...prev, paramName])]);
    }
  };

  // Fonction (actuellement simpliste) pour vérifier la validité de la requête
  const verifyQuery = async (query, parameters, parameterTypes) => {
    try {
      // TODO: Implémenter une vraie vérification côté backend ou via un parser Cypher
      return true; // Retourne toujours vrai pour l'instant
    } catch (error) {
      throw new Error(`${t('Query verification failed')}: ${error.message}`);
    }
  };

  // Fonction pour valider et envoyer le nouveau modèle au backend
  const addAbstractQuestionTemplate = async (userTemplate) => {
    // Vérifie la présence des champs requis
    const requiredFields = ['question', 'query', 'parameters', 'parameterTypes'];
    for (const field of requiredFields) {
      if (!(field in userTemplate) || !userTemplate[field]) {
        throw new Error(`${t('Missing field')}: ${field}`);
      }
    }
    // Vérifie la cohérence entre les clés de parameters et parameterTypes
    const paramKeys = Object.keys(userTemplate.parameters);
    const typeKeys = Object.keys(userTemplate.parameterTypes);
    if (paramKeys.length !== typeKeys.length || !paramKeys.every((key) => typeKeys.includes(key))) {
      throw new Error(t('Parameter mismatch'));
    }
    // Vérifie la validité des types de paramètres
    const validTypes = ['string', 'int'];
    for (const type of Object.values(userTemplate.parameterTypes)) {
      if (!validTypes.includes(type)) {
        throw new Error(`${t('Invalid parameter type')}: ${type}. ${t('Must be string or int')}`);
      }
    }
    // Vérification basique de la requête Cypher (présence de MATCH et RETURN)
    const query = userTemplate.query.toLowerCase();
    if (!query.includes('match') || !query.includes('return')) {
      throw new Error(t('Invalid query'));
    }

    // Appelle la fonction de vérification (actuellement simple)
    await verifyQuery(userTemplate.query, userTemplate.parameters, userTemplate.parameterTypes);

    try {
      // Appel API POST pour ajouter la nouvelle question prédéfinie
      const response = await fetch(`${BASE_URL_Backend}/add_predefined_question/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userTemplate),
      });
      // Gère les réponses non OK
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      // Parse la réponse en cas de succès
      const data = await response.json();
      // Ajoute la nouvelle question à la liste locale
      setQuestions((prev) => [...prev, { id: data.id, ...userTemplate }]);
      // Réinitialise le formulaire d'ajout
      setNewTemplate({ question: '', query: '', parameters: {}, parameterTypes: {} });
      setShowNewTemplateForm(false);
      setTemplateError('');
      // Affiche un message de succès
      setSuccessMessage(t('Template saved successfully'));
    } catch (error) {
      // Propage l'erreur pour affichage
      throw new Error(`${t('Error saving template')}: ${error.message}`);
    }
  };

  // Gestionnaire pour le clic sur le bouton de sauvegarde du nouveau modèle
  const saveNewTemplate = async () => {
    try {
      // Appelle la fonction d'ajout et de validation
      await addAbstractQuestionTemplate(newTemplate);
    } catch (error) {
      // Affiche l'erreur dans la zone dédiée du formulaire
      setTemplateError(error.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg font-sans text-gray-800">
      <h3 className="text-3xl font-bold text-gray-900 text-center mb-5 font-poppins">{t('Manage Templates and Queries')}</h3>
      <p className="text-lg text-gray-600 text-center mb-8 font-normal">{t('Select a predefined question to query the database')}</p>

      <select onChange={handleQuestionSelect} className="w-full p-3 text-base border border-gray-300 rounded-md bg-gray-50 text-gray-800 mb-5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all">
        <option value="">{t('Choose a question')}</option>
        {questions.map((q) => (
          <option key={q.id} value={q.id}>{q.question}</option>
        ))}
      </select>

      <button className="px-5 py-2.5 bg-green-600 text-white rounded-md text-base font-semibold hover:bg-green-700 hover:-translate-y-0.5 transition-all" onClick={() => setShowNewTemplateForm(true)}>
        {t('Add New Template')}
      </button>

      {showNewTemplateForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000] animate-fadeIn">
          <div className="bg-white p-6 rounded-xl w-full max-w-[90%] sm:max-w-[600px] shadow-2xl relative animate-slideIn">
            <h5 className="text-xl font-semibold text-gray-900 mb-5 font-poppins">{t('Add New Template Title')}</h5>
            <input
              type="text"
              name="question"
              value={newTemplate.question}
              onChange={handleNewTemplateChange}
              placeholder={t('Enter question in Arabic')}
              className="w-full p-3 mb-4 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all box-border"
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
            <h6 className="text-base font-medium text-gray-700 mb-2.5 mt-4">{t('Parameters')}</h6>
            {detectedParams.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">{t('Detected Parameters')}:</p>
                {detectedParams.map((param) => (
                  <button
                    key={param}
                    className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 transition-all mr-2 mt-2"
                    onClick={() => selectDetectedParam(param)}
                  >
                    {param}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2.5 mb-4">
              <input
                type="text"
                name="name"
                value={newParam.name}
                onChange={handleNewParamChange}
                placeholder={t('Parameter Name')}
                className="flex-1 p-2.5 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="text"
                name="description"
                value={newParam.description}
                onChange={handleNewParamChange}
                placeholder={t('Parameter Description')}
                className="flex-1 p-2.5 border border-gray-300 rounded-md text-sm"
              />
              <select name="type" value={newParam.type} onChange={handleNewParamChange} className="p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50">
                <option value="string">String</option>
                <option value="int">Int</option>
              </select>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 hover:-translate-y-0.5 transition-all" onClick={addNewParameter}>
                {t('Add')}
              </button>
            </div>
            <div className="max-h-[150px] overflow-y-auto mb-4">
              {Object.entries(newTemplate.parameters).map(([paramName, paramDescription]) => (
                <div key={paramName} className="flex justify-between items-center p-2 bg-gray-100 rounded-md mb-2 text-sm text-gray-700">
                  <span>{paramDescription} ({paramName}): {newTemplate.parameterTypes[paramName]}</span>
                  <button className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-all" onClick={() => removeParameter(paramName)}>{t('Remove')}</button>
                </div>
              ))}
            </div>
            {templateError && <p className="text-sm text-red-600 mb-4">{templateError}</p>}
            <div className="flex justify-end gap-2.5 mt-5">
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 hover:-translate-y-0.5 transition-all" onClick={saveNewTemplate}>{t('Save Template')}</button>
              <button className="px-5 py-2.5 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 hover:-translate-y-0.5 transition-all" onClick={() => setShowNewTemplateForm(false)}>{t('Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-[300px] right-[900px] bg-green-600 text-white p-4 rounded-lg shadow-2xl z-[2000] animate-[slideInSuccess_0.5s_ease,fadeOut_0.5s_ease_2.5s]">
          <p className="m-0 text-base font-medium font-poppins">{successMessage}</p>
        </div>
      )}

      {selectedQuestion && (
        <div className="mt-1 p-1 bg-gray-50 rounded-lg shadow-sm">
          <h5 className="text-xl font-semibold text-gray-900 mb-4 font-poppins">{t('Selected Question')}:</h5>
          <p className="text-base text-gray-600 mb-2 font-normal">{selectedQuestion.question}</p>
          {Object.entries(selectedQuestion.parameters).map(([paramName, paramDescription]) => (
            <div key={paramName} className="mb-2">
              <label className="block text-base text-gray-600  font-medium">{paramDescription}:</label>
              <input
                type="text"
                value={queryParameters[paramName] || ''}
                onChange={(e) => handleParameterChange(e, paramName)}
                placeholder={`${t('Enter')} ${paramDescription}`}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-md bg-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
          ))}
          <button className={`w-full p-3 text-base font-semibold text-white rounded-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-all`} onClick={executeQuery} disabled={isLoading}>
            {isLoading ? t('Executing') : t('Execute Query')}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <h5 className="text-lg font-semibold text-red-800 mb-2.5">{t('Error')}:</h5>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {queryResult && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg shadow-sm">
          <h5 className="text-xl font-semibold text-gray-900 mb-4 font-poppins">{t('Query Result')}:</h5>
          <pre className="bg-gray-900 text-white p-4 rounded-md font-mono text-sm whitespace-pre-wrap break-words">{queryResult}</pre>
        </div>
      )}
    </div>
  );
};

export default Template;