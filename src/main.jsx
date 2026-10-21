import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import './index.css';
import './theme.css';

// Grabs the empty <div> in your index.html
const rootElement = document.getElementById('root');

// Injects the entire React application into the screen safely
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error("Root element not found. Application failed to mount.");
}
