import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getNodeIcon, getNodeColor } from '../../../Parser';
import { BASE_URL_Backend } from '../../../../Platforme/Urls';
import { useTranslation } from 'react-i18next';

const RadioBarComponent = ({ onResult }) => {
  const [nodeData, setNodeData] = useState([]);
  const [selectedNodeType, setSelectedNodeType] = useState('');
  const [error, setError] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    const fetchNodeTypes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(BASE_URL_Backend + '/node-types/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status !== 200) {
          throw new Error('Network response was not ok');
        }
        setNodeData(response.data.node_types);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred');
      }
    };
    fetchNodeTypes();
  }, []);

  const handleSelectionChange = (event) => {
    const selectedType = event.target.value;
    setSelectedNodeType(selectedType);
    onResult(selectedType);
  };

  return (
    <div className="w-full">
      <div className="bg-white shadow rounded-xl">
      <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-t-xl">
  <h5 className="text-sm font-medium flex items-center gap-2">
    <i className="bi bi-diagram-3-fill text-base"></i>
    {t('Select Node Type')}
  </h5>
</div>

        <div className="p-4">
          {error ? (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded">{error}</div>
          ) : (
            <div className="space-y-4">
              {nodeData
                .filter((node) => node.type !== 'Chunk')
                .map((node, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="nodeType"
                      id={`nodeType${index}`}
                      value={node.type}
                      checked={selectedNodeType === node.type}
                      onChange={handleSelectionChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`nodeType${index}`}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: getNodeColor(node.type) }}
                      >
                        <img
                          src={getNodeIcon(node.type)}
                          alt={`${node.type} icon`}
                          className="w-4 h-4 filter brightness-0 invert"
                        />
                      </div>
                      <span className="text-base font-medium">{node.type}</span>
                    </label>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RadioBarComponent;
