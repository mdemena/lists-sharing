// frontend/src/components/ShareListModal.tsx

import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    Input,
    Textarea,
    useToast,
    Alert,
    AlertIcon,
    Text,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { List } from '../types';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    list: List;
    // La URL de tu Edge Function
    edgeFunctionUrl: string;
}

const ShareListModal: React.FC<ShareModalProps> = ({ isOpen, onClose, list, edgeFunctionUrl }) => {
    const { user } = useAuth();
    const [emailsInput, setEmailsInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleShare = async () => {
        if (!user || !list) return;

        // Convertir el string de entrada a un array de emails limpios (separados por coma o nueva línea)
        const recipientEmails = emailsInput
            .split(/[\s,]+/) // Separar por espacios o comas
            .map(email => email.trim().toLowerCase())
            .filter(email => email.length > 0 && email.includes('@')); // Filtrar emails válidos

        if (recipientEmails.length === 0) {
            toast({ title: 'Introduce al menos una dirección de correo válida.', status: 'warning' });
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
            toast({
                title: '¡Lista compartida!',
                description: `Invitaciones enviadas a ${recipientEmails.length} personas.`,
                status: 'success',
            });
            onClose();
            setEmailsInput('');

        } catch (error: any) {
            toast({
                title: 'Error de envío',
                description: error.message,
                status: 'error',
                duration: 8000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const shareLink = `${window.location.origin}/share/${list.id}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Compartir Lista: {list.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Text fontSize="sm">Los destinatarios recibirán un enlace de acceso para ver y adjudicar ítems (requiere registro/login).</Text>
                        </Alert>

                        <Textarea
                            placeholder="Ingresa las direcciones de correo separadas por comas o saltos de línea (Ej: amigo1@mail.com, amigo2@mail.com)"
                            value={emailsInput}
                            onChange={(e) => setEmailsInput(e.target.value)}
                            minH="150px"
                        />

                        <Text fontSize="sm" color="gray.500" w="100%">
                            O comparte el enlace directamente:
                            <Input value={shareLink} isReadOnly size="sm" mt={1} onClick={(e) => (e.target as HTMLInputElement).select()} />
                        </Text>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button colorScheme="teal" onClick={handleShare} isLoading={isLoading}>
                        Enviar Invitaciones
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ShareListModal;