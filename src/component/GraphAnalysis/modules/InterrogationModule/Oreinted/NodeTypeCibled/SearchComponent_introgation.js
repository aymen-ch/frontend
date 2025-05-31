import React, { useEffect, useState, memo } from 'react';
import { getNodeIcon, getNodeColor, parsergraph } from '../../../VisualisationModule/Parser';
import { useTranslation } from 'react-i18next';
import { getAuthToken, BASE_URL_Backend } from '../../../../Platforme/Urls';
import axios from 'axios';

// Ce composant permet de rechercher des noeuds par leurs propriétés et d'ajouter les résultats au graphe
const SearchComponent = ({ selectedNodeType, setNodes, setEdges }) => {
  const [nodeProperties, setNodeProperties] = useState([]); // État pour les propriétés du type de noeud sélectionné
  const [formValues, setFormValues] = useState({});// État pour les valeurs saisies dans le formulaire
  const [operations, setOperations] = useState({});// État pour les opérations de recherche (ex. '=', 'contains')
  const [error, setError] = useState(null);// État pour gérer les erreurs lors des appels API
  const [searchResult, setSearchResult] = useState(''); // État pour stocker les résultats de la recherche
  const [feedbackMessage, setFeedbackMessage] = useState('');// Message pour indiquer le succès ou l'échec de la recherche
  const [remainingNodes, setRemainingNodes] = useState([]); // Noeuds restants non affichés (si > 1000 noeuds)
  const [remainingEdges, setRemainingEdges] = useState([]);// Relations restantes non affichées (si > 1000 noeuds)
  const [showLoadMore, setShowLoadMore] = useState(false);// État pour afficher le bouton "Charger plus"

  const { t } = useTranslation();

  // Récupérer les propriétés d'un type de noeud avdc leurs type via l'API
  const fetchNodeProperties = async (nodeType) => {
    const token = getAuthToken();
    try {
      const response = await axios.get(`${BASE_URL_Backend}/node-types/properties_types/`, {
        params: { node_type: nodeType },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        return response.data.properties;
      } else {
        throw new Error('Erreur lors de la récupération des propriétés');
      }
    } catch (error) {
      console.error('Erreur API :', error);
      throw error;
    }
  };

  // Soumettre le formulaire de recherche via l'API
  const submitSearch = async (nodeType, formValues) => {
    const token = getAuthToken();
    const filteredFormValues = Object.fromEntries(
      Object.entries(formValues).filter(([key, value]) => value !== '' && value !== null)
    );

    const payload = {
      node_type: nodeType,
      properties: { ...filteredFormValues },
    };

    try {
      const response = await axios.post(
        `${BASE_URL_Backend}/search_cible_type_de_node/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error('Échec de la soumission');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission :', error);
      throw error;
    }
  };

  // Réinitialiser les états et récupérer les propriétés du type de noeud
  useEffect(() => {
    setNodeProperties([]);
    setFormValues({});
    setOperations({});
    setRemainingNodes([]);
    setRemainingEdges([]);
    setShowLoadMore(false);
    setFeedbackMessage('');
    const getNodeProperties = async () => {
      try {
        const properties = await fetchNodeProperties(selectedNodeType);
        setNodeProperties(properties);
      } catch (error) {
        setError(t('Erreur lors de la récupération des propriétés.'));
      }
    };
    if (selectedNodeType) {
      getNodeProperties();
    }
  }, [selectedNodeType, t]);

  // Traiter les résultats de recherche et ajouter les noeuds/relations au graphe
  useEffect(() => {
    if (!searchResult) return;
    const graphData = parsergraph(searchResult);

    if (graphData.nodes.length > 1000) {
      // Afficher les 1000 premiers noeuds/relations
      const firstNodes = graphData.nodes.slice(0, 1000);
      const firstEdges = graphData.edges.filter(edge =>
        firstNodes.some(node => node.id === edge.source) &&
        firstNodes.some(node => node.id === edge.target)
      );
      // Stocker les noeuds et relations restants
      const extraNodes = graphData.nodes.slice(1000);
      const extraEdges = graphData.edges.filter(edge =>
        !firstNodes.some(node => node.id === edge.source) ||
        !firstNodes.some(node => node.id === edge.target)
      );

      setNodes((prevNodes) => [...prevNodes, ...firstNodes]);
      setEdges((prevEdges) => [...prevEdges, ...firstEdges]);

      setRemainingNodes(extraNodes);
      setRemainingEdges(extraEdges);

      setShowLoadMore(true);
      setFeedbackMessage(
        t(
          '⚠️ Le résultat contient plus de 1000 noeuds ; seuls les 1000 premiers sont affichés. Vous pouvez ajouter les autres manuellement ou activer l\'option WebGL pour de meilleures performances.'
        )
      );
    } else {
      setNodes((prevNodes) => [...prevNodes, ...graphData.nodes]);
      setEdges((prevEdges) => [...prevEdges, ...graphData.edges]);
      setFeedbackMessage(t('✅ Résultat récupéré avec succès.'));
      setShowLoadMore(false);
      setRemainingNodes([]);
      setRemainingEdges([]);
    }
  }, [searchResult, setNodes, setEdges, t]);

  // Charger les noeuds et relations restants
  const handleLoadMore = () => {
    setNodes((prevNodes) => [...prevNodes, ...remainingNodes]);
    setEdges((prevEdges) => [...prevEdges, ...remainingEdges]);
    setShowLoadMore(false);
    setFeedbackMessage(t('✅ Tous les noeuds restants ont été ajoutés.'));
    setRemainingNodes([]);
    setRemainingEdges([]);
  };

  // Gérer les changements dans les champs de saisie
  const handleInputChange = (e, propertyName, propertyType) => {
    let value = e.target.value;
    if (propertyType === 'int') {
      value = value ? parseInt(value, 10) : '';
    } else if (propertyType === 'float') {
      value = value ? parseFloat(value) : '';
    } else if (propertyType === 'date') {
      if (value) {
        const [year, month, day] = value.split('-');
        value = `${month}-${day}-${year}`;
      }
    }

    setFormValues({ ...formValues, [propertyName]: value });

    // Réinitialiser le message si le champ est vidé
    if (value === '' || value === null) {
      setFeedbackMessage('');
      setShowLoadMore(false);
      setRemainingNodes([]);
      setRemainingEdges([]);
    }
  };

  // Gérer les changements d'opération de recherche
  const handleOperationChange = (e, propertyName) => {
    setOperations({ ...operations, [propertyName]: e.target.value });
  };

  // Soumettre le formulaire et lancer la recherche avec validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMessage('');
    setShowLoadMore(false);
    setRemainingNodes([]);
    setRemainingEdges([]);
    setError(null);

    // Vérifier si au moins une valeur est saisie
    const hasValues = Object.values(formValues).some(value => value !== '' && value !== null);
    if (!hasValues) {
      setError(t('Veuillez remplir au moins un champ pour lancer la recherche.'));
      return;
    }

    try {
      const searchPayload = {
        values: formValues,
        operations: operations,
      };
      const result = await submitSearch(selectedNodeType, searchPayload);
      setSearchResult(result);
    } catch (error) {
      setError(t('Erreur lors de la soumission.'));
    }
  };

  // Options d'opérations pour différents types de propriétés
  const intOperationOptions = ['=', '!=', '>', '<', '>=', '<='];
  const stringOperationOptions = ['=', 'contains', 'startswith', 'endswith'];
  const dateOperationOptions = ['=', '!=', '>', '<', '>=', '<='];

  // Déterminer les options d'opération selon le type de propriété
  const getOperationOptions = (propertyType, propertyName) => {
    const type = propertyType?.toLowerCase();
    if (propertyName.toLowerCase().includes('date')) return dateOperationOptions;
    if (['int', 'float'].includes(type)) return intOperationOptions;
    if (type === 'str' || type === 'string') return stringOperationOptions;
    return [];
  };

  return (
    <div className="flex-1">
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded">{error}</div>}

      {nodeProperties.filter((property) => !property.name.startsWith('_')).length > 0 && (
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <div className="bg-blue-100 text-blue-900 rounded-t flex items-center px-3 py-2">
            <div
              className="w-6 h-6 flex items-center justify-center rounded-full mr-2"
              style={{ backgroundColor: getNodeColor(selectedNodeType) }}
            >
              <img
                src={getNodeIcon(selectedNodeType)}
                alt="Node Type Icon"
                className="w-4 h-4 brightness-0 invert"
              />
            </div>
            <h6 className="text-sm font-semibold m-0">
              {t('Propriétés pour')} {selectedNodeType}
            </h6>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              {nodeProperties
                .filter((property) => !property.name.startsWith('_'))
                .map((property, index) => {
                  const propertyName = property.name;
                  const rawType = property.type?.toLowerCase();
                  const isDate = propertyName.toLowerCase().includes('date');
                  const showOp = ['int', 'float', 'str', 'string'].includes(rawType) || isDate;

                  return (
                    <div key={index} className="flex items-center px-3 py-1 gap-2">
                      <label className="text-sm font-medium min-w-[140px]">
                        {propertyName} ({isDate ? t('date') : t(rawType)}):
                      </label>
                      {showOp && (
                        <select
                          className="border rounded text-sm px-2 py-1 w-[100px]"
                          value={
                            operations[propertyName] ??
                            (isDate || ['int', 'float'].includes(rawType) ? '=' : 'contains')
                          }
                          onChange={(e) => handleOperationChange(e, propertyName)}
                        >
                          {getOperationOptions(rawType, propertyName).map((op) => (
                            <option key={op} value={op}>
                              {t(op)}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type={
                          isDate
                            ? 'date'
                            : ['int', 'float'].includes(rawType)
                            ? 'number'
                            : 'text'
                        }
                        className="border rounded text-sm px-2 py-1 flex-1"
                        onChange={(e) =>
                          handleInputChange(e, propertyName, isDate ? 'date' : rawType)
                        }
                        step={rawType === 'float' ? 'any' : undefined}
                      />
                    </div>
                  );
                })}
              <div className="px-3 pb-3">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded w-full transition-colors"
                >
                  {t('Rechercher')}
                </button>
              </div>
            </form>

            {feedbackMessage && (
              <div
                className={`text-sm px-3 py-2 rounded ${
                  feedbackMessage.includes('Succès')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {feedbackMessage}
              </div>
            )}

            {showLoadMore && (
              <div className="px-3 pb-3">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded w-full transition-colors"
                  onClick={handleLoadMore}
                >
                  {t('Charger les noeuds restants')}
                </button>
                <p className="text-xs mt-1 text-yellow-700">
                  {t('Astuce : Activez l\'option WebGL pour de meilleures performances avec des graphes volumineux.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SearchComponent);