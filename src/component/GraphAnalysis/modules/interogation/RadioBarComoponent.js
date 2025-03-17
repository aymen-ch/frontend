import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getNodeIcon, getNodeColor,LabelManager } from '../../utils/Parser'; // Ensure getNodeColor is imported
import { BASE_URL } from '../../utils/Urls';

const RadioBarComponent = ({ onResult }) => {
    const [nodeData, setNodeData] = useState([]);
    const [selectedNodeType, setSelectedNodeType] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNodeTypes = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(BASE_URL+'/node-types/', {
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
        <div className="w-100"> {/* Full width container */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', backgroundColor: '#ffffff' }}>
                <div className="card-header  text-white" style={{ border: 'none',backgroundColor:'#346478', borderRadius: '15px 15px 0 0' }}>
                    <h5 className="card-title mb-0 d-flex align-items-center">
                        <i className="bi bi-diagram-3-fill me-2"></i>
                        Select Node Type
                    </h5>
                </div>
                <div className="card-body">
                    {error ? (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    ) : (
                        <div className="form-group">
                            {nodeData.map((node, index) => (
                                <div key={index} className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="nodeType"
                                        id={`nodeType${index}`}
                                        value={node.type}
                                        checked={selectedNodeType === node.type}
                                        onChange={handleSelectionChange}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label d-flex align-items-center" htmlFor={`nodeType${index}`}>
                                        <div
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                marginRight: '10px',
                                                backgroundColor: getNodeColor(node.type), // Apply color here
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%', // Make it circular
                                            }}
                                        >
                                            <img
                                                src={getNodeIcon(node.type)}
                                                alt={`${node.type} icon`}
                                                style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} // Ensure icon is visible on colored background
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