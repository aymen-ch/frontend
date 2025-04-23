import React, { useState } from 'react';
import './graphe_anaylsis.css'
import Container_AlgorithmicAnalysis from './HorizontalModules/containervisualization/Container_AlgorithmicAnalysis';
import SchemaVisualizer from './HorizontalModules/schema/schema';
import SettingsPage from './HorizontalModules/Settings/SettingsPage';
import { GlobalProvider } from './GlobalVariables';
import Dashboard from './HorizontalModules/DashBoard/Dashboard'; // Add this import
const Graphe_analysis = () => {
  const [activeModule, setActiveModule] = useState('Schema'); // Default active module


  // Handler for module navigation clicks
  const handleModuleClick = (module) => {
    setActiveModule(module);
  };

  // Components for each module (you can customize these)
  const SchemaPage = () => (
    <div className="module-content">
        <GlobalProvider>
      <SchemaVisualizer/>
      </GlobalProvider>
    </div>
  );

  const SettingPage = () => (
    <div className="module-content">
        <SettingsPage/>
    </div>
  );

  const DashboardPage = () => (
    <div className="module-content">
      <Dashboard/> {/* Use the Dashboard component here */}
    </div>
  );

  const VisualizationPage = () => (
    <div className="module-content">
     <GlobalProvider>
      <Container_AlgorithmicAnalysis/>
      </GlobalProvider>
    </div>
  );

  // Map of module names to their components
  const moduleComponents = {
    Schema: SchemaPage,
    Setting: SettingsPage, // Use the new SettingsPage component
    Dashboard: DashboardPage,
    Visualization: VisualizationPage,
  };

  // Get the current module component
  const ActiveModuleComponent = moduleComponents[activeModule];

  return (
    <div className="app-container">
      {/* Navigation Bar at the Top */}
      <nav className="navbar-horizontal">
        <ul className="navbar-nav">
          {['Schema', 'Setting', 'Dashboard', 'Visualization'].map((module) => (
            <li
              key={module}
              className={`nav-item ${activeModule === module ? 'active' : ''}`}
              onClick={() => handleModuleClick(module)}
            >
              {module}
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content Area */}
      <div className="container-fluid test">
        <ActiveModuleComponent />
      </div>

      {/* TimelineBar at the Bottom */}
     
    </div>
  );
};

export default Graphe_analysis;