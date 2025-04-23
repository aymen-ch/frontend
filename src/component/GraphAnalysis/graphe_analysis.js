import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { FaLanguage, FaProjectDiagram, FaCogs, FaTachometerAlt, FaChartLine } from 'react-icons/fa';
import './graphe_anaylsis.css';
import Container_AlgorithmicAnalysis from './HorizontalModules/containervisualization/Container_AlgorithmicAnalysis';
import SchemaVisualizer from './HorizontalModules/schema/schema';
import SettingsPage from './HorizontalModules/Settings/SettingsPage';
import Dashboard from './HorizontalModules/DashBoard/Dashboard';
import { GlobalProvider } from './GlobalVariables';

const Graphe_analysis = () => {
  const { t, i18n } = useTranslation();
  const [activeModule, setActiveModule] = useState('Schema');

  const changeLanguage = (lng) => {
    console.log(`Changing language to: ${lng}`);
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
      <Dashboard />
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
          {[
            { key: 'Schema', label: t('Schema visualization'), icon: <FaProjectDiagram /> },
            { key: 'Setting', label: t('Settings'), icon: <FaCogs /> },
            { key: 'Dashboard', label: t('Dashboard'), icon: <FaTachometerAlt /> },
            { key: 'Visualization', label: t('Visualization'), icon: <FaChartLine /> },
          ].map(({ key, label, icon }) => (
            <li
              key={key}
              className={`nav-item ${activeModule === key ? 'active' : ''}`}
              onClick={() => handleModuleClick(key)}
            >
              {icon} <span>{label}</span>
            </li>
          ))}
        </ul>

        <div className="language-dropdown-container">
          <DropdownButton
            id="language-dropdown"
            title={
              <>
                <FaLanguage className="language-icon" /> {t('Language')}: {i18n.language.toUpperCase()}
              </>
            }
            variant="outline-light"
            style={{ zIndex: 30 }}
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
