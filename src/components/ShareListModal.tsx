// frontend/src/components/ShareListModal.tsx

import React, { useState } from 'react';
import {
    Modal,
    Box,
    Typography,
    Button,
    TextField,
    TextareaAutosize, // Usamos TextareaAutosize para el campo de emails
    Alert,
    AlertTitle,
    Stack,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { FaInfoCircle, FaShareAlt } from 'react-icons/fa';
import type { List } from '../types';
import toast from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    list: List;
    // La URL de tu Edge Function
    edgeFunctionUrl: string;
}

// Estilo simple para el contenido del modal (similar a ModalContent de Chakra)
const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: 300, sm: 400, md: 500 },
    bgcolor: 'background.paper',
    borderRadius: 1,
    boxShadow: 24,
    p: 4,
};

const ShareListModal: React.FC<ShareModalProps> = ({ isOpen, onClose, list, edgeFunctionUrl }) => {
    const { user } = useAuth();
    const [emailsInput, setEmailsInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleShare = async () => {
        if (!user || !list) return;

        // Convertir el string de entrada a un array de emails limpios (separados por coma o nueva línea)
        const recipientEmails = emailsInput
            .split(/[\s,]+/) // Separar por espacios o comas
            .map(email => email.trim().toLowerCase())
            .filter(email => email.length > 0 && email.includes('@')); // Filtrar emails válidos

        if (recipientEmails.length === 0) {
            toast.error('Introduce al menos una dirección de correo válida.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Llamar a la Edge Function de Supabase
            const response = await fetch(edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Incluir el token de autenticación (JWT) en la cabecera, aunque la función sea --no-verify-jwt, 
                    // es buena práctica y si la función es protegida, es necesario.
                    'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`
                },
                body: JSON.stringify({
                    recipientEmails,
                    listName: list.name,
                    listId: list.id,
                    senderEmail: user.email,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error desconocido al enviar emails.');
            }

            // 2. Éxito
            toast.success(`Invitaciones enviadas a ${recipientEmails.length} personas.`);
            onClose();
            setEmailsInput('');

        } catch (error: any) {
            toast.error(error.message || 'Error al enviar las invitaciones.');
        } finally {
            setIsLoading(false);
        }
    };

    const shareLink = `${window.location.origin}/share/${list.id}`;

    return (
        // Componente Modal de MUI usa 'open' en lugar de 'isOpen'
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="share-modal-title"
            aria-describedby="share-modal-description"
        >
            {/* Box simula el contenido centralizado y estilizado */}
            <Box sx={modalStyle}>
                <Typography id="share-modal-title" variant="h6" component="h2" mb={2}>
                    Compartir Lista: {list.name}
                </Typography>

                <Stack spacing={3}>
                    {/* Alerta de información (Alert de MUI es estable) */}
                    <Alert severity="info" icon={<FaInfoCircle size={20} />}>
                        <AlertTitle>Privacidad</AlertTitle>
                        Los destinatarios recibirán un enlace de acceso para ver y adjudicar ítems (requiere registro/login).
                    </Alert>

                    <TextareaAutosize
                        aria-label="Ingresa correos electrónicos"
                        minRows={5}
                        placeholder="Ingresa las direcciones de correo separadas por comas o saltos de línea (Ej: amigo1@mail.com, amigo2@mail.com)"
                        value={emailsInput}
                        onChange={(e) => setEmailsInput(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            borderColor: '#ccc',
                            fontFamily: 'Roboto, sans-serif'
                        }}
                    />

                    <Typography variant="body2" color="text.secondary">
                        O comparte el enlace directamente:
                    </Typography>
                    <TextField
                        value={shareLink}
                        fullWidth
                        size="small"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="flex-end" mt={4}>
                    <Button onClick={onClose} variant="outlined">
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleShare}
                        disabled={isLoading}
                        startIcon={<FaShareAlt />}
                    >
                        Enviar Invitaciones
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};

export default ShareListModal;