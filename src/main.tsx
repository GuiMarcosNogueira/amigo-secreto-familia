import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { observarInstalacao } from './aparelho';
import './estilos/tokens.css';
import './estilos/base.css';

observarInstalacao();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
