// frontend/src/pages/Login.tsx (Código completo adaptado)

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Divider, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api'; // Necesario para el login social
import toast from 'react-hot-toast';

// Creamos un contenedor centrado usando styled
const CenteredContainer = styled(Container)(({ theme }) => ({
    minHeight: 'calc(100vh - 64px)', // Ajuste de altura
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
}));

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // @ts-ignore: Accedemos a los métodos del contexto
    const { signIn, signUp } = useAuth();

    const handleAuth = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);

        // ... (Lógica de signIn/signUp idéntica a la versión anterior)
        try {
            let error = null;
            if (isRegister) {
                ({ error } = await signUp({ email, password }));
            } else {
                ({ error } = await signIn({ email, password }));
            }

            if (error) throw error;

            // ✅ SUSTITUCIÓN: Llamada directa a toast
            toast.success(isRegister ? '¡Registro Exitoso! Revisa tu correo.' : '¡Bienvenido! Has iniciado sesión.', { duration: 4000 });

        } catch (error: any) {
            // ✅ SUSTITUCIÓN: Llamada directa a toast
            toast.error(`Error de Autenticación: ${error.message || 'Ocurrió un error inesperado.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        // ... (Lógica de login social idéntica a la versión anterior)
        const { data, error } = await api.auth.signInWithOAuth(provider, {
             redirectTo: `${window.location.origin}/dashboard`,
        });
        
        if (error) {
            toast.error(`Error de login social: ${error}`);
            return;
        }
        
        if (data?.url) {
            window.location.href = data.url;
        }
    };

    return (
        <CenteredContainer maxWidth="sm">
            <Box
                sx={{
                    p: 4,
                    border: '1px solid',
                    borderColor: 'divider', // Ahora se adapta al tema
                    borderRadius: 3,
                    boxShadow: (theme) => theme.palette.mode === 'light'
                        ? '0 8px 32px rgba(0,0,0,0.08)'
                        : '0 8px 32px rgba(0,0,0,0.4)',
                    bgcolor: 'background.paper', // Ahora se adapta al tema
                    backdropFilter: 'blur(16px)',
                    width: '100%',
                }}
            >
                <Typography variant="h5" component="h1" align="center" mb={3}>
                    {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </Typography>

                <form onSubmit={handleAuth}>
                    <Stack spacing={2} mb={3}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <TextField
                            label="Contraseña"
                            type="password"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={isLoading}
                        >
                            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
                        </Button>
                    </Stack>
                </form>

                <Typography
                    align="center"
                    mt={2}
                    color="primary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => setIsRegister(!isRegister)}
                >
                    {isRegister ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿Necesitas una cuenta? Regístrate'}
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={() => handleSocialLogin('google')}
                        sx={{
                            color: '#db4437',
                            borderColor: '#db4437',
                            minWidth: 'auto',
                            px: 3,
                            py: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': {
                                borderColor: '#c33d2e',
                                bgcolor: 'rgba(219, 68, 55, 0.04)',
                            }
                        }}
                    >
                        <FaGoogle size={20} />
                        <Typography variant="body2" component="span">Google</Typography>
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => handleSocialLogin('github')}
                        sx={{
                            borderColor: 'text.secondary',
                            minWidth: 'auto',
                            px: 3,
                            py: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': {
                                bgcolor: (theme) => theme.palette.mode === 'light'
                                    ? 'rgba(0, 0, 0, 0.04)'
                                    : 'rgba(255, 255, 255, 0.08)',
                            }
                        }}
                    >
                        <FaGithub size={20} />
                        <Typography variant="body2" component="span">GitHub</Typography>
                    </Button>
                </Box>
            </Box>
        </CenteredContainer>
    );
}

export default Login;