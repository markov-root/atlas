// src/theme/Root.js
import React from 'react';
import { SettingsProvider } from '../components/Settings';

// This component wraps your entire app and provides global context
export default function Root({ children }) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
}
