import React, { useState } from 'react';
import './graphe_anaylsis.css'
import Container_AlgorithmicAnalysis from './Container_AlgorithmicAnalysis';
import { GlobalProvider } from './GlobalVariables';
const Graphe_analysis = () => {
  const [activeModule, setActiveModule] = useState('Schema'); // Default active module


  // Handler for module navigation clicks
  const handleModuleClick = (module) => {
    setActiveModule(module);
  };

  // Components for each module (you can customize these)
  const SchemaPage = () => (
    <div className="module-content">
      <h2>Schema Page</h2>
      <p>This is the Schema module content.</p>
    </div>
  );

  const SettingPage = () => (
    <div className="module-content">
      <h2>Settings Page</h2>
      <p>This is the Settings module content.</p>
    </div>
  );

  const DashboardPage = () => (
    <div className="module-content">
      <h2>Dashboard Page</h2>
      <p>This is the Dashboard module content.</p>
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
    Setting: SettingPage,
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