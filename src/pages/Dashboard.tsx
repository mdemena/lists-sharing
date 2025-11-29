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
} from '@mui/material';
import { FaPlus, FaList, FaShareSquare, FaTh, FaEdit } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
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
    const [listToShare, setListToShare] = useState<List | null>(null); // <-- NUEVO: Almacena la lista a compartir

    // URL de la Edge Function (ajusta la ruta y el dominio de tu proyecto Supabase)
    const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/share-list-email';
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
                .select('*, list_shares(count)')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Casteamos el resultado a nuestro tipo List[]
            setLists(data as List[]);
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

    const handleViewModeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newViewMode: 'grid' | 'table',
    ) => {
        if (newViewMode !== null) {
            setViewMode(newViewMode);
        }
    };

    // --- JSX de Componentes ---

    const ListCard: React.FC<{ list: List }> = ({ list }) => (
        <Card
            sx={{
                width: '100%',
                minHeight: '150px',
                boxShadow: 3,
                transition: '0.2s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
            }}
        >
            <CardContent>
                <Typography variant="h6" component="h3" mb={1} noWrap>
                    {list.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2} noWrap sx={{ WebkitLineClamp: 2 }}>
                    {list.description || 'Sin descripción.'}
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', pb: 2, pr: 2 }}>
                <Button
                    size="small"
                    startIcon={<FaList />}
                    variant="outlined"
                    onClick={() => navigate(`/list/${list.id}/edit`)}
                >
                    Editar Items
                </Button>
                <Button
                    size="small"
                    startIcon={<FaShareSquare />}
                    variant="contained"
                    color="secondary"
                    onClick={() => handleShareClick(list)}
                >
                    Compartir {list.list_shares?.[0]?.count ? `(${list.list_shares[0].count})` : ''}
                </Button>
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

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Listas Creadas ({lists.length})
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
            ) : lists.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed grey', borderRadius: 1, bgcolor: 'white' }}>
                    <Typography variant="h6" mb={1}>¡Aún no tienes listas!</Typography>
                    <Typography color="text.secondary" mb={2}>
                        Crea tu primera lista de regalos, deseos o tareas.
                    </Typography>
                    <Button startIcon={<FaPlus />} variant="contained" color="primary" onClick={() => setIsCreationModalOpen(true)}>
                        Crear Nueva Lista
                    </Button>
                </Box>
            ) : viewMode === 'grid' ? (
                // Renderizado de Listas en Grid
                <Grid container spacing={3}>
                    {lists.map(list => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={list.id}>
                            <ListCard list={list} />
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
                                <TableCell align="center">Compartido con</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lists.map((list) => (
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
                                    <TableCell align="center">
                                        {list.list_shares?.[0]?.count ? `${list.list_shares[0].count} usuarios` : '-'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <Tooltip title="Editar Items">
                                                <IconButton size="small" onClick={() => navigate(`/list/${list.id}/edit`)}>
                                                    <FaEdit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Compartir">
                                                <IconButton size="small" color="secondary" onClick={() => handleShareClick(list)}>
                                                    <FaShareSquare />
                                                </IconButton>
                                            </Tooltip>
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

            {/* --- Modal de Compartir Lista (Componente Secundario) --- */}
            {listToShare && (
                <ShareListModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    list={listToShare}
                    edgeFunctionUrl={EDGE_FUNCTION_URL}
                />
            )}
        </Container>
    );
};
export default Dashboard;