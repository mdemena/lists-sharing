// src/components/cards/ListCard.tsx

import React from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import { FaList, FaShareSquare, FaDownload, FaEnvelope, FaTrash } from 'react-icons/fa';
import type { List } from '../../types';

export interface ListCardProps {
    list: List;
    isShared?: boolean;
    onNavigate: (path: string) => void;
    onShare?: (list: List) => void;
    onDelete?: (list: List) => void;
    onExportClick?: (event: React.MouseEvent<HTMLButtonElement>, list: List) => void;
    onEmailClick?: (list: List) => void;
}

const ListCard: React.FC<ListCardProps> = ({
    list,
    isShared = false,
    onNavigate,
    onShare,
    onDelete,
    onExportClick,
    onEmailClick,
}) => {
    const handleCardClick = () => {
        onNavigate(isShared ? `/share/${list.id}` : `/list/${list.id}/edit`);
    };

    return (
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
            onClick={handleCardClick}
        >
            {/* Action Buttons */}
            <Stack
                direction="row"
                spacing={0.5}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                }}
            >
                {onExportClick && (
                    <Tooltip title="Exportar">
                        <IconButton
                            size="small"
                            onClick={(e) => onExportClick(e, list)}
                            sx={{
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'primary.light', color: 'white' }
                            }}
                        >
                            <FaDownload size={12} />
                        </IconButton>
                    </Tooltip>
                )}
                {onEmailClick && (
                    <Tooltip title="Enviar por Email">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEmailClick(list);
                            }}
                            sx={{
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'info.light', color: 'white' }
                            }}
                        >
                            <FaEnvelope size={12} />
                        </IconButton>
                    </Tooltip>
                )}
                {!isShared && onDelete && (
                    <Tooltip title="Eliminar Lista">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(list);
                            }}
                            sx={{
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'error.light', color: 'white' }
                            }}
                        >
                            <FaTrash size={12} />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            {/* Content */}
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

            {/* Actions */}
            <CardActions sx={{ justifyContent: 'flex-end', pb: 2, pr: 2 }}>
                {!isShared ? (
                    <>
                        <Button
                            size="small"
                            startIcon={<FaList />}
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigate(`/list/${list.id}/edit`);
                            }}
                        >
                            Editar Lista
                        </Button>
                        {onShare && (
                            <Button
                                size="small"
                                startIcon={<FaShareSquare />}
                                variant="contained"
                                color="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare(list);
                                }}
                            >
                                Compartir {list.list_shares?.[0]?.count ? `(${list.list_shares[0].count})` : ''}
                            </Button>
                        )}
                    </>
                ) : (
                    <Button
                        size="small"
                        startIcon={<FaList />}
                        variant="contained"
                        color="primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`/share/${list.id}`);
                        }}
                    >
                        Ver Lista
                    </Button>
                )}
            </CardActions>
        </Card>
    );
};

export default ListCard;
