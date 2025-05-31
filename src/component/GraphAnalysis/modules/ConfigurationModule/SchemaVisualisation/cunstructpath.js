
///cette function permet de verify et de cree un chemin virtuelle enter deux nodes(selectedNodes) , et ensmble des relation(selectedRelationships)
export const constructPath = (selectedNodes, selectedRelationships, allNodes, allEdges) => {
    // If there's no start node or no relationships, return an error
    if (!selectedNodes.size || !selectedRelationships.size) {
        return 'Incomplete selection';
    }

    // Assume the first selected node ID is the start node
    const startNodeId = Array.from(selectedNodes)[0];
    const startNode = allNodes.find(n => n.id === startNodeId);
    if (!startNode) {
        return 'Start node not found';
    }
    let path = [startNode.group]; // Start with the node's type (e.g., "Unite")
    let currentNodeId = startNodeId;
    const usedRelationships = new Set();
    
    // For the case where start and end are both specified
    const endNodeId = selectedNodes.size > 1 ? Array.from(selectedNodes)[1] : startNodeId;
    const endNode = allNodes.find(n => n.id === endNodeId);
    if (!endNode) {
        return 'End node not found';
    }
    
    // Build the path
    let foundPath = false;
    let iterations = 0;
    const maxIterations = selectedRelationships.size * 2; // Prevent infinite loops

    while (iterations < maxIterations && !foundPath) {
        iterations++;
        
        // Find all relationships connected to the current node that haven't been used
        const possibleRelationships = Array.from(selectedRelationships)
            .map(relId => allEdges.find(edge => edge.id === relId))
            .filter(rel => rel && (rel.from === currentNodeId || rel.to === currentNodeId) && !usedRelationships.has(rel.id));
        
        if (possibleRelationships.length === 0) {
            break; // No more connections
        }
        
        // Sort relationships to prefer those that connect to the end node directly
        possibleRelationships.sort((a, b) => {
            const aConnectsToEnd = (a.from === endNodeId || a.to === endNodeId);
            const bConnectsToEnd = (b.from === endNodeId || b.to === endNodeId);
            return bConnectsToEnd - aConnectsToEnd;
        });
        
        // Use the best available relationship
        const nextRel = possibleRelationships[0];
        usedRelationships.add(nextRel.id);
        
        // Determine the next node
        const nextNodeId = nextRel.from === currentNodeId ? nextRel.to : nextRel.from;
        
        // Find the next node in allNodes
        const nextNode = allNodes.find(node => node.id === nextNodeId);
        if (!nextNode) {
            continue; // Skip if the connected node isn't found
        }
        
        // Add the relationship type (using group, then label, then type, then default to 'relation')
        const relType = nextRel.group || nextRel.label || nextRel.type || 'relation';
        path.push(relType);
        
        // Add the next node type to the path
        path.push(nextNode.group);
        
        // Update current node
        currentNodeId = nextNodeId;
        
        // Check if we've reached the end node
        if (currentNodeId === endNodeId) {
            foundPath = true;
        }
    }

    // Validate the path ends at the endNode
    if (foundPath) {
        return path;
    } else {
        // Try to find an indirect path through other nodes
        if (selectedNodes.size === 2) {
            const node1Id = Array.from(selectedNodes)[0];
            const node2Id = Array.from(selectedNodes)[1];
            const node1 = allNodes.find(n => n.id === node1Id);
            const node2 = allNodes.find(n => n.id === node2Id);
            
            if (!node1 || !node2) {
                return 'One or both nodes not found';
            }
            
            // Check connections for both nodes
            const node1Connections = Array.from(selectedRelationships)
                .map(relId => allEdges.find(edge => edge.id === relId))
                .filter(rel => rel && (rel.from === node1Id || rel.to === node1Id));
            
            const node2Connections = Array.from(selectedRelationships)
                .map(relId => allEdges.find(edge => edge.id === relId))
                .filter(rel => rel && (rel.from === node2Id || rel.to === node2Id));
            
            // Find intermediate nodes that connect to both
            const intermediateNodes = new Set();
            node1Connections.forEach(rel => {
                const otherNodeId = rel.from === node1Id ? rel.to : rel.from;
                if (node2Connections.some(r => r.from === otherNodeId || r.to === otherNodeId)) {
                    intermediateNodes.add(otherNodeId);
                }
            });
            
            if (intermediateNodes.size > 0) {
                const intermediateNodeId = Array.from(intermediateNodes)[0];
                const intermediateNodeData = allNodes.find(n => n.id === intermediateNodeId);
                const rel1 = node1Connections.find(rel => 
                    rel.from === node1Id && rel.to === intermediateNodeId || 
                    rel.to === node1Id && rel.from === intermediateNodeId
                );
                const rel2 = node2Connections.find(rel => 
                    rel.from === node2Id && rel.to === intermediateNodeId || 
                    rel.to === node2Id && rel.from === intermediateNodeId
                );
                
                return [
                    node1.group,
                    rel1?.group || rel1?.label || rel1?.type || 'relation',
                    intermediateNodeData.group,
                    rel2?.group || rel2?.label || rel2?.type || 'relation',
                    node2.group
                ];
            }
        }
        
        return 'Path does not connect start and end nodes';
    }
};