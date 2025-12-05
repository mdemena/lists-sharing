// src/components/cards/UseCaseCard.tsx

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export interface UseCaseCardProps {
    emoji: string;
    title: string;
    situation: string;
    solution: string;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({ emoji, title, situation, solution }) => (
    <Paper
        elevation={2}
        sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            bgcolor: 'background.paper',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
            }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ fontSize: '2rem', mr: 2 }}>{emoji}</Box>
            <Typography variant="h6" component="h3" fontWeight="bold">
                {title}
            </Typography>
        </Box>
        <Typography variant="body2" color="text.primary" fontWeight="medium" mb={1}>
            Situación:
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
            {situation}
        </Typography>
        <Typography variant="body2" color="text.primary" fontWeight="medium" mb={1}>
            Solución:
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {solution}
        </Typography>
    </Paper>
);

export default UseCaseCard;
