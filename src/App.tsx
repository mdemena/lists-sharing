// frontend/src/App.tsx

import { Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import NavBar from './components/NavBar.tsx'; // Importamos el NavBar
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Importamos las páginas principales desarrolladas
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ListView from './pages/ListView.tsx';
import Home from './pages/Home.tsx';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Ruta de Acceso Compartido */}
        <Route path="/share/:listId" element={<ListView />} />

        {/* Rutas Privadas: Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/list/:listId/edit" element={<ListView />} />
        </Route>

        {/* Manejo 404 */}
        <Route path="*" element={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh' }}><Typography variant="h4">404 | Página no encontrada</Typography></Box>} />
      </Routes>
    </Box>
  );
}
export default App;