// src/components/GraphVisualizationUtils.js
export const filterNodesByQuery = (nodes, query) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return nodes.filter(node => 
      node.properties && 
      Object.values(node.properties).some(value => 
        value && 
        value.toString().toLowerCase().includes(lowerQuery)
      )
    );
  };
  
  export const updateLayoutOption = (key, value, layoutOptions, setLayoutOptions, nvlRef) => {
    const updatedOptions = { ...layoutOptions, [key]: value };
    setLayoutOptions(updatedOptions);
    nvlRef.current.setLayoutOptions(updatedOptions);
  };