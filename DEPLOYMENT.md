# Guía de Despliegue en Producción

## 🚀 Opción 1: VPS DigitalOcean (Recomendada)

### Pasos:

1. **Crear VPS en DigitalOcean**
   - Elegir Ubuntu 22.04
   - Mínimo 2GB RAM, 1 CPU
   - Costo: ~$6/mes

2. **Configurar Dominio**
   - Comprar dominio (ej: codigosdisney.com)
   - Apuntar DNS a IP del VPS
   - Configurar registro A: @ -> IP_VPS

3. **Instalar Node.js en VPS**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Configurar Firewall**
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

5. **Instalar Nginx**
```bash
sudo apt update
sudo apt install nginx
```

6. **Configurar Nginx**
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

7. **Instalar SSL Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

8. **Subir Proyecto**
```bash
# Copiar archivos al VPS
scp -r /path/to/project user@vps_ip:/home/user/codigos-disney

# En el VPS
cd /home/user/codigos-disney
npm install
cp .env.production .env
# Editar .env con credenciales reales
```

9. **Instalar PM2 (Process Manager)**
```bash
sudo npm install -g pm2
pm2 start server.js --name "codigos-disney"
pm2 startup
pm2 save
```

## ☁️ Opción 2: Heroku

1. **Instalar Heroku CLI**
2. **Login**: `heroku login`
3. **Crear app**: `heroku create tu-app-name`
4. **Configurar variables**:
```bash
heroku config:set GMAIL_USER=tu_correo@gmail.com
heroku config:set GMAIL_PASS=tu_contraseña
heroku config:set PORT=3000
```
5. **Deploy**: `git push heroku main`

## 🐳 Opción 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuración Adicional

### Variables de Entorno Producción
- Usar contraseña de aplicación Gmail (no la contraseña normal)
- Configurar monitoreo con PM2
- Configurar backups automáticos

### Seguridad
- Cambiar puerto por defecto si es posible
- Configurar rate limiting
- Usar HTTPS obligatorio
- Monitorear logs de acceso

### Dominios Recomendados
- codigosdisney.com
- disneycodes.com
- rokocodes.com
- verificationcodes.com
