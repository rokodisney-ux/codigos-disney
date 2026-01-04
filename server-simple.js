require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./database');
const EmailReader = require('./emailReader');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database();
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
        
        // Primero intentar buscar en Gmail si está conectado
        if (emailReader.imap && emailReader.isRunning) {
            try {
                console.log('🔍 Buscando en Gmail...');
                const resultado = await emailReader.buscarUltimoCorreo(email);
                
                if (resultado && resultado.codigos && resultado.codigos.length > 0) {
                    const codigo = resultado.codigos[0];
                    console.log(`✅ Código encontrado en Gmail: ${codigo}`);
                    
                    // Guardar en base de datos
                    await db.guardarCodigo(
                        email,
                        codigo,
                        resultado.servicio || 'disney+',
                        'Código de Disney+',
                        'Código encontrado en tiempo real',
                        new Date().toISOString(),
                        email.split('@')[1],
                        'nuevo'
                    );
                    
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
                }
            } catch (error) {
                console.log('⚠️ Error buscando en Gmail, usando base de datos...');
            }
        }
        
        // Si no hay conexión o no se encontró, buscar en base de datos
        console.log('🔍 Buscando en base de datos...');
        const codigos = await db.obtenerUltimoCodigoDisney(email);
        
        if (codigos.length > 0) {
            console.log(`✅ Código encontrado en base de datos: ${codigos[0].codigo}`);
            res.json(codigos[0]);
        } else {
            console.log(`❌ No hay código para: ${email}`);
            res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
        }
    } catch (error) {
        console.error('Error en el endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los códigos (endpoint para admin)
app.get('/api/admin/codigos', async (req, res) => {
    try {
        const codigos = await db.obtenerTodosLosCodigos();
        res.json(codigos);
    } catch (error) {
        console.error('Error en /api/admin/codigos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para agregar código de prueba
app.post('/api/admin/test-add', async (req, res) => {
    try {
        const { email, codigo, servicio, mensaje, dominio } = req.body;
        
        await db.guardarCodigo(
            email,
            codigo,
            servicio,
            mensaje,
            mensaje,
            new Date().toISOString(),
            dominio
        );
        
        res.json({ message: 'Código agregado exitosamente' });
    } catch (error) {
        console.error('Error agregando código:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para reiniciar el lector de correos
app.post('/api/admin/restart-email-reader', async (req, res) => {
    try {
        emailReader.detener();
        setTimeout(() => {
            emailReader.iniciar();
        }, 2000);
        
        res.json({ message: 'Lector de correos reiniciado' });
    } catch (error) {
        console.error('Error reiniciando lector:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar estado del servicio
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        emailReader: emailReader.isRunning,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Iniciando lector de correos en modo seguro...`);
    
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
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    emailReader.detener();
    db.close();
    process.exit(0);
});
