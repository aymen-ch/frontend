import { handleAggregation, getIntermediateTypes } from './aggregationUtils';
import { useTranslation } from 'react-i18next';

// ***
// Ce composant est responsable de la gestion des agrégations.
// Il prend en entrée les virtualRelations et génère une liste de cases à cocher (toggles).
// Lorsqu'une agrégation est activée/désactivée, il appelle handleAggregation pour effectuer l'agrégation
// ou met à jour les nœuds et arêtes pour refléter les changements (par exemple, masquer/démasquer).
// ***

const Aggregation = ({
  setEdges, // Fonction pour mettre à jour les arêtes
  setNodes, // Fonction pour mettre à jour les nœuds
  nodes, // Liste actuelle des nœuds
  activeAggregations, // État des agrégations actives (objet avec relationName: boolean)
  setActiveAggregations, // Fonction pour mettre à jour les agrégations actives
  virtualRelations // Liste des relations virtuelles
}) => {
  // Hook pour gérer les traductions
  const { t } = useTranslation();

  // Extrait le chemin d'agrégation à partir des virtualRelations en fonction du nom de la relation
  const getAggregationPath = (relationName) => {
    const relation = virtualRelations.find((rel) => rel.name === relationName);
    return relation ? relation.path : null;
  };

  // Déclenche l'agrégation pour une relation donnée
  const handleTypeFilterChange = async (relationName) => {
    // Récupère le chemin d'agrégation pour la relation
    const aggregationPath = getAggregationPath(relationName);
    if (aggregationPath) {
      // Appelle handleAggregation pour effectuer l'agrégation
      await handleAggregation(
        aggregationPath, // Chemin d'agrégation
        relationName, // Type d'agrégation (utilise relationName)
        setNodes,
        setEdges,
        nodes,
        setActiveAggregations
      );
    }
  };

  // Gère l'activation/désactivation d'une agrégation (masque/démasque nœuds et arêtes)
  const toggleAggregation = (relationName) => {
    if (activeAggregations[relationName]) {
      // Si l'agrégation est active, désactive-la
      setEdges((prevEdges) => {
        // Supprime les arêtes associées à cette agrégation
        const filteredEdges = prevEdges.filter((edge) => edge.aggregationType !== relationName);
        // Met à jour l'état hidden des arêtes restantes
        return filteredEdges.map((edge) => {
          const fromNode = nodes.find((node) => node.id === edge.from);
          const toNode = nodes.find((node) => node.id === edge.to);
          // Vérifie si l'arête doit être masquée par une autre agrégation active
          const isHiddenByOtherAggregation = Object.keys(activeAggregations)
            .filter((t) => t !== relationName && activeAggregations[t])
            .some((t) => {
              const path = getAggregationPath(t);
              const intermediateTypes = getIntermediateTypes(path || []);
              return (
                intermediateTypes.includes(fromNode?.group) ||
                intermediateTypes.includes(toNode?.group)
              );
            });
          return { ...edge, hidden: isHiddenByOtherAggregation };
        });
      });

      setNodes((prevNodes) => {
        // Supprime les nœuds associés à cette agrégation et met à jour l'état hidden
        return prevNodes
          .map((node) => {
            if (node.aggregationType === relationName) return null; // Supprime les nœuds agrégés
            // Vérifie si le nœud doit être masqué par une autre agrégation active
            const isHiddenByOtherAggregation = Object.keys(activeAggregations)
              .filter((t) => t !== relationName && activeAggregations[t])
              .some((t) => {
                const path = getAggregationPath(t);
                const intermediateTypes = getIntermediateTypes(path || []);
                return intermediateTypes.includes(node.group);
              });
            return { ...node, hidden: isHiddenByOtherAggregation };
          })
          .filter((node) => node !== null); // Exclut les nœuds supprimés
      });

      // Désactive l'agrégation
      setActiveAggregations((prev) => ({ ...prev, [relationName]: false }));
    } else {
      // Si l'agrégation est inactive, active-la
      handleTypeFilterChange(relationName);
    }
  };

  // Affiche le chemin d'agrégation dans l'interface utilisateur
  const renderAggregationPath = (relation) => {
    const { name, path } = relation;
    if (!path || path.length < 1) return null;

    // Extrait le nœud de départ et d'arrivée du chemin
    const startNode = path[0];
    const endNode = path[path.length - 1];

    return (
      <div
        className="aggregation-path mt-1"
        style={{
          whiteSpace: 'nowrap',
          fontSize: '12px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {/* Affiche le chemin sous la forme "startNode-name-endNode" */}
        <span>{startNode}-{name}-{endNode}</span>
      </div>
    );
  };

  return (
    // Conteneur principal pour le composant d'agrégation
    <div className="container-fluid p-3 bg-white shadow-sm rounded-lg">
      {/* Titre du composant, traduit */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('aggregation.title')}</h3>

      {/* Liste des cases à cocher pour chaque relation virtuelle */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {virtualRelations.map((relation) => (
          <div key={relation.name} className="form-check form-switch" style={{ minWidth: '150px' }}>
            {/* Case à cocher pour activer/désactiver l'agrégation */}
            <input
              type="checkbox"
              className="form-check-input"
              role="switch"
              checked={!!activeAggregations[relation.name]}
              onChange={() => toggleAggregation(relation.name)}
              id={`switch-${relation.name}`}
            />
            {/* Étiquette de la case à cocher */}
            <label className="form-check-label" htmlFor={`switch-${relation.name}`}>
              {relation.name}
            </label>
            <br />
            {/* Affiche le chemin d'agrégation traduit */}
            {t('aggregation.result')}: {renderAggregationPath(relation)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Aggregation;