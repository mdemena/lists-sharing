// frontend/src/pages/ListView.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Stack,
    Grid,
    Modal,
    TextField,
    Select,
    MenuItem,
    CircularProgress,
    IconButton,
    Card,
    CardContent,
    CardMedia,
    Tooltip,
    TextareaAutosize,
    InputLabel,
    FormControl,
} from '@mui/material';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaPlus, FaDollarSign, FaStar, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import type { List, ListItem, ImageUrl, ExternalUrl } from '../types'; // Importamos los tipos
import toast from 'react-hot-toast';

// --- Estilos para el Modal de MUI ---
const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 600, md: 700 },
    maxHeight: '90vh',
    overflowY: 'auto',
    bgcolor: 'background.paper',
    borderRadius: 1,
    boxShadow: 24,
    p: 4,
};

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
        <Box position="relative" width="100%" height="200px" overflow="hidden">
            <CardMedia
                component="img"
                image={currentImage.url}
                alt={currentImage.label || "Imagen del ítem"}
                sx={{ height: '100%', objectFit: 'cover' }}
            />
            {images.length > 1 && (
                <Stack
                    direction="row"
                    spacing={1}
                    position="absolute"
                    bottom={8}
                    right={8}
                    sx={{ bgcolor: 'black.main', borderRadius: 1 }}
                >
                    <Typography
                        variant="caption"
                        color="white"
                        px={1}
                        py={0.5}
                        mr={1}
                        sx={{ bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1 }}
                    >
                        {currentIndex + 1} / {images.length}
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => setCurrentIndex((currentIndex - 1 + images.length) % images.length)}
                        sx={{ color: 'white' }}
                    >
                        &lt;
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}
                        sx={{ color: 'white' }}
                    >
                        &gt;
                    </Button>
                </Stack>
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
    const [list, setList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estado y Hooks para el Modal de Añadir/Editar Item
    const [modalOpen, setModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<CurrentItemState>({
        name: '',
        description: '',
        image_urls: [], // Inicializado como array vacío
        urls: [],      // Inicializado como array vacío
        importance: 3,
        estimated_cost: 0,
    });
    const [isEditingItem, setIsEditingItem] = useState(false);
    // --- Lógica de Manejo de Modales ---
    const handleOpen = () => setModalOpen(true);
    const handleClose = () => setModalOpen(false);

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
            toast.error('No se pudo cargar la lista o sus ítems.');
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

    // --- Adaptación de handleOpenModal ---
    const handleOpenModal = (item?: ListItem) => {
        // ... (Lógica de inicialización de currentItem idéntica)
        if (item) {
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
            setCurrentItem({
                name: '', description: '', image_urls: [], urls: [], importance: 3, estimated_cost: 0,
            });
            setIsEditingItem(false);
        }
        handleOpen(); // Abrir el modal
    };

    const handleSaveItem = async () => {
        if (!currentItem.name.trim() || !listId) {
            toast.error('El nombre del ítem es obligatorio.');
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
            let data: ListItem | null = null;
            let error;
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

            toast.success('Ítem guardado con éxito.');
            handleClose();
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar el elemento.');
        }
    };

    const handleDeleteItem = async (item: ListItem) => {
        // RESTRICCIÓN CLAVE: NO PERMITIR ELIMINAR SI ESTÁ ADJUDICADO
        if (item.is_adjudicated) {
            toast.error('No puedes eliminar un elemento que ya ha sido adjudicado.');
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
            toast.success('Ítem eliminado.');
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar el elemento.');
        }
    };

    // --- Lógica de Adjudicación (Shared Mode) ---

    const handleAdjudicate = async (item: ListItem, adjudicate: boolean) => {
        // ... (Lógica de adjudicación idéntica a la anterior, ya que el cambio es solo en el modelo de datos de imagen)
        if (!user) {
            toast.error('Debes iniciar sesión para adjudicar un ítem.');
            return;
        }

        if (!adjudicate && item.adjudicated_by && item.adjudicated_by !== user.id) {
            toast.error('No puedes desadjudicar un ítem tomado por otra persona.');
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
            toast(adjudicate ? '¡Adjudicado!' : 'Liberado.');

        } catch (error: any) {
            toast.error(error.message || 'Error al adjudicar el elemento.');
        }
    };

    // --- Renderizado del Ítem ---
    const ItemCard: React.FC<{ item: ListItem }> = ({ item }) => {
        const isAdjudicatedByCurrentUser = item.adjudicated_by === user?.id;

        const AdjudicationStatus = (
            <Box sx={{
                bgcolor: item.is_adjudicated ? 'error.light' : 'success.light',
                color: item.is_adjudicated ? 'error.dark' : 'success.dark',
                p: 0.5,
                borderRadius: 1,
                fontWeight: 'bold',
                fontSize: '0.8rem'
            }}>
                {item.is_adjudicated ? 'ADJUDICADO' : 'DISPONIBLE'}
            </Box>
        );

        return (
            <Card sx={{
                width: '100%',
                minHeight: '250px',
                boxShadow: 3,
                borderLeft: `5px solid ${item.is_adjudicated ? 'red' : 'green'}`
            }}>
                {/* Carrusel de Imágenes */}
                <ImageCarousel images={item.image_urls || []} />

                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" component="h3">{item.name}</Typography>
                        {AdjudicationStatus}
                    </Stack>

                    <Typography variant="body2" color="text.secondary" mb={2} noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 3 }}>
                        {item.description || 'Sin descripción.'}
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center" fontSize="small" mb={2}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ color: 'gold' }}><FaStar size={14} /></Box>
                            <Typography variant="caption">Imp: {item.importance}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ color: 'success.main' }}><FaDollarSign size={14} /></Box>
                            <Typography variant="caption">Coste Est.: ${item.estimated_cost?.toFixed(2) || 'N/A'}</Typography>
                        </Stack>
                    </Stack>

                    {/* Enlaces Externos */}
                    <Stack direction="row" spacing={1} overflow="auto" pb={1} sx={{ mt: 1 }}>
                        {item.urls && item.urls.length > 0 && item.urls.map((extUrl, index) => (
                            <Tooltip key={index} title={extUrl.label || "Enlace externo"}>
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => window.open(extUrl.url, '_blank')}
                                >
                                    <FaExternalLinkAlt size={12} />
                                </IconButton>
                            </Tooltip>
                        ))}
                    </Stack>

                    {/* Acciones */}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" pt={2}>
                        {isOwnerMode ? (
                            <>
                                <Button size="small" variant="outlined" startIcon={<FaEdit />} onClick={() => handleOpenModal(item)}>Editar</Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteItem(item)}
                                    disabled={item.is_adjudicated}
                                >
                                    <FaTrash size={14} />
                                </IconButton>
                            </>
                        ) : (
                            user && (
                                <>
                                    {isAdjudicatedByCurrentUser ? (
                                        <Button size="small" variant="contained" color="warning" startIcon={<FaTimes />} onClick={() => handleAdjudicate(item, false)}>
                                            Soltar
                                        </Button>
                                    ) : item.is_adjudicated ? (
                                        <Button size="small" variant="contained" color="error" disabled>
                                            Reservado
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="contained" color="success" startIcon={<FaCheck />} onClick={() => handleAdjudicate(item, true)}>
                                            Yo lo tomo
                                        </Button>
                                    )}
                                </>
                            )
                        )}
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    if (isLoading || !list) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // --- Renderizado Principal ---
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 'lg', mx: 'auto' }}>
            <Typography variant="h3" component="h1" mb={1}>{list.name}</Typography>
            <Typography variant="h6" color="text.secondary" mb={4}>
                {isOwnerMode ? `Modo Edición` : `Lista Compartida`}: {list.description}
            </Typography>

            {isOwnerMode && (
                <Button variant="contained" color="primary" startIcon={<FaPlus />} sx={{ mb: 4 }} onClick={() => handleOpenModal()}>
                    Añadir Nuevo Ítem
                </Button>
            )}

            <Grid container spacing={3}>
                {items.map(item => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                        <ItemCard item={item} />
                    </Grid>
                ))}
            </Grid>

            {/* --- Modal de Añadir/Editar Ítem (MUI) --- */}
            <Modal open={modalOpen} onClose={handleClose}>
                <Box sx={modalStyle}>
                    <Typography variant="h5" component="h2" mb={3}>
                        {isEditingItem ? 'Editar Ítem' : 'Añadir Nuevo Ítem'}
                    </Typography>

                    <Stack spacing={3}>
                        <TextField
                            label="Nombre del Ítem"
                            fullWidth
                            value={currentItem.name}
                            onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                        />
                        <TextareaAutosize
                            placeholder="Descripción completa"
                            minRows={3}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontFamily: 'Roboto, sans-serif'
                            }}
                            value={currentItem.description}
                            onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                        />

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Importancia (1-5)</InputLabel>
                                <Select
                                    label="Importancia (1-5)"
                                    value={currentItem.importance.toString()}
                                    onChange={(e) => setCurrentItem({ ...currentItem, importance: parseInt(e.target.value as string) })}
                                >
                                    {[5, 4, 3, 2, 1].map(n => <MenuItem key={n} value={n}>{n} - {n === 5 ? 'Máxima' : n === 1 ? 'Mínima' : ''}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Coste Estimado ($)"
                                type="number"
                                fullWidth
                                value={currentItem.estimated_cost}
                                onChange={(e) => setCurrentItem({ ...currentItem, estimated_cost: parseFloat(e.target.value) || 0 })}
                            />
                        </Stack>

                        {/* Bloque de URLs de Imágenes */}
                        {/* ... (Implementación de manejo de arrays similar a Login.tsx pero con TextField) */}
                        <Typography variant="h6" mt={2}>Imágenes del Ítem</Typography>
                        <Stack spacing={2}>
                            {currentItem.image_urls.map((image, index) => (
                                <Box key={`img-${index}`} sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <TextField
                                            label={`URL de Imagen ${index + 1}`}
                                            size="small"
                                            fullWidth
                                            value={image.url}
                                            onChange={(e) => handleMediaUrlChange(index, 'url', e.target.value, 'image')}
                                        />
                                        <IconButton size="small" color="error" onClick={() => handleRemoveMediaUrl(index, 'image')}>
                                            <FaTrash size={14} />
                                        </IconButton>
                                    </Stack>
                                    <TextField
                                        label="Etiqueta (Ej: Foto Principal)"
                                        size="small"
                                        fullWidth
                                        value={image.label}
                                        onChange={(e) => handleMediaUrlChange(index, 'label', e.target.value, 'image')}
                                        sx={{ mt: 1 }}
                                    />
                                </Box>
                            ))}
                            <Button variant="outlined" onClick={() => handleAddMediaUrl('image')} startIcon={<FaPlus />}>
                                Añadir Imagen
                            </Button>
                        </Stack>

                        {/* Bloque de URLs Externas (Links) */}
                        <Typography variant="h6" mt={2}>Enlaces de Compra</Typography>
                        <Stack spacing={2}>
                            {currentItem.urls.map((extUrl, index) => (
                                <Box key={`url-${index}`} sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <TextField
                                            label={`URL Externa ${index + 1}`}
                                            size="small"
                                            fullWidth
                                            value={extUrl.url}
                                            // Usamos type: 'external' en el handler de medios
                                            onChange={(e) => handleMediaUrlChange(index, 'url', e.target.value, 'external')}
                                        />
                                        <IconButton size="small" color="error" onClick={() => handleRemoveMediaUrl(index, 'external')}>
                                            <FaTrash size={14} />
                                        </IconButton>
                                    </Stack>
                                    <TextField
                                        label="Etiqueta (Ej: Amazon, Tienda Oficial)"
                                        size="small"
                                        fullWidth
                                        value={extUrl.label}
                                        // Usamos type: 'external' en el handler de medios
                                        onChange={(e) => handleMediaUrlChange(index, 'label', e.target.value, 'external')}
                                        sx={{ mt: 1 }}
                                    />
                                </Box>
                            ))}
                            <Button variant="outlined" onClick={() => handleAddMediaUrl('external')} startIcon={<FaPlus />}>
                                Añadir Enlace
                            </Button>
                        </Stack>

                    </Stack>

                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
                        <Button variant="outlined" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleSaveItem}>
                            {isEditingItem ? 'Guardar Cambios' : 'Añadir Ítem'}
                        </Button>
                    </Stack>
                </Box>
            </Modal>
        </Box>
    );
};

export default ListView;