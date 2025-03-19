
import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { AddNeighborhoodParser,parsePath } from '../../utils/Parser';
import { BASE_URL } from '../../utils/Urls';

const PathFinder = ({ nvlRef,setPathEdges,
    setPathNodes,
    setAllPaths,    
    setCurrentPathIndex,
    setIsBoxPath,
    selectednodes,
    setPathisempty
    }) => {

const [depth, setDepth] = useState(1);
const [isPathFindingStarted, setIsPathFindingStarted] = useState(true);
const updatePathNodesAndEdges = (path) => {
const { nodes: formattedNodes, edges: formattedEdges } = parsePath(path,selectednodes);
setPathNodes(formattedNodes);
setPathEdges(formattedEdges);
};

  const handleDepthChange = (event) => {
    setDepth(parseInt(event.target.value, 10));
  };


  const startPathFinding = async () => {
    setIsPathFindingStarted(true);
    console.log("selected nodes  ", nvlRef.current.getSelectedNodes());
    
    if (nvlRef.current.getSelectedNodes().length>0) {
        setIsBoxPath(true)
        const nodeIds = nvlRef.current.getSelectedNodes().map((node) => parseInt(node.id, 10));
      try {
        const response = await axios.post(
          `${BASE_URL}/get_all_connections/`,
          { ids: nodeIds,depth:depth },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          const paths = response.data.paths;
          if(response.data.paths.length == 0 ){
            setPathisempty(true) ;
            console.log("path is videdd ");
          }
          console.log("response path :" , response);
          
          setAllPaths(paths);
          setCurrentPathIndex(0);
          updatePathNodesAndEdges(paths[0],nvlRef.current.getSelectedNodes());
        } else {
          console.error('Failed to fetch all connections.');
        }
      } catch (error) {
        console.error('Error fetching all connections:', error);
      }
    }
  };

  return (
    <div
      style={{
        padding: '10px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <label htmlFor="depth" style={{ marginRight: '10px' }}>Depth:</label>
        <input
          type="number"
          id="depth"
          value={depth}
          onChange={handleDepthChange}
          min="1"
          style={{
            padding: '5px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>
      <button
        onClick={startPathFinding}
        style={{
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        Start Path Finding
      </button>

    </div>
  );
};

export default PathFinder;