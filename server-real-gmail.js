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
        
        console.log(`🔍 Buscando código REAL para: ${email}`);
        
        // Intentar buscar en Gmail con la nueva contraseña
        try {
            const resultado = await buscarCodigoRealEnGmail(email);
            
            if (resultado) {
                console.log(`✅ Código REAL encontrado: ${resultado.codigo}`);
                console.log(`📧 De: ${resultado.de}`);
                console.log(`📧 Asunto: ${resultado.asunto}`);
                
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
            console.log('⚠️ Error buscando en Gmail:', error.message);
        }
        
        // Si no se encontró en Gmail, mostrar mensaje claro
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

// Función para buscar código REAL en Gmail
async function buscarCodigoRealEnGmail(email) {
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
            authTimeout: 8000
        });

        imap.once('ready', () => {
            console.log('✅ Conectado a Gmail con nueva contraseña');
            
            // Buscar correos de las últimas 2 horas
            const fechaLimite = new Date(Date.now() - 2 * 60 * 60 * 1000);
            
            imap.search([['TO', email], ['SINCE', fechaLimite]], (err, results) => {
                if (err) {
                    console.error('❌ Error buscando correos:', err.message);
                    imap.end();
                    resolve(null);
                    return;
                }

                if (results.length === 0) {
                    console.log('❌ No se encontraron correos recientes');
                    imap.end();
                    resolve(null);
                    return;
                }

                console.log(`📧 Encontrados ${results.length} correos, procesando el más reciente...`);
                
                // Ordenar por UID descendente y tomar el más reciente
                const sortedResults = results.sort((a, b) => b - a);
                const latestResult = sortedResults[0];

                const fetch = imap.fetch(latestResult, { bodies: '' });
                
                fetch.on('message', (msg, seqno) => {
                    msg.on('body', async (stream, info) => {
                        try {
                            const simpleParser = require('mailparser');
                            const parsed = await simpleParser(stream);
                            
                            console.log(`📧 Procesando correo...`);
                            console.log(`📧 De: ${parsed.from?.value?.[0]?.address || 'Desconocido'}`);
                            console.log(`📧 Para: ${parsed.to?.value?.[0]?.address || 'Desconocido'}`);
                            console.log(`📧 Asunto: ${parsed.subject || 'Sin asunto'}`);
                            
                            // Extraer códigos de 6 dígitos
                            const texto = (parsed.text || parsed.html || '').toLowerCase();
                            const regex = /\b\d{6}\b/g;
                            const todosLosCodigos = texto.match(regex) || [];
                            
                            // Filtrar y excluir 000000 y códigos inválidos
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
                                    fecha: parsed.date?.toISOString()
                                });
                            } else {
                                console.log('❌ No se encontraron códigos válidos de 6 dígitos');
                                resolve(null);
                            }
                            
                            imap.end();
                        } catch (error) {
                            console.error('❌ Error procesando correo:', error.message);
                            imap.end();
                            resolve(null);
                        }
                    });
                });

                fetch.once('error', (err) => {
                    console.error('❌ Error fetching correo:', err.message);
                    imap.end();
                    resolve(null);
                });
            });
        });

        imap.once('error', (err) => {
            console.error('❌ Error de conexión IMAP:', err.message);
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
        mode: 'real-gmail-detection'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor REAL GMAIL iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo REAL: Detecta códigos REALES en Gmail`);
    console.log(`🔍 Cada consulta busca el código más reciente que llegó`);
    console.log(`💡 Sin códigos predeterminados`);
    console.log(`🔐 Usando nueva contraseña de aplicación`);
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
