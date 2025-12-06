// frontend/src/pages/ListView.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Stack,
    Grid,
    CircularProgress,
    Tooltip,
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
    Link,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { FaPlus, FaTh, FaList, FaDownload, FaEnvelope, FaExternalLinkAlt, FaLink } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import type { List, ListItem, ExternalUrl } from '../types';
import toast from 'react-hot-toast';
import AuthRequiredDialog from '../components/AuthRequiredDialog';
import { ItemCard } from '../components/cards';
import { ConfirmDeleteDialog, ItemFormModal, EmailExportDialog, type ItemFormData, type ExportFormat } from '../components/dialogs';
import { ExportMenu } from '../components/export';
import { useExport } from '../hooks';

const priorities = [
    { id: 3, name: 'Importante' },
    { id: 2, name: 'Normal' },
    { id: 1, name: 'Opcional' },
];

const ListView: React.FC = () => {
    const { listId } = useParams<{ listId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isOwnerMode = location.pathname.includes('/edit');
    const { user } = useAuth();
    const { exportToFile, sendViaEmail } = useExport({ includeStatus: !isOwnerMode });

    // State
    const [list, setList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    // Modal states
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ListItem | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ListItem | null>(null);

    // Export state
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [anchorElExport, setAnchorElExport] = useState<null | HTMLElement>(null);

    // Links Menu state
    const [linksMenuAnchor, setLinksMenuAnchor] = useState<null | HTMLElement>(null);
    const [currentLinks, setCurrentLinks] = useState<ExternalUrl[]>([]);

    // Fetch data
    const fetchListData = async () => {
        if (!listId) return;
        setIsLoading(true);

        try {
            if (user && !isOwnerMode) {
                const registerResult = await api.lists.registerUserToList(listId);
                if (registerResult.error) {
                    throw new Error(`Registration failed: ${registerResult.error}`);
                }
            }

            const { data: listData, error: listError } = await api.lists.get(listId);
            if (listError) throw new Error(listError);
            setList(listData as List);

            const { data: itemsData, error: itemsError } = await api.items.list(listId);
            if (itemsError) throw new Error(itemsError);
            setItems(itemsData as ListItem[]);
        } catch (error: any) {
            toast.error('No se pudo cargar la lista o sus ítems.');
            console.error(error);
            if (error.message?.includes('not found')) navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user && !isOwnerMode) {
            setIsLoading(false);
            return;
        }
        fetchListData();
    }, [listId, user]);

    // Auth handlers
    const handleAuthDialogLogin = () => {
        setShowAuthDialog(false);
        navigate('/login', { state: { from: location.pathname } });
    };

    const handleAuthDialogSignup = () => {
        setShowAuthDialog(false);
        navigate('/login?tab=signup', { state: { from: location.pathname } });
    };

    // Item CRUD handlers
    const handleOpenItemModal = (item?: ListItem) => {
        if (item) {
            setEditingItem(item);
        } else {
            setEditingItem(null);
        }
        setItemModalOpen(true);
    };

    const handleSaveItem = async (formData: ItemFormData) => {
        if (!list) return;

        try {
            if (formData.id) {
                // Update
                const { error } = await api.items.update(formData.id, {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    image_urls: formData.image_urls.filter(img => img.url.trim()),
                    urls: formData.urls.filter(url => url.url.trim()),
                    importance: formData.importance,
                    estimated_cost: formData.estimated_cost,
                });
                if (error) throw new Error(error);

                setItems(items.map(i => i.id === formData.id ? {
                    ...i,
                    ...formData,
                    importance: formData.importance as 1 | 2 | 3 | 4 | 5
                } : i));
                toast.success('Ítem actualizado.');
            } else {
                // Create
                const { data, error } = await api.items.create({
                    list_id: list.id,
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    image_urls: formData.image_urls.filter(img => img.url.trim()),
                    urls: formData.urls.filter(url => url.url.trim()),
                    importance: formData.importance,
                    estimated_cost: formData.estimated_cost,
                });
                if (error) throw new Error(error);

                setItems([data as ListItem, ...items]);
                toast.success('Ítem añadido.');
            }
            setItemModalOpen(false);
            setEditingItem(null);
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar el ítem.');
        }
    };

    const handleDeleteItem = (item: ListItem) => {
        if (item.is_adjudicated) {
            toast.error('No puedes eliminar un elemento que ya ha sido adjudicado.');
            return;
        }
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            const { error } = await api.items.delete(itemToDelete.id);
            if (error) throw new Error(error);

            setItems(items.filter(i => i.id !== itemToDelete.id));
            toast.success('Ítem eliminado.');
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar el elemento.');
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    // Adjudication handler
    const handleAdjudicate = async (item: ListItem, adjudicate: boolean) => {
        if (!user) {
            toast.error('Debes iniciar sesión para adjudicar un ítem.');
            return;
        }

        try {
            const { error } = await api.items.adjudicate(item.id, adjudicate);
            if (error) throw new Error(error);

            setItems(items.map(i =>
                i.id === item.id
                    ? { ...i, is_adjudicated: adjudicate, adjudicated_by: adjudicate ? user.id : null }
                    : i
            ));
            toast.success(adjudicate ? '¡Has reservado este ítem!' : 'Has liberado el ítem.');
        } catch (error: any) {
            toast.error(error.message || 'Error al adjudicar el elemento.');
        }
    };

    // View mode handler
    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newViewMode: 'grid' | 'table',
    ) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    // Export handlers
    const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorElExport(event.currentTarget);
    };

    const handleExportClose = () => {
        setAnchorElExport(null);
    };

    const handleExportWithFormat = async (format: ExportFormat) => {
        if (!list) return;
        handleExportClose();
        await exportToFile(items, format, list.name);
    };

    const handleSendEmail = async (email: string, format: ExportFormat) => {
        if (!list) return;
        await sendViaEmail(items, format, list.name, email);
        setEmailDialogOpen(false);
    };

    // Render helpers
    const renderGridView = () => (
        <Grid container spacing={3}>
            {items.map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <ItemCard
                        item={item}
                        isOwnerMode={isOwnerMode}
                        currentUserId={user?.id}
                        onEdit={isOwnerMode ? handleOpenItemModal : undefined}
                        onDelete={isOwnerMode ? handleDeleteItem : undefined}
                        onAdjudicate={!isOwnerMode ? handleAdjudicate : undefined}
                    />
                </Grid>
            ))}
        </Grid>
    );

    const renderTableView = () => (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Imagen</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Importancia</TableCell>
                        <TableCell>Coste Est.</TableCell>
                        {!isOwnerMode && <TableCell>Estado</TableCell>}
                        <TableCell align="center">Enlaces</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item) => {
                        const isAdjudicatedByCurrentUser = item.adjudicated_by === user?.id;
                        return (
                            <TableRow
                                key={item.id}
                                hover
                                sx={{
                                    cursor: isOwnerMode ? 'pointer' : 'default',
                                    borderLeft: !isOwnerMode ? `4px solid ${item.is_adjudicated ? theme.palette.error.main : theme.palette.success.main}` : undefined,
                                }}
                                onClick={() => isOwnerMode && handleOpenItemModal(item)}
                            >
                                <TableCell>
                                    {item.image_urls?.[0] ? (
                                        <Avatar src={item.image_urls[0].url} variant="rounded" sx={{ width: 50, height: 50 }} />
                                    ) : (
                                        <Avatar variant="rounded" sx={{ width: 50, height: 50, bgcolor: 'grey.300' }}>-</Avatar>
                                    )}
                                </TableCell>
                                <TableCell><strong>{item.name}</strong></TableCell>
                                <TableCell>
                                    <Box>
                                        <Tooltip title={item.description || ''}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                {item.description || '-'}
                                            </Typography>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                                <TableCell>{priorities.find(p => p.id === item.importance)?.name || 'N/A'}</TableCell>
                                <TableCell>€{item.estimated_cost?.toFixed(2) || '0.00'}</TableCell>
                                {!isOwnerMode && (
                                    <TableCell>
                                        <Box sx={{
                                            bgcolor: item.is_adjudicated
                                                ? alpha(theme.palette.error.main, 0.1)
                                                : alpha(theme.palette.success.main, 0.1),
                                            color: item.is_adjudicated
                                                ? theme.palette.error.main
                                                : theme.palette.success.main,
                                            px: 1, py: 0.5, borderRadius: 1, display: 'inline-block',
                                            fontWeight: 'bold', fontSize: '0.75rem'
                                        }}>
                                            {item.is_adjudicated ? 'ADJUDICADO' : 'DISPONIBLE'}
                                        </Box>
                                    </TableCell>
                                )}
                                <TableCell align="center">
                                    {item.urls && item.urls.length > 0 ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<FaLink />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentLinks(item.urls || []);
                                                setLinksMenuAnchor(e.currentTarget);
                                            }}
                                        >
                                            Ver ({item.urls.length})
                                        </Button>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">-</Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        {isOwnerMode ? (
                                            <>
                                                <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); handleOpenItemModal(item); }}>
                                                    Editar
                                                </Button>
                                                <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }}>
                                                    Eliminar
                                                </Button>
                                            </>
                                        ) : user && (
                                            isAdjudicatedByCurrentUser ? (
                                                <Button size="small" variant="contained" color="warning" onClick={(e) => { e.stopPropagation(); handleAdjudicate(item, false); }}>
                                                    Soltar
                                                </Button>
                                            ) : item.is_adjudicated ? (
                                                <Button size="small" variant="contained" color="error" disabled>Reservado</Button>
                                            ) : (
                                                <Button size="small" variant="contained" color="success" onClick={(e) => { e.stopPropagation(); handleAdjudicate(item, true); }}>
                                                    Yo lo tomo
                                                </Button>
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
    );

    // Auth required view for shared mode
    if (!user && !isOwnerMode) {
        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h5" mb={2}>Para ver esta lista necesitas iniciar sesión</Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                    Inicia sesión o regístrate para ver los ítems y poder reservarlos.
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button variant="contained" onClick={() => navigate('/login', { state: { from: location.pathname } })}>
                        Iniciar Sesión
                    </Button>
                    <Button variant="outlined" onClick={() => navigate('/login?tab=signup', { state: { from: location.pathname } })}>
                        Registrarse
                    </Button>
                </Stack>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!list) {
        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h5">Lista no encontrada</Typography>
                <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
                    Volver al Dashboard
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                mb={4}
                spacing={2}
            >
                <Box>
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        {list.name}
                    </Typography>
                    {list.description && (
                        <Typography variant="body1" color="text.secondary" mt={1}>
                            {list.description}
                        </Typography>
                    )}
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                    >
                        <ToggleButton value="grid"><FaTh /></ToggleButton>
                        <ToggleButton value="table"><FaList /></ToggleButton>
                    </ToggleButtonGroup>
                    <Button
                        variant="outlined"
                        startIcon={<FaDownload />}
                        onClick={handleExportClick}
                    >
                        Exportar
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FaEnvelope />}
                        onClick={() => setEmailDialogOpen(true)}
                    >
                        Email
                    </Button>
                    {isOwnerMode && (
                        <Button
                            variant="contained"
                            startIcon={<FaPlus />}
                            onClick={() => handleOpenItemModal()}
                        >
                            Añadir Ítem
                        </Button>
                    )}
                </Stack>
            </Stack>

            {/* Content */}
            {items.length === 0 ? (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary" mb={2}>
                        {isOwnerMode ? 'Esta lista está vacía' : 'No hay ítems en esta lista'}
                    </Typography>
                    {isOwnerMode && (
                        <Button
                            variant="contained"
                            startIcon={<FaPlus />}
                            onClick={() => handleOpenItemModal()}
                        >
                            Añadir primer ítem
                        </Button>
                    )}
                </Box>
            ) : (
                viewMode === 'grid' ? renderGridView() : renderTableView()
            )}

            {/* Export Menu */}
            <Menu
                anchorEl={linksMenuAnchor}
                open={Boolean(linksMenuAnchor)}
                onClose={() => setLinksMenuAnchor(null)}
                onClick={(e) => e.stopPropagation()}
            >
                {currentLinks.map((url, index) => (
                    <MenuItem
                        key={index}
                        component="a"
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setLinksMenuAnchor(null)}
                    >
                        <ListItemIcon>
                            <FaExternalLinkAlt size={14} />
                        </ListItemIcon>
                        <ListItemText primary={url.label || url.url} secondary={url.label ? url.url : undefined} />
                    </MenuItem>
                ))}
            </Menu>

            <ExportMenu
                anchorEl={anchorElExport}
                onClose={handleExportClose}
                onExport={handleExportWithFormat}
            />

            {/* Item Form Modal */}
            <ItemFormModal
                open={itemModalOpen}
                onClose={() => { setItemModalOpen(false); setEditingItem(null); }}
                onSave={handleSaveItem}
                initialData={editingItem ? {
                    id: editingItem.id,
                    name: editingItem.name,
                    description: editingItem.description || '',
                    image_urls: editingItem.image_urls || [],
                    urls: editingItem.urls || [],
                    importance: editingItem.importance,
                    estimated_cost: editingItem.estimated_cost || 0,
                } : undefined}
                isEditing={!!editingItem}
            />

            {/* Email Export Dialog */}
            <EmailExportDialog
                open={emailDialogOpen}
                onClose={() => setEmailDialogOpen(false)}
                onSend={handleSendEmail}
                listName={list.name}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}
                onConfirm={confirmDeleteItem}
                itemName={itemToDelete?.name || ''}
                itemType="elemento"
            />

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