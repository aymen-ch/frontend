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

// Ce composant est le conteneur principal du projet, dédié à l'analyse, l'interrogation et la visualisation.
// Il inclut une barre de navigation horizontale pour basculer entre les différents modules : schéma, importation (paramètres), tableau de bord et visualisation.
const Graphe_analysis = () => {
  // Hook pour gérer les traductions et la langue
  const { t, i18n } = useTranslation();
  // État pour suivre le module actif (par défaut : Schema)
  const [activeModule, setActiveModule] = useState('Schema');

  // Change la langue de l'application
  const changeLanguage = (lng) => {
    console.log(`Changement de langue vers : ${lng}`);
    i18n.changeLanguage(lng);
  };

  // Gère le clic sur un module pour le rendre actif
  const handleModuleClick = (module) => {
    setActiveModule(module);
  };

  // Composant pour afficher la page du schéma
  const SchemaPage = () => (
    <div className="module-content">
      <GlobalProvider>
        <SchemaVisualizer />
      </GlobalProvider>
    </div>
  );

  // Composant pour afficher la page des paramètres
  const SettingPage = () => (
    <div className="module-content">
      <SettingsPage />
    </div>
  );

  // Composant pour afficher la page du tableau de bord
  const DashboardPage = () => (
    <div className="module-content">
      <Dashboard />
    </div>
  );

  // Composant pour afficher la page de visualisation
  const VisualizationPage = () => (
    <div className="module-content">
      <GlobalProvider>
        <Container_AlgorithmicAnalysis />
      </GlobalProvider>
    </div>
  );

  // Objet associant chaque module à son composant correspondant
  const moduleComponents = {
    Schema: SchemaPage,
    Setting: SettingPage,
    Dashboard: DashboardPage,
    Visualization: VisualizationPage,
  };

  // Composant actif basé sur l'état activeModule
  const ActiveModuleComponent = moduleComponents[activeModule];

  // Classes de base pour les éléments de navigation
  const navItemBaseClasses = "flex items-center gap-2 mx-3 md:mx-2.5 px-3.5 md:px-3 py-2 md:py-2 text-base md:text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out rounded-md text-white hover:bg-white/15 hover:-translate-y-px";
  // Classes pour l'élément de navigation actif
  const navItemActiveClasses = "bg-white/25 shadow-[0_3px_8px_rgba(0,0,0,0.2)]";

  return (
    // Conteneur principal de l'application
    <div className="app-container">
      {/* Barre de navigation avec dégradé et ombre */}
      <nav className="flex justify-between items-center px-5 md:px-2.5 bg-gradient-to-r from-[#5f7c57] to-[#7ba66e] shadow-[0_4px_12px_rgba(0,0,0,0.15)] min-h-[64px] text-white font-['Segoe_UI',_sans-serif] w-full flex-nowrap">
        {/* Liste des modules dans la barre de navigation */}
        <ul className="flex list-none m-0 p-0 items-center">
          {[
            { key: 'Schema', label: t('Schema visualization'), icon: <FaProjectDiagram /> },
            { key: 'Setting', label: t('Settings'), icon: <FaCogs /> },
            { key: 'Dashboard', label: t('Dashboard'), icon: <FaTachometerAlt /> },
            { key: 'Visualization', label: t('Visualization'), icon: <FaChartLine /> },
          ].map(({ key, label, icon }) => (
            // Élément de navigation pour chaque module
            <li
              key={key}
              className={`${navItemBaseClasses} ${activeModule === key ? navItemActiveClasses : ''}`}
              onClick={() => handleModuleClick(key)}
            >
              {icon} <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* Menu déroulant pour le choix de la langue vous pouver ajouter la langue anglais */}
        <div className="relative z-[2000]">
          <DropdownButton
            id="language-dropdown"
            title={
              <>
                <FaLanguage className="mr-2" /> {t('Language')}: {i18n.language.toUpperCase()}
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

      {/* Conteneur pour le module actif */}
      <div className="container-fluid test">
        <ActiveModuleComponent />
      </div>
    </div>
  );
};

export default Graphe_analysis;