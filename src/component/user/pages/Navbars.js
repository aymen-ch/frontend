import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbars = () => {
  const [search, setSearch] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/home/search?query=${encodeURIComponent(search.trim())}`);
      setSearch(''); // Réinitialise la barre de recherche après la navigation
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark py-3" style={{ backgroundColor: '#117a65' }}>
        <div className="container-fluid">
          {/* Logo et titre */}
          <div className="d-flex align-items-center">
            <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center" style={{ width: '50px', height: '50px' }}>
              {/* Placeholder pour logo */}
            </div>
            <span className="ms-3 h4 text-white">Gendarmerie Nationale</span>
          </div>

          {/* Barre de recherche */}
          <form
            className="d-flex flex-grow-1 mx-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="input-group">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                placeholder="Rechercher"
              />
              <button
                className="btn btn-light"
                type="button"
                onClick={handleSearch}
              >
                <i className="bi bi-search"></i>
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <i className="bi bi-funnel"></i>
              </button>
            </div>
          </form>

          {/* Bouton utilisateur */}
          <div className="dropdown" style={{ marginRight: '100px' }}>
            <button
              className="btn btn-light dropdown-toggle"
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              Utilisateur
            </button>
            {showDropdown && (
              <ul className="dropdown-menu dropdown-menu-end show ">
                <li><a className="dropdown-item" href="#">Modifier le profil</a></li>
                <li><a className="dropdown-item" href="#">Changer le mot de passe</a></li>
                <li><a className="dropdown-item" href="#">Déconnexion</a></li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {/* Recherche avancée */}
      {showAdvancedSearch && (
        <div className="bg-light p-3 mt-3">
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="typeRecherche" className="form-label">Type de recherche</label>
              <select className="form-select" id="typeRecherche">
                <option value="tout">Tout</option>
                <option value="titre">Titre</option>
                <option value="description">Description</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="datePublication" className="form-label">Date de publication</label>
              <input type="date" className="form-control" id="datePublication" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbars;
