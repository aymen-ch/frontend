import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlgorithm } from '../../Context';

const PathFinder = ({
  setPathEdges,
  setPathNodes,
  setAllPaths,
  setCurrentPathIndex,
  setIsBoxPath,
  selectednodes,
  setPathisempty,
  // setShortestPathParams, // New callback prop to trigger path finding in PathVisualization
  // setPathFindingParams, // New callback prop for shortest path
}) => {
  const [depth, setDepth] = useState(1);
  const { t } = useTranslation();
  const { setPathFindingParams, setShortestPathParams } = useAlgorithm();


  const handleDepthChange = (event) => {
    setDepth(parseInt(event.target.value, 10));
  };

  const handlePathFinding = () => {
    if (selectednodes.size > 0) {
      setIsBoxPath(true); // Show the PathVisualization window
      setPathFindingParams({ ids: Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10)), depth });
    }
  };

  const handleShortestPath = () => {
    if (selectednodes.size > 0) {
      setIsBoxPath(true); // Show the PathVisualization window
      setShortestPathParams({ ids: Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10)) });
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
   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  <button
    onClick={handlePathFinding}
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
  <button
    onClick={handleShortestPath}
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
</div>

    </div>
  );
};

export default PathFinder;