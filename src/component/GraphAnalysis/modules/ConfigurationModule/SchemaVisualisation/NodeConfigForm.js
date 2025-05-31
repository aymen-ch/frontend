import React, { useState, useEffect } from 'react';
import { updateNodeConfig, getNodeColor, getNodeIcon, NODE_CONFIG } from '../../VisualisationModule/Parser';
import { getAuthToken, BASE_URL_Backend } from '../../../Platforme/Urls';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Composant pour configurer le style d'un nœud sélectionné soulement d'un node on a pas ajouter le style des relation
/// pour ajouter le style des relation il faut ajouter au fichier configue pour chaque type color ,...
const NodeConfigForm = ({ selectedNode, onUpdate }) => {
  // États pour gérer les champs du formulaire
  const [nodeType, setNodeType] = useState(selectedNode?.group || ''); // Type du nœud
  const [color, setColor] = useState(''); // Couleur du nœud
  const [size, setSize] = useState(''); // Taille du nœud
  const [icon, setIcon] = useState(''); // Icône du nœud
  const [labelKey, setLabelKey] = useState([]); // Liste des labels sélectionnés,pour etre afficher durant l'analyse en dessous de node
  const [properties, setProperties] = useState([]); // Propriétés du nœud
  const [error, setError] = useState(null); // Gestion des erreurs
  const { t } = useTranslation(); // Hook pour la traduction

  // Fonction pour récupérer les propriétés d'un nœud via API
  const fetchNodeProperties = async (nodeType) => {
    const token = getAuthToken(); // Récupère le jeton d'authentification
    try {
      const response = await axios.get(`${BASE_URL_Backend}/node-types/properties_types/`, {
        params: { node_type: nodeType },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        return response.data.properties; // Retourne les propriétés
      } else {
        throw new Error('Erreur lors de la récupération des propriétés');
      }
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  };

  // Met à jour le type de nœud lorsque selectedNode change
  useEffect(() => {
    setNodeType(selectedNode?.group || '');
  }, [selectedNode]);

  // Charge les style de configurations et propriétés du nœud
  useEffect(() => {
    if (nodeType) {
      const config = NODE_CONFIG.nodeTypes[nodeType] || NODE_CONFIG.nodeTypes.default; // Config du nœud
      setColor(config.color || getNodeColor(nodeType)); // Définit la couleur
      setSize(config.size || NODE_CONFIG.defaultNodeSize); // Définit la taille
      setIcon(config.icon || getNodeIcon(nodeType)); // Définit l'icône
      setLabelKey(config.labelKey ? config.labelKey.split(',') : []); // Convertit les labels en tableau

      // Récupère les propriétés du nœud
      const fetchProperties = async () => {
        try {
          const nodeProperties = await fetchNodeProperties(nodeType);
          setProperties(nodeProperties || []); // Met à jour les propriétés
          setError(null); // Réinitialise l'erreur
        } catch (err) {
          console.error('Erreur lors de la récupération des propriétés:', err.message);
          setError('Échec du chargement des propriétés du nœud');
          setProperties([]); // Réinitialise les propriétés
        }
      };

      fetchProperties();
    } else {
      // Réinitialise les champs si aucun type de nœud
      setProperties([]);
      setLabelKey([]);
      setColor('');
      setSize('');
      setIcon('');
      setError(null);
    }
  }, [nodeType]);

  // Gère la sélection d'une icône via un fichier
  const handleIconSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const iconPath = `/icon/${file.name}`; // Chemin de l'icône, on a utiliser soulement ce chemin 
      setIcon(iconPath);
      console.log('Icône sélectionnée:', file.name, 'Enregistrée sous:', iconPath);
    }
  };

  // Ajoute un label à la liste
  const handleAddLabel = (e) => {
    const newLabel = e.target.value;
    if (newLabel && !labelKey.includes(newLabel)) {
      setLabelKey([...labelKey, newLabel]); // Ajoute le nouveau label
    }
    e.target.value = ''; // Réinitialise la liste déroulante
  };

  // Supprime un label de la liste
  const handleRemoveLabel = (labelToRemove) => {
    setLabelKey(labelKey.filter((label) => label !== labelToRemove)); // Supprime le label
  };

  // Soumet les modifications de configuration
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {};
      if (color) config.color = color; // Ajoute la couleur si définie
      if (size) config.size = parseInt(size, 10); // Ajoute la taille si définie
      if (icon) config.icon = icon; // Ajoute l'icône si définie
      if (labelKey.length > 0) config.labelKey = labelKey.join(','); // Convertit les labels en chaîne

      await updateNodeConfig(nodeType || 'NewType', config); // Met à jour la configuration
      if (typeof onUpdate === 'function') {
        onUpdate(nodeType, config); // Appelle la fonction de mise à jour
      } else {
        console.warn('onUpdate n’est pas une fonction:', onUpdate);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error.message);
      setError('Échec de la mise à jour de la configuration');
    }
  };

  // Filtre les propriétés non sélectionnées pour éviter les doublons
  const availableProperties = properties.filter((prop) => !labelKey.includes(prop.name));

  // Rendu conditionnel si aucun nœud n'est sélectionné
  if (!selectedNode) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <h3 className="m-0 text-lg">{t('NodeConfig')}</h3>
        <p className="text-gray-600 italic py-2.5">{t('Sélectionnez un nœud pour modifier sa couleur ou son icône')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-full mt-2.5">
      <h3 className="m-0 text-lg">{t('Configuration du nœud')}</h3>

      {error && (
        <div className="bg-red-100 text-red-800 p-2.5 rounded border border-red-300 mb-4 text-sm">
          {t(error)} // Affiche les erreurs
        </div>
      )}

      <form className="mt-4" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Type de nœud')}</label>
          <input
            type="text"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            placeholder={t('Entrez le type de nœud')}
            className="w-full p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Couleur')}</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 p-0 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Taille')}</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder={t('Taille du nœud')}
            className="w-full p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Icône')}</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t('Entrez le chemin de l’icône')}
              className="flex-1 p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
            />
            <label className="bg-blue-500 text-white px-3.5 py-2 rounded-md font-semibold cursor-pointer hover:bg-blue-600 transition-colors duration-300 text-sm">
              {t('Parcourir')}
              <input
                type="file"
                accept="image/*"
                onChange={handleIconSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Clé de propriété d’étiquette')}</label>
          <div className="mt-2">
            {labelKey.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {labelKey.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center bg-indigo-100 text-indigo-900 px-2 py-1 rounded-full text-sm"
                  >
                    {label}
                    <button
                      type="button"
                      className="bg-transparent border-none text-indigo-900 text-base ml-1 hover:text-red-600 cursor-pointer leading-none"
                      onClick={() => handleRemoveLabel(label)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-2">{t('Aucun label sélectionné')}</p>
            )}

            <select
              onChange={handleAddLabel}
              className="w-full p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
              disabled={!nodeType || availableProperties.length === 0}
            >
              <option value="">{t('Sélectionnez une propriété à ajouter')}</option>
              {availableProperties.map((prop) => (
                <option key={prop.name} value={prop.name}>
                  {prop.name} ({prop.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full p-2.5 bg-blue-500 text-white border-none rounded-lg font-semibold text-base hover:bg-blue-600 transition-colors duration-300"
        >
          {t('Appliquer')}
        </button>
      </form>
    </div>
  );
};

export default NodeConfigForm; // Exporte le composant