import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, User, Calendar, Check, X } from 'lucide-react';

const Permission = () => {
  const [acceptedDocs, setAcceptedDocs] = useState([]);
  const [refusedDocs, setRefusedDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [refusedRequests, setRefusedRequests] = useState([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/documents/permission', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });

        const accepted = response.data.documents_accepted.map((doc, index) => ({
          id: index + 1,
          filename: doc.filename,
          owner: doc.owner,
          requestDate: doc.request_date.split('T')[0],
          acceptedDate: doc.response_date ? doc.response_date.split('T')[0] : '',
          link: doc.filename,
        }));

        const requests = response.data.documents_resquest.map((req, index) => ({
          id: req.id,
          documentName: req.filename,
          requester: req.user_request,
          requestDate: req.request_date.split('T')[0],
          docLink: req.filename,
          reason: req.reason || 'Aucun motif fourni',
          permission_id: req.permission_id,
        }));

        setAcceptedDocs(accepted);
        setConsultationRequests(requests);

        // Exemples statiques pour refusés / en attente
        setRefusedDocs([{ id: 1, filename: 'Refusé_doc1.pdf', owner: 'Admin', requestDate: '2024-03-01' }]);
        setPendingDocs([{ id: 1, filename: 'EnAttente_doc1.pdf', owner: 'UserTest', requestDate: '2024-03-05' }]);
        setAcceptedRequests([{ id: 1, documentName: 'DemandeAcceptée_doc1.pdf', requester: 'UserA', requestDate: '2024-02-15' }]);
        setRefusedRequests([{ id: 1, documentName: 'DemandeRefusée_doc1.pdf', requester: 'UserB', requestDate: '2024-02-10' }]);
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
      }
    };

    fetchPermissions();
  }, []);

  const handleAccept = async (permission_id, e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/documents/permission/accept/${permission_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.status === 200) {
        alert(response.data.details);
      }
    } catch (error) {
      alert("Erreur lors de l'acceptation : " + (error.response?.data?.error || 'inconnue'));
    }
  };

  const handleRefuse = async (permission_id, e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/documents/permission/denied/${permission_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      if (response.status === 200) {
        alert(response.data.details);
      }
    } catch (error) {
      alert("Erreur lors du refus : " + (error.response?.data?.error || 'inconnue'));
    }
  };

  const handleFileClick = async (filename, e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/media/${filename}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
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
      console.error("Erreur de téléchargement :", error);
    }
  };

  const renderCard = (title, count, items, renderItem) => (
    <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: '15px', minHeight: '250px' }}>
      <div className="card-header d-flex justify-content-between align-items-center text-white" style={{ background: '#2c5364', borderRadius: '15px 15px 0 0', fontSize: '1rem' }}>
        <span>{title}</span>
        <span className="badge bg-light text-dark">{count}</span>
      </div>
      <ul className="list-group list-group-flush overflow-auto" style={{ maxHeight: '200px' }}>
        {items.map(renderItem)}
      </ul>
    </div>
  );

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-md-6">
          {renderCard('Documents Acceptés', acceptedDocs.length, acceptedDocs, (doc) => (
            <li key={doc.id} className="list-group-item small">
              <a href="#" onClick={(e) => handleFileClick(doc.link, e)} className="text-decoration-none fw-bold">
                <FileText size={16} className="me-2 text-primary" /> {doc.filename}
              </a>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                <User size={10} className="me-1" /> {doc.owner} | <Calendar size={10} /> {doc.requestDate}
              </div>
            </li>
          ))}

          {renderCard('Documents Refusés', refusedDocs.length, refusedDocs, (doc) => (
            <li key={doc.id} className="list-group-item small">
              <FileText size={16} className="me-2 text-danger" /> {doc.filename}
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                <User size={10} className="me-1" /> {doc.owner} | <Calendar size={10} /> {doc.requestDate}
              </div>
            </li>
          ))}

          {renderCard('Documents en Attente', pendingDocs.length, pendingDocs, (doc) => (
            <li key={doc.id} className="list-group-item small">
              <FileText size={16} className="me-2 text-warning" /> {doc.filename}
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                <User size={10} className="me-1" /> {doc.owner} | <Calendar size={10} /> {doc.requestDate}
              </div>
            </li>
          ))}
        </div>

        <div className="col-md-6">
          {renderCard('Demandes de Consultation', consultationRequests.length, consultationRequests, (req) => (
            <li key={req.id} className="list-group-item small">
              <a href="#" onClick={(e) => handleFileClick(req.docLink, e)} className="text-decoration-none fw-bold">
                <FileText size={16} className="me-2 text-primary" /> {req.documentName}
              </a>
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  <User size={10} className="me-1" /> {req.requester} | <Calendar size={10} /> {req.requestDate}
                </div>
                <div>
                  <button className="btn btn-sm btn-success me-2" onClick={(e) => handleAccept(req.permission_id, e)}>
                    <Check size={14} />
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={(e) => handleRefuse(req.permission_id, e)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}

          {renderCard('Demandes Acceptées', acceptedRequests.length, acceptedRequests, (req) => (
            <li key={req.id} className="list-group-item small">
              <FileText size={16} className="me-2 text-success" /> {req.documentName}
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                <User size={10} className="me-1" /> {req.requester} | <Calendar size={10} /> {req.requestDate}
              </div>
            </li>
          ))}

          {renderCard('Demandes Refusées', refusedRequests.length, refusedRequests, (req) => (
            <li key={req.id} className="list-group-item small">
              <FileText size={16} className="me-2 text-danger" /> {req.documentName}
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                <User size={10} className="me-1" /> {req.requester} | <Calendar size={10} /> {req.requestDate}
              </div>
            </li>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Permission;
