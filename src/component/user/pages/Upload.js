import React, { useState } from "react";
import axios from "axios";
const Upload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [currentKeyword, setCurrentKeyword] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()]);
      setCurrentKeyword("");
    }
  };

  const handleRemoveKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  

 

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    // Vérifier que les données sont valides
    if (!file || !title.trim()) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
  
    // Récupérer l'access token depuis le localStorage
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      alert("Vous devez être connecté pour télécharger un fichier.");
      return;
    }
  
    // Convertir les mots-clés en une chaîne séparée par des virgules
    const keywordsString = keywords.join(", ");
  
    // Préparer les données sous forme de FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("keywords", keywordsString);
  
    try {
      // Effectuer l'appel POST avec Axios
      const response = await axios.post(
        "http://127.0.0.1:8000/api/documents/new",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Nécessaire pour form-data
            Authorization: `Bearer ${accessToken}`, // Ajouter l'access token
          },
        }
      );
  
      // Gérer la réponse de l'API
      console.log("Réponse de l'API :", response.data);
      alert("Fichier téléchargé avec succès !");
      setFile(null);
      setTitle("");
      setKeywords([]);
    } catch (error) {
      // Gérer les erreurs
      console.error("Erreur lors de l'envoi :", error);
      alert("Une erreur est survenue lors du téléchargement.");
    }
  };
  


  return (
    <div className="container mt-4">
      <h3 className="mb-4">Upload Fichier</h3>
      <form onSubmit={handleSubmit}>
        {/* Input File */}
        <div className="mb-3">
          <label htmlFor="fileInput" className="form-label">
            Fichier
          </label>
          <input
            type="file"
            className="form-control"
            id="fileInput"
            onChange={handleFileChange}
            required
          />
        </div>

        {/* Input Title */}
        <div className="mb-3">
          <label htmlFor="titleInput" className="form-label">
            Titre
          </label>
          <input
            type="text"
            className="form-control"
            id="titleInput"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entrez un titre"
            required
          />
        </div>

        {/* Input Keywords */}
        <div className="mb-3">
          <label htmlFor="keywordInput" className="form-label">
            Mots-clés
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              id="keywordInput"
              value={currentKeyword}
              onChange={(e) => setCurrentKeyword(e.target.value)}
              placeholder="Ajoutez un mot-clé"
            />
            <button
              type="button"
              className="btn"
              onClick={handleAddKeyword}
              style={{backgroundColor:"#117a65", color:"#fff"}}
            >
              Ajouter
            </button>
          </div>
          {/* Affichage des mots-clés */}
          <div className="mt-2">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="badge me-2 mb-2"
                style={{ cursor: "pointer",  backgroundColor:"#117a65"}}
                onClick={() => handleRemoveKeyword(index)}
              >
                {keyword} &times;
              </span>
            ))}
          </div>
        </div>

        {/* Bouton Submit */}
        <button type="submit" className="btn" style={{backgroundColor:"#117a65", color:"#fff"}}>
          Soumettre
        </button>
      </form>
    </div>
  );
};

export default Upload;
