// Objet pour gérer l'état global de la fenêtre de visualisation
/// comme la fenêtre ,d'ajoute des action, fenter d'analyse statistique des attribtu,....
const globalWindowState = {
  activeWindow: null, // Type de fenêtre active (ex. 'PersonProfile')
  windowData: null,   // Données à passer à la fenêtre (ex. objet nœud)

  // Fonction pour définir une fenêtre active et ses données
  setWindow: (windowType, data) => {
    globalWindowState.activeWindow = windowType; // Définit le type de fenêtre
    globalWindowState.windowData = data;         // Stocke les données de la fenêtre
    // Déclenche un re-rendu si nécessaire (utilisé avec un état React dans le composant)
  },

  // Fonction pour réinitialiser la fenêtre active et ses données
  clearWindow: () => {
    globalWindowState.activeWindow = null; // Réinitialise le type de fenêtre
    globalWindowState.windowData = null;   // Réinitialise les données
  },
};

export default globalWindowState; // Exporte l'objet pour utilisation ailleurs