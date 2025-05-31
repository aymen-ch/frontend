// parser.js : Gère la configuration des styles des nœuds et des relations, ainsi que leur création et parsing
/// Permet de parser les réponses de différents modules. En principe, il n’y a qu’un seul parser, mais il existe des cas spéciaux pour la contextualisation, la détection de chemin et l’agrégation. 
import axios from 'axios'; // Client HTTP pour les appels API
import { BASE_URL_Backend } from '../../Platforme/Urls'; // URL de base de l'API backend

// Objet de configuration initial pour les nœuds
let NODE_CONFIG = {
  nodeTypes: {}, // Types de nœuds avec leurs styles
  defaultNodeSize: 90, // Taille par défaut des nœuds
};

// Fonction pour charger la configuration depuis l'API Django
export const loadConfig = async () => {
  try {
    const response = await axios.get(BASE_URL_Backend + '/node-config/'); // Requête GET pour la configuration
    NODE_CONFIG = response.data; // Met à jour la configuration
  } catch (error) {
    console.error('Erreur lors du chargement de nodeConfig:', error.message);
    throw error;
  }
};

loadConfig()
// Fonction pour mettre à jour la configuration d'un type de nœud via l'API
export const updateNodeConfig = async (nodeType, { color, size, icon, labelKey } = {}) => {
  try {
    const config = {}; // Objet de configuration à envoyer
    if (color) config.color = color; // Ajoute la couleur si fournie
    if (size) config.size = size; // Ajoute la taille si fournie
    if (icon) config.icon = icon; // Ajoute l'icône si fournie
    if (labelKey) config.labelKey = labelKey; // Ajoute la clé d'étiquette si fournie

    await axios.post(BASE_URL_Backend + '/update-node-config/', {
      nodeType, // Type de nœud
      config, // Configuration à mettre à jour
    });

    await loadConfig(); // Recharge la configuration pour synchronisation
  } catch (error) {
    console.error('Erreur lors de la mise à jour de nodeConfig:', error.message);
    throw error;
  }
};

// Charge la configuration au démarrage du module


// Fonction pour créer un objet nœud,pour la bib nvl (https://neo4j.com/docs/api/nvl/current/interfaces/_neo4j_nvl_base.Node.html)
export const createNode = (
  id, // Identifiant du nœud
  nodeType, // Type de nœud
  properties, // Propriétés du nœud
  isSelected = false, // Indicateur si le nœud est sélectionné
  aggregatedproperties = null, // Propriétés agrégées
  ischema = false // Indicateur si c'est un schéma
) => {
  const nodeSize = NODE_CONFIG.nodeTypes[nodeType]?.size || NODE_CONFIG.defaultNodeSize; // Taille du nœud
  const node = {
    id: id.toString(), // ID converti en chaîne
    group: nodeType, // Type de nœud
    shape: 'circularImage', // Forme du nœud
    size: nodeSize, // Taille du nœud
    color: getNodeColor(nodeType), // Couleur du nœud
    html: createNodeHtml(
      LabelManager(nodeType, properties), // Texte de l'étiquette
      nodeType, // Type de nœud
      isSelected, // État sélectionné
      false, // Pas dans un chemin
      id.toString(), // ID
      nodeSize // Taille
    ),
    ischema: ischema, // Indicateur de schéma
    selecte: isSelected, // État sélectionné
    captionnode: ischema ? LabelManagerSchema(nodeType, properties) : LabelManager(nodeType, properties), // Étiquette du nœud
    aggregatedproperties, // Propriétés agrégées
    properties, // Propriétés du nœud
    image: getNodeIcon(nodeType), // Icône du nœud
  };

  if (properties._class) {
    node._class = properties._class; // Ajoute la classe si présente
  }
  if (properties._betweennessCentrality) {
    node._betweennessCentrality = properties._betweennessCentrality; // Ajoute la centralité si présente
  }

  return node; // Retourne l'objet nœud
};

