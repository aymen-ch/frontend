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
    zIndex: 100, // Increased from 50 to ensure it’s above other elements (e.g., graph nodes)
    top: '5px', // Slightly increased for better spacing from the top edge
    left: '53%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 250, 0.98))', // Subtle gradient for depth
    borderRadius: '30px', // Softer, more modern rounded corners
    padding: '10px 18px', // Slightly more padding for comfort
    boxShadow: `
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 2px 4px rgba(0, 0, 0, 0.06),
      inset 0 1px 1px rgba(255, 255, 255, 0.5) // Inner highlight for glassmorphism
    `,
    border: '1px solid rgba(200, 210, 220, 0.3)', // Subtle border with softer color
    transition: 'all 0.3s ease, box-shadow 0.2s ease, transform 0.2s ease', // Smooth transitions
    width: 'auto',
    minWidth: '420px', // Slightly wider for better usability
    maxWidth: '400px', // Increased for larger screens
    '&:hover': {
      boxShadow: `
        0 6px 16px rgba(0, 0, 0, 0.1),
        0 3px 6px rgba(0, 0, 0, 0.08),
        inset 0 1px 1px rgba(255, 255, 255, 0.5)
      `,
      transform: 'translateX(-50%) scale(1.02)', // Subtle lift effect
    },
    '&:focus-within': {
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 1), rgba(250, 251, 253, 1))', // Brighter on focus
      borderColor: 'rgba(58, 102, 219, 0.5)', // Match #3a66db with opacity
      boxShadow: `
        0 6px 16px rgba(58, 102, 219, 0.2),
        0 3px 6px rgba(0, 0, 0, 0.08),
        inset 0 1px 1px rgba(255, 255, 255, 0.5)
      `,
      transform: 'translateX(-50%) scale(1.02)', // Consistent lift effect
    },
    // Accessibility improvements
    outline: 'none',
    '&:focus': {
      outline: '2px solid rgba(58, 102, 219, 0.3)', // Accessible focus ring
      outlineOffset: '2px',
    },
    // Input-specific styling (assuming the search bar contains an input)
    '& input': {
      border: 'none',
      background: 'transparent',
      color: '#1a202c', // Dark text for high contrast
      fontSize: '4rem',
      fontWeight: 400,
      padding: '6px 10px',
      width: '100%',
      '&:focus': {
        outline: 'none', // Remove default input outline
      },
      '&::placeholder': {
        color: 'rgba(113, 128, 150, 0.7)', // Softer placeholder color
        fontWeight: 400,
      },
    },
    // Icon styling (assuming a search icon, e.g., magnifying glass)
    '& svg': {
      color: '#718096', // Neutral gray for icons
      marginRight: '8px',
      transition: 'color 0.2s ease',
    },
    '&:focus-within svg': {
      color: '#3a66db', // Match theme color on focus
    },
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


  
  // In GraphVisualizationStyles.js or inline
export const controlBoxStyle = {
  position: 'absolute',
  top: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '8px',
  padding: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px', // Space between buttons
  zIndex: 1000,
};