// frontend/src/components/SimpleDivider.tsx

import React from 'react';
import { Box } from '@mui/material'; // Usamos Box para estilo, pero sin hooks

interface SimpleDividerProps {
    // Prop para controlar el margen vertical (equivalente a Chakra/MUI 'my')
    marginY?: number;
    // Prop para el color de la línea
    color?: string;
}

const SimpleDivider: React.FC<SimpleDividerProps> = ({ marginY = 3, color = 'grey.300' }) => {
    return (
        <Box
            component="hr" // Renderizado como la etiqueta nativa <hr>
            sx={{
                width: '100%',
                marginY: marginY, // Controla el margen superior e inferior
                borderTopWidth: '1px',
                borderStyle: 'solid',
                borderColor: color, // Color de la línea (usando tema de MUI)
                // Eliminamos el margen nativo del <hr> y usamos el Box para el espaciado
                borderBottom: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                height: '0px'
            }}
        />
    );
};

export default SimpleDivider;