// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';

// Opcional: Personalizar un tema base de Chakra UI
const theme = extendTheme({
  colors: {
    purple: {
      500: '#805AD5', // Color principal para botones y acentos
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. Proveedor de Estilos */}
    <ChakraProvider theme={theme}>
      {/* 2. Proveedor de Rutas */}
      <Router>
        {/* 3. Proveedor de Autenticación */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ChakraProvider>
  </React.StrictMode>,
);