// src/components/cards/ItemCard.tsx

import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Box,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
} from '@mui/material';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaStar, FaEuroSign, FaExternalLinkAlt } from 'react-icons/fa';
import type { ListItem } from '../../types';
import ImageCarousel from '../media/ImageCarousel';

export interface ItemCardProps {
    item: ListItem;
    isOwnerMode: boolean;
    currentUserId?: string;
    onEdit?: (item: ListItem) => void;
    onDelete?: (item: ListItem) => void;
    onAdjudicate?: (item: ListItem, adjudicate: boolean) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
    item,
    isOwnerMode,
    currentUserId,
    onEdit,
    onDelete,
    onAdjudicate,
}) => {
    const theme = useTheme();
    const isAdjudicatedByCurrentUser = item.adjudicated_by === currentUserId;

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

    const handleCardClick = () => {
        if (isOwnerMode && onEdit) {
            onEdit(item);
        }
    };

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
            onClick={handleCardClick}
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
                            {onEdit && (
                                <Button size="small" variant="outlined" startIcon={<FaEdit />} onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                                    Editar
                                </Button>
                            )}
                            {onDelete && (
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item);
                                    }}
                                >
                                    <FaTrash size={14} />
                                </IconButton>
                            )}
                        </>
                    ) : (
                        currentUserId && onAdjudicate && (
                            <>
                                {isAdjudicatedByCurrentUser ? (
                                    <Button size="small" variant="contained" color="warning" startIcon={<FaTimes />} onClick={(e) => { e.stopPropagation(); onAdjudicate(item, false); }}>
                                        Soltar
                                    </Button>
                                ) : item.is_adjudicated ? (
                                    <Button size="small" variant="contained" color="error" disabled>
                                        Reservado
                                    </Button>
                                ) : (
                                    <Button size="small" variant="contained" color="success" startIcon={<FaCheck />} onClick={(e) => { e.stopPropagation(); onAdjudicate(item, true); }}>
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

export default ItemCard;
