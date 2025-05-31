import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importe les styles CSS de Bootstrap
import RadioBarComoponent from './NodeTypesRadio'; // Importe le composant pour la sélection du type de nœud
import SearchComponent from './SearchComponent_introgation'; // Importe le composant de recherche

// Composant principal pour l'interrogation ciblée par type de nœuds
// Il combine la sélection du type de nœud et la recherche associée.
const Properties_introgation = ({ nodes, edges, setNodes, setEdges }) => {
  const [selectedNodeType, setSelectedNodeType] = useState('');  // État pour stocker le type de nœud sélectionné via RadioBarComoponent
  const [isSearchVisible, setIsSearchVisible] = useState(true);// État pour contrôler la visibilité du composant de recherche

  // Fonction pour basculer la visibilité du composant de recherche
  const toggleSearchVisibility = () => {
    setIsSearchVisible(!isSearchVisible); // Inverse la valeur actuelle de isSearchVisible
  };

  // Rendu JSX du composant
  return (
    <div className="container-fluid d-flex flex-column p-0" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Première ligne : Composant RadioBarComponent */}
      {/* Prend toute la largeur disponible, hauteur automatique */}
      <div className="row m-0" style={{ flex: '0 0 auto' }}>
        <div className="col-12 p-0">
          <div className="card h-100 border-0 shadow-sm rounded-0" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-body p-0">
              {/* Instance du composant RadioBar */}
              <RadioBarComoponent
                onResult={setSelectedNodeType} // Passe la fonction pour mettre à jour le type de nœud sélectionné
                toggleSearchVisibility={toggleSearchVisibility} // Passe la fonction pour basculer la visibilité de la recherche
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deuxième ligne : Composant SearchComponent (conditionnel) */}
      {/* S'affiche seulement si isSearchVisible est vrai */}
      {/* Prend la hauteur restante disponible */}
      {isSearchVisible && (
        <div className="row m-0" style={{ flex: '1 1 auto', marginTop: '0.5rem' }}>
          <div className="col-12 p-0">
            <div className="card h-100 border-0 shadow-sm rounded-0" style={{ backgroundColor: '#ffffff' }}>
              <div className="card-body p-0">
                {/* Instance du composant SearchComponent */}
                <SearchComponent
                  selectedNodeType={selectedNodeType} // Passe le type de nœud sélectionné
                  nodes={nodes} // Passe les données des nœuds
                  edges={edges} // Passe les données des arêtes
                  setNodes={setNodes} // Passe la fonction pour mettre à jour les nœuds
                  setEdges={setEdges} // Passe la fonction pour mettre à jour les arêtes
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Exporte le composant pour utilisation dans d'autres parties de l'application
export default Properties_introgation;

