// frontend/src/pages/Home.tsx

import React from 'react';
import { Box, Typography, Button, Container, Stack, Grid, Paper } from '@mui/material';
import { Link, Navigate } from 'react-router-dom';
import { FaGift, FaShareAlt, FaLock, FaUsers } from 'react-icons/fa'; // Iconos representativos
import { useAuth } from '../contexts/AuthContext'; // Para verificar si el usuario está logueado

interface FeatureProps {
    icon: React.ElementType; // Usamos React.ElementType para los iconos de Fa*
    title: string;
    text: string;
}

const Feature: React.FC<FeatureProps> = ({ icon: Icon, title, text }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column', // Columna vertical
            alignItems: 'center',
            justifyContent: 'flex-start', // Dejar el espacio libre en la parte inferior
            height: '100%', // Crucial para que el Grid stretch funcione
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 2
        }}
    >
        <Box sx={{ color: 'primary.main', mb: 2 }}>
            <Icon size={40} />
        </Box>
        <Typography variant="h6" component="h3" mb={1}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{text}</Typography>
    </Paper>
);

const Home: React.FC = () => {
    const { user, loading } = useAuth();

    // SOLUCIÓN: Si NO está cargando y hay un usuario, redirige
    if (!loading && user) {
        // Usamos el componente Navigate para hacer la redirección declarativa
        return <Navigate to="/dashboard" replace />;
    }

    // Si está cargando, mostramos un indicador para evitar el error de renderizado
    if (loading) {
        return (
            <Box sx={{ height: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h5" color="text.secondary">Cargando sesión...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* --- Sección Principal (Hero) --- */}
            <Box
                sx={{
                    minHeight: { xs: '70vh', md: '80vh' },
                    bgcolor: 'background.default', // Usamos el color de fondo definido en el tema
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    py: 8
                }}
            >
                <Container maxWidth="md">
                    <Stack spacing={4}>
                        <Typography
                            variant="h2"
                            component="h1"
                            color="primary.dark"
                            fontWeight="bold"
                        >
                            Lists Sharing: La Forma Inteligente de Compartir Deseos
                        </Typography>
                        <Typography variant="h5" color="text.secondary">
                            Crea listas de regalos, deseos o compras de forma privada y compártelas con amigos y familiares para que puedan adjudicar ítems sin que tú sepas quién lo ha reservado.
                        </Typography>

                        <Button
                            component={Link}
                            to="/login"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ mt: 3, maxWidth: '300px', alignSelf: 'center' }}
                            endIcon={<FaGift />}
                        >
                            Empezar Ahora (Registro Gratuito)
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* --- Sección de Características --- */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography
                    variant="h4"
                    component="h2"
                    textAlign="center"
                    mb={6}
                    fontWeight="medium"
                >
                    ¿Por qué usar Lists Sharing?
                </Typography>
                <Grid container spacing={4} sx={{ alignItems: 'stretch', justifyContent: 'center' }}>
                    <Grid xs={12} sm={6} md={3}>
                        <Feature
                            icon={FaGift}
                            title="Adjudicación Ciega"
                            text="Los invitados pueden reservar un ítem sin que el creador de la lista sepa quién lo reservó."
                        />
                    </Grid>
                    <Grid xs={12} sm={6} md={3}>
                        <Feature
                            icon={FaShareAlt}
                            title="Compartir Fácil"
                            text="Envía invitaciones por email con enlaces personalizados a cualquier familiar o amigo."
                        />
                    </Grid>
                    <Grid xs={12} sm={6} md={3}>
                        <Feature
                            icon={FaLock}
                            title="Restricciones Seguras"
                            text="El creador no puede eliminar ítems que ya han sido adjudicados por un invitado."
                        />
                    </Grid>
                    <Grid xs={12} sm={6} md={3}>
                        <Feature
                            icon={FaUsers}
                            title="Colaboración Total"
                            text="Múltiples usuarios pueden ver el estado de la lista y evitar regalos duplicados."
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Home;