import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { getNodeColor, getNodeIcon } from '../../utils/Parser';
import { useTranslation } from 'react-i18next';
import './Actions.css';
import { BASE_URL } from '../../utils/Urls';
import AddActionWindow from "../../modules/Windows/Actions/PersonProfileWindow/Actions";
import globalWindowState from '../../utils/globalWindowState';

const Actions = ({ selectedItem }) => {
  const { t } = useTranslation();
  const [availableActions, setAvailableActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeWindow, setActiveWindow] = useState(null);

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

  const fetchAvailableActions = async (nodeType) => {
    setLoadingActions(true);
    try {
      const response = await axios.post(BASE_URL+'/get_available_actions/', {
        node_type: nodeType
      });
      setAvailableActions(response.data.actions || []);
      setActionError('');
    } catch (error) {
      setActionError(error.response?.data?.error || t('sidebar.actionsFetchError'));
    } finally {
      setLoadingActions(false);
    }
  };

  const handleAddActionClick = () => {
    globalWindowState.setWindow('add_action', selectedItem);
  };

  const handleCloseWindow = () => {
    globalWindowState.clearWindow();
    setActiveWindow(null);
    if (selectedItem?.isnode) {
      fetchAvailableActions(selectedItem.group);
    }
  };

  const viewActionDetails = (action) => {
    setSelectedAction(action);
  };

  const closeActionDetails = () => {
    setSelectedAction(null);
  };

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

      <div className="actions-header">
        <div className="node-type-badge" style={{ backgroundColor: getNodeColor(selectedItem.group) }}>
          <img
            src={getNodeIcon(selectedItem.group)}
            alt={selectedItem.group}
            className="node-icon-img"
          />
          <span className="node-type-label">{selectedItem.group}</span>
        </div>
        <h3 className="sidebar-title">{t('sidebar.actionsTitle')}</h3>
      </div>

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
              <li key={index} className="action-item">
                <div className="action-info">
                  <span className="action-name">{action.name}</span>
                  {action.description && (
                    <span className="action-description">{action.description}</span>
                  )}
                </div>
                <button 
                  className="view-details-btn"
                  onClick={() => viewActionDetails(action)}
                  disabled={loadingActions}
                >
                  <FaEye /> {t('sidebar.viewDetails')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-actions">{t('sidebar.noActionsAvailable')}</div>
        )}

        {actionError && <div className="action-error">{actionError}</div>}
      </div>

      {/* Action Details Modal */}
      {selectedAction && (
        <div className="action-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedAction.name}</h3>
              <button className="close-btn" onClick={closeActionDetails}>
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
              <button className="close-modal-btn" onClick={closeActionDetails}>
                {t('sidebar.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actions;