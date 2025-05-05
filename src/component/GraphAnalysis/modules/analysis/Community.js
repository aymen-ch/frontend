import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Spinner, Form } from 'react-bootstrap';
import { BASE_URL } from '../../utils/Urls';
import { useTranslation } from 'react-i18next';
import randomColor from 'randomcolor';
import globalWindowState from '../../utils/globalWindowState';
import { Sliders, Zap, Activity, Target, BarChart2 } from 'lucide-react';

const Community = ({ nodes, setNodes, isLoading, setIsLoading, ColorPersonWithClass }) => {
  const [selectedCommunityMeasure, setSelectedCommunityMeasure] = useState('uniform');
const{t} = useTranslation()
const communityMethods = [
  { value: 'uniform', label: 'Uniform' },
  { value: '_color_k1coloring', label: 'K1 Coloring' },
  { value: '_labelPropagation', label: 'Label Propagation' },
  { value: '_louvain', label: 'Louvain' },
  {value :'_modularityOptimization',label :'modularityOptimization' },
  // {value :'_scc',label :'scc' },
  // {value :'_wcc',label :'wcc' },
];

  const [nodeData, setNodeData] = useState([]);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    const fetchNodeTypes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(BASE_URL + '/node-types/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status !== 200) throw new Error('Network response was not ok');
        setNodeData(response.data.node_types);
        if (response.data.node_types.length > 0)
          setSelectedGroup(response.data.node_types[0].type);
      } catch (error) {
        setError(error.message || 'An error occurred');
      }
    };
    fetchNodeTypes();
  }, []);

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
        console.error('handle Secteur Activiti failed.');
      }
    } catch (error) {
      console.error('Error during handleSecteurActiviti:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 d-flex flex-column gap-3">

      

<Button
    size="sm"
    variant="info"
    className="w-100 d-flex align-items-center justify-content-center gap-1"
    onClick={() => globalWindowState.setWindow("Community_BackEnd",  selectedGroup )}
    style={{ height: '50px' }} // Match height with other buttons
  >
    <BarChart2 size={14} className="me-1" /> {/* Adding BarChart2 icon for statistical analysis */}
    {t('add new comunoty attribute')}
  </Button>

  <Form.Label>{t('Select Node Type')}</Form.Label>
                {/* <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="node-group-tooltip">{t('Select the group of nodes for analysis')}</Tooltip>}
                > */}
                  <Form.Select
                    size="sm"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    {nodeData.map((node) => (
                      <option key={node.type} value={node.type}>
                        <Target size={16} className="me-2" />
                        {node.type}
                      </option>
                    ))}
                  </Form.Select>


      <Form.Group>
        <Form.Label>{t('Community Detection')}</Form.Label>
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
        {t('Color Node with Class')}
      </Button>



{/* </OverlayTrigger> */}

 
    </div>
  );
};

export default Community;