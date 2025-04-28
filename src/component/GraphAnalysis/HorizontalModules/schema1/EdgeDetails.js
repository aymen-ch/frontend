// src/components/EdgeDetails/EdgeDetails.jsx
import React from 'react';

const EdgeDetails = ({ edgeId, edges }) => {
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return null;

  return (
    <span
      style={{
        backgroundColor: '#FFD700',
        color: '#333',
        padding: '2px 8px',
        borderRadius: '3px',
        margin: '2px',
        display: 'inline-block',
      }}
    >
      ➜ {edge.group}
    </span>
  );
};

export default EdgeDetails;