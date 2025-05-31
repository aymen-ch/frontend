import React from 'react';
import { Tab, Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'; // Importing the translation hook
import ImportTab from './ImportTab';
import Summary_Statistics from './Summary_Statistics';

///****
// 
// Nav bar of of 2 tabs : ImportTab and GeneralTab
// 
// 
// 
//  */

const SettingsTabs = () => {
  const { t } = useTranslation(); // Initialize the translation hook

  return (
    <Tab.Container defaultActiveKey="general">
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="general">{t('General')}</Nav.Link> {/* Translated Tab Title */}
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="import">{t('Import')}</Nav.Link> {/* Translated Tab Title */}
        </Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey="general">
           <Summary_Statistics />
        </Tab.Pane>
        <Tab.Pane eventKey="import">
          <ImportTab />
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default SettingsTabs;
