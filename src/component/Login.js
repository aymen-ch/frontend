import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
const Login = () => {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email || !password) {
      setErrorMessage('Tous les champs sont obligatoires.');
      return;
    }

    axios
      .post('http://192.168.3.6:8000/api/token/', {
        username: email,
        password: password,
      })
      .then((response) => {
        if (response.status === 200) {
          console.log('Authentification réussie:', response.data.access);
          localStorage.setItem('authToken', response.data.access);
          navigate('/home');
          setErrorMessage('');
        } else {
          console.warn('Réponse inattendue:', response);
          setErrorMessage('Une erreur inattendue est survenue.');
          localStorage.removeItem('authToken');
        }
      })
      .catch((error) => {
        localStorage.removeItem('authToken');
        if (error.response) {
          console.error("Erreur d'authentification:", error.response.data);
          setErrorMessage(error.response.data.detail || "Erreur d'authentification.");
        } else if (error.request) {
          console.error('Aucune réponse du serveur:', error.request);
          setErrorMessage('Aucune réponse du serveur. Veuillez réessayer plus tard.');
        } else {
          console.error('Erreur lors de la requête:', error.message);
          setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
        }
      });

    // Réinitialisation ou logique additionnelle si nécessaire
    console.log('Email:', email);
    console.log('Password:', password);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header text-center">Login</div>
            <div className="card-body">
              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="email">Username</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="Entrez votre email"
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="password">Mot de passe</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="Entrez votre mot de passe"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Connexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;