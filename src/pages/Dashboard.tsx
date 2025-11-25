// frontend/src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Button,
    VStack,
    HStack,
    Text,
    useToast,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
    SimpleGrid,
    Card,
    CardHeader,
    CardBody,
    Spacer,
} from '@chakra-ui/react';
import { FaPlus, FaList, FaShareSquare } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import type { List } from '../types'; // Importamos la interfaz List
import { useNavigate } from 'react-router-dom';
import ShareListModal from '../components/ShareListModal';

const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const [lists, setLists] = useState<List[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const toast = useToast();
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const { isOpen, onOpen, onClose } = useDisclosure(); // Usado para el modal de creación de lista
    const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure(); // <-- NUEVO: Para el modal de compartir
    const [listToShare, setListToShare] = useState<List | null>(null); // <-- NUEVO: Almacena la lista a compartir

    // URL de la Edge Function (ajusta la ruta y el dominio de tu proyecto Supabase)
    const EDGE_FUNCTION_URL = 'https://[TU_PROYECTO_ID].supabase.co/functions/v1/share-list-email';
    // --- Lógica de Carga de Datos ---
    const fetchUserLists = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // 1. Acceder a la tabla 'lists' y seleccionar todos los campos
            // 2. Filtrar por el 'owner_id' que coincide con el ID del usuario actual (user.id)
            //    Supabase y RLS se encargan de esto, pero la cláusula 'eq' es explícita.
            const { data, error } = await supabase
                .from('lists')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Casteamos el resultado a nuestro tipo List[]
            setLists(data as List[]);
        } catch (error: any) {
            toast({
                title: 'Error al cargar listas',
                description: error.message || 'No se pudieron recuperar tus listas.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserLists();
    }, [user]); // Ejecutar al montar el componente o si cambia el usuario

    const handleShareClick = (list: List) => {
        setListToShare(list);
        onShareOpen();
    };
    // --- Lógica de Creación de Lista ---
    const handleCreateList = async () => {
        if (!newListName.trim()) {
            toast({ title: 'El nombre es obligatorio', status: 'warning' });
            return;
        }

        try {
            // 1. Insertar la nueva lista. El 'owner_id' se obtiene del usuario actual.
            const { data, error } = await supabase
                .from('lists')
                .insert({
                    name: newListName.trim(),
                    description: newListDescription.trim(),
                    owner_id: user?.id
                })
                .select() // Pide que devuelva la lista creada
                .single(); // Espera un solo registro devuelto

            if (error) throw error;

            toast({
                title: 'Lista creada con éxito',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            // 2. Actualizar el estado y cerrar el modal
            if (data) {
                setLists([data as List, ...lists]);
            }
            onClose();
            setNewListName('');
            setNewListDescription('');

            // 3. Navegar a la página de edición de la nueva lista
            navigate(`/list/${data?.id}/edit`);

        } catch (error: any) {
            toast({
                title: 'Error de creación',
                description: error.message || 'No se pudo crear la lista.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // --- JSX de Componentes ---

    const ListCard: React.FC<{ list: List }> = ({ list }) => (
        <Card
            w="100%"
            minH="150px"
            shadow="md"
            _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
            transition="0.2s"
        >
            <CardHeader>
                <Heading size="md">{list.name}</Heading>
            </CardHeader>
            <CardBody>
                <Text noOfLines={2} color="gray.600" mb={4}>
                    {list.description || 'Sin descripción.'}
                </Text>

                <HStack spacing={2} pt={2}>
                    <Button
                        leftIcon={<FaList />}
                        colorScheme="purple"
                        size="sm"
                        onClick={() => navigate(`/list/${list.id}/edit`)}
                    >
                        Editar Items
                    </Button>
                    <Button
                        leftIcon={<FaShareSquare />}
                        colorScheme="teal"
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareClick(list)}
                    >
                        Compartir
                    </Button>
                </HStack>
            </CardBody>
        </Card>
    );

    return (
        <Box p={{ base: 4, md: 8 }} maxW="6xl" mx="auto">
            <HStack mb={8} justify="space-between" wrap="wrap">
                <Heading as="h1" size="xl">
                    Mis Listas
                </Heading>
                {/* Movemos la creación de lista al mismo nivel del Heading o la mantenemos aquí */}
                <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={onOpen}>
                    Crear Nueva Lista
                </Button>
            </HStack>

            {/* Manejo de estados de carga y vacío */}
            {isLoading ? (
                <Center h="200px">
                    <Spinner size="xl" color="purple.500" />
                </Center>
            ) : lists.length === 0 ? (
                <Box textAlign="center" py={10} px={6} borderWidth={1} borderRadius="lg" bg="white">
                    <Heading size="md" mb={2}>¡Aún no tienes listas!</Heading>
                    <Text color={'gray.500'} mb={4}>
                        Crea tu primera lista de regalos, deseos o tareas.
                    </Text>
                    <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={onOpen}>
                        Crear Nueva Lista
                    </Button>
                </Box>
            ) : (
                // Renderizado de Listas
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {lists.map(list => (
                        <ListCard key={list.id} list={list} />
                    ))}
                </SimpleGrid>
            )}

            {/* --- Modal de Creación de Lista --- */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Crear Nueva Lista</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder="Nombre de la Lista (Ej: Regalos de Navidad)"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                autoFocus
                            />
                            <Input
                                placeholder="Descripción (Opcional)"
                                value={newListDescription}
                                onChange={(e) => setNewListDescription(e.target.value)}
                            />
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button colorScheme="purple" onClick={handleCreateList} isLoading={isLoading}>
                            Crear Lista
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {/* --- Modal de Compartir Lista --- */}
            {listToShare && (
                <ShareListModal
                    isOpen={isShareOpen}
                    onClose={onShareClose}
                    list={listToShare}
                    edgeFunctionUrl={EDGE_FUNCTION_URL}
                />
            )}
        </Box>
    );
};

export default Dashboard;