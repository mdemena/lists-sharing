// frontend/src/components/NavBar.tsx

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { FaSignOutAlt, FaListUl, FaMoon, FaSun } from 'react-icons/fa';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../main';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'ca', name: 'Català', flag: 'es-ct' },
  { code: 'eu', name: 'Euskera', flag: 'es-pv' },
  { code: 'gl', name: 'Galego', flag: 'es-ga' },
  { code: 'en', name: 'English', flag: 'gb' },
];

const NavBar: React.FC = () => {
  const { signOut, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();


  const { t, i18n } = useTranslation();

  // Language Menu State
  const [langMenuAnchor, setLangMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Has cerrado sesión.', { duration: 4000 });
      navigate('/login');
    } catch (error: any) {
      toast.error(`Error de Cierre de Sesión: ${error.message || 'Ocurrió un error inesperado.'}`);
    }
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLangMenuAnchor(null);
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

          {/* Language Switcher */}
          <Tooltip title="Idioma / Language">
            <IconButton
              onClick={(e) => setLangMenuAnchor(e.currentTarget)}
              color="primary"
              size="small"
            >
              <span className={`fi fi-${languages.find(l => l.code === i18n.language.split('-')[0])?.flag || 'es'}`} />
              <Typography variant="caption" ml={0.5} sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                {i18n.language.split('-')[0]}
              </Typography>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={langMenuAnchor}
            open={Boolean(langMenuAnchor)}
            onClose={() => setLangMenuAnchor(null)}
          >
            {languages.map((lang) => (
              <MenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                selected={i18n.language.startsWith(lang.code)}
                sx={{ display: 'flex', gap: 1.5 }}
              >
                <span className={`fi fi-${lang.flag}`} style={{ borderRadius: '2px' }} />
                {lang.name}
              </MenuItem>
            ))}
          </Menu>
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
                {t('nav.dashboard')}
              </Button>
              <Button
                component={RouterLink}
                to="/profile"
                color="primary"
              >
                {t('nav.profile')}
              </Button>
              {/* Botón Salir */}
              <Button
                onClick={handleLogout}
                startIcon={<FaSignOutAlt />}
                variant="outlined" // Outlined para ser menos agresivo que contained red
                color="error"
                size="small"
              >
                {t('nav.logout')}
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
              {t('nav.login')}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;