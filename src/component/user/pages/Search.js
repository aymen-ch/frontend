import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import SearchResults from "./SearchResults ";

const SearchPage = () => {
  const [results, setResults] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extraction du paramètre "query" de l'URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("query");

  useEffect(() => {
    if (query) {
      // Appel API pour récupérer les résultats
      const fetchResults = async () => {
        setLoading(true);
        setError(null);

        try {
          // Récupération du jeton d'authentification depuis le localStorage
          const token = localStorage.getItem("authToken");

          const response = await axios.get(
            `http://127.0.0.1:8000/api/documents/search`, // Remplacez avec l'URL de votre API
            {
              params: { query: query, page:1},
              headers: {
                Authorization: `Bearer ${token}`, // Ajout de l'en-tête Authorization
              },
            }
          );
          
          setResults(response.data);
          
        } catch (err) {
          setError("Une erreur s'est produite lors de la recherche.");
        } finally {
          setLoading(false);
        }
      };

      fetchResults();
    }
  }, [query]);

  return (
    <div className="container mt-5">
      {/* Affichage des résultats */}
      {loading && <p>Chargement des résultats...</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p>Aucun résultat trouvé pour votre recherche.</p>
      )}
      {/*!loading && results.length > 0 && <SearchResults results={results} />*/}
      <SearchResults results={results} />
    </div>
  );
};

export default SearchPage;
