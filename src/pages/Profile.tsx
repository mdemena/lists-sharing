import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    const getProfile = async () => {
        try {
            setLoading(true);

            // Refresh user session to get latest metadata
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            // Get display_name from user metadata
            setDisplayName(currentUser?.user_metadata?.display_name || '');

            // Get date_of_birth from profiles table
            const { data, error } = await supabase
                .from('profiles')
                .select('date_of_birth')
                .eq('id', user!.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setDateOfBirth(data.date_of_birth || '');
            }
        } catch (error: any) {
            toast.error('Error cargando el perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setLoading(true);

            // Update display_name in Auth user metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { display_name: displayName || null }
            });

            if (authError) {
                throw authError;
            }

            // Update date_of_birth in profiles table
            const updates = {
                id: user!.id,
                date_of_birth: dateOfBirth || null,
                updated_at: new Date().toISOString(),
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(updates);

            if (profileError) {
                throw profileError;
            }

            toast.success('Perfil actualizado correctamente');

            // Refresh profile to show updated data
            await getProfile();

            // Redirect to dashboard after successful save
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000); // Wait 1 second to show the success message
        } catch (error: any) {
            toast.error('Error actualizando el perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                    Mi Perfil
                </Typography>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 3 }}>
                    <TextField
                        id="email"
                        label="Correo Electrónico"
                        value={user?.email}
                        fullWidth
                        margin="normal"
                        disabled
                        variant="outlined"
                    />
                    <TextField
                        id="displayName"
                        label="Nombre para mostrar"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                        helperText="Este nombre será visible para otros usuarios"
                    />
                    <TextField
                        id="dateOfBirth"
                        label="Fecha de Nacimiento"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        variant="outlined"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        sx={{ mt: 3 }}
                        onClick={updateProfile}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ProfilePage;
