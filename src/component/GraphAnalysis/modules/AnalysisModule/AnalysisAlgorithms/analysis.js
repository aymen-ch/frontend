import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faProjectDiagram, faLink, faUsers } from '@fortawesome/free-solid-svg-icons';
import AttributeAnalysis from '../AttributAanalysis/AttributeAnalysis';
import Centrality from './Centrality';
import LinkPrediction from './LinkPrediction';
import Community from './Community';
import './Analysis.css';
import { useTranslation } from 'react-i18next';

const Analysis = ({
  onNodeConfigChange,
  setEdges,
  setNodes,
  nodes,
}) => {

  const [activeTab, setActiveTab] = useState('attribute');
  const{t} = useTranslation()

  const renderContent = () => {
    switch (activeTab) {
      case 'attribute':
        return <AttributeAnalysis combinedNodes={nodes} onNodeConfigChange={onNodeConfigChange}/>;
      case 'centrality':
        return (
          <Centrality
            nodes={nodes}
            setNodes={setNodes}
          />
        );
      case 'linkPrediction':
        return (
          <LinkPrediction
            setEdges={setEdges}
            setNodes={setNodes}
            nodes={nodes}
          />
        );
      case 'community':
        return (
          <Community
            nodes={nodes}
            setNodes={setNodes}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="analysis-container">
      <div className="analysis-tabs">
        <div
          className={`tab-card ${activeTab === 'attribute' ? 'active' : ''}`}
          onClick={() => setActiveTab('attribute')}
        >
          <FontAwesomeIcon icon={faChartBar} className="tab-icon" />
          <span>{t('Attribute Analysis')}</span>
        </div>
        <div
          className={`tab-card ${activeTab === 'centrality' ? 'active' : ''}`}
          onClick={() => setActiveTab('centrality')}
        >
          <FontAwesomeIcon icon={faProjectDiagram} className="tab-icon" />
          <span>{t('Centrality')}</span>
        </div>
        <div
          className={`tab-card ${activeTab === 'linkPrediction' ? 'active' : ''}`}
          onClick={() => setActiveTab('linkPrediction')}
        >
          <FontAwesomeIcon icon={faLink} className="tab-icon" />
          <span>{t('Link Prediction')}</span>
        </div>
        <div
          className={`tab-card ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <FontAwesomeIcon icon={faUsers} className="tab-icon" />
          <span>{t('Community')}</span>
        </div>
      </div>
      <div className="tab-content">{renderContent()}</div>
    </Container>
  );
};

export default Analysis;