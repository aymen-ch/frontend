import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import RadioBarComoponent from './NodeTypesRadio';
import SearchComponent from './SearchComponent_introgation';

const Properties_introgation = ({ nodes, edges, setNodes, setEdges }) => {
  const [selectedNodeType, setSelectedNodeType] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(true); // State to toggle search visibility

  // Toggle Search Visibility
  const toggleSearchVisibility = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <div className="container-fluid d-flex flex-column p-0" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Row 1: RadioBarComponent - Takes full width */}
      <div className="row m-0" style={{ flex: '0 0 auto' }}> {/* Removed flex-grow-1 and set flex to auto */}
        <div className="col-12 p-0">
          <div className="card h-100 border-0 shadow-sm rounded-0" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-body p-0">
              <RadioBarComoponent
                onResult={setSelectedNodeType}
                toggleSearchVisibility={toggleSearchVisibility}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: SearchComponent - Takes full width */}
      {isSearchVisible && (
        <div className="row m-0" style={{ flex: '1 1 auto', marginTop: '0.5rem' }}> {/* Adjusted flex and added margin-top */}
          <div className="col-12 p-0">
            <div className="card h-100 border-0 shadow-sm rounded-0" style={{ backgroundColor: '#ffffff' }}>
              <div className="card-body p-0">
                <SearchComponent
                  selectedNodeType={selectedNodeType}
                  nodes={nodes}
                  edges={edges}
                  setNodes={setNodes}
                  setEdges={setEdges}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties_introgation;