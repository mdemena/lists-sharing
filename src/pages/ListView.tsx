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
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    useTheme,
    alpha,
    Menu,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaPlus, FaEuroSign, FaStar, FaExternalLinkAlt, FaTh, FaList, FaDownload, FaEnvelope } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import type { List, ListItem, ImageUrl, ExternalUrl } from '../types'; // Importamos los tipos
import toast from 'react-hot-toast';
import AuthRequiredDialog from '../components/AuthRequiredDialog';

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

const priorities = [
    { id: 3, name: 'Importante' },
    { id: 2, name: 'Normal' },
    { id: 1, name: 'Opcional' },
];

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
                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.7)', borderRadius: 1 }}
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
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex((currentIndex - 1 + images.length) % images.length);
                        }}
                        sx={{ color: 'white' }}
                    >
                        &lt;
                    </Button>
                    <Button
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex((currentIndex + 1) % images.length);
                        }}
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
    const theme = useTheme();
    // Determina si estamos en modo edición (ruta /list/:id/edit) o compartido (ruta /share/:id)
    const isOwnerMode = location.pathname.includes('/edit');

    const { user } = useAuth();
    const [list, setList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showAuthDialog, setShowAuthDialog] = useState(false);

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

    // --- Lógica de Exportación ---
    const [anchorElExport, setAnchorElExport] = useState<null | HTMLElement>(null);
    const openExport = Boolean(anchorElExport);
    const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElExport(event.currentTarget);
    };
    const handleExportClose = () => {
        setAnchorElExport(null);
    };

    // --- Lógica de Email ---
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel'>('excel');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const handleOpenEmailDialog = () => {
        setEmailDialogOpen(true);
        handleExportClose();
    };

    const handleSendEmail = async () => {
        if (!recipientEmail) {
            toast.error('Por favor, introduce un email.');
            return;
        }
        setIsSendingEmail(true);

        try {
            const exportData = items.map(item => ({
                Nombre: item.name,
                Descripción: item.description,
                Importancia: priorities.find(p => p.id === item.importance)?.name || 'N/A',
                Coste: item.estimated_cost,
                URLs: item.urls?.map(u => u.url).join(', ') || '',
            }));

            const fileName = `${list?.name.replace(/\s+/g, '_')}_export`;
            let content = '';
            let fileExtension = '';

            if (exportFormat === 'json') {
                content = btoa(unescape(encodeURIComponent(JSON.stringify(items, null, 2))));
                fileExtension = 'json';
            } else if (exportFormat === 'csv') {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                content = btoa(unescape(encodeURIComponent(csvOutput)));
                fileExtension = 'csv';
            } else if (exportFormat === 'excel') {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                // Convert array buffer to base64
                let binary = '';
                const bytes = new Uint8Array(excelBuffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                content = btoa(binary);
                fileExtension = 'xlsx';
            }

            const result = await api.lists.sendListFile({
                recipientEmail,
                subject: `Archivo de lista: ${list?.name}`,
                htmlContent: `<p>Adjunto encontrarás la lista <strong>${list?.name}</strong> en formato ${exportFormat.toUpperCase()}.</p>`,
                attachment: {
                    name: `${fileName}.${fileExtension}`,
                    content: content,
                },
            });

            if (result.error) throw new Error(result.error);
            toast.success('Email enviado correctamente.');
            setEmailDialogOpen(false);
            setRecipientEmail('');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al enviar el email.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleExport = (type: 'json' | 'csv' | 'excel') => {
        if (!list || items.length === 0) return;

        const exportData = items.map(item => ({
            Nombre: item.name,
            Descripción: item.description,
            Importancia: priorities.find(p => p.id === item.importance)?.name || 'N/A',
            Coste: item.estimated_cost,
            URLs: item.urls?.map(u => u.url).join(', ') || '',
        }));

        const fileName = `${list.name.replace(/\s+/g, '_')}_export`;

        if (type === 'json') {
            const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                JSON.stringify(items, null, 2)
            )}`;
            const link = document.createElement('a');
            link.href = jsonString;
            link.download = `${fileName}.json`;
            link.click();
        } else if (type === 'csv') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
            const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}.csv`;
            link.click();
        } else if (type === 'excel') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        }
        handleExportClose();
    };

    // --- Lógica de Carga de Datos ---
    const fetchListData = async () => {
        if (!listId) return;
        setIsLoading(true);

        try {
            // 0. Registrar al usuario en la lista si es necesario (Shared Mode)
            // Esto asegura que el usuario tenga permisos (RLS) antes de intentar obtener la lista
            if (user && !isOwnerMode) {
                const registerResult = await api.lists.registerUserToList(listId);
                if (registerResult.error) {
                    throw new Error(`Registration failed: ${registerResult.error}`);
                }
            }

            // 1. Obtener la información de la lista
            const { data: listData, error: listError } = await api.lists.get(listId);

            if (listError) {
                throw new Error(listError);
            }
            setList(listData as List);

            // 2. Obtener los ítems de la lista
            const { data: itemsData, error: itemsError } = await api.items.list(listId);

            if (itemsError) throw new Error(itemsError);
            setItems(itemsData as ListItem[]);

        } catch (error: any) {
            toast.error('No se pudo cargar la lista o sus ítems.');
            console.error(error);
            // Si la lista no existe o no tiene acceso, redirigir al dashboard
            // Note: API might return 404 or 500, we handle generic error here
            if (error.message?.includes('not found')) navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch list data when listId or user changes (only if authenticated in shared mode, or in owner mode)
    useEffect(() => {
        // Don't fetch if user is not authenticated and we're in shared mode
        if (!user && !isOwnerMode) {
            setIsLoading(false);
            return;
        }
        fetchListData();
    }, [listId, user]);

    // Show auth dialog if not authenticated and in shared mode
    useEffect(() => {
        if (!user && !isOwnerMode) {
            setShowAuthDialog(true);
        }
    }, [user, isOwnerMode]);



    const handleAuthDialogLogin = () => {
        // Save current URL for redirect after login
        localStorage.setItem('redirectAfterAuth', window.location.pathname);
        navigate('/login', { state: { isRegister: false } });
    };

    const handleAuthDialogSignup = () => {
        // Save current URL for redirect after signup
        localStorage.setItem('redirectAfterAuth', window.location.pathname);
        navigate('/login', { state: { isRegister: true } });
    };


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
                const result = await api.items.update(currentItem.id, itemData);
                data = result.data as ListItem;
                error = result.error;

                if (error) throw new Error(error);
                setItems(items.map(item => (item.id === currentItem.id ? data as ListItem : item)));

            } else {
                // Insertar
                const result = await api.items.create(itemData);
                data = result.data as ListItem;
                error = result.error;

                if (error) throw new Error(error);
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
            const { error } = await api.items.delete(item.id);

            if (error) throw new Error(error);

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
            const result = await api.items.update(item.id, updateData);
            const data = result.data;
            const error = result.error;

            if (error) throw new Error(error);

            setItems(items.map(i => (i.id === item.id ? data as ListItem : i)));
            toast(adjudicate ? '¡Adjudicado!' : 'Liberado.');

        } catch (error: any) {
            toast.error(error.message || 'Error al adjudicar el elemento.');
        }
    };

    // --- Renderizado del Ítem ---
    const ItemCard: React.FC<{ item: ListItem }> = ({ item }) => {
        const isAdjudicatedByCurrentUser = item.adjudicated_by === user?.id;

        const AdjudicationStatus = !isOwnerMode ? (
            <Box sx={{
                bgcolor: item.is_adjudicated 
                    ? alpha(theme.palette.error.main, 0.1) 
                    : alpha(theme.palette.success.main, 0.1),
                color: item.is_adjudicated 
                    ? theme.palette.error.main 
                    : theme.palette.success.main,
                border: '1px solid',
                borderColor: item.is_adjudicated 
                    ? alpha(theme.palette.error.main, 0.3) 
                    : alpha(theme.palette.success.main, 0.3),
                p: 0.5,
                borderRadius: 1,
                fontWeight: 'bold',
                fontSize: '0.8rem'
            }}>
                {item.is_adjudicated ? 'ADJUDICADO' : 'DISPONIBLE'}
            </Box>
        ) : null;

        return (
            <Card sx={{
                width: '100%',
                minHeight: '250px',
                boxShadow: 3,
                borderLeft: !isOwnerMode ? `5px solid ${item.is_adjudicated ? 'red' : 'green'}` : undefined,
                cursor: isOwnerMode ? 'pointer' : 'default',
                transition: '0.2s',
                '&:hover': isOwnerMode ? { boxShadow: 6, transform: 'translateY(-2px)' } : {}
            }}
                onClick={() => isOwnerMode && handleOpenModal(item)}
            >
                {/* Carrusel de Imágenes */}
                <ImageCarousel images={item.image_urls || []} />

                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" component="h3">{item.name}</Typography>
                        {AdjudicationStatus}
                    </Stack>

                    <Tooltip title={item.description || ''} arrow>
                        <Typography variant="body2" color="text.secondary" mb={2} noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 3 }}>
                            {item.description || 'Sin descripción.'}
                        </Typography>
                    </Tooltip>

                    <Stack direction="row" spacing={2} alignItems="center" fontSize="small" mb={2}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ color: 'warning.main' }}><FaStar size={14} /></Box>
                            <Typography variant="caption">Imp: {item.importance}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ color: 'success.main' }}><FaEuroSign size={14} /></Box>
                            <Typography variant="caption">Coste Est.: €{item.estimated_cost?.toFixed(2) || 'N/A'}</Typography>
                        </Stack>
                    </Stack>

                    {/* Enlaces Externos */}
                    {item.urls && item.urls.length > 0 && (
                        <Stack spacing={0.5} sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                Enlaces:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                {item.urls.map((extUrl, index) => (
                                    <Button
                                        key={index}
                                        size="small"
                                        variant="outlined"
                                        endIcon={<FaExternalLinkAlt size={10} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(extUrl.url, '_blank');
                                        }}
                                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                    >
                                        {extUrl.label || 'Ver enlace'}
                                    </Button>
                                ))}
                            </Stack>
                        </Stack>
                    )}

                    {/* Acciones */}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" pt={2}>
                        {isOwnerMode ? (
                            <>
                                <Button size="small" variant="outlined" startIcon={<FaEdit />} onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}>Editar</Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteItem(item);
                                    }}
                                >
                                    <FaTrash size={14} />
                                </IconButton>
                            </>
                        ) : (
                            user && (
                                <>
                                    {isAdjudicatedByCurrentUser ? (
                                        <Button size="small" variant="contained" color="warning" startIcon={<FaTimes />} onClick={(e) => { e.stopPropagation(); handleAdjudicate(item, false); }}>
                                            Soltar
                                        </Button>
                                    ) : item.is_adjudicated ? (
                                        <Button size="small" variant="contained" color="error" disabled>
                                            Reservado
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="contained" color="success" startIcon={<FaCheck />} onClick={(e) => { e.stopPropagation(); handleAdjudicate(item, true); }}>
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

    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newViewMode: 'grid' | 'table',
    ) => {
                if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    if (isLoading) {
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

    // Show message if not authenticated in shared mode
    if (!user && !isOwnerMode) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Typography variant="h5">Autenticación Requerida</Typography>
                <Typography variant="body1" color="text.secondary">
                    Por favor, inicia sesión o regístrate para acceder a esta lista compartida.
                </Typography>
                <AuthRequiredDialog
                    open={showAuthDialog}
                    onClose={() => {
                        setShowAuthDialog(false);
                        navigate('/');
                    }}
                    onLogin={handleAuthDialogLogin}
                    onSignup={handleAuthDialogSignup}
                />
            </Box>
        );
    }

    if (!list) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <Typography variant="h6">Lista no encontrada</Typography>
            </Box>
        );
    }

    // --- Renderizado Principal ---
    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 'lg', mx: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h3" component="h1">{list.name}</Typography>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="view mode"
                    size="small"
                >
                    <ToggleButton value="grid" aria-label="grid view">
                        <FaTh />
                    </ToggleButton>
                    <ToggleButton value="table" aria-label="table view">
                        <FaList />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            <Tooltip title={list.description || ''} arrow>
                <Typography variant="h6" color="text.secondary" mb={4} noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isOwnerMode ? `Modo Edición` : `Lista Compartida`}: {list.description}
                    {!isOwnerMode && list.shared_by_name && (
                        <Typography component="span" variant="body2" sx={{ display: 'block', fontStyle: 'italic', mt: 1 }}>
                            Compartida por: {list.shared_by_name}
                        </Typography>
                    )}
                </Typography>
            </Tooltip>

            {isOwnerMode && (
                <Stack direction="row" spacing={2} mb={4}>
                    <Button variant="contained" color="primary" startIcon={<FaPlus />} onClick={() => handleOpenModal()}>
                        Añadir Nuevo Ítem
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FaDownload />}
                        onClick={handleExportClick}
                    >
                        Exportar
                    </Button>
                    <Menu
                        anchorEl={anchorElExport}
                        open={openExport}
                        onClose={handleExportClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                    >
                        <MenuItem onClick={() => handleExport('csv')}>CSV</MenuItem>
                        <MenuItem onClick={() => handleExport('excel')}>Excel</MenuItem>
                        <MenuItem onClick={() => handleExport('json')}>JSON</MenuItem>
                        <MenuItem onClick={handleOpenEmailDialog} sx={{ borderTop: '1px solid #eee', color: 'primary.main' }}>
                            <FaEnvelope style={{ marginRight: 8 }} /> Enviar por Email
                        </MenuItem>
                    </Menu>
                </Stack>
            )}

            {/* Email Dialog */}
            <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
                <DialogTitle>Enviar Lista por Email</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                        <TextField
                            autoFocus
                            label="Email del Destinatario"
                            type="email"
                            fullWidth
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Formato</InputLabel>
                            <Select
                                value={exportFormat}
                                label="Formato"
                                onChange={(e) => setExportFormat(e.target.value as any)}
                            >
                                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                                <MenuItem value="csv">CSV (.csv)</MenuItem>
                                <MenuItem value="json">JSON (.json)</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmailDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSendEmail} variant="contained" disabled={isSendingEmail}>
                        {isSendingEmail ? <CircularProgress size={24} /> : 'Enviar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {viewMode === 'grid' ? (
                <Grid container spacing={3}>
                    {items.map(item => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                            <ItemCard item={item} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Imagen</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell align="right">Importancia</TableCell>
                                <TableCell align="right">Coste</TableCell>
                                {!isOwnerMode && <TableCell align="center">Estado</TableCell>}
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item) => {
                                const isAdjudicatedByCurrentUser = item.adjudicated_by === user?.id;
                                return (
                                    <TableRow
                                        key={item.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {item.image_urls && item.image_urls.length > 0 ? (
                                                <Avatar src={item.image_urls[0].url} variant="rounded" />
                                            ) : (
                                                <Avatar src="/favicon.svg" variant="rounded" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {item.name}
                                                </Typography>
                                                {item.urls && item.urls.length > 0 && (
                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mt={0.5}>
                                                        {item.urls.map((extUrl, index) => (
                                                            <Button
                                                                key={index}
                                                                size="small"
                                                                variant="text"
                                                                endIcon={<FaExternalLinkAlt size={8} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(extUrl.url, '_blank');
                                                                }}
                                                                sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto', p: 0.5 }}
                                                            >
                                                                {extUrl.label || 'Link'}
                                                            </Button>
                                                        ))}
                                                    </Stack>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Tooltip title={item.description || ''} arrow>
                                                <span>{item.description || '-'}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="right">{priorities.find(p => p.id === item.importance)?.name || 'N/A'}</TableCell>
                                        <TableCell align="right">€{item.estimated_cost?.toFixed(2) || 'N/A'}</TableCell>
                                        {!isOwnerMode && (
                                            <TableCell align="center">
                                                <Box sx={{
                                                    bgcolor: item.is_adjudicated 
                                                        ? alpha(theme.palette.error.main, 0.1) 
                                                        : alpha(theme.palette.success.main, 0.1),
                                                    color: item.is_adjudicated 
                                                        ? theme.palette.error.main 
                                                        : theme.palette.success.main,
                                                    border: '1px solid',
                                                    borderColor: item.is_adjudicated 
                                                        ? alpha(theme.palette.error.main, 0.3) 
                                                        : alpha(theme.palette.success.main, 0.3),
                                                    p: 0.5,
                                                    borderRadius: 1,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem',
                                                    display: 'inline-block'
                                                }}>
                                                    {item.is_adjudicated ? 'ADJUDICADO' : 'DISPONIBLE'}
                                                </Box>
                                            </TableCell>
                                        )}
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                {isOwnerMode ? (
                                                    <>
                                                        <IconButton size="small" onClick={() => handleOpenModal(item)}>
                                                            <FaEdit />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleDeleteItem(item)}>
                                                            <FaTrash />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    user && (
                                                        <>
                                                            {isAdjudicatedByCurrentUser ? (
                                                                <Tooltip title="Soltar">
                                                                    <IconButton size="small" color="warning" onClick={() => handleAdjudicate(item, false)}>
                                                                        <FaTimes />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            ) : item.is_adjudicated ? (
                                                                <Tooltip title="Reservado">
                                                                    <span>
                                                                        <IconButton size="small" color="error" disabled>
                                                                            <FaTimes />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip title="Yo lo tomo">
                                                                    <IconButton size="small" color="success" onClick={() => handleAdjudicate(item, true)}>
                                                                        <FaCheck />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </>
                                                    )
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

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
                                    {priorities.map(n => <MenuItem key={n.id} value={n.id}>{n.id} - {n.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Coste Estimado (€)"
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

            {/* Auth Required Dialog */}
            <AuthRequiredDialog
                open={showAuthDialog}
                onClose={() => setShowAuthDialog(false)}
                onLogin={handleAuthDialogLogin}
                onSignup={handleAuthDialogSignup}
            />
        </Box>
    );
};

export default ListView;