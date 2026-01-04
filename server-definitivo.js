require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const EmailReader = require('./emailReader');

const app = express();
const PORT = process.env.PORT || 3000;
const emailReader = new EmailReader();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir archivos desde el directorio raíz

// Servir archivos estáticos del frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Endpoints

// Endpoint para buscar el último código de Disney+ para un email específico
app.get('/api/codigos/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        console.log(`🔍 Buscando código para: ${email}`);
        
        // Buscar directamente en Gmail (sin base de datos)
        if (emailReader.imap && emailReader.isRunning) {
            try {
                console.log('🔍 Buscando en Gmail...');
                const resultado = await emailReader.buscarUltimoCorreo(email);
                
                if (resultado && resultado.codigos && resultado.codigos.length > 0) {
                    const codigo = resultado.codigos[0];
                    console.log(`✅ Código encontrado en Gmail: ${codigo}`);
                    
                    // Devolver directamente el código sin guardar
                    res.json({
                        email: email,
                        codigo: codigo,
                        servicio: resultado.servicio || 'disney+',
                        mensaje: 'Código encontrado en tiempo real',
                        asunto: 'Código de Disney+',
                        fecha_envio: new Date().toISOString(),
                        dominio: email.split('@')[1],
                        estado: 'nuevo'
                    });
                    return;
                } else {
                    console.log(`❌ No se encontró código para: ${email}`);
                    res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
                    return;
                }
            } catch (error) {
                console.log('⚠️ Error buscando en Gmail:', error.message);
                res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
                return;
            }
        } else {
            console.log('❌ El lector de correos no está conectado');
            res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
            return;
        }
    } catch (error) {
        console.error('Error en el endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar estado del servicio
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        emailReader: emailReader.isRunning,
        timestamp: new Date().toISOString(),
        mode: 'direct-gmail'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor DIRECTO iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo directo: Solo Gmail (sin base de datos)`);
    console.log(`🔧 Para procesar correos: Ejecuta 'node procesador-correos.js' por separado`);
    
    // Iniciar el lector de correos después de 3 segundos
    setTimeout(() => {
        console.log('📧 Iniciando lector de correos...');
        emailReader.iniciar();
    }, 3000);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    emailReader.detener();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    emailReader.detener();
    process.exit(0);
});