// Fonction pour créer un objet relation pour la bib nvl(https://neo4j.com/docs/api/nvl/current/interfaces/_neo4j_nvl_base.Relationship.html)
export const createEdge = (rel, startId, endId, color = null, aggregationPath = null) => ({
  id: rel.id ? rel.id.toString() : `${startId}-${endId}`, // ID de la relation
  from: startId.toString(), // ID du nœud de départ
  to: endId.toString(), // ID du nœud d'arrivée
  properties: rel.properties ? rel.properties : 'empty', // Propriétés de la relation
  color: color || NODE_CONFIG.edgeColor || 'red', // Couleur de la relation
  width: NODE_CONFIG.edgeWidth || 7, // Largeur de la relation
  captionSize: NODE_CONFIG.captionSize || 5, // Taille de l'étiquette
  captionAlign: 'center', // Alignement de l'étiquette
  aggregationPath: aggregationPath, // Chemin d'agrégation
  captions: [
    {
      value: rel.type, // Type de relation
      styles: ['bold', 'italic'], // Styles de l'étiquette
      key: rel.type, // Clé de l'étiquette
    },
  ],
  group: rel.type, // Type de relation
});

// Fonction pour créer le HTML d'un nœud nvl supprot le style via la creation d'un elemnt html liee au node
export const createNodeHtml = (
  captionText, // Texte de l'étiquette
  nodetype, // Type de nœud
  isSelected = false, // État sélectionné
  isinpath = false, // Indicateur si dans un chemin
  groupCount = 1, // Nombre de groupes
  id, // ID du nœud
  AddIcon = false, // Ajouter un icône
  Icon = "", // Icône à ajouter
  node_size = 90 // Taille du nœud
) => {
  const nodeconfig = calculateNodeConfig(node_size); // Configuration calculée
  const container = document.createElement("div"); // Conteneur principal
  container.style.position = "relative";
  container.style.display = "inline-block";
  container.style.width =
    groupCount > 1 ? NODE_CONFIG.groupNodeWidth : NODE_CONFIG.defaultNodeWidth; // Largeur du conteneur
  container.style.height =
    groupCount > 1 ? NODE_CONFIG.groupNodeHeight : NODE_CONFIG.defaultNodeHeight; // Hauteur du conteneur
  container.style.textAlign = "center";

  const centerWrapper = document.createElement("div"); // Conteneur central
  centerWrapper.style.position = "absolute";
  centerWrapper.style.top = "50%";
  centerWrapper.style.left = "50%";
  centerWrapper.style.transform = "translate(-50%, -50%)";
  centerWrapper.style.width =
    groupCount > 1
      ? NODE_CONFIG.groupCenterWrapperWidth
      : NODE_CONFIG.centerWrapperWidth; // Largeur du conteneur central
  centerWrapper.style.height =
    groupCount > 1
      ? NODE_CONFIG.groupCenterWrapperHeight
      : NODE_CONFIG.centerWrapperHeight; // Hauteur du conteneur central

  const border = document.createElement("div"); // Bordure du nœud
  border.style.position = "absolute";
  border.style.top = nodeconfig.borderTop;
  border.style.left = nodeconfig.borderLeft;
  border.style.transform = "translate(-50%, -50%)";
  border.style.width =
    groupCount > 1 ? NODE_CONFIG.groupNodeWidth : nodeconfig.Nodewidth; // Largeur de la bordure
  border.style.height =
    groupCount > 1 ? NODE_CONFIG.groupNodeHeight : nodeconfig.Nodehight; // Hauteur de la bordure
  border.style.borderRadius = "50%";
  border.style.transition = "all 0.3s ease";

  if (isSelected) {
    border.style.backgroundColor = "rgba(255, 255, 0, 0.05)"; // Fond si sélectionné
  } else if (groupCount > 1) {
    border.style.border = "3px dashed rgba(0, 128, 255, 0.8)"; // Bordure pour groupe
    border.style.backgroundColor = "rgba(0, 128, 255, 0.1)";
  }

  if (isinpath) {
    border.style.boxShadow = "0 0 20px 8px rgba(59, 173, 46, 0.7)"; // Ombre si dans un chemin
    border.style.border = "8px solid rgba(111, 213, 48, 0.9)";
    border.style.backgroundColor = "rgba(255, 255, 0, 0.05)";
  }

  const iconElement = document.createElement("img"); // Élément icône
  iconElement.src = getNodeIcon(nodetype); // Source de l'icône
  iconElement.style.position = "absolute";
  iconElement.style.top = nodeconfig.iconTop;
  iconElement.style.left = nodeconfig.iconLeft;
  iconElement.style.transform = "translate(-50%, -50%)";
  iconElement.style.width =
    groupCount > 1
      ? NODE_CONFIG.groupImageWidth
      : nodeconfig.defaultImageWidth; // Largeur de l'icône
  iconElement.style.height =
    groupCount > 1
      ? NODE_CONFIG.groupImageHeight
      : nodeconfig.defaultImageHeight; // Hauteur de l'icône
  iconElement.style.zIndex = "2";
  iconElement.style.transition = "all 0.3s ease";

  const captionElement = document.createElement("div"); // Élément d'étiquette
  captionElement.innerText = captionText; // Texte de l'étiquette
  captionElement.style.position = "absolute";
  captionElement.style.width = "300px"; // Largeur pour étiquettes
  captionElement.style.height = "auto"; // Hauteur auto
  captionElement.style.lineHeight = "1.4"; // Espacement des lignes
  captionElement.style.left = nodeconfig.captionLeft;
  captionElement.style.top = nodeconfig.captionTop;
  captionElement.style.transform = "translateX(-50%)";
  captionElement.style.fontSize = groupCount > 1 ? "24px" : "30px"; // Taille de police
  captionElement.style.fontWeight = "bold";
  captionElement.style.color = "rgba(23, 22, 22, 0.8)";
  captionElement.style.borderRadius = "6px";
  captionElement.style.textAlign = "center";
  captionElement.style.transition = "all 0.3s ease";
  captionElement.style.padding = "4px 8px"; // Marge intérieure

  if (isSelected) {
    captionElement.style.backgroundColor = "rgba(69, 36, 157, 0.7)"; // Fond si sélectionné
    captionElement.style.boxShadow = "0 2px 4px rgba(152, 115, 52, 0.1)";
    captionElement.style.color = "rgba(255, 255, 255, 0.9)";
  } else if (groupCount > 1) {
    captionElement.style.color = "rgba(0, 128, 255, 0.9)"; // Couleur pour groupe
  }
  if (isinpath) {
    captionElement.style.backgroundColor = "rgba(94, 208, 56, 0.7)"; // Fond si dans un chemin
    captionElement.style.boxShadow = "0 2px 4px rgba(84, 195, 53, 0.1)";
    captionElement.style.color = "rgba(255, 255, 255, 0.9)";
  }

  if (AddIcon) {
    const crownIcon = document.createElement("div"); // Icône supplémentaire
    crownIcon.innerText = Icon; // Texte de l'icône
    crownIcon.style.position = "absolute";
    crownIcon.style.top = "-30px";
    crownIcon.style.left = "80%";
    crownIcon.style.transform = "translateX(-50%)";
    crownIcon.style.fontSize = "32px";
    crownIcon.style.zIndex = "35";
    container.appendChild(crownIcon); // Ajoute l'icône au conteneur
  }

  centerWrapper.appendChild(border); // Ajoute la bordure
  centerWrapper.appendChild(iconElement); // Ajoute l'icône
  container.appendChild(centerWrapper); // Ajoute le conteneur central
  container.appendChild(captionElement); // Ajoute l'étiquette

  return container; // Retourne le conteneur HTML
};

