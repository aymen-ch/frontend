import React, { useState } from 'react';
import axios from 'axios';
import { Button, Spinner, Form } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import randomColor from 'randomcolor';

const Community = ({ nodes, setNodes, isLoading, setIsLoading, ColorPersonWithClass }) => {
  const [selectedCommunityMeasure, setSelectedCommunityMeasure] = useState('uniform');

  const communityMethods = [
    { value: 'uniform', label: 'Uniform' },
    { value: '_color_k1coloring', label: 'K1 Coloring' },
    { value: '_labelPropagation', label: 'Label Propagation' },
    { value: '_louvain', label: 'Louvain' }
  ];

  const ColorNodeWithCommunity = (nodes, setNodes, measure) => {
    const newNodes = [...nodes];

    if (measure === 'uniform') {
      // Assign uniform color to all nodes
      newNodes.forEach(node => {
        node.color = '#4682b4'; // Steel blue as default uniform color
      });
    } else {
      // Get unique communities from selected measure
      const communities = new Set(
        nodes
          .filter(node => node && node.properties && node.properties[measure] !== undefined)
          .map(node => node.properties[measure])
      );

      // Generate distinct hex colors for each community
      const colors = randomColor({
        count: communities.size,
        luminosity: 'bright',
        format: 'hex'
      });

      // Map communities to colors
      const communityColorMap = new Map(
        Array.from(communities).map((community, index) => [community, colors[index]])
      );

      // Assign colors to nodes based on their community
      newNodes.forEach(node => {
        if (node && node.properties && node.properties[measure] !== undefined) {
          const community = node.properties[measure];
          node.color = communityColorMap.get(community) || '#808080'; // Gray for undefined
        }
      });
    }

    // Update nodes with new colors
    setNodes(newNodes);
  };

  const handleSecteurActiviti = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(BASE_URL + '/Secteur_Activite/', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        console.log(response.data);
      } else {
        console.error('handleSecteurActiviti failed.');
      }
    } catch (error) {
      console.error('Error during handleSecteurActiviti:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 d-flex flex-column gap-3">
      <Form.Group>
        <Form.Label>Community Detection</Form.Label>
        <Form.Select
          value={selectedCommunityMeasure}
          onChange={(e) => {
            setSelectedCommunityMeasure(e.target.value);
            ColorNodeWithCommunity(nodes, setNodes, e.target.value);
          }}
        >
          {communityMethods.map(method => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Button
        variant="warning"
        className="w-100"
        onClick={() => ColorPersonWithClass(nodes, setNodes)}
      >
        Color Node with Class
      </Button>

      <Button
        variant="secondary"
        className="w-100"
        onClick={() => handleSecteurActiviti()}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Loading...
          </>
        ) : (
          'Secteur Activiti (Backend)'
        )}
      </Button>
    </div>
  );
};

export default Community;