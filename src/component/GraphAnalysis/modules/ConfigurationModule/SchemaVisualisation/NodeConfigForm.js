import React, { useState, useEffect } from 'react';
import { updateNodeConfig, getNodeColor, getNodeIcon, NODE_CONFIG } from '../../VisualisationModule/Parser';
import { getAuthToken,BASE_URL_Backend } from '../../../Platforme/Urls';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
const NodeConfigForm = ({ selectedNode, onUpdate }) => {
  const [nodeType, setNodeType] = useState(selectedNode?.group || '');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [icon, setIcon] = useState('');
  const [labelKey, setLabelKey] = useState([]); // Array for selected labels
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);
  const { t } = useTranslation();


   const fetchNodeProperties = async (nodeType) => {
  const token = getAuthToken();
  try {
    const response = await axios.get(`${BASE_URL_Backend}/node-types/properties_types/`, {
      params: { node_type: nodeType },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      return response.data.properties;
    } else {
      throw new Error('Error fetching properties');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
  useEffect(() => {
    setNodeType(selectedNode?.group || '');
  }, [selectedNode]);

  useEffect(() => {
    if (nodeType) {
      const config = NODE_CONFIG.nodeTypes[nodeType] || NODE_CONFIG.nodeTypes.default;
      setColor(config.color || getNodeColor(nodeType));
      setSize(config.size || NODE_CONFIG.defaultNodeSize);
      setIcon(config.icon || getNodeIcon(nodeType));
      setLabelKey(config.labelKey ? config.labelKey.split(',') : []); // Split comma-separated string to array

      const fetchProperties = async () => {
        try {
          const nodeProperties = await fetchNodeProperties(nodeType);
          setProperties(nodeProperties || []);
          setError(null);
        } catch (err) {
          console.error('Error fetching node properties:', err.message);
          setError('Failed to load node properties');
          setProperties([]);
        }
      };

      fetchProperties();
    } else {
      setProperties([]);
      setLabelKey([]);
      setColor('');
      setSize('');
      setIcon('');
      setError(null);
    }
  }, [nodeType]);

  const handleIconSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const iconPath = `/icon/${file.name}`;
      setIcon(iconPath);
      console.log('Selected icon:', file.name, 'Saved as:', iconPath);
    }
  };

  const handleAddLabel = (e) => {
    const newLabel = e.target.value;
    if (newLabel && !labelKey.includes(newLabel)) {
      setLabelKey([...labelKey, newLabel]);
    }
    e.target.value = ''; // Reset dropdown
  };

  const handleRemoveLabel = (labelToRemove) => {
    setLabelKey(labelKey.filter((label) => label !== labelToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {};
      if (color) config.color = color;
      if (size) config.size = parseInt(size, 10);
      if (icon) config.icon = icon;
      if (labelKey.length > 0) config.labelKey = labelKey.join(','); // Join array into comma-separated string

      await updateNodeConfig(nodeType || 'NewType', config);
      if (typeof onUpdate === 'function') {
        onUpdate(nodeType, config);
      } else {
        console.warn('onUpdate is not a function:', onUpdate);
      }
    } catch (error) {
      console.error('Error updating node config:', error.message);
      setError('Failed to update node configuration');
    }
  };

  // Filter out already selected properties to avoid duplicates in the dropdown
  const availableProperties = properties.filter((prop) => !labelKey.includes(prop.name));

  if (!selectedNode) {
    return (
      <div className="p-4 h-full overflow-y-auto">
        <h3 className="m-0 text-lg">{t('NodeConfig')}</h3>
        <p className="text-gray-600 italic py-2.5">{t('Select a node to change its color or icon')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-full mt-2.5">
      <h3 className="m-0 text-lg">{t('Node Configuration')}</h3>

      {error && (
        <div className="bg-red-100 text-red-800 p-2.5 rounded border border-red-300 mb-4 text-sm">
          {t(error)}
        </div>
      )}

      <form className="mt-4" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Node Type')}</label>
          <input
            type="text"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            placeholder={t('Enter node type')}
            className="w-full p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Color')}</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 p-0 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Size')}</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder={t('Node size')}
            className="w-full p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Icon')}</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t('Enter icon path')}
              className="flex-1 p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
            />
            <label className="bg-blue-500 text-white px-3.5 py-2 rounded-md font-semibold cursor-pointer hover:bg-blue-600 transition-colors duration-300 text-sm">
              {t('Browse')}
              <input
                type="file"
                accept="image/*"
                onChange={handleIconSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-1.5">{t('Label Property Key')}</label>
          <div className="mt-2">
            {labelKey.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {labelKey.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center bg-indigo-100 text-indigo-900 px-2 py-1 rounded-full text-sm"
                  >
                    {label}
                    <button
                      type="button"
                      className="bg-transparent border-none text-indigo-900 text-base ml-1 hover:text-red-600 cursor-pointer leading-none"
                      onClick={() => handleRemoveLabel(label)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-2">{t('No labels selected')}</p>
            )}

            <select
              onChange={handleAddLabel}
              className="w-full p-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_6px_rgba(13,110,253,0.15)] outline-none transition-all duration-300"
              disabled={!nodeType || availableProperties.length === 0}
            >
              <option value="">{t('Select a property to add')}</option>
              {availableProperties.map((prop) => (
                <option key={prop.name} value={prop.name}>
                  {prop.name} ({prop.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full p-2.5 bg-blue-500 text-white border-none rounded-lg font-semibold text-base hover:bg-blue-600 transition-colors duration-300"
        >
          {t('Apply')}
        </button>
      </form>
    </div>
  );
};

export default NodeConfigForm;