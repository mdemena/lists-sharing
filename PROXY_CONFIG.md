# Configuración de Proxy en Desarrollo

## ¿Qué es el Proxy de Vite?

En desarrollo, el servidor de Vite (puerto 5173) actúa como un proxy que redirige las peticiones a `/api/*` hacia el backend Express (puerto 3001). Esto evita problemas de CORS.

## Configuración

### vite.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### Frontend

El frontend hace peticiones a rutas relativas:
```typescript
const BACKEND_API_URL = '';  // Ruta vacía, usa rutas relativas

// La petición se hace a /api/share-list
await fetch(`${BACKEND_API_URL}/api/share-list`, { ... })
```

## Flujo de Peticiones

```
Frontend (localhost:5173)
    ↓
   fetch('/api/share-list')
    ↓
Vite Proxy detecta /api/*
    ↓
Redirige a → http://localhost:3001/api/share-list
    ↓
Backend Express procesa la petición
    ↓
Respuesta ← Backend
    ↓
Frontend recibe respuesta
```

## Ventajas

✅ **Sin CORS**: Frontend y backend parecen estar en el mismo origen  
✅ **Simple**: No necesitas configurar CORS en el backend para desarrollo  
✅ **Estándar**: Es el patrón recomendado por Vite y React  
✅ **Limpio**: Código del frontend no necesita URLs de desarrollo vs producción

## Producción

En producción, tienes dos opciones:

### Opción 1: Backend Separado (Recomendado)

Despliega frontend y backend por separado:

1. **Frontend**: Usa variable de entorno `VITE_BACKEND_URL`
   ```env
   VITE_BACKEND_URL=https://api.tudominio.com
   ```

2. **Código**: Actualiza `Dashboard.tsx`
   ```typescript
   const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || '';
   ```

3. **Backend**: Configura CORS para permitir tu dominio frontend
   ```typescript
   app.use(cors({
       origin: ['https://tudominio.com'],
       credentials: true,
   }));
   ```

### Opción 2: Servir desde el Mismo Servidor

Compila el frontend y sírvelo desde Express:

1. **Build del frontend**:
   ```bash
   npm run build
   ```

2. **Express sirve los archivos estáticos**:
   ```typescript
   app.use(express.static('path/to/frontend/dist'));
   app.use('/api', apiRoutes);
   app.get('*', (req, res) => {
     res.sendFile('path/to/frontend/dist/index.html');
   });
   ```

## Para Desarrollar

1. **Terminal 1** - Backend:
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2** - Frontend:
   ```bash
   npm run dev
   ```

3. Abre http://localhost:5173

¡Todo funcionará sin problemas de CORS! 🚀
