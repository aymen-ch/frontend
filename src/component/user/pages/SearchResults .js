import React, {useState} from "react";
import axios from "axios";
const SearchResults = ({ results }) => {
  console.log(results);
  const [activeTab, setActiveTab] = useState("auth");
  const handleFileClick = async (filename, e) => {
    e.preventDefault(); // Empêche la redirection par défaut

    try {
      const token = localStorage.getItem("authToken"); // Récupérer le token stocké
      const response = await axios.get(`http://192.168.3.6:8000/api/media/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Si l'appel est un succès, redirige l'utilisateur
      if (response.status === 200) {
        window.open(`http://192.168.3.6:8000/api/media/${filename}`, "_blank");
      } else {
        console.error("Erreur lors de la récupération du fichier.");
      }
    } catch (error) {
      console.error("Erreur d'appel API : ", error);
    }
  };
  return (
    <>
      <div className="container mt-4">
      <h3 className="mb-3">Résultats de recherche</h3>

      {/* Nav-tabs Bootstrap */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "auth" ? "active" : ""}`}
            onClick={() => setActiveTab("auth")}
          >
            Documents Authentifiés
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "not_auth" ? "active" : ""}`}
            onClick={() => setActiveTab("not_auth")}
          >
            Documents Non Authentifiés
          </button>
        </li>
      </ul>

      {/* Contenu des onglets */}
      <div className="tab-content mt-4">
        {activeTab === "auth" && (
          <div className="tab-pane fade show active">
            {results.auth.length === 0 ? (
              <p>Aucun document authentifié trouvé.</p>
            ) : (
              results.auth.map((result, index) => (
                <div key={index} className="mb-4">
                  <a
                    href="javascript:;"
                    onClick={(e) => handleFileClick(result.file.filename, e)}
                    className="text-primary fw-bold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.file.filename}
                  </a>
                  <br />
                  <small className="text-success">{result.file.indexing_date}</small>
                  <p
                    className="text-secondary mt-1"
                    dangerouslySetInnerHTML={{
                      __html: result.highlight.content.join("..."),
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === "not_auth" && (
          <div className="tab-pane fade show active">
            {results.not_auth.length === 0 ? (
              <p>Aucun document non authentifié trouvé.</p>
            ) : (
              results.not_auth.map((result, index) => (
                <div key={index} className="mb-4">
                  <a
                    href="javascript:;"
                    onClick={(e) => handleFileClick(result.file.filename, e)}
                    className="text-primary fw-bold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.file.filename}
                  </a>
                  <br />
                  <small className="text-success">{result.file.indexing_date}</small>
                  <p
                    className="text-secondary mt-1"
                    dangerouslySetInnerHTML={{
                      __html: result.highlight.content.join("..."),
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>

    </>
  );
};

export default SearchResults;

