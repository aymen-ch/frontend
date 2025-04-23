import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { FaLanguage } from 'react-icons/fa';
import './graphe_anaylsis.css';
import Container_AlgorithmicAnalysis from './HorizontalModules/containervisualization/Container_AlgorithmicAnalysis';
import SchemaVisualizer from './HorizontalModules/schema/schema';
import SettingsPage from './HorizontalModules/Settings/SettingsPage';
import { GlobalProvider } from './GlobalVariables';

const Graphe_analysis = () => {
  const { t, i18n } = useTranslation();
  const [activeModule, setActiveModule] = useState('Schema');

  const changeLanguage = (lng) => {
    console.log(`Changing language to: ${lng}`); // Debug log
    i18n.changeLanguage(lng);
  };

  const handleModuleClick = (module) => {
    setActiveModule(module);
  };

  const SchemaPage = () => (
    <div className="module-content">
      <GlobalProvider>
        <SchemaVisualizer />
      </GlobalProvider>
    </div>
  );

  const SettingPage = () => (
    <div className="module-content">
      <SettingsPage />
    </div>
  );

  const DashboardPage = () => (
    <div className="module-content">
      <h2>{t('Dashboard')}</h2>
      <p>{t('This is the Dashboard module content.')}</p>
    </div>
  );

  const VisualizationPage = () => (
    <div className="module-content">
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

  return (
    <div className="app-container">
      <nav className="navbar-horizontal">
        <ul className="navbar-nav">
          {['Schema', 'Setting', 'Dashboard', 'Visualization'].map((module) => (
            <li
              key={module}
              className={`nav-item ${activeModule === module ? 'active' : ''}`}
              onClick={() => handleModuleClick(module)}
            >
              {t(module === 'Schema' ? 'Schema visualization' : module === 'Setting' ? 'Settings' : module)}
            </li>
          ))}
        </ul>
        <div className="language-dropdown-container" >
  <DropdownButton
    id="language-dropdown"
    title={
      <>
        <FaLanguage className="language-icon" /> {t('Language')}: {i18n.language.toUpperCase()}
      </>
    }
    style={{ zIndex: 2000 }}
  >
    <Dropdown.Item onClick={() => changeLanguage('ar')}>{t('Arabic')}</Dropdown.Item>
    <Dropdown.Item onClick={() => changeLanguage('fr')}>{t('French')}</Dropdown.Item>
  </DropdownButton>
</div>

      </nav>

      <div className="container-fluid test">
        <ActiveModuleComponent />
      </div>
    </div>
  );
};

export default Graphe_analysis;