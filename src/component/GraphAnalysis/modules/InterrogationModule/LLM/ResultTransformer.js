// src/utils/GraphConverter.js
import neo4j from 'neo4j-driver'; // Import neo4j to use isPath
import { createNode,createEdge } from '../../Parser';

export const convertNeo4jToGraph = (records) => {
  const newNodes = [];
  const newEdges = [];

  records.forEach(record => {
    record._fields.forEach(field => {
      if (neo4j.isPath(field)) {
        // Handle a path (sequence of nodes and relationships)
        console.log("true")
        const { segments } = field;
        console.log(segments)
        segments.forEach(segment => {
          const { start, relationship, end } = segment;

          // Add start node
          newNodes.push(createNode(start.identity, start.labels[0], start.properties, false));
          // Add end node
          newNodes.push(createNode(end.identity, end.labels[0], end.properties, false));

          // Add relationship as an edge
          newEdges.push(createEdge(relationship, start.identity, end.identity));
        });
      } else if ('labels' in field) {
        console.log(field)
        // Handle individual node
        newNodes.push(createNode(field.identity, field.labels[0], field.properties, false));
      } else if ('type' in field) {
        // Handle individual relationship
        newEdges.push(createEdge(field, field.start, field.end));
      }
    });
  });

  // Remove duplicates (optional, if your graph library doesn't handle duplicates)
  const uniqueNodes = Array.from(new Map(newNodes.map(node => [node.id, node])).values());
  const uniqueEdges = Array.from(new Map(newEdges.map(edge => [edge.id, edge])).values());

  return { nodes: uniqueNodes, edges: uniqueEdges };
};


// src/utils/TabularConverter.js
export const convertNeo4jToTable = (records) => {
    if (!records || records.length === 0) {
      return { columns: [], rows: [] };
    }
  
    // Extract column names from the keys of the first record
    const columns = records[0].keys.map(key => ({
      key,
      label: key, // You can customize this if you want translated labels
    }));
  
    // Convert records to rows
    const rows = records.map(record => {
      const row = {};
      record.keys.forEach(key => {
        const value = record.get(key);
        // Handle Neo4j-specific types if needed (e.g., integers, nulls)
        row[key] = value !== null && value !== undefined ? value.toString() : '';
      });
      return row;
    });
  
    return { columns, rows };
  };