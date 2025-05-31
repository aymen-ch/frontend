// src/utils/contextMenuHelpers.js
import axios from 'axios';
import { BASE_URL_Backend } from '../../../../Platforme/Urls'; 
import { parsergraph } from '../../../VisualisationModule/Parser';


/// Contient les fonctionnalités à appliquer lors du menu contextuel d’un nœud, telles que l’extensibilité, l’exécution des actions...

/// Récupère les relations possibles pour un nœud, afin de permettre le développement d’une relation spécifique.
export const fetchPossibleRelations = async (node, setPossibleRelations) => {
  const token = localStorage.getItem('authToken');
  const node_type = node.group;
  const id = parseInt(node.id, 10) ;

  try {
    const response = await axios.post(
      BASE_URL_Backend + '/get_possible_relations/',
      { node_type, id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      setPossibleRelations(response.data.relations);
    } else {
      console.error('Failed to fetch possible relations.');
    }
  } catch (error) {
    console.error('Error fetching possible relations:', error);
  }
};

/// Exécute les extensions de tous les nodes selectionees utilise par le context menu de canvas
//  : avec une direction et une limite (sans critère).
export const handleNodeExpansion_selected = async (selectedNodes, setNodes, setEdges,expandLimit,expandDirection) => {
  const token = localStorage.getItem('authToken');

  try {
    // Get current nodes to map IDs to node objects
    let nodesToExpand = [];
    setNodes((prevNodes) => {
      nodesToExpand = prevNodes.filter((node) => selectedNodes.has(node.id));
      return prevNodes; // No change to nodes yet
    });

    if (nodesToExpand.length === 0) {
      console.log('No valid nodes to expand');
      return;
    }

    // Collect all new nodes and edges from expansions
    const allNewNodes = [];
    const allNewEdges = [];
    const nodeIds = new Set(); // Track unique node IDs
    const edgeIds = new Set(); // Track unique edge identifiers

    for (const node of nodesToExpand) {
      const node_type = node.group;
      const id = parseInt(node.id, 10);

      try {
        // Make API call for standard relations (relationType = null)
        const response = await axios.post(
          BASE_URL_Backend + '/extensibility/',
          { node_type, id, relation_type: null ,
            expandLimit, // Include sense
          expandDirection  // Include limit
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          const graphData = parsergraph(response.data);
          // Filter unique nodes
          graphData.nodes.forEach((newNode) => {
            if (!nodeIds.has(newNode.id)) {
              nodeIds.add(newNode.id);
              allNewNodes.push(newNode);
            }
          });
          // Filter unique edges (assuming edges have unique from-to pairs)
          graphData.edges.forEach((newEdge) => {
            const edgeKey = `${newEdge.from}-${newEdge.to}`;
            if (!edgeIds.has(edgeKey)) {
              edgeIds.add(edgeKey);
              allNewEdges.push(newEdge);
            }
          });
        } else {
          console.error(`Failed to expand node ${id}:`, response.status);
        }
      } catch (error) {
        console.error(`Error expanding node ${id}:`, error);
      }
    }

    // Update state with deduplicated nodes and edges
    setNodes((prevNodes) => {
      const existingNodeIds = new Set(prevNodes.map((node) => node.id));
      const filteredNewNodes = allNewNodes.filter((node) => !existingNodeIds.has(node.id));
      return [...prevNodes, ...filteredNewNodes];
    });

    setEdges((prevEdges) => {
      const existingEdgeKeys = new Set(prevEdges.map((edge) => `${edge.from}-${edge.to}`));
      const filteredNewEdges = allNewEdges.filter((edge) => !existingEdgeKeys.has(`${edge.from}-${edge.to}`));
      return [...prevEdges, ...filteredNewEdges];
    });
  } catch (error) {
    console.error('Error in handleNodeExpansion_selected:', error);
  }
};



/// Exécute les extensions d’un nœud : soit les relations physiques, soit toutes les relations, soit une relation virtuelle si elle existe, avec une direction et une limite (sans critère).
// Gère l'expansion d'un nœud en ajoutant de nouveaux nœuds et arêtes
// Gère l'expansion d'un nœud en ajoutant de nouveaux nœuds et arêtes
export const handleNodeExpansion = async (
  node, // Nœud à expandre
  relationType, // Type de relation (standard ou virtuelle)
  setNodes, // Fonction pour mettre à jour les nœuds
  setEdges, // Fonction pour mettre à jour les arêtes
  virtualRelations, // Liste des relations virtuelles
  expandLimit = 100, // Limite du nombre de nœuds à expandre
  expandDirection = 'In' // Direction de l'expansion (In/Out)
) => {
  // Récupère le token d'authentification depuis le stockage local
  const token = localStorage.getItem('authToken');
  // Type du nœud
  const node_type = node.group;
  // ID du nœud converti en entier
  const id = parseInt(node.id, 10);

  try {
    // Recherche une relation virtuelle correspondant au type de relation
    const virtualRelation = virtualRelations.find((vr) => vr.name === relationType);

    let response;
    if (virtualRelation) {
      // Gère une relation virtuelle
      response = await axios.post(
        BASE_URL_Backend + '/extensibilty_virtuel/',
        {
          node_type,
          id,
          virtual_relation: relationType,
          path: virtualRelation.path,
          expandLimit,
          expandDirection,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      // Gère une relation standard
      response = await axios.post(
        BASE_URL_Backend + '/extensibility/',
        {
          node_type,
          id,
          relation_type: relationType,
          expandLimit,
          expandDirection,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Vérifie si la requête a réussi
    if (response.status === 200) {
      console.log('Données reçues :', response.data);
      // Parse les données reçues pour obtenir les nœuds et arêtes
      const graphData = parsergraph(response.data);

      // Ajoute les nouveaux nœuds sans dupliquer les existants
      setNodes((prevNodes) => {
        // Affiche les IDs des nœuds existants pour le débogage
        // Filtre les nouveaux nœuds pour exclure ceux qui existent déjà (comparaison par ID)
        const newNodes = graphData.nodes
          .filter((newNode) => !prevNodes.some((existingNode) => existingNode.id === newNode.id))
          .map((newNode) => {
            // Si c'est une relation virtuelle, ajoute aggregationType et aggregationpath
            if (virtualRelation) {
              return {
                ...newNode,
                aggregationType: relationType, // Ajoute le type d'agrégation (nom de la relation virtuelle)
                aggregationpath: virtualRelation.path, // Ajoute le chemin de la relation virtuelle
              };
            }
            return newNode;
          });
        // Retourne la liste des nœuds existants combinée aux nouveaux nœuds
        return [...prevNodes, ...newNodes];
      });

      // Ajoute les nouvelles arêtes sans dupliquer les existantes
      setEdges((prevEdges) => {
        // Filtre les nouvelles arêtes pour exclure celles qui existent déjà (comparaison par ID ou from/to)
        const newEdges = graphData.edges
          .filter(
            (newEdge) =>
              !prevEdges.some(
                (existingEdge) =>
                  existingEdge.id === newEdge.id ||
                  (existingEdge.from === newEdge.from && existingEdge.to === newEdge.to)
              )
          )
          .map((newEdge) => {
            // Si c'est une relation virtuelle, ajoute aggregationType et aggregationpath
            if (virtualRelation) {
              return {
                ...newEdge,
                aggregationType: relationType, // Ajoute le type d'agrégation (nom de la relation virtuelle)
                aggregationpath: virtualRelation.path, // Ajoute le chemin de la relation virtuelle
              };
            }
            return newEdge;
          });
        // Retourne la liste des arêtes existantes combinée aux nouvelles arêtes
        return [...prevEdges, ...newEdges];
      });
    } else {
      console.error('Échec de la requête :', response.status);
    }
  } catch (error) {
    console.error('Erreur lors de l’expansion du nœud :', error);
  }
};





/// Permet d’exécuter une action spécifique.

export const handleActionSelect = async (
  action,
  node,
  setActionsSubMenu,
  setContextMenu,
  setNodes,
  setEdges
) => {
  console.log(`Selected action: ${action}`);
  const token = localStorage.getItem('authToken');

  try {


    const idValue =  parseInt(node.id, 10); // Fallback to node.id if idField is not found

    // Call the execute_action endpoint
    const response = await axios.post(
      `${BASE_URL_Backend}/execute_action/`,
      {
        action_name: action,
        id: idValue,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      // Parse the graph data
      const { nodes: newNodes, edges: newEdges } = parsergraph(response.data);

      // Update nodes and edges, avoiding duplicates
      let updatedNodes;
      setNodes((prevNodes) => {
        const existingNodeIds = new Set(prevNodes.map((n) => n.id));
        updatedNodes = [...prevNodes, ...newNodes.filter((n) => !existingNodeIds.has(n.id))];
        return updatedNodes;
      });

      setEdges((prevEdges) => {
        const existingEdgeIds = new Set(prevEdges.map((e) => `${e.from}-${e.to}`));
        const filteredEdges = newEdges.filter((e) => !existingEdgeIds.has(`${e.from}-${e.to}`));
        return [...prevEdges, ...filteredEdges];
      });

      // Close menus
      setActionsSubMenu(null);
      setContextMenu(null);
    } else {
      console.error(`Failed to execute action: ${action}`);
    }
  } catch (error) {
    console.error(`Error executing action ${action}:`, error);
  }
};




/// Expansion avancée à travers des filtres sur des attributs numériques, avec un seuil.
export const handleAdvancedExpand = async (
  node,
  setNodes,
  setEdges,
  advancedExpandParams
) => {
  const token = localStorage.getItem('authToken');

  try {
    const { attribute, threshold, maxLevel, direction } = advancedExpandParams;
    const response = await axios.post(
      `${BASE_URL_Backend}/expand_path_from_node/`,
      {
        id_start: parseInt(node.id, 10),
        attribute,
        threshold,
        max_level: maxLevel,
        direction, // Include direction in the request
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { nodes: expandedNodes, edges: expandedEdges } = parsergraph(response.data.data);

      setNodes((prevNodes) => [...prevNodes, ...expandedNodes]);
      setEdges((prevEdges) => [...prevEdges, ...expandedEdges]);

      return {
        success: true,
        message: 'Path expanded successfully',
      };
    } else {
      console.error('Failed to expand path from node');
      return {
        success: false,
        error: 'API request failed',
        status: response.status,
      };
    }
  } catch (error) {
    console.error('Error expanding path:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
};


