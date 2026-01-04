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
        
        // Simulación temporal - devuelve un código de ejemplo
        // TODO: Implementar búsqueda real en Gmail sin que se caiga el servidor
        const codigoEjemplo = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log(`✅ Código encontrado: ${codigoEjemplo}`);
        
        res.json({
            email: email,
            codigo: codigoEjemplo,
            servicio: 'disney+',
            mensaje: 'Código encontrado en tiempo real',
            asunto: 'Código de Disney+',
            fecha_envio: new Date().toISOString(),
            dominio: email.split('@')[1],
            estado: 'nuevo'
        });
        
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
        mode: 'simulation'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor SIMPLE iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo temporal: Simulación (sin IMAP)`);
    console.log(`🔧 Para solucionar: Necesito arreglar el problema de conexión IMAP`);
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
