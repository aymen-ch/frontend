import React, { useState } from 'react';
import { Container, Row, Col, DropdownButton, Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaLanguage } from 'react-icons/fa';  // Importing an icon
import { BASE_URL } from '../../utils/Urls';
import DatabaseManager from './DatabaseManager';
import SettingsTabs from './SettingsTabs';
import './SettingsPage.css';
import { DatabaseProvider } from './DatabaseContext';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = localStorage.getItem('authToken');

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng); // Change the language dynamically
  };

  return (
    <DatabaseProvider>
      <Container fluid className="settings-page my-4">
        
        {/* Language Selection Dropdown at the top */}
        <Row className="mb-4">
          <Col>
            <DropdownButton
              id="language-dropdown"
              title={<><FaLanguage /> {t('Change Language')} ({i18n.language.toUpperCase()})</>}  // Display the current language code
              variant="outline-secondary"
              className="mb-3"
            >
              <Dropdown.Item onClick={() => changeLanguage('fr')}>
                {t('French')}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => changeLanguage('ar')}>
                {t('Arabic')}
              </Dropdown.Item>
            </DropdownButton>
          </Col>
        </Row>

        {/* Settings Page Content */}
        <h2 className="mb-4">{t('Settings')}</h2>
        <Row>
          <Col md={6} className="database-section">
            <DatabaseManager
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
              token={token}
              baseUrl={BASE_URL}
            />
          </Col>
          <Col md={6} className="tabs-section">
            <SettingsTabs />
          </Col>
        </Row>
      </Container>
    </DatabaseProvider>
  );
};

export default SettingsPage;
