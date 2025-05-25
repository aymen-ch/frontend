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
  drawCirclesOnPersonneNodes,
  onNodeConfigChange,
  ColorPersonWithClass,
  activeAggregations,
  setActiveAggregations,
  setEdges,
  setNodes,
  nodes,
  edges,
}) => {
  const [depth, setDepth] = useState(1);
  const [nodeTypes, setNodeTypes] = useState([]);
  const [selectedAffaires, setSelectedAffaires] = useState([]);
  const [showNodeClassification, setShowNodeClassification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAggLoading, setIsAggLoading] = useState(false);
  const [isBetweennessLoading, setIsBetweennessLoading] = useState(false);
  const [selectedCentralityAttribute, setSelectedCentralityAttribute] = useState('_betweenness');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [activeTab, setActiveTab] = useState('attribute');
  const{t} = useTranslation()

  useEffect(() => {
    const types = [...new Set(nodes.map((node) => node.group))];
    setNodeTypes(types);
    const affids = nodes
      .filter((node) => node.group === "Affaire")
      .map((node) => parseInt(node.id, 10));
    setSelectedAffaires(affids);
  }, [nodes]);

  const renderContent = () => {
    switch (activeTab) {
      case 'attribute':
        return <AttributeAnalysis combinedNodes={nodes} onNodeConfigChange={onNodeConfigChange}/>;
      case 'centrality':
        return (
          <Centrality
            nodes={nodes}
            setNodes={setNodes}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            selectedCentralityAttribute={selectedCentralityAttribute}
            setSelectedCentralityAttribute={setSelectedCentralityAttribute}
            isBetweennessLoading={isBetweennessLoading}
            setIsBetweennessLoading={setIsBetweennessLoading}
          />
        );
      case 'linkPrediction':
        return (
          <LinkPrediction
            selectedAffaires={selectedAffaires}
            depth={depth}
            setDepth={setDepth}
            isAggLoading={isAggLoading}
            setIsAggLoading={setIsAggLoading}
            setNodes={setNodes}
            setEdges={setEdges}
            showNodeClassification={showNodeClassification}
            setShowNodeClassification={setShowNodeClassification}
          />
        );
      case 'community':
        return (
          <Community
            nodes={nodes}
            setNodes={setNodes}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            ColorPersonWithClass={ColorPersonWithClass}
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