# Sistema de Consulta de Códigos Disney+ - RokoTV & RokoStream

Sistema ultra-rápido para consultar códigos de verificación de Disney+ vía Gmail con detección multi-idioma.

## 🚀 Características

- ✅ Detección multi-idioma (Español, Inglés, Francés, Alemán, Sueco)
- ✅ Dominios configurados: rokotv.xyz, rokostream.com
- ✅ IMAP optimizado con timeouts extendidos
- ✅ Búsqueda en tiempo real sin base de datos
- ✅ Ultra-rápido: 1-3 segundos por consulta
- ✅ Interfaz moderna y responsive
- ✅ Validación exclusiva para dominios rokotv.xyz y rokostream.com
- ✅ Consulta de códigos por correo electrónico
- ✅ Copiado de códigos al portapapeles
- ✅ Indicadores de estado (activo, pendiente, expirado)
- ✅ Información de dominio y fecha
- ✅ Validación de correos electrónicos
- ✅ Mensajes de error específicos para dominios no autorizados

## Cómo usar

### Para clientes:
1. Abre `index.html` en tu navegador web
2. Ingresa tu correo electrónico de **rokotv.xyz** o **rokostream.com**
3. Haz clic en "Consultar Códigos"
4. Verás los códigos asociados a tu correo
5. Puedes copiar cualquier código haciendo clic en el botón "Copiar"

### Correos de ejemplo para pruebas:
- `cliente@rokotv.xyz` - Tiene 2 códigos (RKO001, RKO002)
- `usuario@rokotv.xyz` - Tiene 1 código (TV123)
- `cliente@rokostream.com` - Tiene 2 códigos (STREAM001, STREAM002)
- `soporte@rokostream.com` - Tiene 1 código (RS789)
- `test@rokotv.xyz` - Tiene 1 código (TEST001)

### Para administradores:

#### Agregar nuevos datos:
Presiona `Ctrl+Shift+A` en la página para abrir el formulario de agregar datos de ejemplo. Solo se permiten correos de los dominios autorizados.

## Dominios Soportados

- **rokotv.xyz** - Servicios de streaming y TV
- **rokostream.com** - Plataforma de streaming

## Estructura del proyecto

```
consulta-codigos/
├── index.html      # Página principal
├── styles.css      # Estilos CSS
├── script.js       # Lógica JavaScript
└── README.md       # Este archivo
```

## Personalización

### Agregar más datos de ejemplo:
Edita el objeto `baseDeDatos` en `script.js`:

```javascript
const baseDeDatos = {
    'nuevo@rokotv.xyz': [
        { 
            codigo: 'NUEVO123', 
            dominio: 'rokotv.xyz', 
            fecha: '2026-01-02', 
            estado: 'activo' 
        }
    ]
};
```

### Modificar dominios permitidos:
Edita la función `validarDominio()` en `script.js`:

```javascript
function validarDominio(email) {
    const dominiosPermitidos = ['rokotv.xyz', 'rokostream.com', 'nuevodominio.com'];
    const dominioEmail = email.split('@')[1].toLowerCase();
    return dominiosPermitidos.includes(dominioEmail);
}
```

### Modificar estados disponibles:
Edita la función `getEstadoColor()` en `script.js` para agregar nuevos estados.

### Personalizar colores y estilos:
Edita `styles.css` para modificar la apariencia visual.

## Tecnologías utilizadas

- HTML5 semántico
- CSS3 con gradientes y animaciones
- JavaScript vanilla (ES6+)
- Bootstrap 5 para componentes UI
- Responsive design

## Seguridad

- Validación estricta de dominios
- Solo se permiten correos de dominios autorizados
- Mensajes de error claros para usuarios no autorizados

## Notas

- La aplicación funciona completamente en el cliente (no requiere servidor)
- Los datos están almacenados en un objeto JavaScript para demostración
- Para producción, deberías conectar esto a una base de datos real
- La validación de dominios es estricta para seguridad

## Sugerencias para producción

1. **Backend**: Conectar a una API REST o base de datos real
2. **Autenticación**: Agregar sistema de login adicional
3. **Seguridad**: Implementar HTTPS y validación adicional
4. **Logs**: Registrar consultas para auditoría
5. **Notificaciones**: Sistema de correo para nuevos códigos
6. **API**: Integrar con sistemas de correo reales
