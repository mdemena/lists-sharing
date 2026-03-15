// src/components/dialogs/MoveItemDialog.tsx

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { List, ListItem } from '../../types';

export interface MoveItemDialogProps {
    open: boolean;
    onClose: () => void;
    onMove: (targetListId: string) => Promise<void>;
    item: ListItem | null;
    availableLists: List[];
    isLoading?: boolean;
}

const MoveItemDialog: React.FC<MoveItemDialogProps> = ({
    open,
    onClose,
    onMove,
    item,
    availableLists,
    isLoading = false,
}) => {
    const { t } = useTranslation();
    const [selectedListId, setSelectedListId] = useState('');

    const handleClose = () => {
        setSelectedListId('');
        onClose();
    };

    const handleConfirm = async () => {
        if (!selectedListId) return;
        await onMove(selectedListId);
        setSelectedListId('');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>{t('moveItem.title')}</DialogTitle>
            <DialogContent>
                {item && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        {t('moveItem.itemName')}: <strong>{item.name}</strong>
                    </Typography>
                )}
                {availableLists.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        {t('moveItem.noOtherLists')}
                    </Typography>
                ) : (
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                        <InputLabel>{t('moveItem.selectList')}</InputLabel>
                        <Select
                            value={selectedListId}
                            label={t('moveItem.selectList')}
                            onChange={(e) => setSelectedListId(e.target.value)}
                        >
                            {availableLists.map((list) => (
                                <MenuItem key={list.id} value={list.id}>
                                    {list.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isLoading}>
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="primary"
                    disabled={isLoading || !selectedListId || availableLists.length === 0}
                >
                    {t('moveItem.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MoveItemDialog;