// Fonction pour parser les résultats de plusieur module  qui utilise dans le backend la function(parse_to_graph_with_transformer)
export const parsergraph = (searchResult) => {
  const nodes = searchResult.nodes.map((node) =>
    createNode(
      node.id, // ID du nœud
      node.nodeType, // Type de nœud
      node.properties, // Propriétés
      false, // Non sélectionné
      null, // Pas de propriétés agrégées
      false // Pas un schéma
    )
  );
  const edges = searchResult.edges.map((edge) =>
    createEdge(
      { id: edge.id, type: edge.type, properties: edge.properties }, // Relation
      edge.startNode, // Nœud de départ
      edge.endNode, // Nœud d'arrivée
      NODE_CONFIG.edgeColor || 'red' // Couleur ou valeur par défaut
    )
  );
  return { nodes, edges }; // Retourne les nœuds et relations
};

// Fonction pour parser un sous-graphe(affaire, node et ces relation) de la reponse de contextualisation
export const parseSubGraph_affaire = (subGraph) => {
  const nodes = []; // Liste des nœuds
  const edges = []; // Liste des relations

  const affaire = subGraph.affaire; // Données de l'affaire
  if (affaire && affaire.id !== null && affaire.id !== undefined) {
    nodes.push(createNode(affaire.id, 'Affaire', affaire.properties)); // Ajoute le nœud affaire
  }

  if (subGraph.nodes && Array.isArray(subGraph.nodes)) {
    subGraph.nodes.forEach((node) => {
      if (node.properties && node.id !== null && node.id !== undefined) {
        nodes.push(createNode(node.id, node.node_type, node.properties)); // Ajoute les nœuds
      }
    });
  }

  if (subGraph.relations && Array.isArray(subGraph.relations)) {
    subGraph.relations.forEach((relation) => {
      if (
        relation.startId !== null &&
        relation.startId !== undefined &&
        relation.endId !== null &&
        relation.endId !== undefined
      ) {
        edges.push(createEdge({ id: relation.id, type: relation.type }, relation.startId, relation.endId)); // Ajoute les relations
      }
    });
  }

  return { nodes, edges }; // Retourne les nœuds et relations
};

