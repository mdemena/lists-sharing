// frontend/src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    Grid,
    CircularProgress,
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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import { FaPlus, FaTh, FaList as FaListIcon, FaDownload, FaEnvelope, FaTrash, FaEdit, FaShareSquare, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import type { List, ListItem } from '../types';
import { useNavigate } from 'react-router-dom';
import ShareListModal from '../components/ShareListModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ListCard } from '../components/cards';
import { ConfirmDeleteDialog, CreateListModal, EmailExportDialog, type ExportFormat } from '../components/dialogs';
import { ExportMenu } from '../components/export';
import { useExport } from '../hooks';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { exportToFile, sendViaEmail } = useExport();
    const { t } = useTranslation();

    // State
    const [lists, setLists] = useState<List[]>([]);
    const [sharedLists, setSharedLists] = useState<List[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [activeTab, setActiveTab] = useState(0);
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');

    // Modals state
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
    const [listToShare, setListToShare] = useState<List | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [listToDelete, setListToDelete] = useState<List | null>(null);

    // Toggle status dialog state
    const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
    const [listToToggle, setListToToggle] = useState<List | null>(null);

    // Export state
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [listToExport, setListToExport] = useState<List | null>(null);
    const [anchorElExport, setAnchorElExport] = useState<null | HTMLElement>(null);
    const [listToExportFormat, setListToExportFormat] = useState<List | null>(null);

    // Fetch lists
    const fetchUserLists = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const { data: ownedData, error: ownedError } = await api.lists.list();
            if (ownedError) throw new Error(ownedError);
            setLists(ownedData as List[]);

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
    }, [user]);

    // Handlers
    const handleShareClick = (list: List) => {
        setListToShare(list);
        setIsShareModalOpen(true);
    };

    const handleCreateList = async (name: string, description: string) => {
        try {
            const { data, error } = await api.lists.create({ name, description });
            if (error) throw new Error(error);

            toast.success('Lista creada con éxito');
            if (data) {
                setLists([data as List, ...lists]);
            }
            setIsCreationModalOpen(false);
            navigate(`/list/${data?.id}/edit`);
        } catch (error: any) {
            toast.error(`Error de creación: ${error.message || 'No se pudo crear la lista.'}`);
        }
    };

    const handleDeleteList = (list: List) => {
        setListToDelete(list);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteList = async () => {
        if (!listToDelete) return;

        try {
            // 1. Verificar si hay ítems adjudicados
            const { data: items, error: itemsError } = await api.items.list(listToDelete.id);
            if (itemsError) throw new Error(itemsError);

            const hasAdjudicatedItems = (items as ListItem[]).some(item => item.is_adjudicated);

            if (hasAdjudicatedItems) {
                toast.error('No se puede eliminar la lista porque contiene ítems reservados por otros usuarios.');
                setDeleteDialogOpen(false);
                setListToDelete(null);
                return;
            }

            // 2. Si no hay adjudicados, eliminar todos los ítems primero
            const deletePromises = (items as ListItem[]).map(item => api.items.delete(item.id));
            await Promise.all(deletePromises);

            // 3. Finalmente eliminar la lista
            const { error } = await api.lists.delete(listToDelete.id);
            if (error) throw new Error(error);

            setLists(lists.filter(l => l.id !== listToDelete.id));
            toast.success('Lista eliminada con éxito');
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar la lista');
        } finally {
            setDeleteDialogOpen(false);
            setListToDelete(null);
        }
    };

    // Toggle status handlers
    const handleToggleStatus = (list: List) => {
        if (list.status === 'active') {
            // Show confirmation dialog when deactivating (shares will be removed)
            setListToToggle(list);
            setToggleStatusDialogOpen(true);
        } else {
            // Activate immediately (no shares to remove)
            confirmToggleStatus(list);
        }
    };

    const confirmToggleStatus = async (listOverride?: List) => {
        const list = listOverride || listToToggle;
        if (!list) return;

        const newStatus = list.status === 'active' ? 'inactive' : 'active';

        try {
            const { data, error } = await api.lists.toggleStatus(list.id, newStatus);
            if (error) throw new Error(error);

            // Update local state
            setLists(lists.map(l => l.id === list.id ? (data as List) : l));

            if (newStatus === 'inactive') {
                toast.success('Lista desactivada. Se eliminaron los vínculos de compartición.');
            } else {
                toast.success('Lista activada correctamente.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al cambiar el estado de la lista');
        } finally {
            setToggleStatusDialogOpen(false);
            setListToToggle(null);
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
    const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>, list: List) => {
        event.stopPropagation();
        setAnchorElExport(event.currentTarget);
        setListToExportFormat(list);
    };

    const handleExportClose = () => {
        setAnchorElExport(null);
        setListToExportFormat(null);
    };

    const handleExportWithFormat = async (format: ExportFormat) => {
        if (!listToExportFormat) return;
        handleExportClose();

        try {
            const { data: itemsData, error } = await api.items.list(listToExportFormat.id);
            if (error) throw new Error(error);

            await exportToFile(itemsData as ListItem[] || [], format, listToExportFormat.name);
        } catch (error: any) {
            toast.error(error.message || 'Error al exportar');
        }
    };

    const handleOpenEmailDialog = (list: List) => {
        setListToExport(list);
        setEmailDialogOpen(true);
    };

    const handleSendEmail = async (email: string, format: ExportFormat) => {
        if (!listToExport) return;

        try {
            const { data: itemsData, error } = await api.items.list(listToExport.id);
            if (error) throw new Error(error);

            await sendViaEmail(itemsData as ListItem[] || [], format, listToExport.name, email);
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar email');
        } finally {
            setEmailDialogOpen(false);
            setListToExport(null);
        }
    };

    // Render helpers — filter owned lists by status sub-tab
    const filteredLists = activeTab === 0
        ? lists.filter(l => l.status === statusFilter)
        : sharedLists;
    const isSharedTab = activeTab === 1;

    const activeLists = lists.filter(l => l.status === 'active');
    const inactiveLists = lists.filter(l => l.status === 'inactive');

    const renderGridView = () => (
        <Grid container spacing={3}>
            {filteredLists.map((list) => (
                <Grid key={list.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <ListCard
                        list={list}
                        isShared={isSharedTab}
                        onNavigate={navigate}
                        onShare={isSharedTab ? undefined : handleShareClick}
                        onDelete={isSharedTab ? undefined : handleDeleteList}
                        onExportClick={handleExportClick}
                        onEmailClick={handleOpenEmailDialog}
                        onToggleStatus={isSharedTab ? undefined : handleToggleStatus}
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

                        <TableCell>{t('dashboard.columns.name')}</TableCell>
                        <TableCell>{t('dashboard.columns.description')}</TableCell>
                        {isSharedTab && <TableCell>{t('dashboard.columns.sharedBy')}</TableCell>}
                        <TableCell align="right">{t('common.actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredLists.map((list) => (
                        <TableRow
                            key={list.id}
                            hover
                            sx={{
                                cursor: 'pointer',
                                opacity: list.status === 'inactive' ? 0.65 : 1,
                            }}
                            onClick={() => navigate(isSharedTab ? `/share/${list.id}` : `/list/${list.id}/edit`)}
                        >
                            <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>{list.name}</span>
                                    {list.status === 'inactive' && (
                                        <Chip
                                            label={t('dashboard.inactiveLists')}
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>
                            </TableCell>
                            <TableCell>{list.description || 'Sin descripción'}</TableCell>
                            {isSharedTab && <TableCell>{list.shared_by_name || '-'}</TableCell>}
                            <TableCell align="right">
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <Tooltip title={t('dashboard.tooltips.export')}>
                                        <IconButton size="small" onClick={(e) => handleExportClick(e, list)}>
                                            <FaDownload size={14} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('dashboard.tooltips.email')}>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEmailDialog(list); }}>
                                            <FaEnvelope size={14} />
                                        </IconButton>
                                    </Tooltip>
                                    {!isSharedTab && (
                                        <>
                                            <Tooltip title={t('dashboard.tooltips.edit')}>
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/list/${list.id}/edit`); }}>
                                                    <FaEdit size={14} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('dashboard.tooltips.share')}>
                                                <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleShareClick(list); }}>
                                                    <FaShareSquare size={14} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('dashboard.tooltips.delete')}>
                                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteList(list); }}>
                                                    <FaTrash size={14} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={list.status === 'inactive' ? t('dashboard.tooltips.activate') : t('dashboard.tooltips.deactivate')}>
                                                <IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); handleToggleStatus(list); }}>
                                                    {list.status === 'inactive' ? <FaToggleOff size={14} /> : <FaToggleOn size={14} />}
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (isLoading) {
        return (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                mb={4}
                spacing={2}
            >
                <Typography variant="h4" component="h1" fontWeight="bold">
                    {activeTab === 0 ? t('dashboard.myLists') : t('dashboard.sharedWithMe')}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                    >
                        <ToggleButton value="grid"><FaTh /></ToggleButton>
                        <ToggleButton value="table"><FaListIcon /></ToggleButton>
                    </ToggleButtonGroup>
                    {activeTab === 0 && (
                        <Button
                            variant="contained"
                            startIcon={<FaPlus />}
                            onClick={() => setIsCreationModalOpen(true)}
                        >
                            {t('dashboard.newList')}
                        </Button>
                    )}
                </Stack>
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label={`${t('dashboard.myLists')} (${lists.length})`} />
                    <Tab label={`${t('dashboard.sharedWithMe')} (${sharedLists.length})`} />
                </Tabs>
            </Box>

            {/* Status sub-tabs for "My Lists" */}
            {activeTab === 0 && (
                <Box sx={{ mb: 3 }}>
                    <Tabs
                        value={statusFilter}
                        onChange={(_, v) => setStatusFilter(v)}
                        textColor="secondary"
                        indicatorColor="secondary"
                        sx={{ minHeight: 36 }}
                    >
                        <Tab
                            value="active"
                            label={`${t('dashboard.activeLists')} (${activeLists.length})`}
                            sx={{ minHeight: 36, py: 0.5 }}
                        />
                        <Tab
                            value="inactive"
                            label={`${t('dashboard.inactiveLists')} (${inactiveLists.length})`}
                            sx={{ minHeight: 36, py: 0.5 }}
                        />
                    </Tabs>
                </Box>
            )}

            {filteredLists.length === 0 ? (
                <Box textAlign="center" py={8}>

                    <Typography variant="h6" color="text.secondary" mb={2}>
                        {activeTab === 0
                            ? (statusFilter === 'active'
                                ? t('dashboard.emptyMyLists')
                                : t('dashboard.emptyInactiveLists'))
                            : t('dashboard.emptySharedLists')
                        }
                    </Typography>
                    {activeTab === 0 && statusFilter === 'active' && (
                        <Button
                            variant="contained"
                            startIcon={<FaPlus />}
                            onClick={() => setIsCreationModalOpen(true)}
                        >
                            {t('dashboard.createFirstList')}
                        </Button>
                    )}
                </Box>
            ) : (
                viewMode === 'grid' ? renderGridView() : renderTableView()
            )}

            {/* Export Menu */}
            <ExportMenu
                anchorEl={anchorElExport}
                onClose={handleExportClose}
                onExport={handleExportWithFormat}
            />

            {/* Create List Modal */}
            <CreateListModal
                open={isCreationModalOpen}
                onClose={() => setIsCreationModalOpen(false)}
                onCreate={handleCreateList}
            />

            {/* Email Export Dialog */}
            <EmailExportDialog
                open={emailDialogOpen}
                onClose={() => { setEmailDialogOpen(false); setListToExport(null); }}
                onSend={handleSendEmail}
                listName={listToExport?.name}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => { setDeleteDialogOpen(false); setListToDelete(null); }}
                onConfirm={confirmDeleteList}
                itemName={listToDelete?.name || ''}
                itemType="lista"
            />

            {/* Deactivate Confirmation Dialog */}
            <Dialog
                open={toggleStatusDialogOpen}
                onClose={() => { setToggleStatusDialogOpen(false); setListToToggle(null); }}
            >
                <DialogTitle>{t('dashboard.tooltips.deactivate')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('dashboard.deactivateConfirm')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setToggleStatusDialogOpen(false); setListToToggle(null); }}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={() => confirmToggleStatus()} color="warning" variant="contained">
                        {t('dashboard.tooltips.deactivate')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Share Modal */}
            {listToShare && (
                <ShareListModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    list={listToShare}
                />
            )}
        </Box>
    );
};

export default Dashboard;