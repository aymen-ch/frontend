import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'email') setEmail(value);
    else if (name === 'password') setPassword(value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setErrorMessage('Tous les champs sont obligatoires.');
      return;
    }

    axios
      .post('http://127.0.0.1:8000/api/token/', { username: email, password })
      .then((response) => {
        if (response.status === 200) {
          localStorage.setItem('authToken', response.data.access);
          navigate('/home');
          setErrorMessage('');
        } else {
          setErrorMessage('Une erreur inattendue est survenue.');
          localStorage.removeItem('authToken');
        }
      })
      .catch((error) => {
        localStorage.removeItem('authToken');
        if (error.response) {
          setErrorMessage(error.response.data.detail || "Erreur d'authentification.");
        } else if (error.request) {
          setErrorMessage('Aucune réponse du serveur. Veuillez réessayer plus tard.');
        } else {
          setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
        }
      });
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 login-background">
      <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '420px', borderRadius: '25px' }}>
        <div
          className="card-header text-center text-white"
          style={{
            borderRadius: '20px 20px 0 0',
            background: 'linear-gradient(135deg, #43cea2, #185a9d)',
          }}
        >
          <h3><FaSignInAlt /> Connexion</h3>
        </div>
        <div className="card-body">
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="email"><FaUser className="me-2" />Nom d'utilisateur</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="Votre email"
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
                placeholder="Votre mot de passe"
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
              <FaSignInAlt className="me-2" />Se connecter
            </button>
            <button
              type="button"
              className="btn btn-outline-success w-100"
              style={{ transition: '0.3s ease' }}
              onClick={() => navigate('/register')}
            >
              <FaUserPlus className="me-2" />Créer un compte
            </button>
          </form>
        </div>
        <div className="text-center text-muted mt-3" style={{ fontSize: '0.8rem' }}>
          Développé par le Centre de Recherche et Développement de la Gendarmerie Nationale
        </div>
      </div>

      <style jsx="true">{`
        .login-background {
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

export default Login;