// Fonction pour parser un chemin de la module de detectionde chemin
export const parsePath = (path, selectedNodes) => {
  const selectedNodeIds = selectedNodes; // Nœuds sélectionnés

  const formattedNodes = path.nodes.map((node) => {
    const isSelected = selectedNodeIds.has(node.id.toString()); // Vérifie si sélectionné
    return createNode(node.id, node.type, node.properties, isSelected); // Crée le nœud
  });
  const formattedEdges = path.relationships.map((rel) =>
    createEdge({ id: rel.id, type: rel.type }, rel.source, rel.target) // Crée la relation
  );
  return { nodes: formattedNodes, edges: formattedEdges }; // Retourne les nœuds et relations
};

// Fonction pour parser une réponse  de module d'agrégation
export const parseAggregationResponse = (responseData) => {
  const { nodes: newNodes, relationships: newEdges } = responseData; // Données de la réponse
  const parsedNodes = newNodes.map((node) =>
    createNode(node.id, node.type, node.properties, false) // Crée les nœuds
  );
  const parsedEdges = newEdges.map((rel) => createEdge(rel, rel.startId, rel.endId)); // Crée les relations
  return { nodes: parsedNodes, edges: parsedEdges }; // Retourne les nœuds et relations
};

// Fonction pour parser les sous graphe de la module de cpntextualisation
export const ContextualizationGraphParser = (subGraphs) => {
  const nodes = []; // Liste des nœuds
  const edges = []; // Liste des relations

  if (!subGraphs || !Array.isArray(subGraphs)) {
    console.error('Données subGraphs invalides:', subGraphs);
    return { nodes, edges }; // Retourne vide si invalide
  }

  subGraphs.forEach((subGraph) => {
    const { nodes: parsedNodes, edges: parsedEdges } = parseSubGraph_affaire(subGraph); // Parse chaque sous-graphe
    nodes.push(...parsedNodes); // Ajoute les nœuds
    edges.push(...parsedEdges); // Ajoute les relations
  });

  return { nodes, edges }; // Retourne les nœuds et relations
};

