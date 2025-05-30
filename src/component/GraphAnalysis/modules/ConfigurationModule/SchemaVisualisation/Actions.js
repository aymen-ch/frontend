import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Components
import AddActionWindow from '../../Windows/Actions/PersonProfileWindow/Actions';

// Utilities
import { getNodeColor, getNodeIcon } from '../../Parser';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
import globalWindowState from '../../VisualisationModule/globalWindowState';

const Actions = ({ selectedItem }) => {
  const { t } = useTranslation();

  // State
  const [availableActions, setAvailableActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeWindow, setActiveWindow] = useState(null);

  // Effects
  useEffect(() => {
    if (selectedItem?.isnode) {
      fetchAvailableActions(selectedItem.group);
    } else {
      setAvailableActions([]);
    }
  }, [selectedItem]);

  useEffect(() => {
    const checkWindowState = () => {
      setActiveWindow(globalWindowState.activeWindow);
    };

    checkWindowState();
    const interval = setInterval(checkWindowState, 100);
    return () => clearInterval(interval);
  }, []);

  // API Calls
  const fetchAvailableActions = async (nodeType) => {
    setLoadingActions(true);
    try {
      const response = await axios.post(`${BASE_URL_Backend}/get_available_actions/`, {
        node_type: nodeType,
      });
      setAvailableActions(response.data || []);
      console.log(response.data.actions)
      setActionError('');
    } catch (error) {
      setActionError(error.response?.data?.error || t('sidebar.actionsFetchError'));
    } finally {
      setLoadingActions(false);
    }
  };

  // Event Handlers
  const handleAddActionClick = () => {
    const itemWithoutId = { ...selectedItem, id: null }; // or node_id: null if applicable
    globalWindowState.setWindow('add_action', itemWithoutId);
  };

  const handleCloseWindow = () => {
    globalWindowState.clearWindow();
    setActiveWindow(null);
    if (selectedItem?.isnode) {
      fetchAvailableActions(selectedItem.group);
    }
  };

  const handleViewActionDetails = (action) => {
    setSelectedAction(action);
  };

  const handleCloseActionDetails = () => {
    setSelectedAction(null);
  };

  // Render Components
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
        onClick={() => handleViewActionDetails(action)}
        disabled={loadingActions}
      >
        <FaEye /> {t('sidebar.viewDetails')}
      </button>
    </li>
  );

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

  // Conditional Rendering
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
      {/* Add Action Window */}
      {activeWindow === 'add_action' && (
        <AddActionWindow node={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <NodeBadge />
        <h3 className="m-0 text-lg">{t('sidebar.actionsTitle')}</h3>
      </div>

      {/* Actions Section */}
      <div className="mt-2.5">
        <div className="flex justify-between items-center mb-2.5">
          <h4>{t('sidebar.availableActions')}</h4>
          <button
            className="bg-green-500 hover:bg-green-600 text-white border-none px-2.5 py-1 rounded flex items-center gap-1.5 text-sm disabled:opacity-50"
            onClick={handleAddActionClick}
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

      {/* Action Details Modal */}
      {selectedAction && <ActionDetailsModal />}
    </div>
  );
};

// PropTypes
Actions.propTypes = {
  selectedItem: PropTypes.shape({
    isnode: PropTypes.bool,
    group: PropTypes.string,
  }),
};

export default Actions;