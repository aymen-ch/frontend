import React from 'react';
import Properties_introgation from './Oreinted/NodeTypeCibled/CibledInterrogation';
import Template from './Oreinted/PredefinedQuestions/PredefinedQuestions';
import Chat from './LLM/chat';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faListAlt, faComments } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
///ce composant contient les trois options d'interrogation, cible par type de node(Properties_introgation),questions predifini(Template) ,LLM(Chat)
const InterrogationModule = ({
  selectedOption,
  setSelectedOption,
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNodes
}) => {
  const { t } = useTranslation();

  return (
    <>
      <style>
        {`
          .hide-scrollbar {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
            overflow: -moz-scrollbars-none; /* Legacy Firefox */
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Edge */
            width: 0;
            height: 0;
            background: transparent;
          }
        `}
      </style>
      <div className="bg-white rounded shadow-sm max-w-full min-h-full flex flex-col">
        <div className="flex flex-wrap sticky top-0 z-10 bg-white">
          <button
            className={`flex items-center justify-center gap-1.5 px-6 py-1.5 min-w-[120px] flex-grow rounded text-sm font-semibold transition-all duration-200 ${
              selectedOption === 'option1'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600'
            }`}
            onClick={() => setSelectedOption('option1')}
          >
            <FontAwesomeIcon icon={faCogs} />
            {t('Properties')}
          </button>
          <button
            className={`flex items-center justify-center gap-1.5 px-6 py-1.5 min-w-[120px] flex-grow rounded text-sm font-semibold transition-all duration-200 ${
              selectedOption === 'option2'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600'
            }`}
            onClick={() => setSelectedOption('option2')}
          >
            <FontAwesomeIcon icon={faListAlt} />
            {t('Questions')}
          </button>
          <button
            className={`flex items-center justify-center gap-1.5 px-6 py-1.5 min-w-[120px] flex-grow rounded text-sm font-semibold transition-all duration-200 ${
              selectedOption === 'option3'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600'
            }`}
            onClick={() => setSelectedOption('option3')}
          >
            <FontAwesomeIcon icon={faComments} />
            {t('Chat')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="bg-gray-50 rounded min-h-full">
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
        </div>
      </div>
    </>
  );
};

export default InterrogationModule;