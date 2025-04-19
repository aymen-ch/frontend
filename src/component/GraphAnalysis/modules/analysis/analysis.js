import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { useGlobalContext } from '../../GlobalVariables';
import AttributeAnalysis from './AttributeAnalysis';
import Centrality from './Centrality';
import LinkPrediction from './LinkPrediction';
import Community from './Community';

const Analysis = ({
  drawCirclesOnPersonneNodes,
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
  const [isLoading, setIsLoading] = useState(false); // For SecteurActiviti
  const [isAggLoading, setIsAggLoading] = useState(false); // For Aggregation with Algorithm
  const [isBetweennessLoading, setIsBetweennessLoading] = useState(false); // For Centrality
  const [selectedCentralityAttribute, setSelectedCentralityAttribute] = useState('_betweenness');
  const [selectedGroup, setSelectedGroup] = useState('Personne');

  // const { nodes, setNodes, edges, setEdges } = useGlobalContext();

  useEffect(() => {
    const types = [...new Set(nodes.map((node) => node.group))];
    setNodeTypes(types);
    const affids = nodes
      .filter((node) => node.group === "Affaire")
      .map((node) => parseInt(node.id, 10));
    setSelectedAffaires(affids);
  }, [nodes]);

  return (
    <Container fluid className="p-3 bg-white shadow-sm rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Analysis Module
      </h3>

      <Tabs defaultActiveKey="attribute" id="analysis-tabs" className="mb-3">
        <Tab eventKey="attribute" title="Attribute Analysis">
          <AttributeAnalysis />
        </Tab>
        <Tab eventKey="centrality" title="Centrality">
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
        </Tab>
        <Tab eventKey="linkPrediction" title="Link Prediction">
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
        </Tab>
        <Tab eventKey="community" title="Community">
          <Community
            nodes={nodes}
            setNodes={setNodes}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            ColorPersonWithClass={ColorPersonWithClass}
          />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Analysis;