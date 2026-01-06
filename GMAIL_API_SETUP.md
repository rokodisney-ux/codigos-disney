# 📧 Configurar Gmail API (Alternativa a IMAP)

## 🎯 Por qué usar Gmail API:
- ✅ Más confiable que IMAP
- ✅ Sin problemas de autenticación
- ✅ Acceso directo a todos los correos
- ✅ Mejor rendimiento

## 📋 Pasos para configurar:

### 1️⃣ Crear Proyecto en Google Cloud
1. Ve a: https://console.cloud.google.com/
2. Crea un nuevo proyecto: `Disney+ Codes System`
3. Espera a que se cree

### 2️⃣ Habilitar Gmail API
1. En el proyecto, ve a "APIs y Servicios"
2. Busca "Gmail API" y haz clic
3. Haz clic en "Habilitar"
4. Acepta los términos

### 3️⃣ Crear Credenciales
1. Ve a "Credenciales" → "Crear credenciales"
2. Selecciona "ID de cliente de OAuth"
3. Configura:
   - **Nombre**: Disney+ Web App
   - **URI de redirección autorizado**: `http://localhost:3000/auth/callback`
   - **Aplicación**: Aplicación web
   - **Tipo**: Aplicación web
4. Haz clic en "Crear"

### 4️⃣ Obtener Credenciales
1. Descarga el archivo JSON
2. Copia estos valores:
   - `client_id`
   - `client_secret`
   - `private_key` (toda la clave)

### 5️⃣ Configurar en Render.com
1. Dashboard → `codigos-disney` → "Environment"
2. Agrega estas variables:
   ```
   GMAIL_CLIENT_ID=tu_client_id
   GMAIL_CLIENT_SECRET=tu_client_secret
   GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

### 6️⃣ Probar Localmente
1. Crea un archivo `.env.gmail`:
   ```
   GMAIL_CLIENT_ID=tu_client_id
   GMAIL_CLIENT_SECRET=tu_client_secret
   GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
2. Ejecuta: `node gmail-api-test.js`

## 🚀 Ventajas:
- ✅ Sin errores de IMAP
- ✅ Conexión más estable
- ✅ Búsqueda más rápida
- ✅ Acceso completo a todos los correos

## ⚠️ Nota:
La Gmail API requiere configuración inicial pero es mucho más confiable que IMAP.
