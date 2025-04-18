import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useState, memo, useEffect } from 'react';
import SearchinputComponent from './SearchinputComponent_contextualization';
import { BASE_URL } from '../../utils/Urls';
import { useGlobalContext } from '../../GlobalVariables';

const ContextManagerComponent = ({
  SubGrapgTable,
  setSubGrapgTable,
}) => {
  const [ContextData, setContextData] = useState([]);
  const [showAggregation, setShowAggregation] = useState(false); // State to control visibility of Aggregation component
  const [loading, setLoading] = useState(false); // Loading state
  const { setNewContextHasArrived } = useGlobalContext();
  useEffect(() => {
    console.log(ContextData);
  }, [ContextData]);

  const handleSubmit = async (e) => {
    console.log("Submitted Context data ", ContextData);
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    setLoading(true); // Set loading to true when request starts

    try {
      const response = await axios.post(
        BASE_URL + '/filter_affaire_relations/',
        ContextData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        console.log('Data submitted successfully! Contextualisaiton', response.data);
        console.log(response.data)
        setSubGrapgTable(response.data);
        setShowAggregation(true); // Show Aggregation component after successful submission
        setNewContextHasArrived(true);
      } else {
        console.error('Submission failed.');
      }
    } catch (error) {
      console.error('Error during submission:', error);
    } finally {
      setLoading(false); // Set loading to false when request completes (success or error)
    }
  };

  return (
    <div className="sidebar bg-light p-4 border shadow-sm" style={{ minHeight: '80vh' }}>
      <h5 className="mb-4 text-center">Context Manager</h5>
      {/* <p className="mb-4 text-muted text-center">Manage the context data below.</p> */}
      {SubGrapgTable.results.length > 0 && (
        <div className="mt-4">
          {/* <button
            className="btn btn-secondary w-100 mb-3"
            onClick={() => setShowAggregation(!showAggregation)}
          >
            {showAggregation ? 'Hide Aggregation' : 'Show Aggregation'}
          </button>
          {showAggregation && <>
            <h3>aggregation </h3>
          </>} */}
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