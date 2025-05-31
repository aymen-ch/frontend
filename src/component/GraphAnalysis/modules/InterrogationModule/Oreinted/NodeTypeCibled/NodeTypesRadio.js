import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Client HTTP pour les requêtes API
import { getNodeIcon, getNodeColor } from '../../../VisualisationModule/Parser'; // Fonctions utilitaires pour obtenir l'icône et la couleur d'un nœud
import { BASE_URL_Backend } from '../../../../Platforme/Urls'; // URL de base de l'API backend
import { useTranslation } from 'react-i18next'; // Hook pour l'internationalisation

// Composant affichant une barre de sélection (boutons radio) pour filtrer par type de nœud
const RadioBarComponent = ({ onResult }) => {
  const [nodeData, setNodeData] = useState([]);// État pour stocker les données des types de nœuds récupérées (ex: [{type: 'Person', ...}, ...])
  const [selectedNodeType, setSelectedNodeType] = useState('');  // État pour stocker le type de nœud actuellement sélectionné par l'utilisateur
  const [error, setError] = useState(null);  // État pour stocker un éventuel message d'erreur lors de la récupération des données
  const { t } = useTranslation();  // Hook de traduction pour obtenir la fonction t
  // Effet exécuté une seule fois au montage du composant pour récupérer les types de nœuds
  useEffect(() => {
    // Fonction asynchrone pour interroger l'API
    const fetchNodeTypes = async () => {
      try {
        // Récupération du token d'authentification (si nécessaire par l'API)
        const token = localStorage.getItem('authToken');
        // Appel GET à l'API pour obtenir les types de nœuds
        const response = await axios.get(BASE_URL_Backend + '/node-types/', {
          headers: {
            // Inclusion du token dans les en-têtes si présent
            Authorization: `Bearer ${token}`,
          },
        });
        // Vérification du statut de la réponse
        if (response.status !== 200) {
          throw new Error('Network response was not ok');
        }
        // Mise à jour de l'état nodeData avec les types de nœuds reçus
        setNodeData(response.data.node_types);
      } catch (error) {
        // Gestion des erreurs (console + mise à jour de l'état d'erreur)
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred');
      }
    };
    // Appel de la fonction de récupération
    fetchNodeTypes();
  }, []); // Le tableau de dépendances vide assure l'exécution unique au montage

  // Gestionnaire appelé lors d'un changement de sélection dans les boutons radio
  const handleSelectionChange = (event) => {
    // Récupération de la valeur (type de nœud) sélectionnée
    const selectedType = event.target.value;
    // Mise à jour de l'état local du type sélectionné
    setSelectedNodeType(selectedType);
    // Appel de la fonction onResult passée en prop avec le type sélectionné
    onResult(selectedType);
  };

  // Rendu JSX du composant
  return (
    <div className="w-full">
      <div className="bg-white shadow rounded-xl">
        {/* En-tête de la section */}
        <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-t-xl">
          <h5 className="text-sm font-medium flex items-center gap-2">
            <i className="bi bi-diagram-3-fill text-base"></i>
            {t('Select Node Type')} {/* Texte traduit */}
          </h5>
        </div>

        <div className="p-4">
          {/* Affichage conditionnel du message d'erreur */}
          {error ? (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded">{error}</div>
          ) : (
            /* Conteneur pour les options radio */
            <div className="space-y-4">
              {/* Itération sur les types de nœuds (filtrés pour exclure 'Chunk') */}
              {nodeData
                .filter((node) => node.type !== 'Chunk')
                .map((node, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {/* Bouton radio pour chaque type de nœud */}
                    <input
                      type="radio"
                      name="nodeType" // Nom commun pour lier les boutons radio
                      id={`nodeType${index}`} // ID unique pour le label
                      value={node.type} // Valeur associée au bouton
                      checked={selectedNodeType === node.type} // Coche le bouton si son type correspond à l'état sélectionné
                      onChange={handleSelectionChange} // Appelle le gestionnaire au changement
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    {/* Label associé au bouton radio */}
                    <label
                      htmlFor={`nodeType${index}`}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      {/* Icône colorée représentant le type de nœud */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: getNodeColor(node.type) }} // Couleur de fond dynamique
                      >
                        <img
                          src={getNodeIcon(node.type)} // Icône dynamique
                          alt={`${node.type} icon`}
                          className="w-4 h-4 filter brightness-0 invert" // Style pour l'icône (potentiellement pour contraste)
                        />
                      </div>
                      {/* Nom du type de nœud */}
                      <span className="text-base font-medium">{node.type}</span>
                    </label>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Exporte le composant pour utilisation ailleurs
export default RadioBarComponent;
