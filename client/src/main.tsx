import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/design-system.css';
import './index.css';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
