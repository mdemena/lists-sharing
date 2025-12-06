import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Container, MenuItem } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'es', name: 'Español' },
    { code: 'ca', name: 'Català' },
    { code: 'eu', name: 'Euskera' },
    { code: 'gl', name: 'Galego' },
    { code: 'en', name: 'English' },
];

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('es');

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    const getProfile = async () => {
        try {
            setLoading(true);

            // Get profile data including display_name
            const { data, error } = await api.profiles.get(user!.id);

            if (error) {
                throw new Error(error);
            }

            if (data) {
                setDateOfBirth(data.date_of_birth || '');
                setPreferredLanguage(data.preferred_language || 'es');
                // Use display_name from profiles table
                setDisplayName(data.display_name || user?.user_metadata?.full_name || user?.email || '');
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

            // Update profile in profiles table
            // The DB trigger 'sync_profile_to_auth' will handle updating Auth metadata
            const updates = {
                id: user!.id,
                display_name: displayName,
                date_of_birth: dateOfBirth || null,
                preferred_language: preferredLanguage,
                updated_at: new Date().toISOString(),
            };

            const { error: profileError } = await api.profiles.upsert(updates);

            if (profileError) {
                throw new Error(profileError);
            }

            toast.success('Perfil actualizado correctamente');

            // Change language immediately
            i18n.changeLanguage(preferredLanguage);

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
                    {t('profile.title')}
                </Typography>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 3 }}>
                    <TextField
                        id="email"
                        label={t('profile.email')}
                        value={user?.email}
                        fullWidth
                        margin="normal"
                        disabled
                        variant="outlined"
                    />
                    <TextField
                        id="displayName"
                        label={t('profile.displayName')}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                        helperText={t('profile.displayNameHelper')}
                    />

                    <TextField
                        select
                        id="preferredLanguage"
                        label={t('profile.preferredLanguage')}
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                        helperText={t('profile.preferredLanguageHelper')}
                    >
                        {languages.map((option) => (
                            <MenuItem key={option.code} value={option.code}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        id="dateOfBirth"
                        label={t('profile.dateOfBirth')}
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
                        {loading ? t('profile.saving') : t('profile.save')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ProfilePage;
