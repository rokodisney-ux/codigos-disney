#!/bin/bash

# Script de instalación automática para producción

echo "🚀 Iniciando instalación del Sistema de Códigos Disney+..."

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2
sudo npm install -g pm2

# Configurar firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx -y

echo "✅ Instalación completada!"
echo "📝 Siguiente pasos:"
echo "1. Configurar tu dominio para apuntar a esta IP"
echo "2. Ejecutar: sudo nano /etc/nginx/sites-available/tudominio"
echo "3. Ejecutar: sudo ln -s /etc/nginx/sites-available/tudominio /etc/nginx/sites-enabled/"
echo "4. Ejecutar: sudo certbot --nginx -d tudominio.com"
echo "5. Subir tu proyecto y ejecutar: pm2 start server.js"
