import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useState, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SearchinputComponent from './OptionSelections';
import { BASE_URL_Backend } from '../../../Platforme/Urls';


////*****
// This is the container of Analyse temporelle et géospatiale.
// Contains a set of filters, which can be found inside OptionSelections.js.
// ContextData is sent to OptionSelections.js to be loaded with data.
// The parameters(ContextData) are sent to filter_affaire_relations.
// 
// */

const ContextManagerComponent = ({
  setSubGrapgTable,
}) => {

  const [ContextData, setContextData] = useState({}); // the result of the filters
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // State for validation error
  const { t } = useTranslation();


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!ContextData.wilaya_id) {
      setError(t('contextManager.errorNoWilaya'));
      return;
    }
    if (!ContextData.Affaire_type || ContextData.Affaire_type.length === 0) {
      setError(t('contextManager.errorNoCategories'));
      return;
    }

    const token = localStorage.getItem('authToken');
    setLoading(true); // Set loading to true when request starts
    setError(null); // Clear any previous error

    try {
      const response = await axios.post(
        BASE_URL_Backend + '/filter_affaire_relations/',
        ContextData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        console.log('Data submitted successfully! Contextualisation', response.data);
        setSubGrapgTable(response.data);
      } else {
        console.error('Submission failed.');
        setError(t('contextManager.errorSubmissionFailed'));
      }
    } catch (error) {
      console.error('Error during submission:', error);
      setError(t('contextManager.errorSubmission'));
    } finally {
      setLoading(false); // Set loading to false when request completes
    }
  };

  return (
    <div className="sidebar bg-light p-4 border shadow-sm" style={{ minHeight: '80vh' }}>
      <h5 className="mb-4 text-center">Context Manager</h5>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <span className="me-2 fs-5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4">
        <SearchinputComponent setContextData={setContextData} />
      </div>

      <div className="d-flex justify-content-center mt-3">
        <button
          className="btn btn-primary w-50"
          onClick={handleSubmit}
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Loading...
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </div>
  );
};

export default ContextManagerComponent;