// src/components/dialogs/EmailExportDialog.tsx

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from '@mui/material';

export type ExportFormat = 'json' | 'csv' | 'excel';

export interface EmailExportDialogProps {
    open: boolean;
    onClose: () => void;
    onSend: (email: string, format: ExportFormat) => Promise<void>;
    listName?: string;
}

const EmailExportDialog: React.FC<EmailExportDialogProps> = ({
    open,
    onClose,
    onSend,
    listName,
}) => {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!recipientEmail) return;
        
        setIsSending(true);
        try {
            await onSend(recipientEmail, exportFormat);
            setRecipientEmail('');
            onClose();
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        if (!isSending) {
            setRecipientEmail('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>
                Enviar Lista por Email
                {listName && ` - ${listName}`}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                    <TextField
                        autoFocus
                        label="Email del Destinatario"
                        type="email"
                        fullWidth
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        disabled={isSending}
                    />
                    <FormControl fullWidth disabled={isSending}>
                        <InputLabel>Formato</InputLabel>
                        <Select
                            value={exportFormat}
                            label="Formato"
                            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                        >
                            <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                            <MenuItem value="csv">CSV (.csv)</MenuItem>
                            <MenuItem value="json">JSON (.json)</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isSending}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSend}
                    variant="contained"
                    disabled={isSending || !recipientEmail}
                >
                    {isSending ? <CircularProgress size={24} /> : 'Enviar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EmailExportDialog;
