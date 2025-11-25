// frontend/src/App.tsx

import { Routes, Route } from 'react-router-dom';
import { Box, Center, Heading, Text } from '@chakra-ui/react'; // Importamos componentes de Chakra
import NavBar from './components/NavBar.tsx'; // Importamos el NavBar
import ProtectedRoute from './components/ProtectedRoute.tsx';

// Importamos las páginas principales desarrolladas
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ListView from './pages/ListView.tsx';

// Componente para la página de inicio simple
const Home: React.FC = () => (
  <Center h="90vh" flexDirection="column" pt={0}> {/* pt={0} evita que el NavBar lo empuje */}
    <Heading mb={4} size="2xl" color="purple.600">
      🎁 Antigravity List
    </Heading>
    <Text fontSize="xl" color="gray.600">
      Crea y comparte listas de deseos, regalos o compras fácilmente.
    </Text>
  </Center>
);

function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* 1. La Barra de Navegación se coloca fuera del Routes */}
      <NavBar />

      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* 2. Ruta de Acceso Compartido (Pública/Requiere registro) */}
        <Route path="/share/:listId" element={<ListView />} />

        {/* 3. Rutas Privadas: Protegidas por autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/list/:listId/edit" element={<ListView />} />
        </Route>

        {/* Opcional: Ruta para manejar 404 */}
        <Route path="*" element={<Center h="90vh"><Heading>404 | Página no encontrada</Heading></Center>} />
      </Routes>
    </Box>
  );
}

export default App;