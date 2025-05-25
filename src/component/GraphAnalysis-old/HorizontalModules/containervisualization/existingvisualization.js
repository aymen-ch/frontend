import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ListGroup } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa'; // Import icon
import PropTypes from 'prop-types';
import './existingvisualization.css';

const VisualizationList = ({ visualizations, onSelectVisualization, onCreateNewVisualization }) => {
  const { t } = useTranslation();

  return (
    <div className="visualization-list-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">{t('Visualizations')}</h3>
        <Button variant="primary" onClick={onCreateNewVisualization} className="d-flex align-items-center gap-2">
          <FaPlus />
          {t('Cree un nouvelle visualisation')}
        </Button>
      </div>
      <ListGroup>
        {visualizations.length > 0 ? (
          visualizations.map((viz) => (
            <ListGroup.Item
              key={viz.id}
              action
              onClick={() => onSelectVisualization(viz)}
              className="visualization-item"
            >
              {viz.name}
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item>{t('No visualizations available')}</ListGroup.Item>
        )}
      </ListGroup>
    </div>
  );
};

VisualizationList.propTypes = {
  visualizations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      file: PropTypes.string,
    })
  ).isRequired,
  onSelectVisualization: PropTypes.func.isRequired,
  onCreateNewVisualization: PropTypes.func.isRequired,
};

export default VisualizationList;