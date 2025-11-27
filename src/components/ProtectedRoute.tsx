// frontend/src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * Componente de Ruta Protegida.
 * Requiere que el usuario esté autenticado para renderizar el contenido anidado (<Outlet />).
 */
const ProtectedRoute: React.FC = () => {
    const { user, loading } = useAuth();

    // Muestra un Spinner mientras se carga la sesión de Supabase
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <CircularProgress size={60} color="primary" thickness={4} />
            </Box>
        );
    }

    // Si no hay usuario autenticado, redirige al login
    if (!user) {
        // replace=true evita que el usuario pueda volver con el botón "Atrás"
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, renderiza la ruta destino
    return <Outlet />;
};

export default ProtectedRoute;