// GraphCanvas.js : Composant utilisant une bibliothèque de visualisation pour afficher les nœuds et relations,
// assure l'indépendance de la plateforme par rapport à la bibliothèque de visualisation utilisée.

import React, { useEffect, useState } from 'react';
import useNvlVisualization from './NvlVisualization'; // Hook personnalisé pour gérer la visualisation

// Composant principal pour afficher le canevas de visualisation du graphe
const GraphCanvas = ({
  nvlRef, // Référence pour la visualisation
  nodes, // Liste des nœuds à afficher
  edges, // Liste des relations (arêtes) à afficher
  selectedNodes, // Nœuds actuellement sélectionnés
  setSelectedNodes, // Fonction pour mettre à jour les nœuds sélectionnés
  setContextMenu, // Fonction pour gérer le menu contextuel des nœuds
  setContextMenuRel, // Fonction pour gérer le menu contextuel des relations
  SetContextMenucanvas, // Fonction pour gérer le menu contextuel du canevas
  setnodetoshow, // Fonction pour définir le nœud à afficher
  setrelationtoshow, // Fonction pour définir la relation à afficher
  ispath, // Indicateur si le mode chemin est actif
  setselectedEdges, // Fonction pour mettre à jour les relations sélectionnées
  selectedEdges, // Relations actuellement sélectionnées
  layoutType, // Type de disposition du graphe
  multiselecte, // Indicateur pour la sélection multiple
  setmultiselecte // Fonction pour activer/désactiver la sélection multiple
}) => {
  // État
  const [shiftPressed, setShiftPressed] = useState(false); // État de la touche Shift (pressée ou non)
  const [hoveredEdge, sethoverEdge] = useState(null); // Relation survolée par la souris

  // Gestion de la touche Shift
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Shift') setShiftPressed(true); // Active l'état Shift si pressé
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') setShiftPressed(false); // Désactive l'état Shift si relâché
    };

    // Ajoute les écouteurs d'événements pour la touche Shift
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Nettoie les écouteurs lors du démontage
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Utilisation du hook de visualisation NVL
  const { getVisualizationComponent } = useNvlVisualization({
    nvlRef, // Référence pour la visualisation
    nodes, // Nœuds à visualiser
    edges, // Relations à visualiser
    selectedNodes, // Nœuds sélectionnés
    setSelectedNodes, // Met à jour les nœuds sélectionnés
    setContextMenu, // Gère le menu contextuel des nœuds
    setContextMenuRel, // Gère le menu contextuel des relations
    SetContextMenucanvas, // Gère le menu contextuel du canevas
    setnodetoshow, // Définit le nœud à afficher
    setrelationtoshow, // Définit la relation à afficher
    selectedEdges, // Relations sélectionnées
    setselectedEdges, // Met à jour les relations sélectionnées
    sethoverEdge, // Met à jour la relation survolée
    ispath, // Mode chemin actif
    layoutType, // Type de disposition
    multiselecte, // Sélection multiple active
    setmultiselecte // Met à jour la sélection multiple
  });

  // Obtient le composant de visualisation
  const VisualizationComponent = getVisualizationComponent(hoveredEdge); // Composant de rendu basé sur la relation survolée

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {VisualizationComponent} // Affiche le composant de visualisation
    </div>
  );
};

export default GraphCanvas; // Exporte le composant pour utilisation ailleurs