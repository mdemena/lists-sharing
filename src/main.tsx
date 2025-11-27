// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';

// Opcional: Personalizar un tema base de Chakra UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#673ab7', // Un tono púrpura de Material Design
    },
    background: {
      default: '#f7f9fa', // Simula el 'gray.50' de Chakra
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. Proveedor de Estilos */}
    <ThemeProvider theme={theme}>
      {/* 2. Proveedor de Rutas */}
      <Router>
        {/* 3. Proveedor de Autenticación */}
        <AuthProvider>
          {/* Toaster se mantiene, ya que es independiente */}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <App />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  </React.StrictMode>,
);