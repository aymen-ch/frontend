import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BASE_URL } from '../../utils/Urls';

const SearchinputComponent = ({ setContextData }) => {

    const [nodeData, setNodeData] = useState([]);
    const [error, setError] = useState(null);
    const [selectedNodeTypes, setSelectedNodeTypes] = useState([]);
    const [wilayas, setWilayas] = useState([]);
    const [dairas, setDairas] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [selectedWilaya, setSelectedWilaya] = useState('');
    const [selectedDaira, setSelectedDaira] = useState('');
    const [selectedCommune, setSelectedCommune] = useState('');

    const [formValues, setFormValues] = useState({
        startDate: '',
        endDate: '',
        depth: '',
        selectedNodeTypes: [],
        Affaire_type: '', // To store the selected category from the dropdown
    });

    // Handle checkbox changes to select node types
    const handleCheckboxChange = (e, nodeType) => {
        let updatedSelectedNodeTypes;
        if (e.target.checked) {
            updatedSelectedNodeTypes = [...selectedNodeTypes, nodeType.type];
        } else {
            updatedSelectedNodeTypes = selectedNodeTypes.filter(type => type !== nodeType.type);
        }

        // Update both selectedNodeTypes and formValues
        setSelectedNodeTypes(updatedSelectedNodeTypes);
        setFormValues(prevState => {
            const updatedFormValues = { ...prevState, selectedNodeTypes: updatedSelectedNodeTypes };
            return updatedFormValues;
        });
    };

    // Handle input changes for form fields
    const handleInputChange = (e, propertyName) => {
        const { value } = e.target;
        setFormValues(prevState => {
            const updatedFormValues = { ...prevState, [propertyName]: value };
            return updatedFormValues;
        });
    };

    // Handle category selection change
    const handleCategoryChange = (e) => {
        const { value } = e.target;
        setFormValues(prevState => {
            const updatedFormValues = { ...prevState, Affaire_type: value };
            return updatedFormValues;
        });
    };

     // Handle Wilaya selection
     const handleWilayaChange = (e) => {
        const value = e.target.value;
        setSelectedWilaya(value);
        setSelectedDaira(''); // Reset Daira when Wilaya changes
        setSelectedCommune(''); // Reset Commune when Wilaya changes

        setFormValues(prevState => {
            const updatedFormValues = { ...prevState, "wilaya_id": parseInt(value) };
            return updatedFormValues;
        });
    };

    // Handle Daira selection
    const handleDairaChange = (e) => {
        const value = e.target.value;
        setSelectedDaira(value);
        setSelectedCommune(''); // Reset Commune when Daira changes

        setFormValues(prevState => {
            const updatedFormValues = { ...prevState, "daira_id": parseInt(value) };
            return updatedFormValues;
        });
    };

    // Handle Commune selection
    const handleCommuneChange = (e) => {
        const value = e.target.value;
        setSelectedCommune(value);

        setFormValues(prevState => {
            const updatedFormValues = { ...prevState, "commune_id": parseInt(value) };
            return updatedFormValues;
        });
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
    }, [formValues, setContextData]); // Run whenever formValues changes

    // Fetch Wilayas from API
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
                        { wilaya: parseInt( selectedWilaya )}, // Send Wilaya ID in the body
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
            setDairas([]); // Reset Dairas if no Wilaya is selected
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
                        { daira: parseInt (selectedDaira) ,wilaya: parseInt(selectedWilaya ) }, // Send Daira ID in the body
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
                    console.log("comune : ", response.data);
                } catch (error) {
                    console.error('Error fetching Communes:', error);
                }
            };
            fetchCommunes();
        } else {
            setCommunes([]); // Reset Communes if no Daira is selected
        }
    }, [selectedDaira]);


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
                    disabled={!selectedWilaya} // Disable if no Wilaya is selected
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
                    disabled={!selectedDaira} // Disable if no Daira is selected
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

            {/* Dropdown list */}
            <div className="mb-3">
                <label htmlFor="categorySelect" className="form-label">Category</label>
                <select
                    className="form-select"
                    id="categorySelect"
                    value={formValues.Affaire_type}
                    onChange={handleCategoryChange}
                >
                    <option value="">Select Category</option>
                    <option value="مخدرات">مخدرات</option>
                </select>
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
                <label htmlFor="depth" className="form-label">Depth</label>
                <input
                    type="number"
                    className="form-control"
                    id="depth"
                    min="1"
                    max="20"
                    value={formValues.depth}
                    onChange={(e) => handleInputChange(e, 'depth')}
                />
            </div>
        </div>
    );
};

export default SearchinputComponent;
