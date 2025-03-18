import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbars = () => {
  const [search, setSearch] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/home/search?query=${encodeURIComponent(search.trim())}`);
      setSearch(''); // Reset search bar after navigation
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: 'white' }}>
        <div className="container-fluid">
          <div className="d-flex align-items-center">
           
            <div className="ms-3 p-2 bg-light rounded shadow-sm text-muted" style={{ fontSize: '0.9rem' }}>
            
              <span className="fw-semibold text-dark ms-1">
                {location.pathname === '/' ? 'Home' : location.pathname}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbars;