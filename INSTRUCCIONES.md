# 🚀 Instrucciones de Configuración - Sistema de Códigos de Verificación

## 📋 Requisitos Previos

1. **Node.js** (versión 14 o superior)
2. **Cuenta Gmail** (`rokodisney@gmail.com`)
3. **Contraseña de aplicación de Gmail**

## 🔧 Paso 1: Configurar Contraseña de Aplicación Gmail

### 1.1 Activar Verificación en Dos Pasos
- Ve a: https://myaccount.google.com/security
- Activa "Verificación en dos pasos"
- Sigue los pasos de configuración

### 1.2 Generar Contraseña de Aplicación
- En la misma página de seguridad, busca "Contraseñas de aplicaciones"
- Haz clic en "Generar"
- Selecciona:
  - **Aplicación**: Otra (nombre personalizado)
  - **Nombre**: "Consulta Códigos"
- Copia la contraseña generada (¡guárdala!)

## 📁 Paso 2: Configurar el Proyecto

### 2.1 Instalar Dependencias
```bash
cd consulta-codigos
npm install
```

### 2.2 Configurar Variables de Entorno
1. Copia el archivo `.env.example` a `.env`:
```bash
copy .env.example .env
```

2. Edita el archivo `.env` con tus datos:
```env
GMAIL_USER=rokodisney@gmail.com
GMAIL_PASSWORD=tu_contraseña_de_aplicacion_aqui
PORT=3000
```

**Importante**: Usa la contraseña de aplicación que generaste, NO tu contraseña normal de Gmail.

## 🚀 Paso 3: Iniciar el Sistema

### 3.1 Iniciar el Servidor
```bash
npm start
```

O para desarrollo (con recarga automática):
```bash
npm run dev
```

### 3.2 Verificar que Funciona
- Abre tu navegador en: http://localhost:3000
- Deberías ver la página de consulta de códigos
- En la consola verás mensajes como:
  ```
  🚀 Servidor iniciado en http://localhost:3000
  🔗 Conectando a Gmail...
  ✅ Conectado a Gmail exitosamente
  📧 Encontrados X correos nuevos para procesar
  ```

## 📧 Paso 4: Probar el Sistema

### 4.1 Enviar Correos de Prueba
Envía correos de prueba a `rokodisney@gmail.com` desde:
- `test@rokotv.xyz`
- `test@rokostream.com`

### 4.2 Contenido del Correo de Prueba
```
Asunto: Tu código de acceso único para Disney+

Cuerpo:
Es necesario que verifiques la dirección de correo electrónico asociada a tu cuenta de MyDisney con este código de acceso que vencerá en 15 minutos.

277035
```

### 4.3 Consultar los Códigos
1. Ve a http://localhost:3000
2. Ingresa: `test@rokotv.xyz`
3. Haz clic en "Consultar Códigos"
4. Deberías ver el código `277035`

## 🔍 Paso 5: Monitoreo

### 5.1 Verificar Estado del Sistema
- Ve a: http://localhost:3000/api/status
- Verás el estado del servidor y del lector de correos

### 5.2 Ver Todos los Códigos (Admin)
- Ve a: http://localhost:3000/api/admin/codigos
- Muestra todos los códigos procesados

## 🛠️ Comandos Útiles

### Reiniciar el Lector de Correos
```bash
curl -X POST http://localhost:3000/api/admin/restart-email-reader
```

### Limpiar Códigos Antiguos (más de 30 días)
```bash
curl -X DELETE http://localhost:3000/api/admin/limpiar
```

## 🚨 Solución de Problemas

### Error: "Invalid credentials"
- Verifica que usaste la contraseña de aplicación, no la contraseña normal
- Asegúrate de tener activada la verificación en dos pasos

### Error: "Connection refused"
- Verifica que el servidor esté corriendo en el puerto 3000
- Revisa que no haya otro programa usando ese puerto

### No se detectan códigos
- Verifica que los correos vengan de `@rokotv.xyz` o `@rokostream.com`
- Asegúrate de que los códigos sean exactamente 6 dígitos numéricos

### El lector de correos no se inicia
- Revisa las credenciales en el archivo `.env`
- Verifica tu conexión a internet
- Intenta reiniciar el servidor

## 📁 Estructura de Archivos

```
consulta-codigos/
├── server.js              # Servidor principal
├── database.js            # Gestión de base de datos
├── emailReader.js         # Lector de correos IMAP
├── script-api.js          # Frontend actualizado
├── index.html             # Página principal
├── styles.css             # Estilos
├── package.json           # Dependencias
├── .env                   # Configuración (creado por ti)
├── .env.example           # Ejemplo de configuración
├── codigos.db             # Base de datos SQLite (se crea solo)
└── INSTRUCCIONES.md       # Este archivo
```

## 🔐 Seguridad

- La contraseña de Gmail se guarda en el archivo `.env` (nunca en el código)
- Solo se procesan correos de dominios autorizados
- Los códigos se almacenan localmente en SQLite
- La API tiene validación de dominios

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del servidor para ver errores específicos
2. Verifica que todos los pasos de configuración se completaron correctamente
3. Asegúrate de tener conexión estable a internet

¡Listo! Tu sistema de consulta de códigos está funcionando. 🎉
