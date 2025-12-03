// src/api/storage.ts
import { api } from './index';
import { compressImage } from '../utils/storage';

export interface UploadResult {
    url: string;
    path: string;
    error?: string;
}

/**
 * Sube una imagen a través del backend
 */
export async function uploadItemImage(
    file: File,
    listId: string,
    itemId?: string
): Promise<UploadResult> {
    try {
        // Comprimir la imagen
        const compressedFile = await compressImage(file);

        // Crear FormData
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('listId', listId);
        if (itemId) formData.append('itemId', itemId);

        // Usar el cliente API centralizado
        const { data, error } = await api.storage.upload(formData);

        if (error) {
            throw new Error(error);
        }

        return {
            url: data.url,
            path: data.path,
        };
    } catch (error: any) {
        console.error('Error in uploadItemImage:', error);
        return { url: '', path: '', error: error.message || 'Error desconocido al subir imagen' };
    }
}

/**
 * Elimina una imagen a través del backend
 */
export async function deleteItemImage(path: string): Promise<{ error?: string }> {
    try {
        const { error } = await api.storage.delete(path);

        if (error) {
            throw new Error(error);
        }

        return {};
    } catch (error: any) {
        console.error('Error in deleteItemImage:', error);
        return { error: error.message || 'Error desconocido al eliminar imagen' };
    }
}

/**
 * Elimina múltiples imágenes a través del backend
 */
export async function deleteMultipleImages(paths: string[]): Promise<{ error?: string }> {
    try {
        if (paths.length === 0) return {};

        const { error } = await api.storage.deleteMultiple(paths);

        if (error) {
            throw new Error(error);
        }

        return {};
    } catch (error: any) {
        console.error('Error in deleteMultipleImages:', error);
        return { error: error.message || 'Error desconocido al eliminar imágenes' };
    }
}

/**
 * Obtiene la URL pública de una imagen
 */
export function getPublicUrl(path: string): string {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    return `${SUPABASE_URL}/storage/v1/object/public/item-images/${path}`;
}
