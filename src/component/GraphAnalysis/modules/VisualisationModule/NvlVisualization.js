// useNvlVisualization.js : Hook personnalisé pour gérer la visualisation interactive des nœuds et relations avec Neo4j NVL

import { useEffect, useRef, useState } from 'react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react'; // Composant React pour la visualisation NVL
import {
  PanInteraction,
  ZoomInteraction,
  DragNodeInteraction,
  BoxSelectInteraction,
  ClickInteraction,
  HoverInteraction,
} from '@neo4j-nvl/interaction-handlers'; // Gestionnaires d'interactions pour la visualisation

import { LabelManager, LabelManagerSchema, createNodeHtml } from './Parser'; // Fonctions utilitaires pour les étiquettes et le HTML des nœuds

// Hook personnalisé pour configurer la visualisation NVL
const useNvlVisualization = ({
  nvlRef, // Référence pour le composant NVL
  nodes, // Liste des nœuds
  edges, // Liste des relations
  selectedNodes, // Nœuds sélectionnés
  setSelectedNodes, // Met à jour les nœuds sélectionnés
  setContextMenu, // Gère le menu contextuel des nœuds
  setContextMenuRel, // Gère le menu contextuel des relations
  SetContextMenucanvas, // Gère le menu contextuel du canevas
  setnodetoshow, // Définit le nœud à afficher
  setrelationtoshow, // Définit la relation à afficher
  selectedEdges, // Relations sélectionnées
  setselectedEdges, // Met à jour les relations sélectionnées
  sethoverEdge, // Définit la relation survolée
  ispath, // Indicateur de mode chemin
  layoutType, // Type de disposition
  multiselecte, // Indicateur de sélection multiple
  setmultiselecte, // Met à jour l'état de sélection multiple
}) => {
  // Références
  const previouslyHoveredNodeRef = useRef(null); // Nœud précédemment survolé
  const selectedNodeRef = useRef(null); // Nœud actuellement sélectionné
  const selectedRelationRef = useRef(null); // Relation actuellement sélectionnée
  const minimapContainerRef = useRef(null); // Conteneur de la mini-carte

  // État
  const [isMinimapReady, setIsMinimapReady] = useState(false); // Indique si la mini-carte est prête
  const [hoverdnode, sethovernode] = useState(null); // Nœud actuellement survolé
  const layoutoptions = {
    direction: 'up', // Direction de la disposition
    packing: 'bin', // Type d'empaquetage
  };

  // Vérifie si la mini-carte est prête
  useEffect(() => {
    if (minimapContainerRef.current) {
      setIsMinimapReady(true); // Active la mini-carte
    }
  }, []);

  // Gestion de la touche Ctrl + A pour sélectionner tous les nœuds
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault(); // Empêche le comportement par défaut
        const allNodeIds = nodes.map(node => node.id); // Récupère tous les IDs des nœuds
        setSelectedNodes(new Set(allNodeIds)); // Sélectionne tous les nœuds
      }
    };

    document.addEventListener('keydown', handleKeyDown); // Ajoute l'écouteur
    return () => {
      document.removeEventListener('keydown', handleKeyDown); // Nettoie l'écouteur
    };
  }, [nodes, setSelectedNodes]);

  // Gestion des interactions NVL
  useEffect(() => {
    if (!nvlRef.current) return;

    // Initialise les gestionnaires d'interactions
    const panInteraction = new PanInteraction(nvlRef.current); // Déplacement du canevas
    const boxSelectInteraction = new BoxSelectInteraction(nvlRef.current); // Sélection par boîte
    const clickInteraction = new ClickInteraction(nvlRef.current); // Gestion des clics
    const zoomInteraction = new ZoomInteraction(nvlRef.current); // Gestion du zoom
    const dragNodeInteraction = new DragNodeInteraction(nvlRef.current); // Déplacement des nœuds
    const hoverInteraction = new HoverInteraction(nvlRef.current); // Gestion du survol

    dragNodeInteraction.mouseDownNode = null; // Réinitialise le nœud en cours de déplacement

    if (multiselecte) {
      // Gestion de la sélection multiple
      boxSelectInteraction.updateCallback('onBoxSelect', ({ nodes, rels }) => {
        setSelectedNodes((prevSelected) => {
          const newSelected = new Set(prevSelected); // Copie les nœuds sélectionnés
          nodes.forEach((node) => {
            newSelected.has(node.id) ? newSelected.delete(node.id) : newSelected.add(node.id); // Ajoute ou supprime
          });
          return newSelected;
        });

        setselectedEdges?.((prevSelected) => {
          const newSelected = new Set(prevSelected); // Copie les relations sélectionnées
          rels.forEach((rel) => {
            newSelected.has(rel.id) ? newSelected.delete(rel.id) : newSelected.add(rel.id); // Ajoute ou supprime
          });
          return newSelected;
        });

        setmultiselecte(false); // Désactive la sélection multiple
      });
      panInteraction.destroy(); // Désactive le déplacement
      zoomInteraction.destroy(); // Désactive le zoom
    } else {
      panInteraction.updateCallback('onPan', () => console.log('onPan')); // Log du déplacement
      zoomInteraction.updateCallback('onZoom', () => console.log('onZoom')); // Log du zoom
      boxSelectInteraction.destroy(); // Désactive la sélection par boîte
    }

    // Gestion du clic droit sur un nœud
    clickInteraction.updateCallback('onNodeRightClick', (node, hitElements, event) => {
      event.preventDefault();
      setContextMenu({
        visible: true,
        x: event.clientX - 100, // Position X du menu
        y: event.clientY - 200, // Position Y du menu
        node, // Nœud concerné
      });
    });

    // Gestion du clic sur un nœud
    clickInteraction.updateCallback('onNodeClick', (node, hitElements, event) => {
      if (node && node.id) {
        setSelectedNodes((prevSelected) => {
          const newSelected = new Set(prevSelected); // Copie les nœuds sélectionnés
          newSelected.add(node.id); // Ajoute le nœud
          return newSelected;
        });
        selectedNodeRef.current = node.id; // Met à jour la référence
        setnodetoshow(node.id); // Affiche le nœud
      }
    });

    // Gestion du clic sur une relation
    clickInteraction.updateCallback('onRelationshipClick', (edge, hitElements, event) => {
      if (edge && edge.id) {
        setselectedEdges?.((prevSelected) => {
          const newSelected = new Set(prevSelected); // Copie les relations sélectionnées
          newSelected.add(edge.id); // Ajoute la relation
          return newSelected;
        });
        selectedRelationRef.current = edge.id; // Met à jour la référence
      }
    });

    // Gestion du clic droit sur une relation
    clickInteraction.updateCallback('onRelationshipRightClick', (edge, hitElements, event) => {
      event.preventDefault();
      setContextMenuRel({
        visible: true,
        x: event.clientX - 230, // Position X du menu
        y: event.clientY - 200, // Position Y du menu
        edge, // Relation concernée
      });
    });

    // Gestion du clic sur le canevas
    clickInteraction.updateCallback('onCanvasClick', (event) => {
      if (!event.hitElements || event.hitElements.length === 0) {
        setSelectedNodes?.(new Set()); // Réinitialise les nœuds sélectionnés
        setselectedEdges?.(new Set()); // Réinitialise les relations sélectionnées
        selectedNodeRef.current = null; // Réinitialise la référence du nœud
        selectedRelationRef.current = null; // Réinitialise la référence de la relation
        setnodetoshow(null); // Réinitialise le nœud affiché
        if (typeof setContextMenu === 'function') {
          setContextMenu(null); // Ferme le menu contextuel des nœuds
        }
        if (typeof SetContextMenucanvas === 'function') {
          SetContextMenucanvas(null); // Ferme le menu contextuel du canevas
        }
      }
    });

    // Gestion du clic droit sur le canevas
    clickInteraction.updateCallback('onCanvasRightClick', (event) => {
      event.preventDefault();
      if (typeof SetContextMenucanvas === 'function') {
        SetContextMenucanvas({
          visible: true,
          x: event.clientX - 230, // Position X du menu
          y: event.clientY - 200, // Position Y du menu
        });
      }
    });

    // Gestion du survol
    hoverInteraction.updateCallback('onHover', (element, hitElements, event) => {
      if (!hitElements || ((!hitElements.nodes || hitElements.nodes.length === 0) && 
          (!hitElements.relationships || hitElements.relationships.length === 0))) {
        if (previouslyHoveredNodeRef.current) {
          const shadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
          if (shadowEffect) shadowEffect.remove(); // Supprime l'effet de survol
          previouslyHoveredNodeRef.current = null; // Réinitialise la référence
        }
        setrelationtoshow(selectedRelationRef.current); // Affiche la relation sélectionnée
        sethoverEdge(null); // Réinitialise la relation survolée
        setnodetoshow(selectedNodeRef.current); // Affiche le nœud sélectionné
        sethovernode(null); // Réinitialise le nœud survolé
        return;
      }

      if (hitElements.nodes && hitElements.nodes.length > 0) {
        const hoveredNode = hitElements.nodes[0]; // Nœud survolé
        if (hoveredNode && hoveredNode.data.id) {
          if (previouslyHoveredNodeRef.current) {
            const previousShadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (previousShadowEffect) previousShadowEffect.remove(); // Supprime l'effet précédent
          }
          const hoverEffectPlaceholder = hoveredNode.data.html; // Placeholder pour l'effet
          if (hoverEffectPlaceholder) {
            setnodetoshow(hoveredNode.data.id); // Affiche le nœud
            setrelationtoshow(null); // Réinitialise la relation affichée
            sethovernode(hoveredNode.data.id); // Met à jour le nœud survolé
          }
          previouslyHoveredNodeRef.current = hoverEffectPlaceholder; // Met à jour la référence
        }
      }

      if (hitElements.relationships && hitElements.relationships.length > 0) {
        const hoveredEdge = hitElements.relationships[0]; // Relation survolée
        if (hoveredEdge && hoveredEdge.data.id) {
          if (previouslyHoveredNodeRef.current) {
            const previousShadowEffect = previouslyHoveredNodeRef.current.querySelector('#test');
            if (previousShadowEffect) previousShadowEffect.remove(); // Supprime l'effet précédent
            previouslyHoveredNodeRef.current = null; // Réinitialise la référence
          }
          setnodetoshow(null); // Réinitialise le nœud affiché
          setrelationtoshow(hoveredEdge.data); // Affiche la relation
          sethoverEdge(hoveredEdge.data.id); // Met à jour la relation survolée
        }
      }
    });

    // Nettoyage des interactions
    return () => {
      panInteraction.destroy();
      boxSelectInteraction.destroy();
      clickInteraction.destroy();
      zoomInteraction.destroy();
      dragNodeInteraction.destroy();
      hoverInteraction.destroy();
    };
  }, [
    nvlRef,
    multiselecte,
    setSelectedNodes,
    setContextMenu,
    setnodetoshow,
    setrelationtoshow,
    setselectedEdges,
    sethoverEdge,
    isMinimapReady,
    layoutType,
    setmultiselecte,
  ]);

  // Options de configuration NVL
  const nvlOptions = {
    minimapContainer: minimapContainerRef.current, // Conteneur de la mini-carte
    disableTelemetry: true, // Désactive la télémétrie
    styling: {
      disabledItemFontColor: '#808080', // Couleur des éléments désactivés
      selectedBorderColor: 'rgba(71, 39, 134, 0.9)', // Couleur de la bordure sélectionnée
      dropShadowColor: 'rgba(85, 83, 174, 0.5)', // Couleur de l'ombre
      backgroundColor: 'transparent', // Fond transparent
    },
    initialZoom: 1, // Zoom initial
    layoutOptions: layoutoptions, // Options de disposition
  };

  // Fonction pour obtenir le composant de visualisation
  const getVisualizationComponent = (hoveredEdge) => {
    const nvlProps = {
      nodes: nodes.map((node) => ({
        ...node,
        hovered: node.id === hoverdnode, // Indique si le nœud est survolé
        selected: selectedNodes?.has(node.id) && !node.isSelected, // Indique si sélectionné
        html: createNodeHtml(
          node.ischema
            ? LabelManagerSchema(node.group, node.properties) // Étiquette pour schéma
            : LabelManager(node.group, { ...node.properties, ...node.properties_analyse }), // Étiquette standard
          node.group, // Type de nœud
          selectedNodes?.has(node.id), // État sélectionné
          node.selecte === true, // État de chemin
          1, // Compteur de groupe
          node.id, // ID du nœud
          false, // Pas d'icône supplémentaire
          '🔴', // Icône par défaut
          node.size // Taille du nœud
        ),
      })),
      rels: edges.map((edge) => ({
        ...edge,
        selected: selectedEdges?.has(edge.id) || edge.selected, // Indique si sélectionnée
        color: edge.id === hoveredEdge || selectedEdges?.has(edge.id) || edge.selected ? '#B771E5' : (edge.color || '#808080'), // Couleur de la relation
        width: edge.id === hoveredEdge || selectedEdges?.has(edge.id) || edge.selected ? 15 : (edge.width || 1), // Largeur de la relation
      })),
    };

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {(isMinimapReady || !ispath) && (
          <InteractiveNvlWrapper
            ref={nvlRef} // Référence NVL
            {...nvlProps} // Propriétés des nœuds et relations
            nvlOptions={nvlOptions} // Options de configuration
            allowDynamicMinZoom={true} // Autorise le zoom dynamique
            onError={(error) => console.error('Erreur NVL:', error)} // Gestion des erreurs
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 0,
              cursor: multiselecte ? 'crosshair' : 'pointer', // Curseur selon le mode
              pointerEvents: 'auto', // Active les interactions
            }}
          />
        )}
        <div
          ref={minimapContainerRef} // Conteneur de la mini-carte
          style={{
            position: 'absolute',
            bottom: '100px',
            right: '80px',
            width: '200px',
            height: '150px',
            backgroundColor: 'white',
            border: '1px solid lightgray',
            borderRadius: '4px',
            overflow: 'hidden',
            display: ispath ? 'block' : 'none', // Affiche la mini-carte en mode chemin
          }}
        />
      </div>
    );
  };

  return { getVisualizationComponent }; // Retourne la fonction de rendu
};

export default useNvlVisualization; // Exporte le hook