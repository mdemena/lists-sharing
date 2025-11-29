// frontend/src/components/NavBar.tsx

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import { FaSignOutAlt, FaListUl, FaMoon, FaSun } from 'react-icons/fa';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../main';
import toast from 'react-hot-toast';

const NavBar: React.FC = () => {
  const { signOut, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
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
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        {/* Título de la Aplicación */}
        <Typography
          variant="h6"
          component={RouterLink} // Usamos RouterLink para manejar la navegación interna
          to={user ? "/dashboard" : "/"}
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'primary.main', // Usamos el color primario para el logo
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <img src="/favicon.svg" alt="Logo" style={{ width: 24, height: 24 }} />
          Lists Sharing
        </Typography>

        {/* Contenedor de Botones (Derecha) */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Botón de Toggle de Modo Oscuro */}
          <Tooltip title={mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}>
            <IconButton
              onClick={toggleTheme}
              color="primary"
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'rotate(20deg) scale(1.1)',
                }
              }}
            >
              {mode === 'light' ? <FaMoon size={18} /> : <FaSun size={18} />}
            </IconButton>
          </Tooltip>

          {user && (
            <>
              {/* Botón Mis Listas */}
              <Button
                component={RouterLink}
                to="/dashboard"
                startIcon={<FaListUl />}
                color="primary" // Color primario (ahora el fondo es claro)
              >
                Mis Listas
              </Button>
              <Button
                component={RouterLink}
                to="/profile"
                color="primary"
              >
                Mi Perfil
              </Button>
              {/* Botón Salir */}
              <Button
                onClick={handleLogout}
                startIcon={<FaSignOutAlt />}
                variant="outlined" // Outlined para ser menos agresivo que contained red
                color="error"
                size="small"
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
              color="primary"
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