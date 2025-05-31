import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Utilitaires pour la visualisation
import { getNodeColor, getNodeIcon } from '../../VisualisationModule/Parser';
import { BASE_URL_Backend } from '../../../Platforme/Urls';

// Composant pour afficher les détails d'un nœud ou d'une relation sélectionnée
const Detail = ({ selectedItem }) => {
  const { t } = useTranslation(); // Hook pour la traduction

  // État pour gérer l'affichage des sections
  const [showNodeDetails, setShowNodeDetails] = useState(true); // Contrôle l'affichage des détails du nœud
  const [showProperties, setShowProperties] = useState(true); // Contrôle l'affichage des propriétés
  const [nodeProperties, setNodeProperties] = useState(''); // Propriétés du nœud
  const [relationshipProperties, setRelationshipProperties] = useState(''); // Propriétés de la relation

  // Appel API pour récupérer les propriétés d'un nœud
  const fetchNodeProperties = async () => {
    if (selectedItem?.isnode && selectedItem.group) {
      try {
        const response = await axios.post(`${BASE_URL_Backend}/get_node_properties/`, {
          node_type: selectedItem.group,
        });
        setNodeProperties(response.data.properties || []); // Met à jour les propriétés du nœud
      } catch (error) {
        console.error('Erreur lors de la récupération des propriétés du nœud:', error);
        setNodeProperties([]); // Réinitialise en cas d'erreur
      }
    } else {
      setNodeProperties([]); // Réinitialise si aucun nœud n'est sélectionné
    }
  };

  // Appel API pour récupérer les propriétés d'une relation
  const fetchRelationshipProperties = async () => {
    if (!selectedItem?.isnode && selectedItem?.group && !selectedItem.virtual) {
      try {
        const response = await axios.post(`${BASE_URL_Backend}/get_relationship_properties/`, {
          relationship_type: selectedItem.group,
        });
        setRelationshipProperties(response.data.properties || []); // Met à jour les propriétés de la relation
      } catch (error) {
        console.error('Erreur lors de la récupération des propriétés de la relation:', error);
        setRelationshipProperties([]); // Réinitialise en cas d'erreur
      }
    } else {
      setRelationshipProperties([]); // Réinitialise si aucune relation n'est sélectionnée
    }
  };

  // Effet pour charger les propriétés lors du changement de selectedItem
  useEffect(() => {
    fetchNodeProperties();
    fetchRelationshipProperties();
  }, [selectedItem]);

  // Gestionnaires d'événements pour basculer l'affichage
  const toggleNodeDetails = () => setShowNodeDetails(!showNodeDetails); // Bascule l'affichage des détails du nœud
  const toggleProperties = () => setShowProperties(!showProperties); // Bascule l'affichage des propriétés

  // Affiche les propriétés sous forme de liste
  const renderProperties = (properties) => {
    let fields = [];

    if (Array.isArray(properties) && properties.length === 1 && typeof properties[0] === 'string') {
      fields = properties[0].split(',').map((f) => f.trim()).filter((f) => f && !f.startsWith('_')); // Sépare une chaîne en liste
    } else if (typeof properties === 'string') {
      fields = properties.split(',').map((f) => f.trim()).filter((f) => f && !f.startsWith('_')); // Sépare une chaîne en liste
    } else if (Array.isArray(properties)) {
      fields = properties.filter((f) => typeof f === 'string' && !f.startsWith('_')); // Filtre les propriétés
    } else {
      return (
        <ul className="list-none p-0 m-0">
          {Object.entries(properties || {})
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, value]) => (
              <li key={key} className="my-1">
                <span className="font-semibold text-gray-700">{key}:</span>
                <span className="text-gray-600 ml-2">{String(value)}</span>
              </li>
            ))}
        </ul>
      );
    }

    return (
      <ul className="list-none p-0 m-0">
        {fields.map((field, index) => (
          <li key={index} className="my-1">• {field}</li>
        ))}
      </ul>
    );
  };

  // Composant pour afficher un badge de nœud
  const NodeBadge = ({ group, className = 'w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm' }) => (
    <div className={className} style={{ backgroundColor: getNodeColor(group) }}>
      <img src={getNodeIcon(group)} alt={group} className="w-3.5 h-3.5" />
    </div>
  );

  // Composant pour afficher un chemin virtuel
  const VirtualPath = ({ path }) => (
    <div className="flex flex-wrap gap-1 mt-1.5 pb-1.5 overflow-x-auto">
      {path.map((step, index) => {
        const isNode = index % 2 === 0; // Détermine si l'étape est un nœud
        return (
          <div key={index} className={`path-step ${isNode ? 'node-step' : 'relation-step'}`}>
            {isNode ? (
              <div
                className="flex items-center bg-gray-500 text-white px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]"
                title={step}
                style={{ backgroundColor: getNodeColor(step) }}
              >
                <img src={getNodeIcon(step)} alt={step} className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{step}</span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-gray-600">➝ {step}</span>
            )}
          </div>
        );
      })}
    </div>
  );

  // Composant pour afficher un résumé de relation
  const FinalRelationSummary = ({ path, group }) => (
    <div className="flex flex-wrap gap-1 mt-1.5 pb-1.5 overflow-x-auto">
      <NodeBadge group={path[0]} className="flex items-center bg-gray-500 text-white px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]" />
      <span className="text-xs font-semibold text-gray-600">➝ {group}</span>
      <NodeBadge group={path[path.length - 1]} className="flex items-center bg-gray-500 text-white px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]" />
    </div>
  );

  // Rendu conditionnel si aucun élément n'est sélectionné
  if (!selectedItem) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm h-full overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{t('sidebar.detailsTitle')}</h3>
        <p className="text-base text-gray-600">{t('sidebar.placeholder')}</p>
      </div>
    );
  }

  const isNode = selectedItem.isnode; // Vérifie si l'élément est un nœud

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm h-full overflow-y-auto">
      <h3
        className="text-xl font-bold text-gray-800 mb-4"
        style={
          !isNode
            ? {
                backgroundColor: selectedItem?.virtual ? 'green' : 'red', // Couleur selon le type de relation
                color: 'white',
                padding: '0.5rem',
                borderRadius: '4px',
              }
            : {}
        }
      >
        {isNode ? t('sidebar.nodeDetails') : t('sidebar.relationshipDetails')}
      </h3>

      {isNode ? (
        <div className="details-section">
          <div
            className="flex items-center justify-between p-1.5 bg-white border border-gray-300 rounded-md cursor-pointer font-semibold"
            onClick={toggleNodeDetails}
          >
            <NodeBadge group={selectedItem.group} />
            <span className="flex-grow">{selectedItem.group}</span>
            {showNodeDetails ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {showNodeDetails && (
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 mt-2 shadow-sm">
              <div className="flex flex-wrap my-3">
                <span className="font-medium text-gray-600">{t('sidebar.id')}:</span>
                <span className="text-gray-700 ml-2">{selectedItem.id}</span>
              </div>
              <div className="flex flex-wrap my-3">
                <span className="font-medium text-gray-600">{t('sidebar.type')}:</span>
                <span className="text-gray-700 ml-2">{selectedItem.group}</span>
              </div>
              <div className="mt-3">
                <div
                  className="flex items-center justify-between p-1 font-medium text-gray-800 cursor-pointer"
                  onClick={toggleProperties}
                >
                  <span className="flex-grow">{t('sidebar.properties')}</span>
                  {showProperties ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {showProperties && (
                  <div className="mt-1 pl-4">
                    {renderProperties(nodeProperties)} 
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
          <div className="flex flex-wrap my-3">
            <span className="font-medium text-gray-600">{t('sidebar.type')}:</span>
            <span className="text-gray-700 ml-2">{selectedItem.group}</span>
          </div>
          <div className="flex flex-wrap my-3">
            <span className="font-medium text-gray-600">{t('sidebar.properties')}:</span>
            <div className="ml-2">
              {selectedItem.virtual
                ? renderProperties({ count: 'Nombre total de relations entre un début et une fin' })
                : renderProperties(relationshipProperties)} 
            </div>
          </div>

          {selectedItem.virtual && (
            <>
              <hr />
              <div className="flex flex-wrap my-3">
                <span className="font-medium text-gray-600">Chemin:</span>
                <VirtualPath path={selectedItem.path} />
              </div>
              <div className="flex flex-wrap my-3">
                <span className="font-medium text-gray-600">Relation virtuelle:</span>
                <FinalRelationSummary path={selectedItem.path} group={selectedItem.group} /> 
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Validation des props
Detail.propTypes = {
  selectedItem: PropTypes.shape({
    isnode: PropTypes.bool, // Indique si c'est un nœud
    group: PropTypes.string, // Type ou groupe de l'élément
    id: PropTypes.string, // Identifiant du nœud
    from: PropTypes.string, // Départ de la relation
    to: PropTypes.string, // Arrivée de la relation
    virtual: PropTypes.bool, // Indique si la relation est virtuelle
    path: PropTypes.arrayOf(PropTypes.string), // Chemin pour les relations virtuelles
  }),
};

export default Detail; // Exporte le composant