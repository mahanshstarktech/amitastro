import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/design-system.css';
import './index.css';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { CountryProvider } from './context/CountryContext';
import { HeaderActionsProvider } from './context/HeaderActionsContext';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <CountryProvider>
        <NotificationProvider>
          <AuthProvider>
            <HeaderActionsProvider>
              <App />
            </HeaderActionsProvider>
          </AuthProvider>
        </NotificationProvider>
      </CountryProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
