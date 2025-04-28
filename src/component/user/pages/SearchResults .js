import React, { useState } from "react";
import axios from "axios";
import { FaFileAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, KeyRound } from "lucide-react";
import { Modal, Button, Form } from "react-bootstrap";

const SearchResults = ({ results }) => {
  const [activeTab, setActiveTab] = useState("auth");
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [reason, setReason] = useState("");
  const [requestedFiles, setRequestedFiles] = useState([]);

  const handleFileClick = async (filename, e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`http://127.0.0.1:8000/api/media/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      if (response.status === 200) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du fichier :", error);
    }
  };

  const handleRequestPermissionClick = (filename) => {
    setSelectedFile(filename);
    setShowModal(true);
  };

  const handleSendPermissionRequest = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `http://127.0.0.1:8000/api/permission/${selectedFile}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Demande envoyée avec succès !");
      setRequestedFiles((prev) => [...prev, selectedFile]);
      setShowModal(false);
      setReason("");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
      alert("Erreur lors de l'envoi de la demande.");
    }
  };

  return (
    <div className="container mt-5" style={{ backgroundColor: "#f7f9fc", padding: "2rem", borderRadius: "20px" }}>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4 fw-semibold"
        style={{ color: "#202124" }}
      >
        🔎 Résultats de recherche
      </motion.h2>

      <div className="d-flex justify-content-center mb-5 gap-3 flex-wrap">
        <button
          className={`btn ${activeTab === "auth" ? "btn-primary" : "btn-outline-primary"} rounded-pill px-4 py-2`}
          onClick={() => setActiveTab("auth")}
        >
          <CheckCircle className="me-2" size={18} /> Authentifiés ({results.auth.length})
        </button>
        <button
          className={`btn ${activeTab === "permission" ? "btn-success" : "btn-outline-success"} rounded-pill px-4 py-2`}
          onClick={() => setActiveTab("permission")}
        >
          <KeyRound className="me-2" size={18} /> Permissions ({results.permission.length})
        </button>
        <button
          className={`btn ${activeTab === "not_auth" ? "btn-warning text-white" : "btn-outline-warning"} rounded-pill px-4 py-2`}
          onClick={() => setActiveTab("not_auth")}
        >
          <AlertTriangle className="me-2" size={18} /> Non Authentifiés ({results.not_auth.length})
        </button>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Tab Auth */}
        {activeTab === "auth" && (
          results.auth.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="alert alert-info text-center">
              Aucun document authentifié trouvé.
            </motion.div>
          ) : (
            results.auth.map((result, index) => (
              <motion.div
                key={index}
                className="p-4 mb-4 bg-white rounded-4 shadow-sm"
                whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 150 }}
                style={{ cursor: "pointer", borderLeft: "4px solid #4285F4" }}
                //onClick={(e) => handleFileClick(result.file.filename, e)}
              >
                <h5 className="fw-bold text-dark mb-2 d-flex align-items-center">
                <FaFileAlt className="me-2 text-primary" />
                      <a
                        href="#"
                        onClick={(e) => handleFileClick(result.file.filename, e)}
                        className="hover-link text-decoration-none"
                        style={{ color: "#202124", fontWeight: "bold" }}
                      >
                        {result.file.filename}
                      </a>
                </h5>
                <small className="text-muted">📅 Indexé le {result.file.indexing_date}</small>
                <p className="mt-3 text-secondary" style={{ fontSize: "0.95rem" }} dangerouslySetInnerHTML={{ __html: result.highlight.content.join("...") }} />
              </motion.div>
            ))
          )
        )}

        {/* Tab Permission */}
        {activeTab === "permission" && (
          results.permission.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="alert alert-info text-center">
              Aucun document avec permission trouvé.
            </motion.div>
          ) : (
            results.permission.map((result, index) => (
              <motion.div
                key={index}
                className="p-4 mb-4 bg-white rounded-4 shadow-sm"
                whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 150 }}
                style={{ cursor: "pointer", borderLeft: "4px solid #34A853" }}
                
              >
                <h5 className="fw-bold text-dark mb-2 d-flex align-items-center">
                  <FaFileAlt className="me-2 text-success" />
                      <a
                        href="#"
                        onClick={(e) => handleFileClick(result.file.filename, e)}
                        className="hover-link text-decoration-none"
                        style={{ color: "#202124", fontWeight: "bold" }}
                      >
                        {result.file.filename}
                      </a>
                </h5>
                <small className="text-muted">📅 Indexé le {result.file.indexing_date}</small>
                <p className="mt-3 text-secondary" style={{ fontSize: "0.95rem" }} dangerouslySetInnerHTML={{ __html: result.highlight.content.join("...") }} />
              </motion.div>
            ))
          )
        )}

        {/* Tab Not Auth */}
        {activeTab === "not_auth" && (
          results.not_auth.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="alert alert-info text-center">
              Aucun document non authentifié trouvé.
            </motion.div>
          ) : (
            results.not_auth.map((result, index) => (
              <motion.div
                key={index}
                className="p-4 mb-4 bg-white rounded-4 shadow-sm"
                whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 150 }}
                style={{ cursor: "default", borderLeft: "4px solid #FBBC05" }}
              >
                <h5 className="fw-bold text-dark mb-2 d-flex align-items-center">
                  <FaFileAlt className="me-2 text-warning" />
                  {result.file.filename}
                </h5>
                <small className="text-muted">📅 Indexé le {result.file.indexing_date}</small>
                <p className="mt-3 text-secondary" style={{ fontSize: "0.95rem" }} dangerouslySetInnerHTML={{ __html: result.highlight.content.join("...") }} />
                <div className="mt-3 text-center">
                  {requestedFiles.includes(result.file.filename) ? (
                    <button className="btn btn-secondary btn-sm rounded-pill" disabled>
                      ✅ Demande envoyée
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-secondary btn-sm rounded-pill"
                      onClick={() => handleRequestPermissionClick(result.file.filename)}
                    >
                      🔒 Demander l'autorisation
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Demande d'autorisation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Vous demandez l'accès au fichier : <strong>{selectedFile}</strong></p>
          <Form>
            <Form.Group controlId="reason">
              <Form.Label>Raison de votre demande</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Besoin de consulter pour un dossier juridique..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSendPermissionRequest}>Envoyer la demande</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SearchResults;
