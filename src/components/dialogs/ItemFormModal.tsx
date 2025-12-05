// src/components/dialogs/ItemFormModal.tsx

import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextareaAutosize,
    IconButton,
} from '@mui/material';
import { FaPlus, FaTrash } from 'react-icons/fa';
import type { ImageUrl, ExternalUrl } from '../../types';

const modalStyle = {
    position: 'absolute' as const,
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

const priorities = [
    { id: 3, name: 'Importante' },
    { id: 2, name: 'Normal' },
    { id: 1, name: 'Opcional' },
];

export interface ItemFormData {
    id?: string;
    name: string;
    description: string;
    image_urls: ImageUrl[];
    urls: ExternalUrl[];
    importance: number;
    estimated_cost: number;
}

export interface ItemFormModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: ItemFormData) => Promise<void>;
    initialData?: ItemFormData;
    isEditing?: boolean;
    isLoading?: boolean;
}

const defaultFormData: ItemFormData = {
    name: '',
    description: '',
    image_urls: [],
    urls: [],
    importance: 3,
    estimated_cost: 0,
};

const ItemFormModal: React.FC<ItemFormModalProps> = ({
    open,
    onClose,
    onSave,
    initialData,
    isEditing = false,
    isLoading = false,
}) => {
    const [formData, setFormData] = useState<ItemFormData>(defaultFormData);

    useEffect(() => {
        if (open) {
            setFormData(initialData || defaultFormData);
        }
    }, [open, initialData]);

    const handleChange = (field: keyof ItemFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMediaUrlChange = (
        index: number,
        field: 'url' | 'label',
        value: string,
        type: 'image' | 'external'
    ) => {
        const targetArray = type === 'image' ? [...formData.image_urls] : [...formData.urls];
        targetArray[index] = { ...targetArray[index], [field]: value };

        if (type === 'image') {
            setFormData(prev => ({ ...prev, image_urls: targetArray as ImageUrl[] }));
        } else {
            setFormData(prev => ({ ...prev, urls: targetArray as ExternalUrl[] }));
        }
    };

    const handleAddMediaUrl = (type: 'image' | 'external') => {
        const newItem = { url: '', label: '' };
        if (type === 'image') {
            setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, newItem] }));
        } else {
            setFormData(prev => ({ ...prev, urls: [...prev.urls, newItem] }));
        }
    };

    const handleRemoveMediaUrl = (index: number, type: 'image' | 'external') => {
        if (type === 'image') {
            setFormData(prev => ({
                ...prev,
                image_urls: prev.image_urls.filter((_, i) => i !== index)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                urls: prev.urls.filter((_, i) => i !== index)
            }));
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        await onSave(formData);
    };

    const handleClose = () => {
        if (!isLoading) {
            setFormData(defaultFormData);
            onClose();
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={modalStyle}>
                <Typography variant="h5" component="h2" mb={3}>
                    {isEditing ? 'Editar Ítem' : 'Añadir Nuevo Ítem'}
                </Typography>

                <Stack spacing={3}>
                    <TextField
                        label="Nombre del Ítem"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={isLoading}
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
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        disabled={isLoading}
                    />

                    <Stack direction="row" spacing={2}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Importancia (1-5)</InputLabel>
                            <Select
                                label="Importancia (1-5)"
                                value={formData.importance.toString()}
                                onChange={(e) => handleChange('importance', parseInt(e.target.value))}
                            >
                                {priorities.map(n => (
                                    <MenuItem key={n.id} value={n.id}>{n.id} - {n.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Coste Estimado (€)"
                            type="number"
                            fullWidth
                            value={formData.estimated_cost}
                            onChange={(e) => handleChange('estimated_cost', parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                        />
                    </Stack>

                    {/* Images Section */}
                    <Typography variant="h6" mt={2}>Imágenes del Ítem</Typography>
                    <Stack spacing={2}>
                        {formData.image_urls.map((image, index) => (
                            <Box key={`img-${index}`} sx={{ border: '1px solid', borderColor: 'divider', p: 1, borderRadius: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        label={`URL de Imagen ${index + 1}`}
                                        size="small"
                                        fullWidth
                                        value={image.url}
                                        onChange={(e) => handleMediaUrlChange(index, 'url', e.target.value, 'image')}
                                        disabled={isLoading}
                                    />
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveMediaUrl(index, 'image')}
                                        disabled={isLoading}
                                    >
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
                                    disabled={isLoading}
                                />
                            </Box>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={() => handleAddMediaUrl('image')}
                            startIcon={<FaPlus />}
                            disabled={isLoading}
                        >
                            Añadir Imagen
                        </Button>
                    </Stack>

                    {/* External URLs Section */}
                    <Typography variant="h6" mt={2}>Enlaces de Compra</Typography>
                    <Stack spacing={2}>
                        {formData.urls.map((extUrl, index) => (
                            <Box key={`url-${index}`} sx={{ border: '1px solid', borderColor: 'divider', p: 1, borderRadius: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        label={`URL Externa ${index + 1}`}
                                        size="small"
                                        fullWidth
                                        value={extUrl.url}
                                        onChange={(e) => handleMediaUrlChange(index, 'url', e.target.value, 'external')}
                                        disabled={isLoading}
                                    />
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveMediaUrl(index, 'external')}
                                        disabled={isLoading}
                                    >
                                        <FaTrash size={14} />
                                    </IconButton>
                                </Stack>
                                <TextField
                                    label="Etiqueta (Ej: Amazon, Tienda Oficial)"
                                    size="small"
                                    fullWidth
                                    value={extUrl.label}
                                    onChange={(e) => handleMediaUrlChange(index, 'label', e.target.value, 'external')}
                                    sx={{ mt: 1 }}
                                    disabled={isLoading}
                                />
                            </Box>
                        ))}
                        <Button
                            variant="outlined"
                            onClick={() => handleAddMediaUrl('external')}
                            startIcon={<FaPlus />}
                            disabled={isLoading}
                        >
                            Añadir Enlace
                        </Button>
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
                    <Button variant="outlined" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        disabled={isLoading || !formData.name.trim()}
                    >
                        {isEditing ? 'Guardar Cambios' : 'Añadir Ítem'}
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};

export default ItemFormModal;
