import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'firstName') setFirstName(value);
    else if (name === 'lastName') setLastName(value);
    else if (name === 'email') setEmail(value);
    else if (name === 'password') setPassword(value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setErrorMessage('Tous les champs sont obligatoires.');
      setSuccessMessage('');
      return;
    }

    axios
      .post('http://127.0.0.1:8000/api/register/', {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
      })
      .then((response) => {
        if (response.status === 201) {
          setSuccessMessage(response.data.details || 'Votre compte a été créé avec succès !');
          setErrorMessage('');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setErrorMessage('Une erreur inattendue est survenue.');
          setSuccessMessage('');
        }
      })
      .catch((error) => {
        if (error.response) {
          setErrorMessage(error.response.data.error || "Erreur lors de l'inscription.");
          setSuccessMessage('');
        } else if (error.request) {
          setErrorMessage('Aucune réponse du serveur. Veuillez réessayer plus tard.');
          setSuccessMessage('');
        } else {
          setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
          setSuccessMessage('');
        }
      });
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 register-background">
      <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '450px', borderRadius: '25px' }}>
        <div
          className="card-header text-center text-white"
          style={{
            borderRadius: '20px 20px 0 0',
            background: 'linear-gradient(135deg, #43cea2, #185a9d)',
          }}
        >
          <h3><FaUserPlus /> Créer un compte</h3>
        </div>
        <div className="card-body">
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="firstName"><FaUser className="me-2" />Prénom</label>
              <input
                type="text"
                className="form-control"
                id="firstName"
                name="firstName"
                value={firstName}
                onChange={handleChange}
                placeholder="Entrez votre prénom"
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="lastName"><FaUser className="me-2" />Nom</label>
              <input
                type="text"
                className="form-control"
                id="lastName"
                name="lastName"
                value={lastName}
                onChange={handleChange}
                placeholder="Entrez votre nom"
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="email"><FaEnvelope className="me-2" />Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="Entrez votre email"
                required
              />
            </div>
            <div className="form-group mb-4">
              <label htmlFor="password"><FaLock className="me-2" />Mot de passe</label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-success w-100 mb-3"
              style={{
                transition: '0.3s ease',
                background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                border: 'none',
              }}
            >
              <FaUserPlus className="me-2" /> S'inscrire
            </button>
            <button
              type="button"
              className="btn btn-outline-success w-100"
              style={{ transition: '0.3s ease' }}
              onClick={() => navigate('/')}
            >
              <FaSignInAlt className="me-2" />Retour à la connexion
            </button>
          </form>
        </div>
        <div className="text-center text-muted mt-3" style={{ fontSize: '0.8rem' }}>
          Développé par le Centre de Recherche et Développement de la Gendarmerie Nationale
        </div>
      </div>

      <style jsx="true">{`
        .register-background {
          background: linear-gradient(120deg, #f0f4f8, #d9e4f5);
        }

        .btn-success:hover {
          background: linear-gradient(135deg, #66bb6a, #388e3c);
          transform: translateY(-2px);
        }

        .btn-outline-success:hover {
          background-color: #4caf50;
          color: #fff;
          transform: scale(1.03);
        }
      `}</style>
    </div>
  );
};

export default Register;
