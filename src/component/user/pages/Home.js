import React, { useState } from "react";
import SearchResults from "./SearchResults ";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (event) => {
    event.preventDefault();
    // Simuler des résultats de recherche
    const sampleResults = [
      {
        title: "Site officiel de la Gendarmerie Nationale",
        link: "https://www.gendarmerie.dz",
        description: "Le portail officiel de la Gendarmerie Nationale en Algérie.",
      },
      {
        title: "Formation en Gendarmerie",
        link: "https://www.example.com/formation-gendarmerie",
        description:
          "Découvrez les formations proposées par la Gendarmerie Nationale pour devenir un officier qualifié.",
      },
      {
        title: "Historique de la Gendarmerie",
        link: "https://www.example.com/histoire-gendarmerie",
        description: "L'histoire complète de la Gendarmerie Nationale depuis sa création.",
      },
    ];
    setResults(sampleResults);
  };

  return (
    <div className="container mt-5">
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Rechercher
          </button>
        </div>
      </form>

      {/* Affichage des résultats */}
      {/* <SearchResults results={results} /> */}
    </div>
  );
};

export default SearchPage;
