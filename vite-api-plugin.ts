// vite-api-plugin.ts
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { handler as shareListHandler } from './api/share-list';

export function apiPlugin(): Plugin {
    return {
        name: 'vite-api-plugin',
        configureServer(server) {
            server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
                // Manejar rutas de API
                if (req.url?.startsWith('/api/')) {
                    const path = req.url.replace('/api/', '');

                    // Routing de APIs
                    if (path === 'share-list' || path.startsWith('share-list?')) {
                        try {
                            await shareListHandler(req, res);
                        } catch (error) {
                            console.error('API Error:', error);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Internal server error' }));
                        }
                        return;
                    }

                    // Ruta no encontrada
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'API endpoint not found' }));
                    return;
                }

                // Si no es una ruta de API, continuar con el siguiente middleware
                next();
            });
        }
    };
}
