// frontend/src/components/NavBar.tsx

import React from 'react';
import { Box, Flex, Heading, Button, Spacer, HStack, useToast } from '@chakra-ui/react';
import { FaSignOutAlt, FaListUl, FaHome } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavBar: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Sesión cerrada.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error al cerrar sesión',
        status: 'error',
      });
    }
  };

  return (
    <Box bg="purple.600" px={{ base: 4, md: 8 }} py={3} color="white" boxShadow="md">
      <Flex h={10} alignItems="center">
        <Heading as="h1" size="md" letterSpacing={'tight'}>
          <Link to={user ? "/dashboard" : "/"}>
            🎁 Antigravity List
          </Link>
        </Heading>

        <Spacer />

        <HStack spacing={4}>
          {user && (
            <>
              <Button
                as={Link}
                to="/dashboard"
                leftIcon={<FaListUl />}
                variant="ghost"
                color="white"
                _hover={{ bg: "purple.700" }}
                size="sm"
              >
                Mis Listas
              </Button>
              <Button
                onClick={handleLogout}
                leftIcon={<FaSignOutAlt />}
                colorScheme="red"
                size="sm"
              >
                Salir
              </Button>
            </>
          )}
          {!user && (
            <Button
              as={Link}
              to="/login"
              colorScheme="purple"
              bg="purple.400"
              size="sm"
            >
              Iniciar Sesión
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default NavBar;