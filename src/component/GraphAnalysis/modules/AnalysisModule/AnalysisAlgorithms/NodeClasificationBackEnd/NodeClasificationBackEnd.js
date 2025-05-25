import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BASE_URL_Backend } from "../../../../Platforme/Urls";
import "./NodeClasificationBackEnd.css";

const NodeClasificationBackEnd = ({ onClose }) => {
  const [selectedTemplates, setSelectedTemplates] = useState([]); // Holds selected templates (checkbox)
  const [depth, setDepth] = useState(""); // Holds depth value
  const [isClassifying, setIsClassifying] = useState(false);

  // Draggable window logic
  const windowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Predefined relationship templates
  const relationshipTemplates = [
    "(p1:Personne)-[:Proprietaire]-(ph1:Phone)-[ap:Appel_telephone]->(ph2:Phone)-[:Proprietaire]-(p2:Personne)",
    "(p1:Personne)-[:Proprietaire]-(ph1:Virtuel)-[:Message]-(ph2:Virtuel)-[:Proprietaire]-(p2:Personne)",
    "(p1:Personne)-[:Proprietaire]-(ph1:Phone)-[:SMS]-(ph2:Phone)-[:Proprietaire]-(p2:Personne)",
  ];

  // Center the pop-up on mount
  useEffect(() => {
    const centerX = window.innerWidth / 2 - 300; // Center pop-up
    const centerY = window.innerHeight / 2 - 200;
    setPosition({ x: centerX, y: centerY });
  }, []);

  // Draggable logic
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = windowRef.current.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle checkbox selection
  const handleCheckboxChange = (template) => {
    setSelectedTemplates((prevSelected) =>
      prevSelected.includes(template)
        ? prevSelected.filter((t) => t !== template) // Remove if already selected
        : [...prevSelected, template] // Add if not selected
    );
  };

  // Handle API Call
  const handleRun = async () => {
    setIsClassifying(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        BASE_URL_Backend + "/Node_clasification/",
        { 
          templates: selectedTemplates, // Send selected templates as an array
          depth: depth, // Send depth value
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Node classification completed!");
      } else {
        console.error("Node classification failed.");
      }
    } catch (error) {
      console.error("Error during classification:", error);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="node-classification-popup" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div
        ref={windowRef}
        className="node-classification-content"
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="window-header">
          <h3>Node Classification BackEnd</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Checkbox Inputs for Relationship Templates */}
        <div className="form-group">
          <label>Select Relationship Template(s)</label>
          <div className="checkbox-group">
            {relationshipTemplates.map((template, index) => (
              <div key={index} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`template-${index}`}
                  value={template}
                  checked={selectedTemplates.includes(template)}
                  onChange={() => handleCheckboxChange(template)}
                />
                <label htmlFor={`template-${index}`} className="template-label">
                  <code>{template}</code>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Number Input for Depth */}
        <div className="form-group">
          <label htmlFor="depth">Depth</label>
          <input
            type="number"
            id="depth"
            min="3"
            max="10"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className="form-control"
            placeholder="Enter depth"
          />
        </div>

        {/* Buttons */}
        <div className="button-group">
          <button className="btn btn-primary" onClick={handleRun} disabled={isClassifying}>
            {isClassifying ? (
              <span>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span className="sr-only">Loading...</span>
              </span>
            ) : (
              "Run Classification"
            )}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeClasificationBackEnd;