import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye } from 'react-icons/fa'; // Icônes pour ajouter et voir les détails
import PropTypes from 'prop-types'; // Validation des props
import { useTranslation } from 'react-i18next'; // Hook pour la traduction
import axios from 'axios'; // Client HTTP pour les appels API

// Composants
import AddActionWindow from '../../Windows/Actions/PersonProfileWindow/Actions'; // Fenêtre pour ajouter une action

// Utilitaires
import { getNodeColor, getNodeIcon } from '../../VisualisationModule/Parser'; // Fonctions pour la couleur et l'icône des nœuds
import { BASE_URL_Backend } from '../../../Platforme/Urls'; // URL de base de l'API backend
import globalWindowState from '../../VisualisationModule/globalWindowState'; // État global de la fenêtre

// Composant pour gérer les actions d'un nœud sélectionné
const Actions = ({ selectedItem }) => {
  const { t } = useTranslation(); // Fonction de traduction

  // État
  const [availableActions, setAvailableActions] = useState([]); // Liste des actions disponibles
  const [loadingActions, setLoadingActions] = useState(false); // Indicateur de chargement des actions
  const [actionError, setActionError] = useState(''); // Message d'erreur pour les actions
  const [selectedAction, setSelectedAction] = useState(null); // Action sélectionnée pour les détails
  const [activeWindow, setActiveWindow] = useState(null); // Fenêtre active

  // Fonction pour récupérer les actions disponibles
  const fetchAvailableActions = async (nodeType) => {
    setLoadingActions(true); // Active l'indicateur de chargement
    try {
      const response = await axios.post(`${BASE_URL_Backend}/get_available_actions/`, {
        node_type: nodeType, // Type de nœud
      });
      setAvailableActions(response.data || []); // Met à jour les actions disponibles
      console.log(response.data.actions); // Affiche les actions dans la console
      setActionError(''); // Efface les erreurs
    } catch (error) {
      setActionError(error.response?.data?.error || t('sidebar.actionsFetchError')); // Définit le message d'erreur
    } finally {
      setLoadingActions(false); // Désactive l'indicateur de chargement
    }
  };

  // Effets
  useEffect(() => {
    if (selectedItem?.isnode) {
      fetchAvailableActions(selectedItem.group); // Récupère les actions si un nœud est sélectionné
    } else {
      setAvailableActions([]); // Réinitialise les actions si aucun nœud
    }
  }, [selectedItem]);

  useEffect(() => {
    const checkWindowState = () => {
      setActiveWindow(globalWindowState.activeWindow); // Met à jour la fenêtre active
    };

    checkWindowState(); // Vérifie l'état initial
    const interval = setInterval(checkWindowState, 100); // Vérifie toutes les 100ms
    return () => clearInterval(interval); // Nettoie l'intervalle
  }, []);

  // Gestionnaires d'événements
  const handleAddActionClick = () => {
    const itemWithoutId = { ...selectedItem, id: null }; // Supprime l'ID du nœud
    globalWindowState.setWindow('add_action', itemWithoutId); // Ouvre la fenêtre d'ajout d'action
  };

  const handleCloseWindow = () => {
    globalWindowState.clearWindow(); // Ferme la fenêtre
    setActiveWindow(null); // Réinitialise la fenêtre active
    if (selectedItem?.isnode) {
      fetchAvailableActions(selectedItem.group); // Récupère les actions à nouveau
    }
  };

  const handleViewActionDetails = (action) => {
    setSelectedAction(action); // Sélectionne une action pour afficher ses détails
  };

  const handleCloseActionDetails = () => {
    setSelectedAction(null); // Ferme la fenêtre des détails
  };

  // Composant pour afficher le badge du nœud
  const NodeBadge = () => (
    <div className={`flex items-center px-2.5 py-1 rounded-full text-white text-sm gap-1.5`} style={{ backgroundColor: getNodeColor(selectedItem.group) }}>
      <img
        src={getNodeIcon(selectedItem.group)}
        alt={selectedItem.group}
        className="w-4 h-4"
      />
      <span className="node-type-label">{selectedItem.group}</span>
    </div>
  );

  // Composant pour afficher une action
  const ActionItem = ({ action, index }) => (
    <li className="flex justify-between items-center py-2 border-b border-gray-100" key={index}>
      <div className="action-info">
        <span className="font-medium">{action.name}</span>
        {action.description && (
          <span className="action-description">{action.description}</span>
        )}
      </div>
      <button
        className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded px-2.5 py-1 flex items-center gap-1.5 text-sm disabled:opacity-50"
        onClick={() => handleViewActionDetails(action)} // Affiche les détails de l'action
        disabled={loadingActions}
      >
        <FaEye /> {t('sidebar.viewDetails')}
      </button>
    </li>
  );

  // Composant pour la modale des détails d'action
  const ActionDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="m-0 text-lg">{selectedAction.name}</h3>
          <button className="bg-transparent border-none text-xl cursor-pointer text-gray-600" onClick={handleCloseActionDetails}>
            {t('sidebar.close')}
          </button>
        </div>
        <div className="p-5">
          {selectedAction.description && (
            <div className="mb-4">
              <span className="block font-bold mb-1 text-gray-700">{t('sidebar.description')}:</span>
              <span className="block text-gray-900">{selectedAction.description}</span>
            </div>
          )}
          <div className="mb-4">
            <span className="block font-bold mb-1 text-gray-700">{t('sidebar.nodeType')}:</span>
            <span className="block text-gray-900">{selectedAction.node_type}</span>
          </div>
          <div className="mb-4">
            <span className="block font-bold mb-1 text-gray-700">{t('sidebar.cypherQuery')}:</span>
            <pre className="bg-gray-50 p-2.5 rounded whitespace-pre-wrap break-words font-mono text-sm">{selectedAction.query}</pre>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded px-3 py-2 cursor-pointer" onClick={handleCloseActionDetails}>
            {t('sidebar.close')}
          </button>
        </div>
      </div>
    </div>
  );

  // Rendu conditionnel
  if (!selectedItem) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <h3 className="m-0 text-lg">{t('sidebar.actionsTitle')}</h3>
        <p className="text-gray-600 italic py-2.5">{t('sidebar.selectNode')}</p>
      </div>
    );
  }

  if (!selectedItem.isnode) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <h3 className="m-0 text-lg">{t('sidebar.actionsTitle')}</h3>
        <p className="text-gray-600 italic py-2.5">{t('sidebar.actionsOnlyNodes')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Fenêtre d'ajout d'action */}
      {activeWindow === 'add_action' && (
        <AddActionWindow node={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}

      {/* En-tête */}
      <div className="flex items-center gap-2.5 mb-4">
        <NodeBadge />
        <h3 className="m-0 text-lg">{t('sidebar.actionsTitle')}</h3>
      </div>

      {/* Section des actions */}
      <div className="mt-2.5">
        <div className="flex justify-between items-center mb-2.5">
          <h4>{t('sidebar.availableActions')}</h4>
          <button
            className="bg-green-500 hover:bg-green-600 text-white border-none px-2.5 py-1 rounded flex items-center gap-1.5 text-sm disabled:opacity-50"
            onClick={handleAddActionClick} // Ouvre la fenêtre d'ajout
            disabled={loadingActions}
          >
            <FaPlus /> {t('sidebar.addAction')}
          </button>
        </div>

        {loadingActions ? (
          <div className="text-gray-600 italic py-2.5">{t('sidebar.loadingActions')}</div>
        ) : availableActions.length > 0 ? (
          <ul className="list-none p-0 m-0">
            {availableActions.map((action, index) => (
              <ActionItem action={action} index={index} key={index} />
            ))}
          </ul>
        ) : (
          <div className="text-gray-600 italic py-2.5">{t('sidebar.noActionsAvailable')}</div>
        )}

        {actionError && <div className="text-red-500 mt-2.5 text-sm">{actionError}</div>}
      </div>

      {/* Modale des détails d'action */}
      {selectedAction && <ActionDetailsModal />}
    </div>
  );
};

// Validation des props
Actions.propTypes = {
  selectedItem: PropTypes.shape({
    isnode: PropTypes.bool, // Indique si l'élément est un nœud
    group: PropTypes.string, // Groupe du nœud
  }),
};

export default Actions;