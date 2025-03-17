import React, { useState } from 'react';
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from 'cdbreact';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [isGraphAnalysisOpen, setIsGraphAnalysisOpen] = useState(false);

  const toggleGraphAnalysis = () => {
    setIsGraphAnalysisOpen(!isGraphAnalysisOpen);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <CDBSidebar textColor="#fff" backgroundColor="rgb(68 78 100)">
        <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large"></i>}>
          <a href="/" className="text-decoration-none" style={{ color: 'inherit' }}>
            PICIC
          </a>
        </CDBSidebarHeader>

        <CDBSidebarContent className="sidebar-content">
          <CDBSidebarMenu>
            <NavLink exact to="/home" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="columns">Dashboard</CDBSidebarMenuItem>
            </NavLink>
            <NavLink exact to="/home/upload" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="table">Upload Files</CDBSidebarMenuItem>
            </NavLink>
            <NavLink exact to="/profile" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="user">Search metadata</CDBSidebarMenuItem>
            </NavLink>

            {/* Graph Analysis with Sub-options */}
           
            <NavLink exact to="analytics/AlgorithmicAnalysis" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="chart-line">Algorithmic Analysis</CDBSidebarMenuItem>
            </NavLink>
            <NavLink exact to="/hero404" target="_blank" activeClassName="activeClicked">
              <CDBSidebarMenuItem icon="exclamation-circle">Annotation</CDBSidebarMenuItem>
            </NavLink>
          </CDBSidebarMenu>
        </CDBSidebarContent>
        {/*
        <CDBSidebarFooter style={{ textAlign: 'center' }}>
          <div style={{ padding: '20px 5px' }}>
            Sidebar Footer
          </div>
        </CDBSidebarFooter>  */}
      </CDBSidebar>
    </div>
  );
};

export default Sidebar;
