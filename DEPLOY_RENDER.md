# Guía de Despliegue GRATIS en Render.com

## 🆓 Render.com - La Mejor Opción Gratuita

### ✅ Ventajas:
- **Totalmente gratis** para proyectos pequeños
- **Soporta Node.js completo** (IMAP, base de datos)
- **SSL automático**
- **Dominio personalizado gratis**
- **750 horas/mes** (suficiente para tu uso)

### 🚀 Pasos para Deploy en Render:

#### 1. **Preparar Proyecto**
```bash
# Agregar archivo render.yaml
echo "services:
  - type: web
    name: codigos-disney
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000" > render.yaml
```

#### 2. **Subir a GitHub**
```bash
git init
git add .
git commit -m "Sistema de códigos Disney+ listo"
git branch -M main
git remote add origin https://github.com/tuusuario/codigos-disney.git
git push -u origin main
```

#### 3. **Configurar en Render**
1. Ir a [render.com](https://render.com)
2. Crear cuenta gratuita
3. Conectar cuenta GitHub
4. "New +" → "Web Service"
5. Elegir tu repositorio
6. Configurar:
   - **Name**: codigos-disney
   - **Plan**: Free
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### 4. **Configurar Variables de Entorno**
En Render dashboard → Environment:
```
GMAIL_USER=tu_correo@gmail.com
GMAIL_PASS=tu_contraseña_de_aplicacion
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
PORT=3000
```

#### 5. **Configurar Dominio Personalizado**
1. En Render dashboard → Domains
2. Agregar tu dominio: `tudominio.com`
3. Render te dará registros DNS
4. En tu registrador de dominio, agregar:
   - **A**: `tudominio.com` → IP de Render
   - **CNAME**: `www` → `tudominio.com.onrender.com`

### 📊 Límites del Plan Gratis:
- **750 horas/mes** = ~25 horas/día
- **Sleep después de 15 min inactividad** (se reactiva en ~30 seg)
- **Ancho de banda**: 100GB/mes
- **Dominio personalizado**: ✅ Gratis

### ⚡ Optimización para Render:
```javascript
// Agregar en server.js para evitar sleep
app.get('/ping', (req, res) => res.send('pong'));

// Agregar en package.json
"scripts": {
  "start": "node server.js",
  "keepalive": "node -e \"setInterval(() => require('http').get('https://tuapp.onrender.com/ping'), 5 * 60 * 1000)\""
}
```
