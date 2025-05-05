import React from 'react';
import { FaExpand, FaCompress, FaSave, FaUndo, FaTrash, FaAdn } from 'react-icons/fa';
import { MdOutlineTabUnselected } from 'react-icons/md';
import { buttonStyle } from './GraphVisualizationStyles';

const CanvasControl = ({
  isFullscreen,
  toggleFullscreen,
  handleSave,
  handleBack,
  handleDelete,
  handlewebgl,
  hanldemultiselecte,
  multiselecte,
}) => {
  return (
    <>
      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '380px' }}
        onClick={handleSave}
        title="Save"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)')}
      >
        <FaSave size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '420px' }}
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)')}
      >
        {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '460px' }}
        onClick={handleBack}
        title="Back"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)')}
      >
        <FaUndo size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '500px' }}
        onClick={handleDelete}
        title="Global View"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)')}
      >
        <FaTrash size={16} />
      </button>

      <button
        style={{ ...buttonStyle, position: 'absolute', top: '10px', left: '540px' }}
        onClick={handlewebgl}
        title="Toggle Renderer"
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)')}
      >
        <FaAdn size={16} />
      </button>

      <button
        style={{
          ...buttonStyle,
          position: 'absolute',
          top: '10px',
          left: '580px',
          backgroundColor: multiselecte ? 'blue' : 'rgba(255, 255, 255, 0.8)',
          cursor: multiselecte ? 'crosshair' : 'pointer',
        }}
        onClick={hanldemultiselecte}
        title="Multi select"
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = multiselecte ? 'darkblue' : 'rgba(255, 255, 255, 0.9)')
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = multiselecte ? 'blue' : 'rgba(255, 255, 255, 0.8)')
        }
      >
        <MdOutlineTabUnselected size={16} />
      </button>
    </>
  );
};

export default CanvasControl;