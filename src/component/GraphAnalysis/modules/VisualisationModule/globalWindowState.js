// src/utils/globalWindowState.js
const globalWindowState = {
    activeWindow: null, // e.g., 'PersonProfile'
    windowData: null,   // Data to pass to the window (e.g., node object)
    setWindow: (windowType, data) => {
      globalWindowState.activeWindow = windowType;
      globalWindowState.windowData = data;
      // Trigger a re-render if needed (for React, we'll use state in the component)
    },
    clearWindow: () => {
      globalWindowState.activeWindow = null;
      globalWindowState.windowData = null;
    },
  };
  
  export default globalWindowState;