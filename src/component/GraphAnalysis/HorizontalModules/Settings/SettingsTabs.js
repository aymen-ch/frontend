// SettingsTabs.jsx
import React from 'react';
import { Tab, Nav } from 'react-bootstrap';
import ImportTab from './ImportTab';

const SettingsTabs = () => {
  return (
    <Tab.Container defaultActiveKey="general">
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="general">General</Nav.Link>
        </Nav.Item>
        {/* <Nav.Item>
          <Nav.Link eventKey="users">Users</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="security">Security</Nav.Link>
        </Nav.Item> */}
        <Nav.Item>
          <Nav.Link eventKey="import">Import</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey="general">
          <h4>General Settings</h4>
          <p>Mock content for general settings goes here.</p>
        </Tab.Pane>
        <Tab.Pane eventKey="users">
          <h4>User Management</h4>
          <p>Mock content for user settings goes here.</p>
        </Tab.Pane>
        <Tab.Pane eventKey="security">
          <h4>Security Settings</h4>
          <p>Mock content for security settings goes here.</p>
        </Tab.Pane>
        <Tab.Pane eventKey="import">
          <ImportTab />
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default SettingsTabs;