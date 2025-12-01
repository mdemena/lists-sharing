import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stack,
} from '@mui/material';
import { FaLock } from 'react-icons/fa';

interface AuthRequiredDialogProps {
    open: boolean;
    onClose: () => void;
    onLogin: () => void;
    onSignup: () => void;
}

const AuthRequiredDialog: React.FC<AuthRequiredDialogProps> = ({
    open,
    onClose,
    onLogin,
    onSignup,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <FaLock />
                    <Typography variant="h6">Autenticación Requerida</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    Para acceder a esta lista compartida y poder adjudicarte elementos, necesitas iniciar sesión o crear una cuenta.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Una vez autenticado, serás redirigido automáticamente a esta lista y podrás participar.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Cancelar
                </Button>
                <Button onClick={onSignup} variant="outlined" color="primary">
                    Registrarse
                </Button>
                <Button onClick={onLogin} variant="contained" color="primary">
                    Iniciar Sesión
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AuthRequiredDialog;
