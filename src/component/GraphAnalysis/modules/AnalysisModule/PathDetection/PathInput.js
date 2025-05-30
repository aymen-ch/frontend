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
  const { t } = useTranslation();
  const { 
    setPathFindingParams, 
    setShortestPathParams,
    setStartPathfinding,
    setStartShortestPathFinding
  } = useAlgorithm();

  const handleDepthChange = (event) => {
    setDepth(parseInt(event.target.value, 10));
  };

  const handlePathFinding = () => {
    if (selectednodes.size > 0) {
      setIsBoxPath(true);
      setPathFindingParams({ ids: Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10)), depth });
      console.log("H2", { ids: Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10)), depth });
      setStartPathfinding(true);
      setStartShortestPathFinding(false);
    }
  };

  const handleShortestPath = () => {
    if (selectednodes.size > 0) {
      setIsBoxPath(true);
      setShortestPathParams({ ids: Array.from(selectednodes).map((nodeId) => parseInt(nodeId, 10)) });
      setStartShortestPathFinding(true);
      setStartPathfinding(false);
    }
  };

  return (
    <div className="p-2.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
      <div className="flex items-center">
        <label htmlFor="depth" className="mr-2.5 text-sm text-gray-600">{t('pathFinder.depthLabel')}:</label>
        <input
          type="number"
          id="depth"
          value={depth}
          onChange={handleDepthChange}
          min="1"
          className="p-1.5 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          onClick={handlePathFinding}
          className="bg-[#5f7c57] text-white border-none rounded px-2.5 py-1.5 text-sm hover:bg-[#4e6a47] transition-colors duration-200"
        >
          {t('pathFinder.startPathFinding')}
        </button>
        <button
          onClick={handleShortestPath}
          className="bg-[#5f7c57] text-white border-none rounded px-2.5 py-1.5 text-sm hover:bg-[#4e6a47] transition-colors duration-200"
        >
          {t('pathFinder.shortestPath')}
        </button>
      </div>
    </div>
  );
};

export default PathFinder;