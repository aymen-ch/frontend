import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AddNeighborhoodParser, parsePath } from '../../utils/Parser';
import { BASE_URL } from '../../utils/Urls';
import { useTranslation } from 'react-i18next';

const PathFinder = ({
  setPathEdges,
  setPathNodes,
  setAllPaths,
  setCurrentPathIndex,
  setIsBoxPath,
  selectednodes,
  setPathisempty
}) => {
  const [depth, setDepth] = useState(1);
  const [isPathFindingStarted, setIsPathFindingStarted] = useState(true);
  const { t } = useTranslation();

  const updatePathNodesAndEdges = (path) => {
    console.log(selectednodes);
    const { nodes: formattedNodes, edges: formattedEdges } = parsePath(path, selectednodes);
    setPathNodes(formattedNodes);
    setPathEdges(formattedEdges);
  };

  const handleDepthChange = (event) => {
    setDepth(parseInt(event.target.value, 10));
  };

  const startPathFinding = async () => {
    setIsPathFindingStarted(true);
    console.log(selectednodes);
    if (selectednodes.size > 0) {
      setIsBoxPath(true);
      const nodeIds = Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10));
      try {
        const response = await axios.post(
          `${BASE_URL}/get_all_connections/`,
          { ids: nodeIds, depth: depth },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          const paths = response.data.paths;
          if (response.data.paths.length === 0) {
            setPathisempty(true);
            console.log("path is videdd ");
          }
          console.log("response path :", response);

          setAllPaths(paths);
          setCurrentPathIndex(0);
          updatePathNodesAndEdges(paths[0], selectednodes);
        } else {
          console.error('Failed to fetch all connections.');
        }
      } catch (error) {
        console.error('Error fetching all connections:', error);
      }
    }
  };

  const startPathFinding_shortest = async () => {
    setIsPathFindingStarted(true);

    console.log(selectednodes);
    if (selectednodes.size > 0) {
      setIsBoxPath(true);
      const nodeIds = Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10));
      try {
        const response = await axios.post(
          `${BASE_URL}/shortestpath/`,
          { ids: nodeIds },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 200) {
          const paths = response.data.paths;
          if (response.data.paths.length === 0) {
            setPathisempty(true);
            console.log("path is videdd ");
          }
          console.log("response path :", response);

          setAllPaths(paths);
          setCurrentPathIndex(0);
          updatePathNodesAndEdges(paths[0], selectednodes);
        } else {
          console.error('Failed to fetch all connections.');
        }
      } catch (error) {
        console.error('Error fetching all connections:', error);
      }
    }
  };

  return (
    <>
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
          <label htmlFor="depth" style={{ marginRight: '10px' }}>{t('pathFinder.depthLabel')}:</label>
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
            background: 'rgb(95 124 87)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          {t('pathFinder.startPathFinding')}
        </button>
      </div>
      <button
        onClick={startPathFinding_shortest}
        style={{
          background: 'rgb(95 124 87)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        {t('pathFinder.shortestPath')}
      </button>
    </>
  );
};

export default PathFinder;