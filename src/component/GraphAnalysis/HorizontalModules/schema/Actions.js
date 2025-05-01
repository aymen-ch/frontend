import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Components
import AddActionWindow from '../../modules/Windows/Actions/PersonProfileWindow/Actions';

// Utilities
import { getNodeColor, getNodeIcon } from '../../utils/Parser';
import { BASE_URL } from '../../utils/Urls';
import globalWindowState from '../../utils/globalWindowState';

// Styles
import './Actions.css';

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
      const response = await axios.post(`${BASE_URL}/get_available_actions/`, {
        node_type: nodeType,
      });
      setAvailableActions(response.data.actions || []);
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
    <div className="node-type-badge" style={{ backgroundColor: getNodeColor(selectedItem.group) }}>
      <img
        src={getNodeIcon(selectedItem.group)}
        alt={selectedItem.group}
        className="node-icon-img"
      />
      <span className="node-type-label">{selectedItem.group}</span>
    </div>
  );

  const ActionItem = ({ action, index }) => (
    <li className="action-item" key={index}>
      <div className="action-info">
        <span className="action-name">{action.name}</span>
        {action.description && (
          <span className="action-description">{action.description}</span>
        )}
      </div>
      <button
        className="view-details-btn"
        onClick={() => handleViewActionDetails(action)}
        disabled={loadingActions}
      >
        <FaEye /> {t('sidebar.viewDetails')}
      </button>
    </li>
  );

  const ActionDetailsModal = () => (
    <div className="action-details-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{selectedAction.name}</h3>
          <button className="close-btn" onClick={handleCloseActionDetails}>
            {t('sidebar.close')}
          </button>
        </div>
        <div className="modal-body">
          {selectedAction.description && (
            <div className="detail-item">
              <span className="detail-label">{t('sidebar.description')}:</span>
              <span className="detail-value">{selectedAction.description}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.nodeType')}:</span>
            <span className="detail-value">{selectedAction.node_type}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('sidebar.cypherQuery')}:</span>
            <pre className="query-preview">{selectedAction.query}</pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="close-modal-btn" onClick={handleCloseActionDetails}>
            {t('sidebar.close')}
          </button>
        </div>
      </div>
    </div>
  );

  // Conditional Rendering
  if (!selectedItem) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">{t('sidebar.actionsTitle')}</h3>
        <p className="sidebar-placeholder">{t('sidebar.selectNode')}</p>
      </div>
    );
  }

  if (!selectedItem.isnode) {
    return (
      <div className="sidebar-container">
        <h3 className="sidebar-title">{t('sidebar.actionsTitle')}</h3>
        <p className="sidebar-placeholder">{t('sidebar.actionsOnlyNodes')}</p>
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      {/* Add Action Window */}
      {activeWindow === 'add_action' && (
        <AddActionWindow node={globalWindowState.windowData} onClose={handleCloseWindow} />
      )}

      {/* Header */}
      <div className="actions-header">
        <NodeBadge />
        <h3 className="sidebar-title">{t('sidebar.actionsTitle')}</h3>
      </div>

      {/* Actions Section */}
      <div className="actions-section">
        <div className="section-header">
          <h4>{t('sidebar.availableActions')}</h4>
          <button
            className="add-action-btn"
            onClick={handleAddActionClick}
            disabled={loadingActions}
          >
            <FaPlus /> {t('sidebar.addAction')}
          </button>
        </div>

        {loadingActions ? (
          <div className="loading-actions">{t('sidebar.loadingActions')}</div>
        ) : availableActions.length > 0 ? (
          <ul className="actions-list">
            {availableActions.map((action, index) => (
              <ActionItem action={action} index={index} key={index} />
            ))}
          </ul>
        ) : (
          <div className="no-actions">{t('sidebar.noActionsAvailable')}</div>
        )}

        {actionError && <div className="action-error">{actionError}</div>}
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