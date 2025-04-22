import React from 'react';
import { 
    FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaAdn, FaCog, FaSearch, 
    FaTimes, FaSpinner, FaProjectDiagram, FaLayerGroup, FaSitemap, FaCircle,
    FaBan, FaPlus, FaLink, FaMousePointer, FaVectorSquare, FaExpandArrowsAlt,
    FaCrosshairs, FaHighlighter, FaCircleNotch, FaThLarge, FaSun, FaObjectGroup,
    FaLongArrowAltRight, FaExchangeAlt, FaFileAlt, FaEye, FaChevronDown, 
  } from 'react-icons/fa';

// Styles pour la barre d'outils
const toolbarStyles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #ddd',
    padding: '4px 8px',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  
  sectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginRight: '8px',
    borderRight: '1px solid #ddd',
    paddingRight: '8px',
  },
  
  sectionTitle: {
    color: '#888',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: '4px',
    textAlign: 'center',
  },
  
  toolsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  dropdownButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    marginRight: '8px',
  },
  
  toolButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    transition: 'background-color 0.2s, transform 0.1s',
    marginRight: '5px',
  },
  
  activeToolButton: {
    backgroundColor: 'rgba(66, 153, 225, 0.8)',
    color: '#fff',
  },
  
  lastSection: {
    borderRight: 'none',
  }
};

// Composant pour un bouton d'outil
const ToolButton = ({ icon, title, onClick, isActive }) => {
  const buttonStyle = {
    ...toolbarStyles.toolButton,
    ...(isActive ? toolbarStyles.activeToolButton : {})
  };
  
  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      title={title}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = isActive ? 'rgba(66, 153, 225, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = isActive ? 'rgba(66, 153, 225, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
    >
      {icon}
    </button>
  );
};

// Composant pour une section de la barre d'outils
const ToolSection = ({ title, tools, handleToolClick, isLastSection }) => {
  const sectionStyle = {
    ...toolbarStyles.sectionContainer,
    ...(isLastSection ? toolbarStyles.lastSection : {})
  };
  
  return (
    <div style={sectionStyle}>
      <div style={toolbarStyles.sectionTitle}>{title}</div>
      <div style={toolbarStyles.toolsRow}>
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            title={tool.label}
            onClick={() => handleToolClick(tool.id)}
            isActive={tool.isActive}
          />
        ))}
      </div>
    </div>
  );
};

// Composant pour un bouton déroulant
const DropdownButton = ({ icon, label, onClick, isEnd }) => {
  const style = {
    ...toolbarStyles.dropdownButton,
    ...(isEnd ? { marginLeft: 'auto' } : {})
  };
  
  return (
    <div style={style} onClick={onClick}>
      {icon}
      <span style={{ marginLeft: '4px' }}>{label}</span>
      <FaChevronDown size={12} style={{ marginLeft: '4px' }} />
    </div>
  );
};

