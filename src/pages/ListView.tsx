// frontend/src/pages/ListView.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Heading,
    Text,
    Spinner,
    Center,
    useToast,
    Button,
    VStack,
    HStack,
    SimpleGrid,
    Card,
    CardBody,
    Input,
    Textarea,
    Select,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    IconButton,
    Image,
} from '@chakra-ui/react';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaPlus, FaDollarSign, FaStar, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import type { List, ListItem, ImageUrl, ExternalUrl } from '../types'; // Importamos los tipos

// Tipos para el estado de edición del ítem
interface CurrentItemState {
    id?: string;
    name: string;
    description: string;
    image_urls: ImageUrl[]; // Array de objetos { url: string, label: string }
    urls: ExternalUrl[]; // Array de objetos { url: string, label: string }
    importance: number;
    estimated_cost: number;
}

// Componente pequeño para el carrusel (simplificado para MVP)
const ImageCarousel: React.FC<{ images: ImageUrl[] }> = ({ images }) => {
    if (!images || images.length === 0) return null;
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentImage = images[currentIndex];

    return (
        <Box position="relative" w="100%" h="200px" overflow="hidden" borderTopRadius="md">
            <Image
                src={currentImage.url}
                alt={currentImage.label || "Imagen del ítem"}
                objectFit="cover"
                h="100%"
                w="100%"
                fallbackSrc="https://via.placeholder.com/400x200?text=Sin+Imagen"
            />
            {images.length > 1 && (
                // Controles de navegación (simplificado)
                <HStack position="absolute" bottom={2} right={2} spacing={1}>
                    <Text fontSize="xs" bg="blackAlpha.600" color="white" px={2} py={1} borderRadius="md">
                        {currentIndex + 1} / {images.length}
                    </Text>
                    <Button
                        size="xs"
                        onClick={() => setCurrentIndex((currentIndex - 1 + images.length) % images.length)}
                    >
                        &lt;
                    </Button>
                    <Button
                        size="xs"
                        onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}
                    >
                        &gt;
                    </Button>
                </HStack>
            )}
        </Box>
    );
};

