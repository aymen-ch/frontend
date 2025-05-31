import React, { useEffect ,useState} from 'react';
import axios from 'axios';
import { BASE_URL_Backend } from '../../../Platforme/Urls';
// Composant pour la zone de saisie du chat et les options associées
const ChatInput = ({
  inputText, // Texte actuel dans la zone de saisie
  setInputText, // Fonction pour mettre à jour le texte de saisie
  responseType, // Type de réponse sélectionné (Graphique, Tableau)
  setResponseType, // Fonction pour mettre à jour le type de réponse
  isLoading, // Indicateur si une requête est en cours
  handleSendMessage, // Fonction à appeler pour envoyer le message
  selectedModel, // Modèle d'IA actuellement sélectionné
  setSelectedModel, // Fonction pour mettre à jour le modèle sélectionné
}) => {

  // État pour stocker les options de modèles d'IA disponibles
  const [modelOptions, setModelOptions] = useState([]);

  // Effet pour charger les modèles d'IA disponibles au montage du composant
  useEffect(() => {
    // Fonction asynchrone pour récupérer les modèles depuis le backend
    const fetchModels = async () => {
      try {
        // Appel API pour obtenir la liste des modèles Ollama
        const response = await axios.post(BASE_URL_Backend + '/getollamamodeles/');
        // Récupération des données des modèles
        const models = response.data;
        // Formatage des modèles pour les options du select
        const options = models.map(model => ({
          value: model.name, // Valeur de l'option (nom du modèle)
          label: model.name  // Texte affiché de l'option (nom du modèle)
        }));
        // Mise à jour de l'état avec les options formatées
        setModelOptions(options);
      } catch (error) {
        // Gestion des erreurs lors de la récupération des modèles
        console.error('Échec de la récupération des modèles:', error);
      }
    };
    // Appel de la fonction pour récupérer les modèles
    fetchModels();
  }, []); // Le tableau vide indique que cet effet ne s'exécute qu'une fois au montage

  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow-chat">
      <textarea
        className="w-full p-2.5 rounded-md border border-gray-300 text-sm resize-none min-h-[60px] leading-relaxed disabled:bg-gray-200 disabled:cursor-not-allowed focus:border-chat-blue focus:outline-none"
        placeholder="Tapez un message..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        disabled={isLoading}
        rows="3"
      />

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-sm text-gray-600">Vue :</label>
          <select
            className="p-1 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-200 disabled:cursor-not-allowed focus:border-chat-blue focus:outline-none"
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            disabled={isLoading}
          >
            <option value="Graph">Graphique</option>
            <option value="Table">Tableau</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-sm text-gray-600">Modèle:</label>
          <select
            className="p-1 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-200 disabled:cursor-not-allowed focus:border-chat-blue focus:outline-none"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading}
          >
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className="bg-chat-blue text-white px-3.5 py-2 rounded-md font-medium hover:bg-chat-blue-hover disabled:bg-chat-disabled disabled:cursor-not-allowed transition-colors"
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default ChatInput;