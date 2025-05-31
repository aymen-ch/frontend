
import { handleAggregation, getIntermediateTypes } from './aggregationUtils';
import { useTranslation } from 'react-i18next';

////***
// This Componet responsible for Aggregation 
// it will take virtualRelations   use generate list of Toggoles (check box)
// when you check on ageregation it will call handleAggregation
// 
// 
// 
// 
//  */

const Aggregation = ({
  setEdges,
  setNodes,
  nodes,
  activeAggregations,
  setActiveAggregations,
  virtualRelations
}) => {

  const { t } = useTranslation();



  //Extract aggregation path form virtualRelations
  const getAggregationPath = (relationName) => {
    const relation = virtualRelations.find((rel) => rel.name === relationName);
    return relation ? relation.path : null;
  };

  //Do the Agregation 
  const handleTypeFilterChange = async (relationName) => {
    const aggregationPath = getAggregationPath(relationName);
    if (aggregationPath) {
      await handleAggregation(relationName, aggregationPath, relationName, setNodes, setEdges, nodes, setActiveAggregations);
    }
  };


  ///This is where nodes and edges of virtual path are being hidden (The Aggregation it self)
  const toggleAggregation = (relationName) => {
    if (activeAggregations[relationName]) {
      setEdges((prevEdges) => {
        const filteredEdges = prevEdges.filter((edge) => edge.aggregationType !== relationName);
        return filteredEdges.map((edge) => {
          const fromNode = nodes.find((node) => node.id === edge.from);
          const toNode = nodes.find((node) => node.id === edge.to);
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
        return prevNodes
          .map((node) => {
            if (node.aggregationType === relationName) return null;
            const isHiddenByOtherAggregation = Object.keys(activeAggregations)
              .filter((t) => t !== relationName && activeAggregations[t])
              .some((t) => {
                const path = getAggregationPath(t);
                const intermediateTypes = getIntermediateTypes(path || []);
                return intermediateTypes.includes(node.group);
              });
            return { ...node, hidden: isHiddenByOtherAggregation };
          })
          .filter((node) => node !== null);
      });

      setActiveAggregations((prev) => ({ ...prev, [relationName]: false }));
    } else {
      handleTypeFilterChange(relationName);
    }
  };


  /// This for printing the agreagtion path in the UI
  const renderAggregationPath = (relation) => {
    const { name, path } = relation;
    if (!path || path.length < 1) return null;

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
        <span>{startNode}-{name}-{endNode}</span>
      </div>
    );
  };

  return (
    <div className="container-fluid p-3 bg-white shadow-sm rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('aggregation.title')}</h3>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {virtualRelations.map((relation) => (
          <div key={relation.name} className="form-check form-switch" style={{ minWidth: '150px' }}>
            <input
              type="checkbox"
              className="form-check-input"
              role="switch"
              checked={!!activeAggregations[relation.name]}
              onChange={() => toggleAggregation(relation.name)}
              id={`switch-${relation.name}`}
            />
            <label className="form-check-label" htmlFor={`switch-${relation.name}`}>
              {relation.name}
            </label>
            <br />
            {t('aggregation.result')}: {renderAggregationPath(relation)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Aggregation;