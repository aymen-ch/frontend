import React, { useState } from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CDBSidebar textColor="#fff" backgroundColor="rgb(68 78 100)" style={{ height: '100vh' }}>
        <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large"></i>}>
          <a href="/" className="text-decoration-none" style={{ color: 'inherit' }}>
            PICIC
          </a>
        </CDBSidebarHeader>

        <div style={{ display: 'flex', flexDirection: 'column', height: '70%' }}>
          <CDBSidebarContent className="sidebar-content" style={{ flex: 1, overflowY: 'auto' }}>
            <CDBSidebarMenu>
              {/* <NavLink exact="true" to="/home" activeclassname="activeClicked">
                <CDBSidebarMenuItem icon="columns">Moteur de recherche</CDBSidebarMenuItem>
              </NavLink> */}
              <NavLink exact="true" to="/home/upload" activeclassname="activeClicked">
                <CDBSidebarMenuItem icon="table">Upload Files</CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact="true" to="/profile" activeclassname="activeClicked">
                <CDBSidebarMenuItem icon="user">Search metadata</CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact="true" to="/home/permission" activeclassname="activeClicked">
                <CDBSidebarMenuItem icon="key">Permissions d'accès</CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact="true" to="analytics/AlgorithmicAnalysis" activeclassname="activeClicked">
                <CDBSidebarMenuItem icon="chart-line">Algorithmic Analysis</CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact="true" to="/hero404" target="_blank" activeclassname="activeClicked">
                <CDBSidebarMenuItem icon="exclamation-circle">Annotation</CDBSidebarMenuItem>
              </NavLink>
            </CDBSidebarMenu>
          </CDBSidebarContent>

          <CDBSidebarFooter style={{ padding: '20px', textAlign: 'center' }}>
            {/* <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgb(255, 76, 76)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Déconnexion
            </button> */}
          </CDBSidebarFooter>
        </div>
      </CDBSidebar>

      <style jsx>{`
        .active li {
          background-color: rgb(81, 140, 168) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
