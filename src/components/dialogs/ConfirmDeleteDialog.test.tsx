import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

describe('ConfirmDeleteDialog', () => {
    it('renders correctly when open', () => {
        render(
            <ConfirmDeleteDialog 
                open={true} 
                onClose={() => {}} 
                onConfirm={() => {}} 
                itemName="Test Item" 
            />
        );
        expect(screen.getByText(/Confirmar Eliminación/i)).toBeInTheDocument();
        expect(screen.getByText(/Test Item/i)).toBeInTheDocument();
    });

    it('calls onConfirm when delete button is clicked', () => {
        const handleConfirm = vi.fn();
        render(
            <ConfirmDeleteDialog 
                open={true} 
                onClose={() => {}} 
                onConfirm={handleConfirm} 
                itemName="Test Item" 
            />
        );
        
        fireEvent.click(screen.getByText('Eliminar'));
        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', () => {
        const handleClose = vi.fn();
        render(
            <ConfirmDeleteDialog 
                open={true} 
                onClose={handleClose} 
                onConfirm={() => {}} 
                itemName="Test Item" 
            />
        );
        
        fireEvent.click(screen.getByText('Cancelar'));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
