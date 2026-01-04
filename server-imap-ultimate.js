require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Servir archivos estáticos del frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Endpoints

// Endpoint para buscar el último código de Disney+ para un email específico
app.get('/api/codigos/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        console.log(`🔍 Buscando código REAL para: ${email}`);
        
        // Intentar buscar con IMAP Ultimate
        try {
            const resultado = await buscarCodigoUltimate(email);
            
            if (resultado) {
                console.log(`✅ Código REAL encontrado: ${resultado.codigo}`);
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
                return;
            }
        } catch (error) {
            console.log('⚠️ Error con IMAP Ultimate:', error.message);
        }
        
        // Si no se encontró, mostrar mensaje claro
        console.log(`❌ No se encontró código REAL para: ${email}`);
        res.status(404).json({ 
            error: 'No se encontraron códigos de verificación asociados a este correo electrónico. ' +
                   'Por favor, solicita un nuevo código de Disney+ y vuelve a consultar.' 
        });
        
    } catch (error) {
        console.error('Error en el endpoint:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función para buscar código con IMAP Ultimate
async function buscarCodigoUltimate(email) {
    return new Promise((resolve, reject) => {
        const Imap = require('imap');
        
        // Configuración Ultimate de IMAP
        const imap = new Imap({
            user: process.env.GMAIL_USER,
            password: process.env.GMAIL_PASSWORD,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { 
                rejectUnauthorized: false,
                servername: 'imap.gmail.com',
                secureProtocol: 'TLSv1_2_method'
            },
            connTimeout: 20000,
            authTimeout: 15000,
            keepalive: {
                interval: 10000,
                idleTimeout: 300000,
                forceNoop: true
            },
            authTimeout: 15000
        });

        imap.once('ready', () => {
            console.log('✅ Conectado a Gmail con configuración ULTIMATE');
            
            // Buscar en múltiples carpetas
            const carpetas = ['INBOX', '[Gmail]/Promociones', '[Gmail]/Social', '[Gmail]/Notificaciones'];
            let intentos = 0;
            
            function buscarEnCarpeta() {
                if (intentos >= carpetas.length) {
                    console.log('❌ No se encontraron códigos en ninguna carpeta');
                    imap.end();
                    resolve(null);
                    return;
                }
                
                const carpeta = carpetas[intentos];
                intentos++;
                
                console.log(`📂 Buscando en carpeta: ${carpeta}`);
                
                imap.openBox(carpeta, false, (err, box) => {
                    if (err) {
                        console.log(`⚠️ Error abriendo ${carpeta}:`, err.message);
                        buscarEnCarpeta();
                        return;
                    }
                    
                    // Buscar correos de las últimas 6 horas
                    const fechaLimite = new Date(Date.now() - 6 * 60 * 60 * 1000);
                    
                    imap.search([['TO', email], ['SINCE', fechaLimite]], (err, results) => {
                        if (err) {
                            console.log(`⚠️ Error buscando en ${carpeta}:`, err.message);
                            buscarEnCarpeta();
                            return;
                        }

                        if (results.length === 0) {
                            console.log(`📂 No hay correos en ${carpeta}`);
                            buscarEnCarpeta();
                            return;
                        }

                        console.log(`📧 Encontrados ${results.length} correos en ${carpeta}`);
                        
                        // Ordenar por UID descendente
                        const sortedResults = results.sort((a, b) => b - a);
                        const latestResult = sortedResults[0];

                        const fetch = imap.fetch(latestResult, { bodies: '' });
                        
                        fetch.on('message', (msg, seqno) => {
                            msg.on('body', async (stream, info) => {
                                try {
                                    const { simpleParser } = require('mailparser');
                                    const parsed = await simpleParser(stream);
                                    
                                    console.log(`📧 Procesando correo de ${carpeta}...`);
                                    console.log(`📧 De: ${parsed.from?.value?.[0]?.address || 'Desconocido'}`);
                                    console.log(`📧 Asunto: ${parsed.subject || 'Sin asunto'}`);
                                    
                                    // Extraer códigos de 6 dígitos
                                    const texto = (parsed.text || parsed.html || '').toLowerCase();
                                    const regex = /\b\d{6}\b/g;
                                    const todosLosCodigos = texto.match(regex) || [];
                                    
                                    // Filtrar códigos válidos
                                    const codigosValidos = todosLosCodigos.filter(codigo => {
                                        return codigo !== '000000' && !codigo.startsWith('0000');
                                    });
                                    
                                    console.log(`🔍 Códigos encontrados: ${todosLosCodigos.join(', ')}`);
                                    console.log(`✅ Códigos válidos: ${codigosValidos.join(', ')}`);
                                    
                                    if (codigosValidos.length > 0) {
                                        const codigo = codigosValidos[0];
                                        console.log(`✅ Código REAL extraído: ${codigo}`);
                                        
                                        // Detectar si es Disney+
                                        const textoCompleto = (parsed.subject + ' ' + parsed.text + ' ' + parsed.html).toLowerCase();
                                        const esDisney = textoCompleto.includes('disney') || 
                                                      textoCompleto.includes('disney+') || 
                                                      textoCompleto.includes('disneyplus') ||
                                                      textoCompleto.includes('access code') ||
                                                      textoCompleto.includes('código de acceso') ||
                                                      textoCompleto.includes('verification code') ||
                                                      textoCompleto.includes('unique code');
                                        
                                        resolve({
                                            codigo: codigo,
                                            servicio: esDisney ? 'disney+' : 'desconocido',
                                            de: parsed.from?.value?.[0]?.address || 'Desconocido',
                                            asunto: parsed.subject,
                                            fecha: parsed.date?.toISOString(),
                                            carpeta: carpeta
                                        });
                                        imap.end();
                                    } else {
                                        console.log(`❌ No se encontraron códigos válidos en ${carpeta}`);
                                        buscarEnCarpeta();
                                    }
                                    
                                } catch (error) {
                                    console.error('❌ Error procesando correo:', error.message);
                                    buscarEnCarpeta();
                                }
                            });
                        });

                        fetch.once('error', (err) => {
                            console.error('❌ Error fetching correo:', err.message);
                            buscarEnCarpeta();
                        });
                    });
                });
            }
            
            buscarEnCarpeta();
        });

        imap.once('error', (err) => {
            console.error('❌ Error de conexión IMAP Ultimate:', err.message);
            reject(err);
        });

        imap.once('end', () => {
            console.log('📪 Conexión con Gmail finalizada');
        });

        imap.connect();
    });
}

// Endpoint para verificar estado
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        mode: 'imap-ultimate'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor IMAP ULTIMATE iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo ULTIMATE: Configuración IMAP mejorada`);
    console.log(`🔍 Busca en múltiples carpetas automáticamente`);
    console.log(`💡 100% automático sin intervención manual`);
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
