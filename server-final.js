require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
        
        // Usar el EmailReader directamente (sin conexión persistente)
        const EmailReader = require('./emailReader');
        const emailReaderInstance = new EmailReader();
        
        try {
            console.log('🔍 Conectando a Gmail...');
            const resultado = await emailReaderInstance.buscarUltimoCorreoDirecto(email);
            
            if (resultado && resultado.codigos && resultado.codigos.length > 0) {
                const codigo = resultado.codigos[0];
                console.log(`✅ Código encontrado: ${codigo}`);
                
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
            } else {
                console.log(`❌ No se encontró código para: ${email}`);
                res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
            }
        } catch (error) {
            console.log('⚠️ Error buscando en Gmail:', error.message);
            res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
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
        timestamp: new Date().toISOString(),
        mode: 'direct-gmail-on-demand'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor FINAL iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo final: Conexión bajo demanda (sin base de datos)`);
    console.log(`🔍 Cada consulta busca directamente en Gmail`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});
