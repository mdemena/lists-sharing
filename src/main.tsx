// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';

// --- Tema Moderno y Vibrante ---
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1', // Indigo vibrante
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Pink vibrante para acentos
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Slate 50 (muy claro)
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Slate 800
      secondary: '#64748b', // Slate 500
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 }, // Botones sin mayúsculas forzadas
  },
  shape: {
    borderRadius: 12, // Bordes más redondeados globalmente
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Fondo con gradiente sutil
          background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px', // Botones tipo "píldora"
          padding: '8px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Sombra suave al hover
            transform: 'translateY(-1px)', // Ligero efecto de elevación
          },
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)', // Gradiente en botones primarios
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', // Sombra muy suave y difusa
          border: '1px solid rgba(255,255,255,0.5)', // Borde sutil
          backdropFilter: 'blur(10px)', // Efecto glassmorphism (si hay fondo detrás)
          background: 'rgba(255, 255, 255, 0.8)', // Fondo semi-transparente
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)', // Navbar semi-transparente
          backdropFilter: 'blur(12px)',
          color: '#1e293b', // Texto oscuro
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // Sombra mínima
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. Proveedor de Estilos */}
    <ThemeProvider theme={theme}>
      <CssBaseline />
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