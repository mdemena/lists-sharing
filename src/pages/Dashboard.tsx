// frontend/src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    Grid,
    Modal,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    Container,
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { FaPlus, FaList, FaShareSquare, FaTh, FaEdit, FaTrash, FaDownload, FaEnvelope } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import type { List } from '../types'; // Importamos la interfaz List
import { useNavigate } from 'react-router-dom';
import ShareListModal from '../components/ShareListModal';
import toast from 'react-hot-toast';

// Estilos para el Modal de MUI
const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 400 },
    bgcolor: 'background.paper',
    borderRadius: 1,
    boxShadow: 24,
    p: 4,
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [lists, setLists] = useState<List[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
    const [listToShare, setListToShare] = useState<List | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [sharedLists, setSharedLists] = useState<List[]>([]);

    // Export state
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel'>('excel');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [listToExport, setListToExport] = useState<List | null>(null);

    // URL de la API del backend (a través del proxy de Vite)
    // const BACKEND_API_URL = '';
    // --- Lógica de Carga de Datos ---
    const fetchUserLists = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // Fetch owned lists
            const { data: ownedData, error: ownedError } = await api.lists.list();
            if (ownedError) throw new Error(ownedError);
            setLists(ownedData as List[]);

            // Fetch shared lists
            const { data: sharedData, error: sharedError } = await api.lists.getSharedWithMe();
            if (sharedError) throw new Error(sharedError);
            setSharedLists(sharedData as List[]);

        } catch (error: any) {
            toast.error(`Error al cargar listas: ${error.message || 'No se pudieron recuperar tus listas.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserLists();
    }, [user]); // Ejecutar al montar el componente o si cambia el usuario

    const handleShareClick = (list: List) => {
        setListToShare(list);
        setIsShareModalOpen(true);
    };

    // --- Lógica de Creación de Lista ---
    const handleCreateList = async () => {
        if (!newListName.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        try {
            const { data, error } = await api.lists.create({
                name: newListName.trim(),
                description: newListDescription.trim(),
            });

            if (error) throw new Error(error);

            toast.success('Lista creada con éxito');

            // 2. Actualizar el estado y cerrar el modal
            if (data) {
                setLists([data as List, ...lists]);
            }
            setIsShareModalOpen(false);
            setNewListName('');
            setNewListDescription('');

            // 3. Navegar a la página de edición de la nueva lista
            navigate(`/list/${data?.id}/edit`);

        } catch (error: any) {
            toast.error(`Error de creación: ${error.message || 'No se pudo crear la lista.'}`);
        }
    }

    const handleDeleteList = async (list: List) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la lista "${list.name}"?`)) return;

        try {
            const { error } = await api.lists.delete(list.id);
            if (error) throw new Error(error);

            setLists(lists.filter(l => l.id !== list.id));
            toast.success('Lista eliminada con éxito');
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar la lista');
        }
    };

    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newViewMode: 'grid' | 'table',
    ) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    // Export handlers
    const handleExportList = async (list: List, format: 'json' | 'csv' | 'excel') => {
        try {
            // Fetch items for this list
            const { data: itemsData, error } = await api.items.list(list.id);
            if (error) throw new Error(error);
            
            const items = itemsData || [];
            const priorities = [
                { id: 3, name: 'Importante' },
                { id: 2, name: 'Normal' },
                { id: 1, name: 'Opcional' },
            ];

            const exportData = items.map((item: any) => ({
                Nombre: item.name,
                Descripción: item.description,
                Importancia: priorities.find(p => p.id === item.importance)?.name || 'N/A',
                Coste: item.estimated_cost,
                Estado: item.is_adjudicated ? 'Adjudicado' : 'Disponible',
                AdjudicadoPor: item.adjudicated_by || '',
                URLs: item.urls?.map((u: any) => u.url).join(', ') || '',
            }));

            const fileName = `${list.name.replace(/\s+/g, '_')}_export`;

            if (format === 'json') {
                const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                    JSON.stringify(items, null, 2)
                )}`;
                const link = document.createElement('a');
                link.href = jsonString;
                link.download = `${fileName}.json`;
                link.click();
            } else if (format === 'csv') {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${fileName}.csv`;
                link.click();
            } else if (format === 'excel') {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
                XLSX.writeFile(workbook, `${fileName}.xlsx`);
            }
            toast.success('Lista exportada correctamente');
        } catch (error: any) {
            toast.error(error.message || 'Error al exportar la lista');
        }
    };

    const handleOpenEmailDialog = (list: List) => {
        setListToExport(list);
        setEmailDialogOpen(true);
    };

    const handleSendEmail = async () => {
        if (!recipientEmail || !listToExport) {
            toast.error('Por favor, introduce un email.');
            return;
        }
        setIsSendingEmail(true);

        try {
            // Fetch items for this list
            const { data: itemsData, error } = await api.items.list(listToExport.id);
            if (error) throw new Error(error);
            
            const items = itemsData || [];
            const priorities = [
                { id: 3, name: 'Importante' },
                { id: 2, name: 'Normal' },
                { id: 1, name: 'Opcional' },
            ];

            const exportData = items.map((item: any) => ({
                Nombre: item.name,
                Descripción: item.description,
                Importancia: priorities.find(p => p.id === item.importance)?.name || 'N/A',
                Coste: item.estimated_cost,
                Estado: item.is_adjudicated ? 'Adjudicado' : 'Disponible',
                AdjudicadoPor: item.adjudicated_by || '',
                URLs: item.urls?.map((u: any) => u.url).join(', ') || '',
            }));

            const fileName = `${listToExport.name.replace(/\s+/g, '_')}_export`;
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
                subject: `Archivo de lista: ${listToExport.name}`,
                htmlContent: `<p>Adjunto encontrarás la lista <strong>${listToExport.name}</strong> en formato ${exportFormat.toUpperCase()}.</p>`,
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

    // --- JSX de Componentes ---

    const ListCard: React.FC<{ list: List; isShared?: boolean }> = ({ list, isShared }) => (
        <Card
            sx={{
                width: '100%',
                minHeight: '150px',
                boxShadow: 3,
                transition: '0.2s',
                cursor: 'pointer',
                position: 'relative',
                '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
            }}
            onClick={() => navigate(isShared ? `/share/${list.id}` : `/list/${list.id}/edit`)}
        >
            {!isShared && (
                <Tooltip title="Eliminar Lista">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list);
                        }}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1,
                            bgcolor: 'background.paper',
                            '&:hover': { bgcolor: 'error.light', color: 'white' }
                        }}
                    >
                        <FaTrash size={12} />
                    </IconButton>
                </Tooltip>
            )}
            <CardContent>
                <Typography variant="h6" component="h3" mb={1} noWrap sx={{ pr: 3 }}>
                    {list.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1} noWrap sx={{ WebkitLineClamp: 2 }}>
                    {list.description || 'Sin descripción.'}
                </Typography>
                {isShared && list.shared_by_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Compartida por: {list.shared_by_name}
                    </Typography>
                )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', pb: 2, pr: 2 }}>
                {!isShared ? (
                    <>
                        <Button
                            size="small"
                            startIcon={<FaList />}
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/list/${list.id}/edit`);
                            }}
                        >
                            Editar Lista
                        </Button>
                        <Button
                            size="small"
                            startIcon={<FaShareSquare />}
                            variant="contained"
                            color="secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShareClick(list);
                            }}
                        >
                            Compartir {list.list_shares?.[0]?.count ? `(${list.list_shares[0].count})` : ''}
                        </Button>
                        <Tooltip title="Exportar">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportList(list, 'excel');
                                }}
                            >
                                <FaDownload size={12} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Enviar por Email">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEmailDialog(list);
                                }}
                            >
                                <FaEnvelope size={12} />
                            </IconButton>
                        </Tooltip>
                    </>
                ) : (
                    <Button
                        size="small"
                        startIcon={<FaList />}
                        variant="contained"
                        color="primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/share/${list.id}`);
                        }}
                    >
                        Ver Lista
                    </Button>
                )}
            </CardActions>
        </Card>
    );

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                mb={4}
                spacing={2}
            >
                <Typography variant="h4" component="h1">
                    Mis Listas
                </Typography>
                <Button
                    startIcon={<FaPlus />}
                    variant="contained"
                    color="primary"
                    onClick={() => setIsCreationModalOpen(true)}
                >
                    Crear Nueva Lista
                </Button>
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} aria-label="dashboard tabs">
                    <Tab label={`Mis Listas (${lists.length})`} />
                    <Tab label={`Compartidas Conmigo (${sharedLists.length})`} />
                </Tabs>
            </Box>

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    {activeTab === 0 ? 'Mis Listas' : 'Listas Compartidas'}
                </Typography>
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

            {/* Manejo de estados de carga y vacío */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (activeTab === 0 ? lists : sharedLists).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, border: 1, borderColor: 'divider', borderStyle: 'dashed', borderRadius: 1, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" mb={1}>
                        {activeTab === 0 ? '¡Aún no tienes listas!' : '¡No tienes listas compartidas!'}
                    </Typography>
                    <Typography color="text.secondary" mb={2}>
                        {activeTab === 0 
                            ? 'Crea tu primera lista de regalos, deseos o tareas.' 
                            : 'Cuando alguien comparta una lista contigo, aparecerá aquí.'}
                    </Typography>
                    {activeTab === 0 && (
                        <Button startIcon={<FaPlus />} variant="contained" color="primary" onClick={() => setIsCreationModalOpen(true)}>
                            Crear Nueva Lista
                        </Button>
                    )}
                </Box>
            ) : viewMode === 'grid' ? (
                // Renderizado de Listas en Grid
                <Grid container spacing={3}>
                    {(activeTab === 0 ? lists : sharedLists).map(list => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={list.id}>
                            <ListCard list={list} isShared={activeTab === 1} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                // Renderizado de Listas en Tabla
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                {activeTab === 0 && <TableCell align="center">Compartido con</TableCell>}
                                {activeTab === 1 && <TableCell align="center">Compartida por</TableCell>}
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(activeTab === 0 ? lists : sharedLists).map((list) => (
                                <TableRow
                                    key={list.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {list.name}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {list.description || '-'}
                                    </TableCell>
                                    {activeTab === 0 && (
                                        <TableCell align="center">
                                            {list.list_shares?.[0]?.count ? `${list.list_shares[0].count} usuarios` : '-'}
                                        </TableCell>
                                    )}
                                    {activeTab === 1 && (
                                        <TableCell align="center">
                                            {list.shared_by_name || '-'}
                                        </TableCell>
                                    )}
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            {activeTab === 0 ? (
                                                <>
                                                    <Tooltip title="Editar Lista">
                                                        <IconButton size="small" onClick={() => navigate(`/list/${list.id}/edit`)}>
                                                            <FaEdit />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar Lista">
                                                        <IconButton size="small" color="error" onClick={() => handleDeleteList(list)}>
                                                            <FaTrash />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Compartir">
                                                        <IconButton size="small" color="secondary" onClick={() => handleShareClick(list)}>
                                                            <FaShareSquare />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Exportar">
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleExportList(list, 'excel'); }}>
                                                            <FaDownload />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Enviar por Email">
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEmailDialog(list); }}>
                                                            <FaEnvelope />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Tooltip title="Ver Lista">
                                                    <IconButton size="small" color="primary" onClick={() => navigate(`/share/${list.id}`)}>
                                                        <FaList />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* --- Modal de Creación de Lista (MUI) --- */}
            <Modal open={isCreationModalOpen} onClose={() => setIsCreationModalOpen(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="h5" component="h2" mb={3}>
                        Crear Nueva Lista
                    </Typography>
                    <Stack spacing={3}>
                        <TextField
                            label="Nombre de la Lista"
                            fullWidth
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            label="Descripción (Opcional)"
                            fullWidth
                            multiline
                            rows={2}
                            value={newListDescription}
                            onChange={(e) => setNewListDescription(e.target.value)}
                        />
                    </Stack>

                    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
                        <Button variant="outlined" onClick={() => setIsCreationModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleCreateList} disabled={isLoading}>
                            Crear Lista
                        </Button>
                    </Stack>
                </Box>
            </Modal>

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

            {/* --- Modal de Compartir Lista (Componente Secundario) --- */}
            {listToShare && (
                <ShareListModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    list={listToShare}
                />
            )}
        </Container>
    );
};
export default Dashboard;