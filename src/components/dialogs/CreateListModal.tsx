// src/components/dialogs/CreateListModal.tsx

import React, { useState } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    Stack,
} from '@mui/material';

const modalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 400 },
    bgcolor: 'background.paper',
    borderRadius: 1,
    boxShadow: 24,
    p: 4,
};

export interface CreateListModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string, description: string) => Promise<void>;
    isLoading?: boolean;
}

const CreateListModal: React.FC<CreateListModalProps> = ({
    open,
    onClose,
    onCreate,
    isLoading = false,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) return;
        await onCreate(name.trim(), description.trim());
        setName('');
        setDescription('');
    };

    const handleClose = () => {
        if (!isLoading) {
            setName('');
            setDescription('');
            onClose();
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={modalStyle}>
                <Typography variant="h5" component="h2" mb={3}>
                    Crear Nueva Lista
                </Typography>
                <Stack spacing={3}>
                    <TextField
                        label="Nombre de la Lista"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        disabled={isLoading}
                    />
                    <TextField
                        label="Descripción (Opcional)"
                        fullWidth
                        multiline
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                    />
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
                    <Button variant="outlined" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreate}
                        disabled={isLoading || !name.trim()}
                    >
                        Crear Lista
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};

export default CreateListModal;
