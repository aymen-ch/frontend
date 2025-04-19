export const constructPath = (selectedNodes, selectedRelationships, allNodes) => {
    // If there's no start node or no relationships, return an error
    if (!selectedNodes.length || !selectedRelationships.length) {
        return 'Incomplete selection';
    }

    // Assume the first selected node is the start node
    const startNode = selectedNodes[0];
    let path = [startNode.group]; // Start with the node's type (e.g., "Personne")
    let currentNodeId = startNode.id;
    const usedRelationships = new Set();
    
    // For your case where start and end are both "Personne"
    const endNode = selectedNodes.length > 1 ? selectedNodes[1] : selectedNodes[0];
    
    // Build the path
    let foundPath = false;
    let iterations = 0;
    const maxIterations = selectedRelationships.length * 2; // Prevent infinite loops

    while (iterations < maxIterations && !foundPath) {
        iterations++;
        
        // Find all relationships connected to the current node that haven't been used
        const possibleRelationships = selectedRelationships.filter(rel => 
            (rel.from === currentNodeId || rel.to === currentNodeId) && 
            !usedRelationships.has(rel.id)
        );
        
        if (possibleRelationships.length === 0) {
            break; // No more connections
        }
        
        // Sort relationships to prefer those that connect to the end node directly
        possibleRelationships.sort((a, b) => {
            const aConnectsToEnd = (a.from === endNode.id || a.to === endNode.id);
            const bConnectsToEnd = (b.from === endNode.id || b.to === endNode.id);
            return bConnectsToEnd - aConnectsToEnd;
        });
        
        // Use the best available relationship
        const nextRel = possibleRelationships[0];
        usedRelationships.add(nextRel.id);
        
        // Determine the next node
        const nextNodeId = nextRel.from === currentNodeId ? nextRel.to : nextRel.from;
        
        // Find the next node in allNodes (since it might not be in selectedNodes)
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
        if (currentNodeId === endNode.id) {
            foundPath = true;
        }
    }

    // Validate the path ends at the endNode
    if (foundPath) {
        return path;
    } else {
        // Try to find if there's an indirect path through other nodes
        if (selectedNodes.length === 2) {
            const node1 = selectedNodes[0];
            const node2 = selectedNodes[1];
            
            // Check if there's a common connection between the two nodes
            const node1Connections = selectedRelationships.filter(rel => 
                rel.from === node1.id || rel.to === node1.id
            );
            
            const node2Connections = selectedRelationships.filter(rel => 
                rel.from === node2.id || rel.to === node2.id
            );
            
            // Find intermediate nodes that connect to both
            const intermediateNodes = new Set();
            node1Connections.forEach(rel => {
                const otherNode = rel.from === node1.id ? rel.to : rel.from;
                if (node2Connections.some(r => r.from === otherNode || r.to === otherNode)) {
                    intermediateNodes.add(otherNode);
                }
            });
            
            if (intermediateNodes.size > 0) {
                const intermediateNode = Array.from(intermediateNodes)[0];
                const intermediateNodeData = allNodes.find(n => n.id === intermediateNode);
                const rel1 = node1Connections.find(rel => 
                    rel.from === node1.id && rel.to === intermediateNode || 
                    rel.to === node1.id && rel.from === intermediateNode
                );
                const rel2 = node2Connections.find(rel => 
                    rel.from === node2.id && rel.to === intermediateNode || 
                    rel.to === node2.id && rel.from === intermediateNode
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