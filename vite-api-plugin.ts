// vite-api-plugin.ts
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import { handler as shareListHandler } from "./api/share-list";
import { handler as authHandler } from "./api/auth";
import { handler as listsHandler } from "./api/lists";
import { handler as itemsHandler } from "./api/items";
import { handler as profilesHandler } from "./api/profiles";
import { loadEnv } from "vite";

export function apiPlugin(): Plugin {
    return {
        name: "vite-api-plugin",
        configureServer(server) {
            // Cargar variables de entorno
            const env = loadEnv(server.config.mode, process.cwd(), "");

            // Inyectar variables de entorno en process.env para que el handler las pueda usar
            Object.keys(env).forEach((key) => {
                if (key.startsWith("VITE_")) {
                    process.env[key] = env[key];
                }
            });

            server.middlewares.use(
                async (req: IncomingMessage, res: ServerResponse, next) => {
                    // Manejar rutas de API
                    if (req.url?.startsWith("/api/")) {
                        const url = new URL(
                            req.url,
                            `http://${req.headers.host}`,
                        );
                        const path = url.pathname.replace("/api/", "");

                        try {
                            if (
                                path === "share-list" ||
                                path.startsWith("share-list/")
                            ) {
                                await shareListHandler(req, res);
                            } else if (
                                path === "auth" || path.startsWith("auth/")
                            ) {
                                await authHandler(req, res);
                            } else if (
                                path === "lists" || path.startsWith("lists/")
                            ) {
                                await listsHandler(req, res);
                            } else if (
                                path === "items" || path.startsWith("items/")
                            ) {
                                await itemsHandler(req, res);
                            } else if (
                                path === "profiles" ||
                                path.startsWith("profiles/")
                            ) {
                                await profilesHandler(req, res);
                            } else {
                                // Ruta no encontrada
                                res.writeHead(404, {
                                    "Content-Type": "application/json",
                                });
                                res.end(
                                    JSON.stringify({
                                        error: "API endpoint not found",
                                    }),
                                );
                            }
                        } catch (error) {
                            console.error("API Error:", error);
                            res.writeHead(500, {
                                "Content-Type": "application/json",
                            });
                            res.end(
                                JSON.stringify({
                                    error: "Internal server error",
                                }),
                            );
                        }
                        return;
                    }

                    // Si no es una ruta de API, continuar con el siguiente middleware
                    next();
                },
            );
        },
    };
}
