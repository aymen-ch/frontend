import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
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

    const handleSelectionChange = async (event) => {
        const selectedType = event.target.value;
        setSelectedNodeType(selectedType);
        onResult(selectedType);
    };

    return (
        <div className="w-100">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', backgroundColor: '#ffffff' }}>
                <div className="card-header text-white" style={{ border: 'none', backgroundColor: '#346478', borderRadius: '15px 15px 0 0' }}>
                    <h5 className="card-title mb-0 d-flex align-items-center">
                        <i className="bi bi-diagram-3-fill me-2"></i>
                        {t('Select Node Type')}
                    </h5>
                </div>
                <div className="card-body">
                    {error ? (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    ) : (
                        <div className="form-group">
                            {nodeData
                                .filter((node) => node.type !== 'Chunk') // Filter out nodes with type "chunk"
                                .map((node, index) => (
                                    <div key={index} className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="nodeType"
                                            id={`nodeType${index}`}
                                            value={node.type}
                                            checked={selectedNodeType === node.type}
                                            onChange={handleSelectionChange}
                                            style={{
                                                cursor: 'pointer',
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                border: '1px solid #ccc',
                                                display: 'inline-block',
                                            }}
                                        />
                                        <label className="form-check-label d-flex align-items-center" htmlFor={`nodeType${index}`}>
                                            <div
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    marginRight: '10px',
                                                    backgroundColor: getNodeColor(node.type),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '50%',
                                                }}
                                            >
                                                <img
                                                    src={getNodeIcon(node.type)}
                                                    alt={`${node.type} icon`}
                                                    style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }}
                                                />
                                            </div>
                                            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{node.type}</span>
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