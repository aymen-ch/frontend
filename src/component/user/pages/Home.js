import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchResults from "./SearchResults ";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [bool, setBool] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [noResult, setNoResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  useEffect(() => {
    console.log("Résultats mis à jour :", results);
  }, [results]);


  const fetchSuggestions = async (value) => {
    try {
      if (value.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`http://127.0.0.1:8000/api/documents/suggestion`, {
        params: { query: value },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data);
      setSuggestions(response.data.queries || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Erreur lors de la récupération des suggestions :", err);
    }
  };
  const handleSearch = async (event) => {
    event.preventDefault();
    setErrorMessage(null);
    setNoResult(false);
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`http://127.0.0.1:8000/api/documents/search`, {
        params: { query: query, page: 1 },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data.hasOwnProperty('details')){
        setResults(response.data);
        setBool(true);
      }
      else {
        setNoResult(true);
        setResults({});
        setBool(false);
      }
      
    } catch (err) {
      setErrorMessage("Une erreur s'est produite lors de la recherche.");
    }finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Optionnel : lancer la recherche directement après sélection
    //handleSearch({ preventDefault: () => {} });
  };
  return (
    <div className="container mt-5">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher..."
            value={query}
            //onChange={(e) => setQuery(e.target.value)}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <button className="btn btn-primary" type="submit">
            Rechercher
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul
            className="list-group position-absolute w-100 mt-1 shadow"
            style={{ zIndex: 10, maxHeight: "200px", overflowY: "auto" }}
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="list-group-item list-group-item-action"
                style={{ cursor: "pointer" }}
                onClick={() => handleSuggestionClick(suggestion.query)}
              >
                {suggestion.query}
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Indicateur de chargement */}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Recherche en cours...</p>
        </div>
      )}

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Message aucun résultat */}
      {noResult && (
        <div className="alert alert-warning" role="alert">
          Aucun résultat trouvé pour votre recherche.
        </div>
      )}
      {bool && <SearchResults results={results} />}
    </div>
  );
};

export default SearchPage;
