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
      <nav className="navbar navbar-expand-lg navbar-dark " style={{ backgroundColor: 'white' }}>
        <div className="container-fluid">
          {/* Logo et titre */}
          <div className="d-flex align-items-center">
           HomeGr/paheanalysis
            
          </div>

          {/* Barre de recherche */}
    
         

          {/* Bouton utilisateur */}
        
        </div>
      </nav>

      {/* Recherche avancée */}
      
    </>
  );
};

export default Navbars;
