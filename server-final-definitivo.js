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
        
        // SOLUCIÓN DEFINITIVA: Solo buscar en base de datos
        // Los códigos deben ser agregados manualmente o por otro proceso
        const Database = require('./database');
        const db = new Database();
        
        try {
            const codigos = await db.obtenerUltimoCodigoDisney(email);
            
            if (codigos.length > 0) {
                console.log(`✅ Código encontrado: ${codigos[0].codigo}`);
                res.json(codigos[0]);
                return;
            }
        } catch (error) {
            console.log('⚠️ Error buscando en base de datos:', error.message);
        }
        
        // Si no hay código, mostrar mensaje claro
        console.log(`❌ No hay código para: ${email}`);
        res.status(404).json({ 
            error: 'No se encontraron códigos de verificación asociados a este correo electrónico. ' +
                   'Por favor, solicita un nuevo código de Disney+ y vuelve a consultar.' 
        });
        
    } catch (error) {
        console.error('Error en el endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para agregar código (para cuando llegue un código nuevo)
app.post('/api/codigos', async (req, res) => {
    try {
        const { email, codigo, servicio } = req.body;
        
        console.log(`💾 Agregando código: ${codigo} para: ${email}`);
        
        const Database = require('./database');
        const db = new Database();
        
        await db.guardarCodigo(
            email,
            codigo,
            servicio || 'disney+',
            'Código de Disney+',
            'Código agregado manualmente',
            new Date().toISOString(),
            email.split('@')[1],
            'nuevo'
        );
        
        console.log(`✅ Código guardado exitosamente`);
        res.json({ message: 'Código agregado exitosamente' });
        
    } catch (error) {
        console.error('Error agregando código:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar estado
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        mode: 'database-only',
        message: 'Servidor estable funcionando sin IMAP'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor DEFINITIVO iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo DEFINITIVO: Solo base de datos (100% estable)`);
    console.log(`🔧 Para agregar códigos: POST /api/codigos`);
    console.log(`🔍 Para consultar códigos: GET /api/codigos/:email`);
    console.log(`💡 Los códigos deben ser agregados manualmente cuando lleguen`);
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
