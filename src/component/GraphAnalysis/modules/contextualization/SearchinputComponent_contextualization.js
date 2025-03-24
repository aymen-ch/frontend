import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BASE_URL } from '../../utils/Urls';

const SearchinputComponent = ({ setContextData }) => {
    const [affaireTypes, setaffaireTypes] = useState([]);
    const [nodeData, setNodeData] = useState([]);
    const [error, setError] = useState(null);
    const [selectedNodeTypes, setSelectedNodeTypes] = useState([]);
    const [wilayas, setWilayas] = useState([]);
    const [dairas, setDairas] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [selectedWilaya, setSelectedWilaya] = useState('');
    const [selectedDaira, setSelectedDaira] = useState('');
    const [selectedCommune, setSelectedCommune] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);

    const [formValues, setFormValues] = useState({
        startDate: '',
        endDate: '',
        depth: '0', // Default to "Only Node"
        selectedNodeTypes: [],
        Affaire_type: [], // Changed to array to store multiple categories
        // wilaya_id, daira_id, commune_id remain as single values
    });


    
    // Handle checkbox changes for node types
    const handleCheckboxChange = (e, nodeType) => {
        let updatedSelectedNodeTypes;
        if (e.target.checked) {
            updatedSelectedNodeTypes = [...selectedNodeTypes, nodeType.type];
        } else {
            updatedSelectedNodeTypes = selectedNodeTypes.filter(type => type !== nodeType.type);
        }

        setSelectedNodeTypes(updatedSelectedNodeTypes);
        setFormValues(prevState => ({
            ...prevState,
            selectedNodeTypes: updatedSelectedNodeTypes
        }));
    };

    // Handle category checkbox changes
    const handleCategoryCheckboxChange = (e, category) => {
        let updatedCategories;
        if (e.target.checked) {
            updatedCategories = [...selectedCategories, category];
        } else {
            updatedCategories = selectedCategories.filter(cat => cat !== category);
        }

        setSelectedCategories(updatedCategories);
        setFormValues(prevState => ({
            ...prevState,
            Affaire_type: updatedCategories
        }));
    };

    // Handle input changes for form fields
    const handleInputChange = (e, propertyName) => {
        const { value } = e.target;
        setFormValues(prevState => ({
            ...prevState,
            [propertyName]: value
        }));
    };

    // Handle Wilaya selection
    const handleWilayaChange = (e) => {
        const value = e.target.value;
        setSelectedWilaya(value);
        setSelectedDaira('');
        setSelectedCommune('');

        setFormValues(prevState => ({
            ...prevState,
            "wilaya_id": parseInt(value)
        }));
    };

    // Handle Daira selection
    const handleDairaChange = (e) => {
        const value = e.target.value;
        setSelectedDaira(value);
        setSelectedCommune('');

        setFormValues(prevState => ({
            ...prevState,
            "daira_id": parseInt(value)
        }));
    };

    // Handle Commune selection
    const handleCommuneChange = (e) => {
        const value = e.target.value;
        setSelectedCommune(value);

        setFormValues(prevState => ({
            ...prevState,
            "commune_id": parseInt(value)
        }));
    };

    // Fetch node types from API
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

    // Use useEffect to setContextData after formValues change
    useEffect(() => {
        setContextData(formValues);
    }, [formValues, setContextData]);

    // Fetch Wilayas from API
    useEffect(() => {
        const fetchWilayas = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(BASE_URL+'/all_wilaya/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status !== 200) {
                    throw new Error('Failed to fetch Wilayas');
                }
                setWilayas(response.data.wilaya);
            } catch (error) {
                console.error('Error fetching Wilayas:', error);
            }
        };
        fetchWilayas();
    }, []);

    // Fetch Dairas based on selected Wilaya
    useEffect(() => {
        if (selectedWilaya) {
            const fetchDairas = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await axios.post(
                        BASE_URL+'/dairas/',
                        { wilaya: parseInt(selectedWilaya) },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    if (response.status !== 200) {
                        throw new Error('Failed to fetch Dairas');
                    }
                    setDairas(response.data.daira);
                } catch (error) {
                    console.error('Error fetching Dairas:', error);
                }
            };
            fetchDairas();
        } else {
            setDairas([]);
        }
    }, [selectedWilaya]);

    // Fetch Communes based on selected Daira
    useEffect(() => {
        if (selectedDaira) {
            const fetchCommunes = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    const response = await axios.post(
                        BASE_URL+'/communes/',
                        { daira: parseInt(selectedDaira), wilaya: parseInt(selectedWilaya) },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    if (response.status !== 200) {
                        throw new Error('Failed to fetch Communes');
                    }
                    setCommunes(response.data.commune);
                } catch (error) {
                    console.error('Error fetching Communes:', error);
                }
            };
            fetchCommunes();
        } else {
            setCommunes([]);
        }
    }, [selectedDaira]);

    useEffect(() => {
        const fetchall_affaire_types = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(BASE_URL+'/all_affaire_types/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.status !== 200) {
                    throw new Error('Network response was not ok');
                }
                setaffaireTypes(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(error.message || 'An error occurred');
            }
        };
        fetchall_affaire_types();
    }, []);

    return (
        <div className="container mt-4">
            {/* Wilaya Dropdown */}
            <div className="mb-3">
                <label htmlFor="wilayaSelect" className="form-label">Wilaya</label>
                <select
                    className="form-select"
                    id="wilayaSelect"
                    value={selectedWilaya}
                    onChange={handleWilayaChange}
                >
                    <option value="">Select Wilaya</option>
                    {wilayas.map((wilaya) => (
                        <option key={wilaya.wilaya_id} value={wilaya.wilaya_id}>
                            {wilaya.wilaya_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Daira Dropdown */}
            <div className="mb-3">
                <label htmlFor="dairaSelect" className="form-label">Daira</label>
                <select
                    className="form-select"
                    id="dairaSelect"
                    value={selectedDaira}
                    onChange={handleDairaChange}
                    disabled={!selectedWilaya}
                >
                    <option value="">Select Daira</option>
                    {dairas.map((daira) => (
                        <option key={daira.daira_id} value={daira.daira_id}>
                            {daira.daira_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Commune Dropdown */}
            <div className="mb-3">
                <label htmlFor="communeSelect" className="form-label">Commune</label>
                <select
                    className="form-select"
                    id="communeSelect"
                    value={selectedCommune}
                    onChange={handleCommuneChange}
                    disabled={!selectedDaira}
                >
                    <option value="">Select Commune</option>
                    {communes.map((commune) => (
                        <option key={commune.commune_id} value={commune.commune_id}>
                            {commune.commune_name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {nodeData.length === 0 ? (
                    <p>Loading...</p>
                ) : (
                    <div className="d-flex flex-wrap">
                        {nodeData.map((nodeType, index) => (
                            <div key={index} className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value={nodeType.type}
                                    id={`nodeType-${index}`}
                                    onChange={(e) => handleCheckboxChange(e, nodeType)}
                                />
                                <label className="form-check-label" htmlFor={`nodeType-${index}`}>
                                    {nodeType.type}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Category Checkboxes */}
            <div className="mb-3">
                <label className="form-label">Categories</label>
                {affaireTypes.affaire_types && affaireTypes.affaire_types.length > 0 ? (
                    <div className="d-flex flex-wrap">
                        {affaireTypes.affaire_types.map((type, index) => (
                            <div key={index} className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value={type}
                                    id={`category-${index}`}
                                    onChange={(e) => handleCategoryCheckboxChange(e, type)}
                                    checked={selectedCategories.includes(type)}
                                />
                                <label className="form-check-label" htmlFor={`category-${index}`}>
                                    {type}
                                </label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No categories available</p>
                )}
            </div>

            {/* Start Date, End Date, and Depth Inputs */}
            <div className="col-4">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    value={formValues.startDate}
                    onChange={(e) => handleInputChange(e, 'startDate')}
                />
            </div>
            <div className="col-4">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    value={formValues.endDate}
                    onChange={(e) => handleInputChange(e, 'endDate')}
                />
            </div>
            <div className="col-4">
                <label className="form-label">Depth</label>
                <div className="d-flex flex-column">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="depth"
                            id="depth0"
                            value="0"
                            checked={formValues.depth === '0'}
                            onChange={(e) => handleInputChange(e, 'depth')}
                        />
                        <label className="form-check-label" htmlFor="depth0">
                            Only Node
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="depth"
                            id="depth1"
                            value="1"
                            checked={formValues.depth === '1'}
                            onChange={(e) => handleInputChange(e, 'depth')}
                        />
                        <label className="form-check-label" htmlFor="depth1">
                            Connected Directly
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="depth"
                            id="depth2"
                            value="2"
                            checked={formValues.depth === '2'}
                            onChange={(e) => handleInputChange(e, 'depth')}
                        />
                        <label className="form-check-label" htmlFor="depth2">
                            Connected Indirectly
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="depth"
                            id="depthAdvanced"
                            value="advanced"
                            checked={formValues.depth !== '0' && formValues.depth !== '1' && formValues.depth !== '2'}
                            onChange={(e) => handleInputChange(e, 'depth')}
                        />
                        <label className="form-check-label" htmlFor="depthAdvanced">
                            Advanced
                        </label>
                    </div>
                    {formValues.depth !== '0' && formValues.depth !== '1' && formValues.depth !== '2' && (
                        <input
                            type="number"
                            className="form-control mt-2"
                            min="0"
                            max="5"
                            value={formValues.depth}
                            onChange={(e) => handleInputChange(e, 'depth')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchinputComponent;