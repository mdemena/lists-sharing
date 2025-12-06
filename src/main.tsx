// frontend/src/main.tsx

import React, { createContext, useState, useMemo, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme, CssBaseline, type PaletteMode } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './i18n/config';
import 'flag-icons/css/flag-icons.min.css';

// --- Context para el modo de tema ---
interface ThemeModeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'light',
  toggleTheme: () => { },
});

export const useThemeMode = () => useContext(ThemeModeContext);

// --- Función para crear tema dinámico según el modo ---
const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#667eea' : '#818cf8', // Púrpura/Índigo vibrante
      light: mode === 'light' ? '#818cf8' : '#a5b4fc',
      dark: mode === 'light' ? '#5568d3' : '#6366f1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'light' ? '#06b6d4' : '#22d3ee', // Cyan brillante
      light: mode === 'light' ? '#22d3ee' : '#67e8f9',
      dark: mode === 'light' ? '#0891b2' : '#06b6d4',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f8fafc' : '#0f172a', // Slate claro/oscuro
      paper: mode === 'light' ? '#ffffff' : '#1e293b',
    },
    text: {
      primary: mode === 'light' ? '#1e293b' : '#f1f5f9',
      secondary: mode === 'light' ? '#64748b' : '#cbd5e1',
    },
    success: {
      main: mode === 'light' ? '#10b981' : '#34d399', // Verde esmeralda
      light: mode === 'light' ? '#34d399' : '#6ee7b7',
      dark: mode === 'light' ? '#059669' : '#10b981',
    },
    warning: {
      main: mode === 'light' ? '#f59e0b' : '#fbbf24', // Ámbar
      light: mode === 'light' ? '#fbbf24' : '#fcd34d',
      dark: mode === 'light' ? '#d97706' : '#f59e0b',
    },
    info: {
      main: mode === 'light' ? '#3b82f6' : '#60a5fa', // Azul brillante
      light: mode === 'light' ? '#60a5fa' : '#93c5fd',
      dark: mode === 'light' ? '#2563eb' : '#3b82f6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          transition: 'background 0.3s ease-in-out',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          padding: '10px 28px',
          boxShadow: mode === 'light'
            ? '0 4px 14px rgba(0,0,0,0.08)'
            : '0 4px 14px rgba(0,0,0,0.3)',
          fontWeight: 600,
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0 6px 20px rgba(0,0,0,0.15)'
              : '0 6px 20px rgba(0,0,0,0.5)',
            transform: 'translateY(-2px) scale(1.02)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          },
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        containedPrimary: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #667eea 0%, #818cf8 100%)'
            : 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%)',
          '&:hover': {
            background: mode === 'light'
              ? 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%)'
              : 'linear-gradient(135deg, #a5b4fc 0%, #c7d2fe 100%)',
          },
        },
        containedSecondary: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
            : 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 100%)',
          '&:hover': {
            background: mode === 'light'
              ? 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 100%)'
              : 'linear-gradient(135deg, #67e8f9 0%, #a5f3fc 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: mode === 'light'
            ? '0 8px 32px rgba(0,0,0,0.08)'
            : '0 8px 32px rgba(0,0,0,0.4)',
          border: mode === 'light'
            ? '1px solid rgba(255,255,255,0.8)'
            : '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          background: mode === 'light'
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(30, 41, 59, 0.8)',
          '&:hover': {
            boxShadow: mode === 'light'
              ? '0 12px 40px rgba(0,0,0,0.12)'
              : '0 12px 40px rgba(0,0,0,0.6)',
            transform: 'translateY(-4px)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: mode === 'light'
            ? '0 4px 24px rgba(0,0,0,0.06)'
            : '0 4px 24px rgba(0,0,0,0.3)',
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0 2px 12px rgba(0,0,0,0.04)'
            : '0 2px 12px rgba(0,0,0,0.2)',
        },
        elevation2: {
          boxShadow: mode === 'light'
            ? '0 4px 24px rgba(0,0,0,0.06)'
            : '0 4px 24px rgba(0,0,0,0.3)',
        },
        elevation3: {
          boxShadow: mode === 'light'
            ? '0 8px 32px rgba(0,0,0,0.08)'
            : '0 8px 32px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: mode === 'light'
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          color: mode === 'light' ? '#1e293b' : '#f1f5f9',
          boxShadow: mode === 'light'
            ? '0 2px 16px rgba(0,0,0,0.04)'
            : '0 2px 16px rgba(0,0,0,0.3)',
          borderBottom: mode === 'light'
            ? '1px solid rgba(102,126,234,0.1)'
            : '1px solid rgba(129,140,248,0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#667eea' : '#818cf8',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          fontWeight: 600,
        },
        colorPrimary: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #667eea 0%, #818cf8 100%)'
            : 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%)',
        },
        colorSecondary: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
            : 'linear-gradient(135deg, #22d3ee 0%, #67e8f9 100%)',
        },
      },
    },
  },
});

// --- Componente Provider del Tema ---
function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as PaletteMode) || 'light';
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <Router>
        <AuthProvider>
          <Toaster
            position="top-center"
            gutter={12}
            containerStyle={{
              top: 80, // Below navbar
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxWidth: '400px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f1f5f9',
                },
                style: {
                  background: '#064e3b',
                  border: '1px solid #10b981',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f1f5f9',
                },
                style: {
                  background: '#7f1d1d',
                  border: '1px solid #ef4444',
                },
              },
            }}
          />
          <App />
        </AuthProvider>
      </Router>
    </ThemeModeProvider>
  </React.StrictMode>,
);