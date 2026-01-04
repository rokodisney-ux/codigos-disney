require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

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
        
        console.log(`🔍 Buscando código real para: ${email}`);
        
        // Intentar buscar usando Gmail API con OAuth2
        try {
            const resultado = await buscarCodigoConGmailAPI(email);
            
            if (resultado) {
                console.log(`✅ Código encontrado: ${resultado.codigo}`);
                
                res.json({
                    email: email,
                    codigo: resultado.codigo,
                    servicio: resultado.servicio || 'disney+',
                    mensaje: 'Código encontrado en tiempo real',
                    asunto: resultado.asunto || 'Código de Disney+',
                    fecha_envio: resultado.fecha || new Date().toISOString(),
                    dominio: email.split('@')[1],
                    estado: 'nuevo'
                });
            } else {
                console.log(`❌ No se encontró código para: ${email}`);
                res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
            }
        } catch (error) {
            console.log('⚠️ Error con Gmail API, intentando método alternativo:', error.message);
            
            // Método alternativo: buscar con IMAP simplificado
            const resultado = await buscarCodigoConIMAP(email);
            
            if (resultado) {
                console.log(`✅ Código encontrado con IMAP: ${resultado.codigo}`);
                
                res.json({
                    email: email,
                    codigo: resultado.codigo,
                    servicio: resultado.servicio || 'disney+',
                    mensaje: 'Código encontrado en tiempo real',
                    asunto: resultado.asunto || 'Código de Disney+',
                    fecha_envio: resultado.fecha || new Date().toISOString(),
                    dominio: email.split('@')[1],
                    estado: 'nuevo'
                });
            } else {
                console.log(`❌ No se encontró código con ningún método para: ${email}`);
                res.status(404).json({ error: 'No se encontraron códigos de verificación asociados a este correo electrónico' });
            }
        }
        
    } catch (error) {
        console.error('Error en el endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función para buscar con Gmail API (requiere configuración OAuth2)
async function buscarCodigoConGmailAPI(email) {
    // Esta función requeriría configuración OAuth2 completa
    // Por ahora, retornamos null para que use el método alternativo
    return null;
}

// Función para buscar con IMAP simplificado
async function buscarCodigoConIMAP(email) {
    return new Promise((resolve, reject) => {
        const Imap = require('imap');
        
        const imap = new Imap({
            user: process.env.GMAIL_USER,
            password: process.env.GMAIL_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 10000,
            authTimeout: 5000
        });

        imap.once('ready', () => {
            console.log('✅ Conectado a Gmail');
            
            // Buscar correos recientes para el email
            const fechaLimite = new Date(Date.now() - 2 * 60 * 60 * 1000);
            imap.search([['TO', email], ['SINCE', fechaLimite]], (err, results) => {
                if (err) {
                    console.error('Error buscando correos:', err);
                    imap.end();
                    resolve(null);
                    return;
                }

                if (results.length === 0) {
                    console.log('No se encontraron correos recientes');
                    imap.end();
                    resolve(null);
                    return;
                }

                console.log(`Encontrados ${results.length} correos, procesando el más reciente...`);
                
                // Ordenar por UID descendente y tomar el más reciente
                const sortedResults = results.sort((a, b) => b - a);
                const latestResult = sortedResults[0];

                const fetch = imap.fetch(latestResult, { bodies: '' });
                
                fetch.on('message', (msg, seqno) => {
                    msg.on('body', async (stream, info) => {
                        try {
                            const simpleParser = require('mailparser');
                            const parsed = await simpleParser(stream);
                            
                            // Extraer códigos de 6 dígitos
                            const texto = (parsed.text || parsed.html || '').toLowerCase();
                            const regex = /\b\d{6}\b/g;
                            const codigos = texto.match(regex) || [];
                            
                            // Filtrar códigos válidos
                            const codigosValidos = codigos.filter(codigo => 
                                codigo !== '000000' && !codigo.startsWith('0000')
                            );
                            
                            if (codigosValidos.length > 0) {
                                const codigo = codigosValidos[0];
                                console.log(`✅ Código extraído: ${codigo}`);
                                
                                resolve({
                                    codigo: codigo,
                                    servicio: 'disney+',
                                    asunto: parsed.subject,
                                    fecha: parsed.date?.toISOString()
                                });
                            } else {
                                console.log('No se encontraron códigos válidos en el correo');
                                resolve(null);
                            }
                            
                            imap.end();
                        } catch (error) {
                            console.error('Error procesando correo:', error);
                            imap.end();
                            resolve(null);
                        }
                    });
                });

                fetch.once('error', (err) => {
                    console.error('Error fetching correo:', err);
                    imap.end();
                    resolve(null);
                });
            });
        });

        imap.once('error', (err) => {
            console.error('Error de conexión IMAP:', err.message);
            reject(err);
        });

        imap.connect();
    });
}

// Endpoint para verificar estado del servicio
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        mode: 'gmail-real'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor GMAIL REAL iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo real: Busca códigos reales en Gmail`);
    console.log(`🔧 Intentando múltiples métodos de conexión`);
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
