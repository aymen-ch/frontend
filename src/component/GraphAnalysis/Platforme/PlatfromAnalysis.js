import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { FaLanguage, FaProjectDiagram, FaCogs, FaTachometerAlt, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

import Container_AlgorithmicAnalysis from '../Modules/ContainersModules/ContainerModules';
import SchemaVisualizer from '../Modules/ConfigurationModule/SchemaVisualisation/schema';
import SettingsPage from '../Modules/ConfigurationModule/Importation/SettingsPage';
import Dashboard from '../Modules/ConfigurationModule/Dachboard/Dashboard';
import { GlobalProvider } from './GlobalVariables';

const Graphe_analysis = () => {
  const { t, i18n } = useTranslation();
  const [activeModule, setActiveModule] = useState('Schema');
 
  // Fetch visualizations from backend on mount


  const changeLanguage = (lng) => {
    console.log(`Changing language to: ${lng}`);
    i18n.changeLanguage(lng);
  };

  const handleModuleClick = (module) => {
    setActiveModule(module);
  };





  // Add a new visualization to the list


  const SchemaPage = () => (
    <div className="module-content"> {/* Kept as is, not styled by PlatformAnalysis.css */}
      <GlobalProvider>
        <SchemaVisualizer />
      </GlobalProvider>
    </div>
  );

  const SettingPage = () => (
    <div className="module-content"> {/* Kept as is */}
      <SettingsPage />
    </div>
  );

  const DashboardPage = () => (
    <div className="module-content"> {/* Kept as is */}
      <Dashboard />
    </div>
  );

  const VisualizationPage = () => (
    <div className="module-content"> {/* Kept as is */}
      <GlobalProvider>
    
          <Container_AlgorithmicAnalysis />
      </GlobalProvider>
    </div>
  );

  const moduleComponents = {
    Schema: SchemaPage,
    Setting: SettingPage,
    Dashboard: DashboardPage,
    Visualization: VisualizationPage,
  };

  const ActiveModuleComponent = moduleComponents[activeModule];

  // Define base and active classes for nav items
  const navItemBaseClasses = "flex items-center gap-2 mx-3 md:mx-2.5 px-3.5 md:px-3 py-2 md:py-2 text-base md:text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out rounded-md text-white hover:bg-white/15 hover:-translate-y-px";
  const navItemActiveClasses = "bg-white/25 shadow-[0_3px_8px_rgba(0,0,0,0.2)]";

  return (
    <div className="app-container"> {/* Kept as is */}
      {/* Apply Tailwind classes to the navbar */}
      <nav className="flex justify-between items-center px-5 md:px-2.5 bg-gradient-to-r from-[#5f7c57] to-[#7ba66e] shadow-[0_4px_12px_rgba(0,0,0,0.15)] min-h-[64px] text-white font-['Segoe_UI',_sans-serif] w-full flex-nowrap">
        {/* Apply Tailwind classes to the nav list */}
        <ul className="flex list-none m-0 p-0 items-center">
          {[
            { key: 'Schema', label: t('Schema visualization'), icon: <FaProjectDiagram /> },
            { key: 'Setting', label: t('Settings'), icon: <FaCogs /> },
            { key: 'Dashboard', label: t('Dashboard'), icon: <FaTachometerAlt /> },
            { key: 'Visualization', label: t('Visualization'), icon: <FaChartLine /> },
          ].map(({ key, label, icon }) => (
            <li
              key={key}
              // Combine base, hover, and conditional active classes
              className={`${navItemBaseClasses} ${activeModule === key ? navItemActiveClasses : ''}`}
              onClick={() => handleModuleClick(key)}
            >
              {icon} <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* Apply Tailwind classes to the dropdown container */}
        <div className="relative z-[2000]">
          <DropdownButton
            id="language-dropdown"
            title={
              <>
                {/* Added margin to the language icon */}
                <FaLanguage className="mr-2" /> {t('Language')}: {i18n.language.toUpperCase()}
              </>
            }
            variant="outline-light"
            // Keep inline style for z-index if needed, though Tailwind class is applied to parent
            style={{ zIndex: 30 }} 
          >
            <Dropdown.Item onClick={() => changeLanguage('ar')}>{t('Arabic')}</Dropdown.Item>
            <Dropdown.Item onClick={() => changeLanguage('fr')}>{t('French')}</Dropdown.Item>
          </DropdownButton>
        </div>
      </nav>

      <div className="container-fluid test"> {/* Kept as is */}
        <ActiveModuleComponent />
      </div>
    </div>
  );
};

export default Graphe_analysis;

