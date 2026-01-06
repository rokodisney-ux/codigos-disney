require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Usar Gmail API en lugar de IMAP
const EmailReader = require('./emailReader-gmail-api');
const Database = require('./database');
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

// Mantener vivo el servicio (evitar sleep de Render)
setInterval(() => {
    require('http').get(`http://localhost:${PORT}/api/status`, (res) => {
        console.log('🔄 Keep-alive ping enviado');
    }).on('error', (err) => {
        console.log('⚠️ Error en keep-alive:', err.message);
    });
}, 5 * 60 * 1000); // Cada 5 minutos

// API Endpoints

// Endpoint para buscar el último código de Disney+ para un email específico
app.get('/api/codigos/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        console.log(`🔍 INICIANDO BÚSQUEDA para: ${email}`);
        console.log(`🔍 Estado del lector:`, {
            gmail: !!emailReader.gmail,
            isRunning: emailReader.isRunning
        });
        
        // SOLO buscar en Gmail con API - ignorar completamente la base de datos
        if (emailReader.gmail && emailReader.isRunning) {
            try {
                console.log('🔍 Buscando en Gmail...');
                const resultado = await emailReader.buscarUltimoCorreo(email);
                
                console.log(`🔍 Resultado de búsqueda:`, resultado);
                
                if (resultado && resultado.codigos && resultado.codigos.length > 0) {
                    const codigo = resultado.codigos[0];
                    console.log(`✅ Código encontrado en Gmail: ${codigo}`);
                    
                    // NO guardar en base de datos - solo devolver el resultado
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
                    console.log(`❌ No se encontraron códigos recientes en Gmail para: ${email}`);
                    res.status(404).json({ error: 'No se encontraron códigos de verificación recientes asociados a este correo electrónico' });
                    return;
                }
            } catch (error) {
                console.log('⚠️ Error buscando en Gmail:', error.message);
                console.log('⚠️ Error completo:', error);
                res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
                return;
            }
        } else {
            console.log('❌ El lector de correos no está conectado');
            console.log('❌ gmail:', !!emailReader.gmail);
            console.log('❌ isRunning:', emailReader.isRunning);
            res.status(404).json({ error: 'El servicio de búsqueda de correos no está disponible en este momento' });
            return;
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

// Actualizar estado de un código
app.put('/api/codigos/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        if (!['activo', 'usado', 'expirado'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        await db.actualizarEstado(id, estado);
        res.json({ message: 'Estado actualizado correctamente' });
        
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Limpiar códigos antiguos
app.delete('/api/admin/limpiar', async (req, res) => {
    try {
        const resultado = await db.limpiarCodigosAntiguos();
        res.json({ 
            message: `Se eliminaron ${resultado.deleted} códigos antiguos` 
        });
    } catch (error) {
        console.error('Error limpiando códigos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar estado del servicio
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        emailReader: emailReader.isRunning,
        readerType: 'Gmail API',
        timestamp: new Date().toISOString()
    });
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`🔧 Usando Gmail API (multi-idioma)`);
    
    // Iniciar el lector de correos inmediatamente
    setTimeout(() => {
        console.log('📧 Iniciando lector de correos con Gmail API...');
        emailReader.iniciar();
    }, 1000);
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
