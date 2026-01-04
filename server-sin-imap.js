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
        
        // Usar base de datos simple para guardar códigos
        const Database = require('./database');
        const db = new Database();
        
        // Intentar buscar en base de datos
        try {
            const codigos = await db.obtenerUltimoCodigoDisney(email);
            
            if (codigos.length > 0) {
                console.log(`✅ Código encontrado en base de datos: ${codigos[0].codigo}`);
                res.json(codigos[0]);
                return;
            }
        } catch (error) {
            console.log('⚠️ Error buscando en base de datos:', error.message);
        }
        
        // Si no hay en base de datos, mostrar mensaje
        console.log(`❌ No hay código guardado para: ${email}`);
        res.status(404).json({ 
            error: 'No se encontraron códigos de verificación asociados a este correo electrónico. ' +
                   'Por favor, solicita un nuevo código y vuelve a intentar.' 
        });
        
    } catch (error) {
        console.error('Error en el endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para agregar código manualmente
app.post('/api/codigos', async (req, res) => {
    try {
        const { email, codigo, servicio } = req.body;
        
        console.log(`💾 Agregando código manual: ${codigo} para: ${email}`);
        
        const Database = require('./database');
        const db = new Database();
        
        await db.guardarCodigo(
            email,
            codigo,
            servicio || 'disney+',
            'Código agregado manualmente',
            'Código agregado manualmente',
            new Date().toISOString(),
            email.split('@')[1],
            'nuevo'
        );
        
        console.log(`✅ Código guardado en base de datos`);
        res.json({ message: 'Código agregado exitosamente' });
        
    } catch (error) {
        console.error('Error agregando código:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar estado del servicio
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        mode: 'database-only',
        message: 'Servidor funcionando sin IMAP'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor SIN IMAP iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo estable: Solo base de datos (sin problemas de IMAP)`);
    console.log(`🔧 Para agregar códigos: POST /api/codigos con email, codigo, servicio`);
    console.log(`🔍 Para consultar códigos: GET /api/codigos/:email`);
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
