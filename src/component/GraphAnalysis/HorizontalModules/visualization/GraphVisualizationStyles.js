// src/components/GraphVisualizationStyles.js
export const buttonStyle = {
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '35px',
    height: '35px',
    transition: 'background-color 0.2s, transform 0.1s',
    marginRight: '5px',
    ':hover': {
      transform: 'scale(1.05)',
    }
  };
  
  export const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'rgba(66, 153, 225, 0.8)',
    color: '#fff',
  };
  
  export const layoutControlStyle = {
    position: 'absolute',
    zIndex: 50,
    top: '10px',
    left: '60px',
    display: 'flex',
    flexDirection: 'row',
  };
  
  export const searchStyle = {
    position: 'absolute',
    zIndex: 50,
    top: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: '25px',
    padding: '8px 15px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    width: 'auto',
    minWidth: '300px',
    maxWidth: '450px',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    '&:hover': {
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 5px rgba(0, 0, 0, 0.06)',
    },
    '&:focus-within': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      borderColor: 'rgba(66, 153, 225, 0.3)',
    }
  };
  
  // Additional style for the select element (you might want to add this)
  export const searchSelectStyle = {
    marginLeft: '10px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      borderColor: 'rgba(66, 153, 225, 0.3)',
    },
    '&:focus': {
      outline: 'none',
      borderColor: 'rgba(66, 153, 225, 0.5)',
      boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.2)',
    }
  };
  
  export const containerStyle = (isFullscreen) => ({
    width: isFullscreen ? '100vw' : '100%',
    height: isFullscreen ? '100vh' : '100%',
    border: '1px solid lightgray',
    position: isFullscreen ? 'fixed' : 'relative',
    top: isFullscreen ? 0 : 'auto',
    left: isFullscreen ? 0 : 'auto',
    zIndex: isFullscreen ? 20000 : 'auto',
    backgroundColor: isFullscreen ? '#fff' : 'transparent',
    padding: '0px',
    margin: '0',
  });
  
  export const settingsPanelStyle = {
    position: 'absolute',
    top: '300px',
    left: '10px',
    zIndex: 1002,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '6px',
    padding: '15px',
    width: '220px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  };