const ListView: React.FC = () => {
    const { listId } = useParams<{ listId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    // Determina si estamos en modo edición (ruta /list/:id/edit) o compartido (ruta /share/:id)
    const isOwnerMode = location.pathname.includes('/edit');

    const { user } = useAuth();
    const toast = useToast();
    const [list, setList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estado y Hooks para el Modal de Añadir/Editar Item
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentItem, setCurrentItem] = useState<CurrentItemState>({
        name: '',
        description: '',
        image_urls: [], // Inicializado como array vacío
        urls: [],      // Inicializado como array vacío
        importance: 3,
        estimated_cost: 0,
    });
    const [isEditingItem, setIsEditingItem] = useState(false);

    // --- Lógica de Carga de Datos ---
    const fetchListData = async () => {
        if (!listId) return;
        setIsLoading(true);

        try {
            // 1. Obtener la información de la lista
            const { data: listData, error: listError } = await supabase
                .from('lists')
                .select('*')
                .eq('id', listId)
                .single();

            if (listError) throw listError;
            setList(listData as List);

            // 2. Obtener los ítems de la lista
            const { data: itemsData, error: itemsError } = await supabase
                .from('list_items')
                .select('*')
                .eq('list_id', listId)
                .order('importance', { ascending: false });

            if (itemsError) throw itemsError;
            setItems(itemsData as ListItem[]);

        } catch (error: any) {
            toast({
                title: 'Error de carga',
                description: 'No se pudo cargar la lista o sus ítems.',
                status: 'error',
            });
            console.error(error);
            // Si la lista no existe o no tiene acceso, redirigir al dashboard
            if (error.code === 'PGRST116') navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchListData();
    }, [listId, user]);


    // --- Lógica de Gestión de URLs e Imágenes ---

    const handleMediaUrlChange = (index: number, field: 'url' | 'label', value: string, type: 'image' | 'external') => {
        const targetArray = type === 'image' ? [...currentItem.image_urls] : [...currentItem.urls];

        targetArray[index] = {
            ...targetArray[index],
            [field]: value
        };

        if (type === 'image') {
            setCurrentItem({ ...currentItem, image_urls: targetArray as ImageUrl[] });
        } else {
            setCurrentItem({ ...currentItem, urls: targetArray as ExternalUrl[] });
        }
    };

    const handleAddMediaUrl = (type: 'image' | 'external') => {
        const newItem = { url: '', label: '' };
        if (type === 'image') {
            setCurrentItem({ ...currentItem, image_urls: [...currentItem.image_urls, newItem] });
        } else {
            setCurrentItem({ ...currentItem, urls: [...currentItem.urls, newItem] });
        }
    };

    const handleRemoveMediaUrl = (index: number, type: 'image' | 'external') => {
        const targetArray = type === 'image' ? [...currentItem.image_urls] : [...currentItem.urls];
        const newUrls = targetArray.filter((_, i) => i !== index);

        if (type === 'image') {
            setCurrentItem({ ...currentItem, image_urls: newUrls as ImageUrl[] });
        } else {
            setCurrentItem({ ...currentItem, urls: newUrls as ExternalUrl[] });
        }
    };


    // --- Lógica CRUD (Owner Mode) ---

    const handleOpenModal = (item?: ListItem) => {
        if (item) {
            // Editar
            setCurrentItem({
                id: item.id,
                name: item.name,
                description: item.description || '',
                image_urls: item.image_urls || [],
                urls: item.urls || [],
                importance: item.importance,
                estimated_cost: item.estimated_cost || 0,
            });
            setIsEditingItem(true);
        } else {
            // Añadir nuevo
            setCurrentItem({
                name: '',
                description: '',
                image_urls: [],
                urls: [],
                importance: 3,
                estimated_cost: 0,
            });
            setIsEditingItem(false);
        }
        onOpen();
    };

    const handleSaveItem = async () => {
        if (!currentItem.name.trim() || !listId) {
            toast({ title: 'El nombre del ítem es obligatorio.', status: 'warning' });
            return;
        }

        // Filtrar y limpiar URLs/Imágenes vacías antes de enviar a Supabase
        const itemData = {
            list_id: listId,
            name: currentItem.name.trim(),
            description: currentItem.description.trim(),
            image_urls: currentItem.image_urls.filter(media => media.url.trim() !== ''),
            urls: currentItem.urls.filter(media => media.url.trim() !== ''),
            importance: currentItem.importance,
            estimated_cost: currentItem.estimated_cost,
        };

        try {
            let data, error;
            if (isEditingItem && currentItem.id) {
                // Actualizar
                ({ data, error } = await supabase
                    .from('list_items')
                    .update(itemData)
                    .eq('id', currentItem.id)
                    .select()
                    .single());

                if (error) throw error;
                setItems(items.map(item => (item.id === currentItem.id ? data as ListItem : item)));

            } else {
                // Insertar
                ({ data, error } = await supabase
                    .from('list_items')
                    .insert(itemData)
                    .select()
                    .single());

                if (error) throw error;
                setItems([...items, data as ListItem]);
            }

            toast({ title: 'Ítem guardado con éxito.', status: 'success' });
            onClose();
        } catch (error: any) {
            toast({
                title: 'Error al guardar',
                description: error.message || 'Error al guardar el elemento.',
                status: 'error',
            });
        }
    };

    const handleDeleteItem = async (item: ListItem) => {
        // RESTRICCIÓN CLAVE: NO PERMITIR ELIMINAR SI ESTÁ ADJUDICADO
        if (item.is_adjudicated) {
            toast({
                title: '¡No permitido!',
                description: 'No puedes eliminar un elemento que ya ha sido adjudicado.',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        if (!window.confirm(`¿Estás seguro de que quieres eliminar "${item.name}"?`)) return;

        try {
            const { error } = await supabase
                .from('list_items')
                .delete()
                .eq('id', item.id);

            if (error) throw error;

            setItems(items.filter(i => i.id !== item.id));
            toast({ title: 'Ítem eliminado.', status: 'success' });
        } catch (error: any) {
            toast({
                title: 'Error de eliminación',
                description: error.message,
                status: 'error',
            });
        }
    };

    // --- Lógica de Adjudicación (Shared Mode) ---

    const handleAdjudicate = async (item: ListItem, adjudicate: boolean) => {
        // ... (Lógica de adjudicación idéntica a la anterior, ya que el cambio es solo en el modelo de datos de imagen)
        if (!user) {
            toast({ title: 'Debes iniciar sesión para adjudicar un ítem.', status: 'warning' });
            return;
        }

        if (!adjudicate && item.adjudicated_by && item.adjudicated_by !== user.id) {
            toast({ title: 'Error', description: 'No puedes desadjudicar un ítem tomado por otra persona.', status: 'error' });
            return;
        }

        if (adjudicate && item.adjudicated_by === user.id) return;

        const updateData = {
            is_adjudicated: adjudicate,
            adjudicated_by: adjudicate ? user.id : null,
            adjudicated_at: adjudicate ? new Date().toISOString() : null,
        };

        try {
            const { data, error } = await supabase
                .from('list_items')
                .update(updateData)
                .eq('id', item.id)
                .select()
                .single();

            if (error) throw error;

            setItems(items.map(i => (i.id === item.id ? data as ListItem : i)));
            toast({
                title: adjudicate ? '¡Adjudicado!' : 'Liberado.',
                status: adjudicate ? 'success' : 'info',
            });

        } catch (error: any) {
            toast({ title: 'Error de Adjudicación', description: error.message, status: 'error' });
        }
    };

    // --- Renderizado del Ítem ---
    const ItemCard: React.FC<{ item: ListItem }> = ({ item }) => {
        const isAdjudicatedByCurrentUser = item.adjudicated_by === user?.id;
        const isAdjudicatedByOthers = item.is_adjudicated && item.adjudicated_by !== user?.id;

        const AdjudicationStatus = (
            <HStack bg={item.is_adjudicated ? 'red.100' : 'green.100'} p={1} borderRadius="md" mt={1}>
                <Text fontSize="sm" fontWeight="bold" color={item.is_adjudicated ? 'red.700' : 'green.700'}>
                    {item.is_adjudicated ? 'ADJUDICADO' : 'DISPONIBLE'}
                </Text>
            </HStack>
        );

        const firstImageUrl = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0].url : null;

        return (
            <Card
                w="100%"
                minH="250px"
                shadow={item.is_adjudicated ? 'lg' : 'md'}
                borderLeft={item.is_adjudicated ? '5px solid red' : '5px solid green'}
            >
                <ImageCarousel images={item.image_urls || []} />
                <CardBody>
                    <VStack align="flex-start" spacing={1}>
                        <Heading size="md">{item.name}</Heading>
                        {AdjudicationStatus}
                        <Text mt={2} noOfLines={3} fontSize="sm">{item.description || 'Sin descripción.'}</Text>
                    </VStack>

                    <HStack fontSize="sm" mt={3} wrap="wrap">
                        <HStack>
                            <FaStar color="gold" />
                            <Text>Imp: {item.importance}</Text>
                        </HStack>
                        <HStack ml={4}>
                            <FaDollarSign color="green" />
                            <Text>Coste Est.: ${item.estimated_cost?.toFixed(2) || 'N/A'}</Text>
                        </HStack>
                        {/* ENLACES EXTERNOS */}
                        {item.urls && item.urls.length > 0 && (
                            <HStack ml={4} spacing={2} overflowX="auto" pb={1}>
                                {item.urls.map((extUrl, index) => (
                                    <Tooltip key={index} label={extUrl.label || "Enlace externo"} shouldWrapChildren>
                                        <Link href={extUrl.url} isExternal>
                                            <IconButton
                                                icon={<FaExternalLinkAlt />}
                                                aria-label={`Enlace a ${extUrl.label || 'Recurso'}`}
                                                size="xs"
                                                colorScheme="blue"
                                                variant="outline"
                                            />
                                        </Link>
                                    </Tooltip>
                                ))}
                            </HStack>
                        )}
                    </HStack>

                    {/* Acciones */}
                    <HStack spacing={2} pt={4} justify="flex-end" w="100%">
                        {isOwnerMode ? (
                            // PROPIETARIO: Edición y Eliminación
                            <>
                                <Button leftIcon={<FaEdit />} size="sm" onClick={() => handleOpenModal(item)}>Editar</Button>
                                <IconButton
                                    icon={<FaTrash />}
                                    aria-label="Eliminar ítem"
                                    colorScheme="red"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item)}
                                    isDisabled={item.is_adjudicated}
                                />
                            </>
                        ) : (
                            // INVITADO: Adjudicación
                            user && (
                                <>
                                    {isAdjudicatedByCurrentUser ? (
                                        <Button
                                            leftIcon={<FaTimes />}
                                            colorScheme="orange"
                                            size="sm"
                                            onClick={() => handleAdjudicate(item, false)}
                                        >
                                            Soltar
                                        </Button>
                                    ) : item.is_adjudicated ? (
                                        <Button colorScheme="red" size="sm" isDisabled>
                                            Reservado
                                        </Button>
                                    ) : (
                                        <Button
                                            leftIcon={<FaCheck />}
                                            colorScheme="green"
                                            size="sm"
                                            onClick={() => handleAdjudicate(item, true)}
                                        >
                                            Yo lo tomo
                                        </Button>
                                    )}
                                </>
                            )
                        )}
                    </HStack>
                </CardBody>
            </Card>
        );
    };

    if (isLoading || !list) {
        return (
            <Center minH="100vh">
                <Spinner size="xl" color="purple.500" />
            </Center>
        );
    }

    // --- Renderizado Principal ---
    return (
        <Box p={{ base: 4, md: 8 }} maxW="6xl" mx="auto">
            <Heading as="h1" size="xl" mb={2}>{list.name}</Heading>
            <Text fontSize="lg" color="gray.600" mb={6}>
                {isOwnerMode ? `Modo Edición - ${list.description}` : `Lista Compartida - ${list.description}`}
            </Text>

            {isOwnerMode && (
                <Button leftIcon={<FaPlus />} colorScheme="purple" mb={8} onClick={() => handleOpenModal()}>
                    Añadir Nuevo Ítem
                </Button>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {items.map(item => (
                    <ItemCard key={item.id} item={item} />
                ))}
            </SimpleGrid>

            {/* --- Modal de Añadir/Editar Ítem --- */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{isEditingItem ? 'Editar Ítem' : 'Añadir Nuevo Ítem'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Input
                                placeholder="Nombre del Ítem"
                                value={currentItem.name}
                                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                            />
                            <Textarea
                                placeholder="Descripción completa"
                                value={currentItem.description}
                                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                            />

                            <HStack w="100%">
                                <Select
                                    value={currentItem.importance.toString()}
                                    onChange={(e) => setCurrentItem({ ...currentItem, importance: parseInt(e.target.value) || 3 })}
                                    placeholder="Importancia (1-5)"
                                >
                                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} - {n === 5 ? 'Máxima' : n === 1 ? 'Mínima' : ''}</option>)}
                                </Select>
                                <Input
                                    type="number"
                                    placeholder="Coste Estimado ($)"
                                    value={currentItem.estimated_cost}
                                    onChange={(e) => setCurrentItem({ ...currentItem, estimated_cost: parseFloat(e.target.value) || 0 })}
                                />
                            </HStack>

                            {/* Bloque de URLs de Imágenes */}
                            <Heading size="sm" mt={4} mb={2}>Imágenes del Ítem</Heading>
                            <VStack spacing={3} w="100%" alignItems="flex-start">
                                {currentItem.image_urls.map((image, index) => (
                                    <Box key={`img-${index}`} p={3} borderWidth="1px" borderRadius="md" w="100%">
                                        <HStack w="100%" mb={2}>
                                            <Input
                                                placeholder={`URL de Imagen ${index + 1}`}
                                                value={image.url}
                                                onChange={(e) => handleMediaUrlChange(index, 'url', e.target.value, 'image')}
                                                size="sm"
                                            />
                                            <IconButton
                                                icon={<FaTrash />}
                                                aria-label="Eliminar Imagen URL"
                                                colorScheme="red"
                                                onClick={() => handleRemoveMediaUrl(index, 'image')}
                                                size="sm"
                                                variant="ghost"
                                            />
                                        </HStack>
                                        <Input
                                            placeholder="Etiqueta (Ej: Foto Principal)"
                                            value={image.label}
                                            onChange={(e) => handleMediaUrlChange(index, 'label', e.target.value, 'image')}
                                            size="sm"
                                        />
                                    </Box>
                                ))}
                                <Button leftIcon={<FaPlus />} size="sm" variant="outline" onClick={() => handleAddMediaUrl('image')} isFullWidth>
                                    Añadir Imagen
                                </Button>
                            </VStack>

                            {/* Bloque de URLs Externas (Links) - Reutilizando la lógica */}
                            <Heading size="sm" mt={4} mb={2}>Enlaces de Compra/Referencia</Heading>
                            <VStack spacing={3} w="100%" alignItems="flex-start">
                                {currentItem.urls.map((extUrl, index) => (
                                    <Box key={`url-${index}`} p={3} borderWidth="1px" borderRadius="md" w="100%">
                                        <HStack w="100%" mb={2}>
                                            <Input
                                                placeholder={`URL Externa ${index + 1}`}
                                                value={extUrl.url}
                                                onChange={(e) => handleMediaUrlChange(index, 'url', e.target.value, 'external')}
                                                size="sm"
                                            />
                                            <IconButton
                                                icon={<FaTrash />}
                                                aria-label="Eliminar URL Externa"
                                                colorScheme="red"
                                                onClick={() => handleRemoveMediaUrl(index, 'external')}
                                                size="sm"
                                                variant="ghost"
                                            />
                                        </HStack>
                                        <Input
                                            placeholder="Etiqueta (Ej: Amazon, Tienda Oficial)"
                                            value={extUrl.label}
                                            onChange={(e) => handleMediaUrlChange(index, 'label', e.target.value, 'external')}
                                            size="sm"
                                        />
                                    </Box>
                                ))}
                                <Button leftIcon={<FaPlus />} size="sm" variant="outline" onClick={() => handleAddMediaUrl('external')} isFullWidth>
                                    Añadir Enlace
                                </Button>
                            </VStack>

                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button colorScheme="purple" onClick={handleSaveItem}>
                            {isEditingItem ? 'Guardar Cambios' : 'Añadir Ítem'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default ListView;