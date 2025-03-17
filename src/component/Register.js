import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

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
    if (name === 'firstName') {
      setFirstName(value);
    } else if (name === 'lastName') {
      setLastName(value);
    } else if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validation: Ensure all fields are filled
    if (!firstName || !lastName || !email || !password) {
      setErrorMessage('Tous les champs sont obligatoires.');
      setSuccessMessage('');
      return;
    }

    // Send registration request to the backend
    axios
      .post('http://127.0.0.1:8000/api/register/', {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
      })
      .then((response) => {
        if (response.status === 201) {
          console.log('Inscription réussie:', response.data.details);
          setSuccessMessage(response.data.details || 'Votre compte a été créé avec succès !');
          setErrorMessage('');
          // Optionally redirect to login page after a delay
          setTimeout(() => navigate('/'), 2000);
        } else {
          console.warn('Réponse inattendue:', response);
          setErrorMessage('Une erreur inattendue est survenue.');
          setSuccessMessage('');
        }
      })
      .catch((error) => {
        if (error.response) {
          console.error("Erreur d'inscription:", error.response.data);
          setErrorMessage(error.response.data.error || "Erreur lors de l'inscription.");
          setSuccessMessage('');
        } else if (error.request) {
          console.error('Aucune réponse du serveur:', error.request);
          setErrorMessage('Aucune réponse du serveur. Veuillez réessayer plus tard.');
          setSuccessMessage('');
        } else {
          console.error('Erreur lors de la requête:', error.message);
          setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
          setSuccessMessage('');
        }
      });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header text-center">Inscription</div>
            <div className="card-body">
              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label htmlFor="firstName">Prénom</label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    name="firstName"
                    value={firstName}
                    onChange={handleChange}
                    placeholder="Entrez votre prénom"
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="lastName">Nom</label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    name="lastName"
                    value={lastName}
                    onChange={handleChange}
                    placeholder="Entrez votre nom"
                  />
                </div>
                <div className="form-group mb-3">
                  <label htmlFor="email">Email</label>
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
                  S'inscrire
                </button>
              </form>
              <button type="submit" className="btn btn-secondary m-20"  onClick={()=>navigate('/')}>
                  Login
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;