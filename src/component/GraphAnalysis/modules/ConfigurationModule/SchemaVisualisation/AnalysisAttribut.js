import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // Hook pour la traduction
import { FaChevronUp, FaChevronDown } from 'react-icons/fa'; // Icônes pour afficher/masquer les sections
import axios from 'axios'; // Client HTTP pour les appels API
import { BASE_URL_Backend } from '../../../Platforme/Urls'; // URL de base de l'API backend

// Composant pour gérer les attributs d'analyse d'un nœud sélectionné
const AnalysisAttributeForm = ({ selectedItem }) => {
  const { t } = useTranslation(); // Fonction de traduction

  // État
  const [showAttributeForm, setShowAttributeForm] = useState(false); // Affiche/masque le formulaire d'attributs
  const [showAnalysisProperties, setShowAnalysisProperties] = useState(true); // Affiche/masque les propriétés d'analyse
  const [analysisMessage, setAnalysisMessage] = useState(null); // Message de résultat de l'analyse
  const [isLoading, setIsLoading] = useState(false); // Indicateur de chargement
  const [relAttributes, setRelAttributes] = useState([]); // Liste des attributs de relation
  const [analysisProperties, setAnalysisProperties] = useState([]); // Liste des propriétés d'analyse
  const [direction, setDirection] = useState('in'); // Direction des relations (entrantes/sortantes)
  const [calcType, setCalcType] = useState('degree_in'); // Type de calcul (degré entrant/sortant, somme)
  const [aggregation, setAggregation] = useState('sum'); // Type d'agrégation (somme/multiplication)
  const [selectedRelAttribute, setSelectedRelAttribute] = useState(''); // Attribut de relation sélectionné
  const [attributeName, setAttributeName] = useState('degree_in'); // Nom de l'attribut d'analyse

  // Fonction pour récupérer les attributs de relation
  const fetchRelationshipAttributes = async () => {
    if (!selectedItem?.isnode || !selectedItem.group) {
      setRelAttributes([]); // Réinitialise les attributs si aucun nœud
      return;
    }

    try {
      const endpoint =
        direction === 'in'
          ? `${BASE_URL_Backend}/get_incoming_relationship_attributes/`
          : `${BASE_URL_Backend}/get_outgoing_relationship_attributes/`; // Endpoint selon la direction
      const response = await axios.post(endpoint, {
        node_type: selectedItem.group, // Type de nœud
      });
      setRelAttributes(response.data.attributes); // Met à jour les attributs de relation
      if (response.data.attributes.length > 0) {
        setSelectedRelAttribute(response.data.attributes[0]); // Sélectionne le premier attribut
      } else {
        setSelectedRelAttribute(''); // Réinitialise si aucun attribut
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des attributs de relation:', error);
      setRelAttributes([]); // Réinitialise en cas d'erreur
    }
  };

  // Fonction pour récupérer les propriétés d'analyse (commençant par '_')
  const fetchNodeProperties = async () => {
    if (!selectedItem?.isnode || !selectedItem.group) {
      setAnalysisProperties([]); // Réinitialise les propriétés si aucun nœud
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL_Backend}/get_node_properties/`, {
        node_type: selectedItem.group, // Type de nœud
      });
      let properties = response.data.properties; // Propriétés récupérées

      // Gestion des différents formats de propriétés
      let analysisFields = [];

      if (Array.isArray(properties) && properties.length === 1 && typeof properties[0] === 'string') {
        analysisFields = properties[0]
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f && f.startsWith('_')); // Filtre les propriétés commençant par '_'
      } else if (typeof properties === 'string') {
        analysisFields = properties
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f && f.startsWith('_')); // Filtre les propriétés de type string
      } else if (Array.isArray(properties)) {
        analysisFields = properties.filter((f) => typeof f === 'string' && f.startsWith('_')); // Filtre les propriétés dans un tableau
      } else if (typeof properties === 'object') {
        analysisFields = Object.keys(properties).filter((key) => key.startsWith('_')); // Filtre les clés commençant par '_'
      }

      setAnalysisProperties(analysisFields); // Met à jour les propriétés d'analyse
    } catch (error) {
      console.error('Erreur lors de la récupération des propriétés d\'analyse:', error);
      setAnalysisProperties([]); // Réinitialise en cas d'erreur
    }
  };

  // Effet pour récupérer les attributs et propriétés
  useEffect(() => {
    fetchRelationshipAttributes(); // Récupère les attributs de relation
    fetchNodeProperties(); // Récupère les propriétés d'analyse
  }, [direction, selectedItem]);

  // Effet pour mettre à jour le nom de l'attribut selon le type de calcul
  useEffect(() => {
    setAttributeName(
      calcType === 'degree_in'
        ? 'degree_in'
        : calcType === 'degree_out'
        ? 'degree_out'
        : calcType === 'sum_degree_in'
        ? 'sum_degree_in'
        : 'sum_degree_out' // Définit le nom en fonction du type de calcul
    );
  }, [calcType]);

  // Fonction pour basculer l'affichage du formulaire
  const toggleAttributeForm = () => setShowAttributeForm(!showAttributeForm);

  // Fonction pour basculer l'affichage des propriétés d'analyse
  const toggleAnalysisProperties = () => setShowAnalysisProperties(!showAnalysisProperties);

  // Fonction pour insérer un nouvel attribut
  const handleInsertAttributes = async () => {
    if (!selectedItem?.isnode) {
      setAnalysisMessage(t('sidebar.errorNodeRequired')); // Message d'erreur si aucun nœud
      return;
    }

    setIsLoading(true); // Active l'indicateur de chargement
    setAnalysisMessage(null); // Réinitialise le message

    try {
      const response = await axios.post(`${BASE_URL_Backend}/insert_node_attribute/`, {
        node_type: selectedItem.group, // Type de nœud
        calc_type: calcType, // Type de calcul
        attribute_name: attributeName, // Nom de l'attribut
        rel_attribute: selectedRelAttribute, // Attribut de relation
        aggregation: aggregation, // Type d'agrégation
      });
      setAnalysisMessage(response.data.message); // Affiche le message de succès
      fetchNodeProperties(); // Rafraîchit les propriétés d'analyse
    } catch (error) {
      setAnalysisMessage(
        error.response?.data?.error || t('sidebar.errorAnalysisFailed') // Message d'erreur en cas d'échec
      );
    } finally {
      setIsLoading(false); // Désactive l'indicateur de chargement
    }
  };

  // Fonction pour afficher les propriétés d'analyse
  const renderAnalysisProperties = () => {
    if (!analysisProperties.length) {
      return <p className="text-sm text-gray-600 m-0">{t('sidebar.noAnalysisProperties')}</p>;
    }

    return (
      <ul className="list-none p-0 m-0">
        {analysisProperties.map((prop, index) => (
          <li key={index} className="py-1 text-sm text-gray-700">
            • {prop.startsWith('_') ? prop.substring(1) : prop} 
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mt-4">
      {/* Section des propriétés d'analyse */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between p-2 bg-gray-100 rounded cursor-pointer text-gray-700 hover:bg-gray-200 transition-colors duration-200"
          onClick={toggleAnalysisProperties} // Bascule l'affichage
        >
          <span className="font-bold">{t('sidebar.analysisProperties')}</span>
          {showAnalysisProperties ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        {showAnalysisProperties && (
          <div className="mt-2 p-2 bg-white border border-gray-300 rounded">
            {renderAnalysisProperties()} 
          </div>
        )}
      </div>

      {/* Section du formulaire d'attributs */}
      <button
        className="flex items-center justify-between w-full p-2 bg-gray-100 border-none rounded text-gray-700 hover:bg-gray-200 transition-colors duration-200 text-base"
        onClick={toggleAttributeForm} // Bascule l'affichage du formulaire
        aria-expanded={showAttributeForm}
      >
        {showAttributeForm
          ? t('sidebar.hideAttributeForm')
          : t('sidebar.showAttributeForm')}
        {showAttributeForm ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {showAttributeForm && (
        <div className="mt-4 p-4 bg-white border border-gray-300 rounded">
          <div className="grid gap-4">
            <div className="flex flex-col">
              <label className="font-bold mb-1">
                {t('sidebar.direction')}
                <select
                  value={direction}
                  onChange={(e) => {
                    setDirection(e.target.value); // Met à jour la direction
                    setCalcType(e.target.value === 'in' ? 'degree_in' : 'degree_out'); // Met à jour le type de calcul
                    setSelectedRelAttribute(''); // Réinitialise l'attribut de relation
                    setAggregation('sum'); // Réinitialise l'agrégation
                  }}
                  disabled={isLoading}
                  className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="in">{t('sidebar.incoming')}</option>
                  <option value="out">{t('sidebar.outgoing')}</option>
                </select>
              </label>
            </div>
            <div className="flex flex-col">
              <label className="font-bold mb-1">
                {t('sidebar.calcType')}
                <select
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)} // Met à jour le type de calcul
                  disabled={isLoading}
                  className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {direction === 'in' ? (
                    <>
                      <option value="degree_in">{t('sidebar.degreeIn')}</option>
                      <option value="sum_degree_in">{t('sidebar.sumDegreeIn')}</option>
                    </>
                  ) : (
                    <>
                      <option value="degree_out">{t('sidebar.degreeOut')}</option>
                      <option value="sum_degree_out">{t('sidebar.sumDegreeOut')}</option>
                    </>
                  )}
                </select>
              </label>
            </div>
            {(calcType === 'sum_degree_in' || calcType === 'sum_degree_out') && (
              <>
                <div className="flex flex-col">
                  <label className="font-bold mb-1">
                    {t('sidebar.relAttribute')}
                    <select
                      value={selectedRelAttribute}
                      onChange={(e) => setSelectedRelAttribute(e.target.value)} // Met à jour l'attribut de relation
                      disabled={isLoading}
                      className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {relAttributes.map((attr) => (
                        <option key={attr} value={attr}>
                          {attr}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-col">
                  <label className="font-bold mb-1">
                    {t('sidebar.aggregation')}
                    <select
                      value={aggregation}
                      onChange={(e) => setAggregation(e.target.value)} // Met à jour le type d'agrégation
                      disabled={isLoading}
                      className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="sum">{t('sidebar.sum')}</option>
                      <option value="multiplication">{t('sidebar.multiplication')}</option>
                    </select>
                  </label>
                </div>
              </>
            )}
            <div className="flex flex-col">
              <label className="font-bold mb-1">
                {t('sidebar.attributeName')}
                <input
                  type="text"
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)} // Met à jour le nom de l'attribut
                  disabled={isLoading}
                  placeholder={
                    calcType === 'degree_in'
                      ? 'degree_in'
                      : calcType === 'degree_out'
                      ? 'degree_out'
                      : calcType === 'sum_degree_in'
                      ? 'sum_degree_in'
                      : 'sum_degree_out'
                  }
                  className="p-2 border border-gray-300 rounded text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </div>
          <button
            className="mt-4 p-2 bg-blue-500 text-white border-none rounded flex items-center justify-center text-base disabled:bg-gray-500 disabled:cursor-not-allowed"
            onClick={handleInsertAttributes} // Insère le nouvel attribut
            disabled={isLoading || !attributeName.trim()}
            aria-busy={isLoading}
            aria-label={
              isLoading
                ? t('sidebar.insertingAttributes')
                : t('sidebar.insertNewAttribute')
            }
          >
            {isLoading ? (
              <span
                className="inline-block w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"
                aria-hidden="true"
              ></span>
            ) : (
              t('sidebar.insertNewAttribute')
            )}
          </button>
          {analysisMessage && (
            <p className="mt-4 p-2 bg-gray-200 rounded text-sm">{analysisMessage}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisAttributeForm;