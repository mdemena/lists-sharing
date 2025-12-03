// src/utils/storage.ts
import imageCompression from 'browser-image-compression';

/**
 * Opciones de compresión de imágenes
 */
const COMPRESSION_OPTIONS = {
    maxSizeMB: 1, // Tamaño máximo en MB
    maxWidthOrHeight: 1920, // Dimensión máxima
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
};

/**
 * Tamaño máximo de archivo antes de compresión (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Tipos de archivo permitidos
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Valida que el archivo sea una imagen válida
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG y WebP.',
        };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
    }

    return { valid: true };
}

/**
 * Comprime una imagen antes de subirla
 */
export async function compressImage(file: File): Promise<File> {
    try {
        const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
        return compressedFile;
    } catch (error) {
        console.error('Error comprimiendo imagen:', error);
        // Si falla la compresión, devolver el archivo original
        return file;
    }
}

/**
 * Genera un nombre único para el archivo
 */
export function generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Genera la ruta completa para almacenar una imagen
 * Estructura: {userId}/{listId}/{itemId}/{filename}
 */
export function generateStoragePath(
    userId: string,
    listId: string,
    itemId: string | undefined,
    filename: string
): string {
    const itemPath = itemId || 'temp';
    return `${userId}/${listId}/${itemPath}/${filename}`;
}

/**
 * Convierte un File a base64 para preview
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}
