// src/components/cards/FeatureCard.tsx

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export interface FeatureCardProps {
    icon: React.ElementType;
    title: string;
    text: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, text }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '100%',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper'
        }}
    >
        <Box sx={{ color: 'primary.main', mb: 2 }}>
            <Icon size={40} />
        </Box>
        <Typography variant="h6" component="h3" mb={1}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>{text}</Typography>
    </Paper>
);

export default FeatureCard;