// Composant principal de la barre d'outils
const GraphVisualizationToolbar = ({
  handleSave,
  handleBack,
  handleDelete,
  handlewebgl,
  toggleFullscreen,
  toggleSettingsPanel,
  isFullscreen,
  layoutType,
  setLayoutType,
  // Autres props nécessaires
}) => {
  // Fonction pour gérer les clics sur les outils
  const handleToolClick = (toolId) => {
    switch (toolId) {
      case 'save':
        handleSave();
        break;
      case 'undo':
        handleBack();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'renderer':
        handlewebgl();
        break;
      case 'fullscreen':
        toggleFullscreen();
        break;
      case 'settings':
        toggleSettingsPanel();
        break;
      case 'force':
        setLayoutType('ForceDirectedLayout');
        break;
      case 'hierarchy':
        setLayoutType('HierarchicalLayout');
        break;
      case 'circular':
        setLayoutType('CircularLayout');
        break;
      case 'grid':
        setLayoutType('GridLayout');
        break;
      // Ajouter d'autres cas selon les besoins
      default:
        console.log(`Tool ${toolId} clicked`);
    }
  };

  // Définition des outils avec leurs icônes
  const graphTools = [
    { id: 'node', icon: <FaCircle size={16} />, label: 'Node' },
    { id: 'settings', icon: <FaCog size={16} />, label: 'Settings', isActive: false },
    { id: 'connect', icon: <FaProjectDiagram size={16} />, label: 'Connect' },
    { id: 'branch', icon: <FaSitemap size={16} />, label: 'Branch' },
    { id: 'group', icon: <FaLayerGroup size={16} />, label: 'Group' },
    { id: 'block', icon: <FaBan size={16} />, label: 'Block' },
    { id: 'save', icon: <FaSave size={16} />, label: 'Save' },
    { id: 'undo', icon: <FaUndo size={16} />, label: 'Undo' },
    { id: 'delete', icon: <FaTrash size={16} />, label: 'Delete' },
  ];
  
  const selectionTools = [
    { id: 'select', icon: <FaMousePointer size={16} />, label: 'Select' },
    { id: 'lasso', icon: <FaVectorSquare size={16} />, label: 'Lasso' },
    { id: 'marquee', icon: <FaExpandArrowsAlt size={16} />, label: 'Marquee' },
    { id: 'circle', icon: <FaCircle size={16} />, label: 'Circle' },
    { id: 'target', icon: <FaCrosshairs size={16} />, label: 'Target' },
    { id: 'highlight', icon: <FaHighlighter size={16} />, label: 'Highlight' },
  ];
  
  const layoutTools = [
    { id: 'force', icon: <FaProjectDiagram size={16} />, label: 'Force', isActive: layoutType === 'ForceDirectedLayout' },
    { id: 'hierarchy', icon: <FaSitemap size={16} />, label: 'Hierarchy', isActive: layoutType === 'HierarchicalLayout' },
    { id: 'circular', icon: <FaCircleNotch size={16} />, label: 'Circular', isActive: layoutType === 'CircularLayout' },
    { id: 'grid', icon: <FaThLarge size={16} />, label: 'Grid', isActive: layoutType === 'GridLayout' },
    { id: 'radial', icon: <FaSun size={16} />, label: 'Radial' },
    { id: 'cluster', icon: <FaObjectGroup size={16} />, label: 'Cluster' },
  ];
  
  const relationships = [
    { id: 'connect', icon: <FaLink size={16} />, label: 'Connect' },
    { id: 'directed', icon: <FaLongArrowAltRight size={16} />, label: 'Directed' },
    { id: 'bidirectional', icon: <FaExchangeAlt size={16} />, label: 'Bidirectional' },
    { id: 'document', icon: <FaFileAlt size={16} />, label: 'Document' },
  ];

  return (
    <div style={toolbarStyles.container}>
      {/* Export dropdown button */}
      <DropdownButton 
        icon={<FaFileAlt size={16} />} 
        label="Export" 
        onClick={() => console.log('Export clicked')} 
      />
      
      {/* GRAPH TOOLS */}
      <ToolSection 
        title="GRAPH TOOLS" 
        tools={graphTools} 
        handleToolClick={handleToolClick} 
      />
      
      {/* SELECTION TOOLS */}
      <ToolSection 
        title="SELECTION TOOLS" 
        tools={selectionTools} 
        handleToolClick={handleToolClick} 
      />
      
      {/* LAYOUT TOOLS */}
      <ToolSection 
        title="LAYOUT TOOLS" 
        tools={layoutTools} 
        handleToolClick={handleToolClick} 
      />
      
      {/* RELATIONSHIPS */}
      <ToolSection 
        title="RELATIONSHIPS" 
        tools={relationships} 
        handleToolClick={handleToolClick} 
        isLastSection={true}
      />
      
      {/* View dropdown button at the end */}
      <DropdownButton 
        icon={<FaEye size={16} />} 
        label="View" 
        onClick={() => console.log('View clicked')} 
        isEnd={true}
      />
    </div>
  );
};

export default GraphVisualizationToolbar;
