import { BASE_URL_Backend } from "../../../Platforme/Urls";
import { parseAggregationResponse } from "../../Parser";
import axios from "axios";
export const getIntermediateTypes = (aggregationPath) => {
  const intermediateTypes = [];
  for (let i = 2; i < aggregationPath.length - 2; i += 2) {
    intermediateTypes.push(aggregationPath[i]);
  }
  return intermediateTypes;
};



export const handleAggregation = async (
relationName = "apple_telephone",
type,
aggregationType,
setNodes,
setEdges,
nodes,
setActiveAggregations
) => {

 
const nodeIds = nodes
  .filter((node) => type.includes(node.group))
  .map((node) => parseInt(node.id, 10));
  console.log("aggregation handled!!!!",nodeIds)
try {
  const token = localStorage.getItem('authToken');
  const response = await axios.post(BASE_URL_Backend + '/agregate/', {
    node_ids: nodeIds,
    aggregation_type: [type],
    type: relationName
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { nodes: parsedNodes, edges: parsedEdges } = parseAggregationResponse(response.data);
    const updatedEdges = parsedEdges.map(edge => ({
      ...edge,
      aggregationType: aggregationType,
      aggregationpath: type
    }));

    const updatedNodes = parsedNodes.map(node => ({
      ...node,
      aggregationType: aggregationType,
      aggregationpath: type
    }));

    const intermediateTypes = getIntermediateTypes(type);
    console.log("inter", intermediateTypes);

    // Check if path length is 3
    const isSimpleRelation = type.length === 3;

    if (isSimpleRelation) {
      // For length 3, hide only edges of the specified relation type
      const relationType = type[1]; // e.g., "call"
      console.log("ibrahim",relationType)
      setEdges((prevEdges) => {
        const combinedEdges = [...prevEdges, ...updatedEdges];
        return combinedEdges.map((edge) => ({
          ...edge,
          hidden: edge.group === relationType || edge.hidden // Hide only edges matching relationType
        }));
      });
    } else {
      // For paths longer than 3, use original logic
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          hidden: intermediateTypes.includes(node.group) || node.hidden,
        }))
      );

      setEdges((prevEdges) => {
        const combinedEdges = [...prevEdges, ...updatedEdges];
        const edgesWithHiddenState = combinedEdges.map((edge) => {
          const isFromHidden = nodes.some(
            (node) => node.id === edge.from && intermediateTypes.includes(node.group)
          );
          const isToHidden = nodes.some(
            (node) => node.id === edge.to && intermediateTypes.includes(node.group)
          );
          return {
            ...edge,
            hidden: isFromHidden || isToHidden || edge.hidden,
          };
        });
        return edgesWithHiddenState;
      });
    }

    // Add new nodes regardless of path length
    setNodes((prevNodes) => [...prevNodes, ...updatedNodes]);
    setActiveAggregations((prev) => ({ ...prev, [aggregationType]: true }));
  } else {
    console.error('Aggregation failed.');
  }
} catch (error) {
  console.error('Error during aggregation:', error);
}
};