// Fonction pour calculer la configuration d'un nœud selon le styel par deafut, pour ajouter la postionement des element html liee au node
export const calculateNodeConfig = (node_size) => {
  if (typeof node_size !== 'number' || node_size < 0) {
    throw new Error('node_size doit être un nombre positif'); // Vérifie la taille
  }

  const borderOffset = (node_size - 70) * (13 / 20) + 30; // Calcul de l'offset de la bordure
  const iconOffset = (node_size - 70) * (13 / 20) + 33; // Calcul de l'offset de l'icône
  const baseSize = node_size === 90 ? 200 : node_size === 120 ? 250 : (node_size / 90) * 200; // Taille de base

  return {
    borderTop: `${borderOffset}%`, // Position verticale de la bordure
    borderLeft: `${borderOffset}%`, // Position horizontale de la bordure
    iconTop: `${iconOffset}%`, // Position verticale de l'icône
    iconLeft: `${iconOffset}%`, // Position horizontale de l'icône
    Nodewidth: `${baseSize}px`, // Largeur du nœud
    Nodehight: `${baseSize}px`, // Hauteur du nœud
    captionTop: `${node_size}%`, // Position verticale de l'étiquette
    captionLeft: `${node_size / 2 - 2}%`, // Position horizontale de l'étiquette
    defaultImageWidth: `${node_size}px`, // Largeur de l'image
    defaultImageHeight: `${node_size}px`, // Hauteur de l'image
  };
};

// Fonction pour obtenir la couleur d'un type de nœud
export const getNodeColor = (nodeType) =>
  NODE_CONFIG.nodeTypes[nodeType]?.color || NODE_CONFIG.nodeTypes.default.color; // Retourne la couleur ou valeur par défaut

// Fonction pour obtenir l'icône d'un type de nœud
export const getNodeIcon = (nodeType) =>
  NODE_CONFIG.nodeTypes[nodeType]?.icon || NODE_CONFIG.nodeTypes.default.icon; // Retourne l'icône ou valeur par défaut

// Fonction pour gérer l'étiquette d'un type de nœud qui sorant afficher dans le node leur de l'analyse
export const LabelManager = (node_type, properties) => {
  const labelKey = NODE_CONFIG.nodeTypes[node_type]?.labelKey || NODE_CONFIG.nodeTypes.default.labelKey; // Clé d'étiquette
  if (!labelKey) {
    const fallback = `Type inconnu\nID: ${properties.identity || 'N/A'}`; // Étiquette par défaut
    return fallback;
  }

  const iconMap = {
    incoming_links: '⬅', // Icône pour liens entrants
    outgoing_links: '➡' // Icône pour liens sortants
  };

  if (labelKey.includes(',')) {
    const keys = labelKey.split(','); // Sépare les clés
    const result = keys
      .map((key) => {
        if (properties[key] !== undefined && properties[key] !== null) {
          const displayKey = iconMap[key] || key; // Applique l'icône si définie
          return `${displayKey}: ${properties[key]}`; // Format clé:valeur
        }
        return '';
      })
      .filter((item) => item !== '')
      .join('\n'); // Joint avec des sauts de ligne
    return result;
  }

  const displayKey = iconMap[labelKey] || labelKey; // Applique l'icône ou la clé
  const result =
    properties[labelKey] !== undefined && properties[labelKey] !== null
      ? `${displayKey}: ${properties[labelKey]}` // Format clé:valeur
      : `Inconnu ${node_type}`; // Étiquette par défaut
  return result;
};

// Fonction pour gérer l'étiquette d'un type de nœud de schema qui sorant afficher dans le node leur de l'analyse
export const LabelManagerSchema = (node_type, properties = null) => {
  const labelKey = NODE_CONFIG.nodeTypes[node_type]?.labelKey || NODE_CONFIG.nodeTypes.default.labelKey; // Clé d'étiquette
  if (!labelKey) {
    const fallback = `${node_type}\nType inconnu`; // Étiquette par défaut
    return fallback;
  }

  const iconMap = {
    incoming_links: '⬅NB entrant', // Icône pour liens entrants
    outgoing_links: '➡NB sortant' // Icône pour liens sortants
  };

  if (labelKey.includes(',')) {
    const keys = labelKey.split(','); // Sépare les clés
    const result = [
      node_type, // Ajoute le type de nœud
      ...keys
        .map((key) => {
          const displayKey = iconMap[key] || key; // Applique l'icône si définie
          return displayKey;
        })
        .filter((item) => item !== '')
    ].join('\n'); // Joint avec des sauts de ligne
    return result;
  }

  const displayKey = iconMap[labelKey] || labelKey; // Applique l'icône ou la clé
  const result = `${node_type}\n${displayKey}`; // Format type et clé
  return result;
};

// Exporte la configuration pour accès direct
export { NODE_CONFIG };