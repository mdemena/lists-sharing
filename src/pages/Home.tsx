// frontend/src/pages/Home.tsx

import React from 'react';
import { Box, Typography, Button, Container, Stack, Paper, Grid } from '@mui/material';
import { Link, Navigate } from 'react-router-dom';
import { FaGift, FaShareAlt, FaLock, FaUsers } from 'react-icons/fa'; // Iconos representativos
import { useAuth } from '../contexts/AuthContext'; // Para verificar si el usuario está logueado

interface FeatureProps {
    icon: React.ElementType; // Usamos React.ElementType para los iconos de Fa*
    title: string;
    text: string;
}

interface UseCaseProps {
    emoji: string;
    title: string;
    situation: string;
    solution: string;
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

const UseCase: React.FC<UseCaseProps> = ({ emoji, title, situation, solution }) => (
    <Paper
        elevation={2}
        sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
            }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ fontSize: '2rem', mr: 2 }}>{emoji}</Box>
            <Typography variant="h6" component="h3" fontWeight="bold">
                {title}
            </Typography>
        </Box>
        <Typography variant="body2" color="text.primary" fontWeight="medium" mb={1}>
            Situación:
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
            {situation}
        </Typography>
        <Typography variant="body2" color="text.primary" fontWeight="medium" mb={1}>
            Solución:
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {solution}
        </Typography>
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
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={4}
                    justifyContent="center"
                    alignItems="stretch"
                >
                    <Box flex={1}>
                        <Feature
                            icon={FaGift}
                            title="Adjudicación Ciega"
                            text="Los invitados pueden reservar un ítem sin que el creador de la lista sepa quién lo reservó."
                        />
                    </Box>
                    <Box flex={1}>
                        <Feature
                            icon={FaShareAlt}
                            title="Compartir Fácil"
                            text="Envía invitaciones por email con enlaces personalizados a cualquier familiar o amigo."
                        />
                    </Box>
                    <Box flex={1}>
                        <Feature
                            icon={FaLock}
                            title="Restricciones Seguras"
                            text="El creador no puede eliminar ítems que ya han sido adjudicados por un invitado."
                        />
                    </Box>
                    <Box flex={1}>
                        <Feature
                            icon={FaUsers}
                            title="Colaboración Total"
                            text="Múltiples usuarios pueden ver el estado de la lista y evitar regalos duplicados."
                        />
                    </Box>
                </Stack>
            </Container>

            {/* --- Sección de Casos de Uso --- */}
            <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h4"
                        component="h2"
                        textAlign="center"
                        mb={2}
                        fontWeight="medium"
                    >
                        Casos de Uso
                    </Typography>
                    <Typography
                        variant="body1"
                        textAlign="center"
                        color="text.secondary"
                        mb={6}
                        maxWidth="800px"
                        mx="auto"
                    >
                        Descubre cómo Lists Sharing puede ayudarte en diferentes situaciones de tu vida
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <UseCase
                                emoji="🎂"
                                title="Cumpleaños"
                                situation="Se acerca tu cumpleaños y quieres evitar recibir regalos que no necesitas o duplicados."
                                solution="Crea una lista con ideas de regalos que realmente te gustaría recibir. Añade enlaces a productos específicos, describe tallas, colores o modelos preferidos. Compártela con tu familia y amigos. Ellos podrán coordinarse sin que tú sepas qué te van a regalar, manteniendo la emoción de la sorpresa."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <UseCase
                                emoji="👰"
                                title="Bodas y eventos especiales"
                                situation="Estás organizando tu boda y prefieres regalos específicos o contribuciones concretas."
                                solution="Crea una lista de bodas con todo lo que necesitas para tu nuevo hogar o tu luna de miel. Los invitados pueden reservar elementos sin que tú lo sepas, y entre ellos se coordinan automáticamente para evitar duplicados. Recibirás exactamente lo que pediste, sin sorpresas indeseadas."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <UseCase
                                emoji="🎄"
                                title="Navidad familiar"
                                situation="En tu familia hacen amigo invisible o intercambio de regalos y quieren acertar con los gustos de cada uno."
                                solution="Cada miembro de la familia crea su lista de deseos navideños. Los demás pueden ver las listas y reservar lo que van a regalar. Nadie sabe qué recibirá, pero todos están seguros de que sus regalos serán bien recibidos."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <UseCase
                                emoji="👶"
                                title="Baby shower"
                                situation="Estás esperando un bebé y tus amigos quieren ayudarte con lo que realmente necesitas."
                                solution="Crea una lista con artículos esenciales para el bebé: cochecito, cuna, ropa, pañales, etc. Tus invitados pueden reservar lo que van a regalarte, coordinándose entre ellos sin que tú sepas qué recibirás exactamente. Así evitas duplicados y recibes todo lo necesario."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <UseCase
                                emoji="🎓"
                                title="Graduación"
                                situation="Te gradúas y familiares y amigos quieren celebrarlo con regalos útiles para tu siguiente etapa."
                                solution="Crea una lista con cosas que necesitas para la universidad, tu primer trabajo o tu nuevo apartamento. Los invitados se coordinan de forma invisible para ti, asegurándose de que recibas todo lo que necesitas sin duplicados."
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <UseCase
                                emoji="🎮"
                                title="Wishlist de coleccionista"
                                situation="Coleccionas algo específico (videojuegos, libros, figuras) y tus amigos quieren regalarte algo de tu colección."
                                solution="Mantén una lista actualizada de los elementos que te faltan en tu colección. Cuando llegue una ocasión especial, comparte la lista. Tus amigos pueden ver qué está disponible y qué ya ha sido reservado por otros, garantizando que no recibas duplicados."
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;