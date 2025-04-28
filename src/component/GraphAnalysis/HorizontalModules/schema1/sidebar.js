import React, { useState } from 'react';
import NodeConfigForm from './NodeConfigForm';
import PathBuilder from './PathBuilder';
import SchemaIcon from './SchemaIcon';
import './SchemaVisualizerSidebar.css';

const Sidebar = ({ selectedItem, onUpdate, isPathBuilding, setIsPathBuilding, selectedNodes, selectedEdges, nodes, edges, pathName, setPathName, isPathValid, setIsPathValid, pathResult, setPathResult, virtualRelations, setVirtualRelations, setEdges, nvlRef }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    basic: false,
    properties: false,
    config: false
  });

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSection = (section) => {
    setSectionsCollapsed({
      ...sectionsCollapsed,
      [section]: !sectionsCollapsed[section]
    });
  };

  // Si la barre latérale est réduite, afficher uniquement le bouton d'expansion
  if (isCollapsed) {
    return (
      <div className="schema-viz-sidebar-container schema-viz-sidebar-collapsed">
        <div className="schema-viz-sidebar-header">
          <button className="schema-viz-sidebar-toggle-btn" onClick={toggleSidebar} title="Expand sidebar">
            <SchemaIcon type="chevron-right" size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Function to normalize and render properties
  const renderProperties = (properties) => {
    let props = properties || {};

    // Handle cases where properties might be a string or array
    if (typeof properties === 'string') {
      try {
        props = JSON.parse(properties);
      } catch (e) {
        // If it's a comma-separated string, split it into key-value pairs
        props = properties.split(',').reduce((acc, item, index) => {
          acc[`key_${index}`] = item.trim();
          return acc;
        }, {});
      }
    } else if (Array.isArray(properties)) {
      // Convert array to object with indexed keys
      props = properties.reduce((acc, item, index) => {
        acc[`item_${index}`] = String(item);
        return acc;
      }, {});
    }

    if (!props || Object.keys(props).length === 0) {
      return <p className="schema-viz-no-properties">No properties available</p>;
    }

    return (
      <ul className="schema-viz-properties-list">
        {Object.entries(props).map(([key, value]) => (
          <li key={key} className="schema-viz-property-item">
            <span className="schema-viz-property-key">
              <SchemaIcon type="tag" size={14} /> {key}:
            </span>
            <span className="schema-viz-property-value">{String(value)}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Si aucun élément n'est sélectionné, afficher un message
  if (!selectedItem && activeTab === 'details') {
    return (
      <div className="schema-viz-sidebar-container">
        <div className="schema-viz-sidebar-header">
          <h3 className="schema-viz-sidebar-title">Details</h3>
          <button className="schema-viz-sidebar-toggle-btn" onClick={toggleSidebar} title="Collapse sidebar">
            <SchemaIcon type="chevron-left" size={16} />
          </button>
        </div>
        <div className="schema-viz-sidebar-tabs">
          <div 
            className={`schema-viz-sidebar-tab ${activeTab === 'details' ? 'active' : ''}`} 
            onClick={() => setActiveTab('details')}
          >
            <SchemaIcon type="info-circle" size={14} style={{ marginRight: '5px' }} /> Details
          </div>
          <div 
            className={`schema-viz-sidebar-tab ${activeTab === 'path' ? 'active' : ''}`} 
            onClick={() => setActiveTab('path')}
          >
            <SchemaIcon type="route" size={14} style={{ marginRight: '5px' }} /> Path
          </div>
        </div>
        <div className="schema-viz-sidebar-content">
          <p className="schema-viz-sidebar-placeholder">
            <SchemaIcon type="mouse-pointer" size={14} style={{ marginRight: '5px' }} /> Select a node or relationship to see details.
          </p>
        </div>
      </div>
    );
  }

  const isNode = selectedItem && selectedItem.group && !selectedItem.from;

  return (
    <div className="schema-viz-sidebar-container">
      <div className="schema-viz-sidebar-header">
        <h3 className="schema-viz-sidebar-title">
          {activeTab === 'details' ? (isNode ? 'Node Details' : 'Relationship Details') : 'Path Builder'}
        </h3>
        <button className="schema-viz-sidebar-toggle-btn" onClick={toggleSidebar} title="Collapse sidebar">
          <SchemaIcon type="chevron-left" size={16} />
        </button>
      </div>
      
      <div className="schema-viz-sidebar-tabs">
        <div 
          className={`schema-viz-sidebar-tab ${activeTab === 'details' ? 'active' : ''}`} 
          onClick={() => setActiveTab('details')}
        >
          <SchemaIcon type="info-circle" size={14} style={{ marginRight: '5px' }} /> Details
        </div>
        <div 
          className={`schema-viz-sidebar-tab ${activeTab === 'path' ? 'active' : ''}`} 
          onClick={() => setActiveTab('path')}
        >
          <SchemaIcon type="route" size={14} style={{ marginRight: '5px' }} /> Aggregation
        </div>
      </div>
      
      <div className="schema-viz-sidebar-content">
        {activeTab === 'details' && selectedItem && (
          <>
            <div className="schema-viz-details-card">
              <div className="schema-viz-detail-section">
                <div 
                  className="schema-viz-detail-section-header" 
                  onClick={() => toggleSection('basic')}
                >
                  <span>
                    <SchemaIcon type="id-card" size={14} style={{ marginRight: '5px' }} /> Basic Information
                  </span>
                  <SchemaIcon 
                    type={sectionsCollapsed.basic ? 'chevron-down' : 'chevron-up'} 
                    size={14} 
                  />
                </div>
                {!sectionsCollapsed.basic && (
                  <div className="schema-viz-detail-section-content">
                    <div className="schema-viz-detail-item">
                      <span className="schema-viz-detail-label">
                        <SchemaIcon type="fingerprint" size={14} style={{ marginRight: '5px' }} /> ID:
                      </span>
                      <span className="schema-viz-detail-value">{selectedItem.id}</span>
                    </div>
                    <div className="schema-viz-detail-item">
                      <span className="schema-viz-detail-label">
                        <SchemaIcon type="tag" size={14} style={{ marginRight: '5px' }} /> Type:
                      </span>
                      <span className="schema-viz-detail-value">{selectedItem.group}</span>
                    </div>
                    {!isNode && (
                      <>
                        <div className="schema-viz-detail-item">
                          <span className="schema-viz-detail-label">
                            <SchemaIcon type="arrow-right" size={14} style={{ marginRight: '5px' }} /> From:
                          </span>
                          <span className="schema-viz-detail-value">{selectedItem.from}</span>
                        </div>
                        <div className="schema-viz-detail-item">
                          <span className="schema-viz-detail-label">
                            <SchemaIcon type="arrow-left" size={14} style={{ marginRight: '5px' }} /> To:
                          </span>
                          <span className="schema-viz-detail-value">{selectedItem.to}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="schema-viz-detail-section">
                <div 
                  className="schema-viz-detail-section-header" 
                  onClick={() => toggleSection('properties')}
                >
                  <span>
                    <SchemaIcon type="list-ul" size={14} style={{ marginRight: '5px' }} /> Properties
                  </span>
                  <SchemaIcon 
                    type={sectionsCollapsed.properties ? 'chevron-down' : 'chevron-up'} 
                    size={14} 
                  />
                </div>
                {!sectionsCollapsed.properties && (
                  <div className="schema-viz-detail-section-content">
                    {renderProperties(selectedItem.properties)}
                  </div>
                )}
              </div>
              
              {isNode && (
                <div className="schema-viz-detail-section">
                  <div 
                    className="schema-viz-detail-section-header" 
                    onClick={() => toggleSection('config')}
                  >
                    <span>
                      <SchemaIcon type="cog" size={14} style={{ marginRight: '5px' }} /> Configuration
                    </span>
                    <SchemaIcon 
                      type={sectionsCollapsed.config ? 'chevron-down' : 'chevron-up'} 
                      size={14} 
                    />
                  </div>
                  {!sectionsCollapsed.config && (
                    <div className="schema-viz-detail-section-content">
                      <NodeConfigForm selectedNode={selectedItem} onUpdate={onUpdate} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'path' && (
          <PathBuilder
            isPathBuilding={isPathBuilding}
            setIsPathBuilding={setIsPathBuilding}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            nodes={nodes}
            edges={edges}
            pathName={pathName}
            setPathName={setPathName}
            isPathValid={isPathValid}
            setIsPathValid={setIsPathValid}
            pathResult={pathResult}
            setPathResult={setPathResult}
            virtualRelations={virtualRelations}
            setVirtualRelations={setVirtualRelations}
            setEdges={setEdges}
            nvlRef={nvlRef}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
