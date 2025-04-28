import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BASE_URL } from '../../utils/Urls';
import { getNodeIcon, getNodeColor } from '../../utils/Parser';
import './SearchInputComponent.css';

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
    const [totalAffaires, setTotalAffaires] = useState(null);

    const [formValues, setFormValues] = useState({
        startDate: '',
        endDate: '',
        depth: '0',
        selectedNodeTypes: [],
        Affaire_type: [],
    });

    const handleCheckboxChange = (e, nodeType) => {
        const updated = e.target.checked
            ? [...selectedNodeTypes, nodeType.type]
            : selectedNodeTypes.filter(type => type !== nodeType.type);

        setSelectedNodeTypes(updated);
        setFormValues(prev => ({ ...prev, selectedNodeTypes: updated }));
    };

    const handleCategoryCheckboxChange = (e, category) => {
        const updated = e.target.checked
            ? [...selectedCategories, category]
            : selectedCategories.filter(cat => cat !== category);

        setSelectedCategories(updated);
        setFormValues(prev => ({ ...prev, Affaire_type: updated }));
    };

    const handleInputChange = (e, propertyName) => {
        setFormValues(prev => ({ ...prev, [propertyName]: e.target.value }));
    };

    const handleWilayaChange = (e) => {
        const value = e.target.value;
        setSelectedWilaya(value);
        setSelectedDaira('');
        setSelectedCommune('');
        setFormValues(prev => ({
            ...prev,
            wilaya_id: parseInt(value) || undefined,
            daira_id: undefined,
            commune_id: undefined
        }));
    };

    const handleDairaChange = (e) => {
        const value = e.target.value;
        setSelectedDaira(value);
        setSelectedCommune('');
        setFormValues(prev => ({
            ...prev,
            daira_id: parseInt(value) || undefined,
            commune_id: undefined
        }));
    };

    const handleCommuneChange = (e) => {
        const value = e.target.value;
        setSelectedCommune(value);
        setFormValues(prev => ({ ...prev, commune_id: parseInt(value) || undefined }));
    };

    useEffect(() => {
        const fetchNodeTypes = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(BASE_URL + '/node-types/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNodeData(response.data.node_types);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchNodeTypes();
    }, []);

    useEffect(() => {
        setContextData(formValues);
    }, [formValues, setContextData]);

    useEffect(() => {
        const fetchWilayas = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await axios.get(BASE_URL + '/all_wilaya/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setWilayas(res.data.wilaya);
            } catch (error) {
                console.error(error);
            }
        };
        fetchWilayas();
    }, []);

    useEffect(() => {
        if (selectedWilaya) {
            const fetchDairas = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    const res = await axios.post(BASE_URL + '/dairas/', { wilaya: parseInt(selectedWilaya) }, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    setDairas(res.data.daira);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchDairas();
        } else {
            setDairas([]);
        }
    }, [selectedWilaya]);

    useEffect(() => {
        if (selectedDaira) {
            const fetchCommunes = async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    const res = await axios.post(BASE_URL + '/communes/', {
                        daira: parseInt(selectedDaira),
                        wilaya: parseInt(selectedWilaya)
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    setCommunes(res.data.commune);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchCommunes();
        } else {
            setCommunes([]);
        }
    }, [selectedDaira]);

    useEffect(() => {
        const fetchAllAffaireTypes = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await axios.get(BASE_URL + '/all_affaire_types/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setaffaireTypes(res.data);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchAllAffaireTypes();
    }, []);

    useEffect(() => {
        const fetchTotalAffaires = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const payload = {
                    Affaire_type: selectedCategories.length > 0 ? selectedCategories : affaireTypes.affaire_types || [],
                    wilaya_id: selectedWilaya ? parseInt(selectedWilaya) : null,
                    daira_id: selectedDaira ? parseInt(selectedDaira) : null,
                    commune_id: selectedCommune ? parseInt(selectedCommune) : null,
                    startDate: formValues.startDate || null,
                    endDate: formValues.endDate || null,
                    selectedNodeTypes,
                    depth: parseInt(formValues.depth) || 0
                };

                if (selectedWilaya || selectedDaira || selectedCommune) {
                    const response = await axios.post(BASE_URL + '/filter_affaire_relations/', payload, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    setTotalAffaires(response.data.results.length);
                } else {
                    setTotalAffaires(null);
                }
            } catch (error) {
                setError(error.message);
            }
        };
        fetchTotalAffaires();
    }, [selectedWilaya, selectedDaira, selectedCommune, selectedCategories, formValues.startDate, formValues.endDate, formValues.depth, selectedNodeTypes, affaireTypes]);

    return (
        <div className="container search-container p-3">
            <div class="region-filter">
            <div class="filter-section-title-total">Total Affaires: {totalAffaires}</div>
            
      
            </div>

            {/* Region selection row */}
            <div class="region-filter">
    <div class="filter-section-title"> <i className="bi bi-geo-alt-fill me-2 text-primary"></i>Location Analysis</div>
    <div className="row mb-2">
                <div className="col-md">
                     Wilaya
                    <select className="form-select" value={selectedWilaya} onChange={handleWilayaChange}>
                        <option value="">Wilaya</option>
                        {wilayas.map(w => <option key={w.wilaya_id} value={w.wilaya_id}>{w.wilaya_name}</option>)}
                    </select>
                </div>
                <div className="col-md">
                     Daira
                    <select className="form-select" value={selectedDaira} onChange={handleDairaChange} disabled={!selectedWilaya}>
                        <option value="">Daira</option>
                        {dairas.map(d => <option key={d.daira_id} value={d.daira_id}>{d.daira_name}</option>)}
                    </select>
                </div>
                <div className="col-md">
                    Commune
                    <select className="form-select" value={selectedCommune} onChange={handleCommuneChange} disabled={!selectedDaira}>
                        <option value="">Commune</option>
                        {communes.map(c => <option key={c.commune_id} value={c.commune_id}>{c.commune_name}</option>)}
                    </select>
                </div>
            </div>

</div>
           
            {/* Date Range */}

            <div class="temporal-filter">
    <div class="filter-section-title"><i className="bi bi-calendar-event-fill me-2 text-primary"></i>  Temporal analysis</div>
    <div className="row mb-3">
                <div className="col">
                       start date 
                    <input type="date" className="form-control" value={formValues.startDate} onChange={(e) => handleInputChange(e, 'startDate')} />
                </div>
                <div className="col">
                    end date
                    <input type="date" className="form-control" value={formValues.endDate} onChange={(e) => handleInputChange(e, 'endDate')} />
                </div>
            </div>
</div>
          
<div class="temporal-filter">
<div class="filter-section-title"><i className="bi bi-tags-fill me-2 text-primary"></i> Categories of affairess</div>
{/* Categories */}
<div className="mb-3">
               
                <div className="d-flex flex-wrap">
                    {affaireTypes.affaire_types?.map((type, index) => (
                        <div key={index} className="form-check form-check-inline">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                value={type}
                                checked={selectedCategories.includes(type)}
                                onChange={(e) => handleCategoryCheckboxChange(e, type)}
                            />
                            <label className="form-check-label">{type}</label>
                        </div>
                    ))}
                </div>
            </div>
            </div>

            {/* Node Types */}
            <div className="mb-3">
                <label className="form-label"> <i className="bi bi-diagram-3-fill me-2 text-primary"></i>Node Types a afficher</label>
                <div className="node-types-container d-flex flex-wrap border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {nodeData.filter(nt => nt.type !== 'Affaire').map((nodeType, idx) => (
                        <div key={idx} className="d-flex align-items-center me-3 mb-2">
                            <input
                                type="checkbox"
                                className="form-check-input me-1"
                                onChange={(e) => handleCheckboxChange(e, nodeType)}
                                checked={selectedNodeTypes.includes(nodeType.type)}
                            />
                            <img src={getNodeIcon(nodeType.type)} alt="" style={{ width: 20, height: 20, backgroundColor: getNodeColor(nodeType.type),borderRadius: '50%' }} className="me-1" />
                            <small>{nodeType.type}</small>
                        </div>
                    ))}
                </div>
            </div>

            
            {/* Depth */}
            <div className="mb-3">
                <label className="form-label">Depth</label>
                <div className="d-flex flex-wrap align-items-center gap-3">
                {[0, 1, 2].map((d) => {
    const depthLabels = {
        0: 'only Affaires',
        1: 'Direct',
        2: 'Indirect'
    };

    return (
        <div className="form-check" key={d}>
            <input
                className="form-check-input"
                type="radio"
                name="depth"
                id={`depth${d}`}
                value={d}
                checked={formValues.depth === `${d}`}
                onChange={(e) => handleInputChange(e, 'depth')}
            />
            <label className="form-check-label" htmlFor={`depth${d}`}>
                {depthLabels[d]}
            </label>
        </div>
    );
})}

                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="depth"
                            id="depthAdvanced"
                            value="advanced"
                            checked={!['0', '1', '2'].includes(formValues.depth)}
                            onChange={(e) => handleInputChange(e, 'depth')}
                        />
                        <label className="form-check-label" htmlFor="depthAdvanced">Advanced</label>
                    </div>
                    {!['0', '1', '2'].includes(formValues.depth) && (
                        <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="5"
                            value={formValues.depth}
                            onChange={(e) => handleInputChange(e, 'depth')}
                            style={{ width: 80 }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchinputComponent;
