// src/components/export/ExportMenu.tsx

import React from 'react';
import { Menu, MenuItem } from '@mui/material';
import type { ExportFormat } from '../../hooks/useExport';

export interface ExportMenuProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onExport: (format: ExportFormat) => void;
    showEmailOption?: boolean;
    onEmailClick?: () => void;
}

const ExportMenu: React.FC<ExportMenuProps> = ({
    anchorEl,
    onClose,
    onExport,
    showEmailOption = false,
    onEmailClick,
}) => {
    const handleExport = (format: ExportFormat) => {
        onExport(format);
        onClose();
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            <MenuItem onClick={() => handleExport('csv')}>CSV</MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>Excel</MenuItem>
            <MenuItem onClick={() => handleExport('json')}>JSON</MenuItem>
            {showEmailOption && onEmailClick && (
                <MenuItem onClick={() => { onEmailClick(); onClose(); }}>
                    Enviar por Email
                </MenuItem>
            )}
        </Menu>
    );
};

export default ExportMenu;
