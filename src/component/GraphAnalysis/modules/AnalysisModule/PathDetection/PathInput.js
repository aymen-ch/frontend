import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlgorithm } from '../../ContainersModules/PathPrameters';

const PathFinder = ({
  setPathEdges,
  setPathNodes,
  setAllPaths,
  setCurrentPathIndex,
  setIsBoxPath,
  selectednodes,
  setPathisempty,
}) => {
  const [depth, setDepth] = useState(1);
  const [error, setError] = useState(null); // State for error messages
  const { t } = useTranslation();
  const {
    setPathFindingParams,
    setShortestPathParams,
    setStartPathfinding,
    setStartShortestPathFinding,
  } = useAlgorithm();

  const handleDepthChange = (event) => {
    setDepth(parseInt(event.target.value, 10));
    setError(null); // Clear error on input change
  };

  const handlePathFinding = () => {
    if (selectednodes.size < 2) {
      setError(t('pathFinder.errorMinTwoNodes')); // Error for subgraph
      return;
    }
    setError(null); // Clear any previous error
    setIsBoxPath(true);
    const nodeIds = Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10));
    setPathFindingParams({ ids: nodeIds, depth });
    console.log('Pathfinding params:', { ids: nodeIds, depth });
    setStartPathfinding(true);
    setStartShortestPathFinding(false);
  };

  const handleShortestPath = () => {
    if (selectednodes.size !== 2) {
      setError(t('pathFinder.errorExactlyTwoNodes')); // Error for shortest path
      return;
    }
    setError(null); // Clear any previous error
    setIsBoxPath(true);
    const nodeIds = Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10));
    setShortestPathParams({ ids: nodeIds });
    setStartShortestPathFinding(true);
    setStartPathfinding(false);
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-lg shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="depth"
            className="text-sm font-medium text-gray-700"
          >
            {t('pathFinder.depthLabel')}:
          </label>
          <input
            type="number"
            id="depth"
            value={depth}
            onChange={handleDepthChange}
            min="1"
            className="w-20 p-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 hover:shadow-md"
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handlePathFinding}
            className="bg-[#5f7c57] text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-[#4e6a47] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {t('pathFinder.startPathFinding')}
          </button>
          <button
            onClick={handleShortestPath}
            className="bg-[#5f7c57] text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-[#4e6a47] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {t('pathFinder.shortestPath')}
          </button>
        </div>
      </div>
      {error && (
        <div
          className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 shadow-sm"
          role="alert"
        >
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PathFinder;