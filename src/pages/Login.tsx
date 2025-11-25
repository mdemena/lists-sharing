// frontend/src/pages/Login.tsx (Código completo adaptado)

import React, { useState } from 'react';
import {
    Box,
    Button,
    Input,
    VStack,
    Heading,
    Text,
    useToast,
    Divider,
    Center, // Aseguramos que Center esté importado
} from '@chakra-ui/react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient'; // Necesario para el login social

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // @ts-ignore: Accedemos a los métodos del contexto
    const { signIn, signUp } = useAuth();
    const toast = useToast();

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

            toast({
                title: isRegister ? '¡Registro Exitoso!' : '¡Bienvenido!',
                description: isRegister ? 'Revisa tu correo para confirmar tu cuenta.' : 'Has iniciado sesión correctamente.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

        } catch (error: any) {
            toast({
                title: 'Error de Autenticación',
                description: error.message || 'Ocurrió un error inesperado.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        // ... (Lógica de login social idéntica a la versión anterior)
        await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
    };

    return (
        // Centramos el contenido en la altura restante
        <Center minH="calc(100vh - 64px)">
            <Box
                maxW="sm"
                p={8}
                borderWidth={1}
                borderRadius="lg"
                bg="white"
                boxShadow="md"
                w="100%"
            >
                {/* Este heading se mantiene para dar contexto al formulario dentro del box */}
                <Heading size="lg" mb={6} textAlign="center">
                    {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </Heading>

                <form onSubmit={handleAuth}>
                    <VStack spacing={4}>
                        <Input
                            placeholder="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            placeholder="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            type="submit"
                            colorScheme="purple"
                            isFullWidth
                            isLoading={isLoading}
                        >
                            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
                        </Button>
                    </VStack>
                </form>

                <Text
                    align="center"
                    mt={4}
                    onClick={() => setIsRegister(!isRegister)}
                    color="purple.500"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                >
                    {isRegister ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿Necesitas una cuenta? Regístrate'}
                </Text>

                <Divider my={6} />
                <VStack spacing={3}>
                    <Button
                        leftIcon={<FaGoogle />}
                        colorScheme="red"
                        isFullWidth
                        onClick={() => handleSocialLogin('google')}
                    >
                        Continuar con Google
                    </Button>
                    <Button
                        leftIcon={<FaGithub />}
                        colorScheme="gray"
                        isFullWidth
                        onClick={() => handleSocialLogin('github')}
                    >
                        Continuar con GitHub
                    </Button>
                </VStack>
            </Box>
        </Center>
    );
}

export default Login;