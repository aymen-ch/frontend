import { BASE_URL_Backend } from "../../../Platforme/Urls";
import { parseAggregationResponse } from "../../VisualisationModule/Parser";
import axios from "axios";

// Extrait les types intermédiaires d'un chemin d'agrégation (nœuds entre le début et la fin du chemin)
export const getIntermediateTypes = (aggregationPath) => {
  const intermediateTypes = [];
  // Parcourt le chemin à partir de l'index 2 jusqu'à l'avant-dernier nœud, en sautant les relations
  for (let i = 2; i < aggregationPath.length - 2; i += 2) {
    intermediateTypes.push(aggregationPath[i]);
  }
  return intermediateTypes;
};

// Gère l'agrégation de nœuds en fonction d'un chemin et d'un type de relation
export const handleAggregation = async (
  path, // Chemin d'agrégation, e.g., ["Label1", "RELATION", "Label2"]
  aggregationType, // Type d'agrégation à appliquer
  setNodes, // Fonction pour mettre à jour les nœuds
  setEdges, // Fonction pour mettre à jour les arêtes
  nodes, // Liste actuelle des nœuds
  setActiveAggregations // Fonction pour activer les agrégations
) => {
  // Filtre les nœuds correspondant aux labels dans le chemin et extrait leurs IDs
  const nodeIds = nodes
    .filter((node) => path.includes(node.group))
    .map((node) => parseInt(node.id, 10));
  // Affiche les IDs des nœuds concernés pour le débogage
  console.log("Agrégation effectuée !!!!", nodeIds);

  try {
    // Récupère le token d'authentification depuis le stockage local
    const token = localStorage.getItem('authToken');
    // Envoie une requête POST pour effectuer l'agrégation
    const response = await axios.post(
      BASE_URL_Backend + '/agregate/',
      {
        node_ids: nodeIds, // IDs des nœuds à agréger
        aggregation_path: [path], // Chemin d'agrégation (encapsulé dans un tableau)
        type: aggregationType, // Type de relation pour l'agrégation
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Vérifie si la requête a réussi
    if (response.status === 200) {
      // Parse les données reçues pour obtenir les nœuds et arêtes agrégés
      const { nodes: parsedNodes, edges: parsedEdges } = parseAggregationResponse(response.data);

      // Ajoute les propriétés aggregationType et aggregationpath aux arêtes agrégées
      const updatedEdges = parsedEdges.map((edge) => ({
        ...edge,
        aggregationType: aggregationType,
        aggregationpath: path,
      }));

      // Ajoute les propriétés aggregationType et aggregationpath aux nœuds agrégés
      const updatedNodes = parsedNodes.map((node) => ({
        ...node,
        aggregationType: aggregationType,
        aggregationpath: path,
      }));

      // Extrait les types intermédiaires du chemin (nœuds à masquer pour les chemins longs)
      const intermediateTypes = getIntermediateTypes(path);
      console.log("Types intermédiaires :", intermediateTypes);

      // Vérifie si le chemin est une relation simple (longueur 3, e.g., ["Label1", "RELATION", "Label2"])
      const isSimpleRelation = path.length === 3;

      if (isSimpleRelation) {
        // Pour un chemin de longueur 3, masque uniquement les arêtes du type de relation spécifié
        const relationType = path[1]; // Type de relation, e.g., "call"
        console.log("Relation simple :", relationType);
        setEdges((prevEdges) => {
          // Combine les arêtes existantes avec les nouvelles
          const combinedEdges = [...prevEdges, ...updatedEdges];
          // Masque les arêtes correspondant au type de relation
          return combinedEdges.map((edge) => ({
            ...edge,
            hidden: edge.group === relationType || edge.hidden, // Conserve l'état hidden existant
          }));
        });
      } else {
        // Pour les chemins plus longs (> 3), masque les nœuds et arêtes intermédiaires
        setNodes((prevNodes) =>
          prevNodes.map((node) => ({
            ...node,
            // Masque les nœuds dont le groupe est dans les types intermédiaires
            hidden: intermediateTypes.includes(node.group) || node.hidden,
          }))
        );

        setEdges((prevEdges) => {
          // Combine les arêtes existantes avec les nouvelles
          const combinedEdges = [...prevEdges, ...updatedEdges];
          // Détermine si une arête doit être masquée en fonction des nœuds connectés
          const edgesWithHiddenState = combinedEdges.map((edge) => {
            const isFromHidden = nodes.some(
              (node) => node.id === edge.from && intermediateTypes.includes(node.group)
            );
            const isToHidden = nodes.some(
              (node) => node.id === edge.to && intermediateTypes.includes(node.group)
            );
            return {
              ...edge,
              hidden: isFromHidden || isToHidden || edge.hidden, // Conserve l'état hidden existant
            };
          });
          return edgesWithHiddenState;
        });
      }

      // Ajoute les nouveaux nœuds agrégés, quelle que soit la longueur du chemin
      setNodes((prevNodes) => [...prevNodes, ...updatedNodes]);

      // Active l'agrégation en mettant à jour l'état des agrégations actives
      setActiveAggregations((prev) => ({ ...prev, [aggregationType]: true }));
    } else {
      console.error('Échec de l’agrégation.');
    }
  } catch (error) {
    console.error('Erreur lors de l’agrégation :', error);
  }
};