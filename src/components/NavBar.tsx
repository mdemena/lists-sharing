// frontend/src/components/NavBar.tsx

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { FaSignOutAlt, FaListUl, FaHome } from 'react-icons/fa';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const NavBar: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();


  const handleLogout = async () => {
    try {
      await signOut();
      // ✅ SUSTITUCIÓN: Llamada directa a toast
      toast.success('Has cerrado sesión.', { duration: 4000 });
      navigate('/login');
    } catch (error: any) {
      toast.error(`Error de Cierre de Sesión: ${error.message || 'Ocurrió un error inesperado.'}`);
    }
  };

  return (
    // AppBar de MUI es la barra de navegación principal
    <AppBar position="static" color="primary">
      <Toolbar>
        {/* Título de la Aplicación */}
        <Typography
          variant="h6"
          component={RouterLink} // Usamos RouterLink para manejar la navegación interna
          to={user ? "/dashboard" : "/"}
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
        >
          🎁 Lists Sharing
        </Typography>

        {/* Contenedor de Botones (Derecha) */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {user && (
            <>
              {/* Botón Mis Listas */}
              <Button
                component={RouterLink}
                to="/dashboard"
                startIcon={<FaListUl />}
                color="inherit" // Hereda el color blanco de AppBar
              >
                Mis Listas
              </Button>
              {/* Botón Salir */}
              <Button
                onClick={handleLogout}
                startIcon={<FaSignOutAlt />}
                variant="contained"
                size="small"
                sx={{
                  bgcolor: 'error.main', // Color rojo para el botón de salir
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                Salir
              </Button>
            </>
          )}
          {!user && (
            // Botón Iniciar Sesión (visible cuando no hay usuario)
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="small"
              sx={{
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              Iniciar Sesión
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;