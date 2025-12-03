// src/components/ImageUploader.tsx
import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Stack,
    Typography,
    IconButton,
    TextField,
    CircularProgress,
    Paper,
    Alert,
} from '@mui/material';
import { FaPlus, FaTrash, FaUpload, FaLink } from 'react-icons/fa';
import { validateImageFile } from '../utils/storage';
import { uploadItemImage, deleteItemImage } from '../api/storage';
import type { ImageUrl } from '../types';

interface ImageUploaderProps {
    images: ImageUrl[];
    onChange: (images: ImageUrl[]) => void;
    listId: string;
    itemId?: string;
    disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    images,
    onChange,
    listId,
    itemId,
    disabled = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [externalUrl, setExternalUrl] = useState('');
    const [externalLabel, setExternalLabel] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await handleFiles(e.target.files);
        }
    };

    const handleFiles = async (files: FileList) => {
        setError(null);
        const file = files[0];

        // Validar archivo
        const validation = validateImageFile(file);
        if (!validation.valid) {
            setError(validation.error || 'Archivo no válido');
            return;
        }

        setUploading(true);

        try {
            // Subir imagen
            const result = await uploadItemImage(file, listId, itemId);

            if (result.error) {
                setError(result.error);
                return;
            }

            // Añadir a la lista de imágenes
            const newImage: ImageUrl = {
                url: result.url,
                label: file.name,
                storage_path: result.path,
                is_uploaded: true,
            };

            onChange([...images, newImage]);
        } catch (err: any) {
            setError(err.message || 'Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async (index: number) => {
        const image = images[index];

        // Si es una imagen subida, eliminarla del storage
        if (image.is_uploaded && image.storage_path) {
            await deleteItemImage(image.storage_path);
        }

        // Eliminar de la lista
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
    };

    const handleAddExternalUrl = () => {
        if (!externalUrl.trim()) {
            setError('La URL es obligatoria');
            return;
        }

        const newImage: ImageUrl = {
            url: externalUrl.trim(),
            label: externalLabel.trim() || 'Imagen externa',
            is_uploaded: false,
        };

        onChange([...images, newImage]);
        setExternalUrl('');
        setExternalLabel('');
        setShowUrlInput(false);
    };

    const handleUpdateLabel = (index: number, newLabel: string) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], label: newLabel };
        onChange(newImages);
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h6">Imágenes del Ítem</Typography>

            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Drag & Drop Zone */}
            <Paper
                sx={{
                    border: '2px dashed',
                    borderColor: dragActive ? 'primary.main' : 'grey.300',
                    bgcolor: dragActive ? 'action.hover' : 'background.paper',
                    p: 3,
                    textAlign: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={!disabled ? onButtonClick : undefined}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    disabled={disabled}
                />

                {uploading ? (
                    <Stack alignItems="center" spacing={2}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary">
                            Subiendo imagen...
                        </Typography>
                    </Stack>
                ) : (
                    <Stack alignItems="center" spacing={1}>
                        <FaUpload size={40} color="#999" />
                        <Typography variant="body1" fontWeight="medium">
                            Arrastra una imagen aquí
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            o haz clic para seleccionar
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            JPG, PNG o WebP (máx. 5MB)
                        </Typography>
                    </Stack>
                )}
            </Paper>

            {/* Lista de imágenes */}
            {images.length > 0 && (
                <Stack spacing={2}>
                    {images.map((image, index) => (
                        <Box
                            key={index}
                            sx={{
                                border: '1px solid',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                p: 2,
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                {/* Preview de la imagen */}
                                <Box
                                    component="img"
                                    src={image.url}
                                    alt={image.label}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        flexShrink: 0,
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/favicon.svg';
                                    }}
                                />

                                {/* Información de la imagen */}
                                <Stack spacing={1} flex={1}>
                                    <TextField
                                        size="small"
                                        label="Etiqueta"
                                        value={image.label}
                                        onChange={(e) => handleUpdateLabel(index, e.target.value)}
                                        disabled={disabled}
                                        fullWidth
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {image.is_uploaded ? '📤 Imagen subida' : '🔗 URL externa'}
                                    </Typography>
                                </Stack>

                                {/* Botón eliminar */}
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveImage(index)}
                                    disabled={disabled}
                                >
                                    <FaTrash size={14} />
                                </IconButton>
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}

            {/* Botones de acción */}
            <Stack direction="row" spacing={2}>
                <Button
                    variant="outlined"
                    startIcon={<FaPlus />}
                    onClick={onButtonClick}
                    disabled={disabled || uploading}
                >
                    Subir Imagen
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<FaLink />}
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    disabled={disabled}
                >
                    Añadir URL Externa
                </Button>
            </Stack>

            {/* Input para URL externa */}
            {showUrlInput && (
                <Box sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 1, p: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            label="URL de la imagen"
                            size="small"
                            fullWidth
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            placeholder="https://ejemplo.com/imagen.jpg"
                        />
                        <TextField
                            label="Etiqueta (opcional)"
                            size="small"
                            fullWidth
                            value={externalLabel}
                            onChange={(e) => setExternalLabel(e.target.value)}
                            placeholder="Ej: Foto principal"
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => setShowUrlInput(false)}>
                                Cancelar
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={handleAddExternalUrl}
                            >
                                Añadir
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Stack>
    );
};

export default ImageUploader;
