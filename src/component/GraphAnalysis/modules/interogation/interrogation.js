// InterrogationModule.js
import React from 'react';
import Properties_introgation from '../interogation/Properties_introgation';
import Template from '../interogation/tamplate';
import Chat from '../interogation/chat';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faListAlt, faComments } from '@fortawesome/free-solid-svg-icons';

const InterrogationModule = ({
  selectedOption,
  setSelectedOption,
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNodes
}) => {
  return (
    <>
      <div className="option-tabs">
        <button
          className={`btn option-tab ${selectedOption === 'option1' ? 'btn-info active' : 'btn-light'}`}
          onClick={() => setSelectedOption('option1')}
        >
          <FontAwesomeIcon icon={faCogs} className="me-2" />
          Properties
        </button>
        <button
          className={`btn option-tab ${selectedOption === 'option2' ? 'btn-info active' : 'btn-light'}`}
          onClick={() => setSelectedOption('option2')}
        >
          <FontAwesomeIcon icon={faListAlt} className="me-2" />
          Template
        </button>
        <button
          className={`btn option-tab ${selectedOption === 'option3' ? 'btn-info active' : 'btn-light'}`}
          onClick={() => setSelectedOption('option3')}
        >
          <FontAwesomeIcon icon={faComments} className="me-2" />
          Chat
        </button>
      </div>
      
      <div className="option-content">
        {selectedOption === 'option1' && (
          <Properties_introgation
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
          />
        )}
        {selectedOption === 'option2' && (
          <Template
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
          />
        )}
        {selectedOption === 'option3' && (
          <Chat
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            selectedNodes={selectedNodes}
          />
        )}
      </div>
    </>
  );
};

export default InterrogationModule;