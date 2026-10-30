import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Before ReactDOM.createRoot, apply stored theme immediately to prevent FOIT
const storedTheme = localStorage.getItem('theme') || localStorage.getItem('ai_validate_theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
} else {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
