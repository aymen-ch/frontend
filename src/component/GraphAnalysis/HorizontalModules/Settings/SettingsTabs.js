// SettingsTabs.jsx
import React from 'react';
import { Tab, Nav } from 'react-bootstrap';
import ImportTab from './ImportTab';
import GeneralTab from './GeneralTab';

const SettingsTabs = () => {
  return (
    <Tab.Container defaultActiveKey="general">
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="general">General</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="import">Import</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey="general">
           <GeneralTab  />
        </Tab.Pane>
        <Tab.Pane eventKey="import">
          <ImportTab />
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default SettingsTabs;