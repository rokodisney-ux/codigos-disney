const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Database = require('./database');

class EmailReader {
    constructor() {
        this.imap = null;
        this.isRunning = false;
        this.db = new Database();
    }

    // Configuración IMAP optimizada
    getImapConfig() {
        return {
            user: process.env.GMAIL_USER,
            password: process.env.GMAIL_PASS,
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(process.env.IMAP_PORT) || 993,
            tls: true,
            tlsOptions: { 
                rejectUnauthorized: false,
                servername: 'imap.gmail.com'
            },
            connTimeout: 30000,
            authTimeout: 30000,
            keepalive: {
                interval: 10000,
                idleTimeout: 300000,
                forceNoop: true
            }
        };
    }

    // Extraer códigos de Disney+ (multi-idioma)
    extraerCodigosDisney(cuerpo, asunto) {
        if (!cuerpo && !asunto) return [];
        
        const textoCompleto = `${cuerpo || ''} ${asunto || ''}`.toLowerCase();
        
        // Palabras clave en múltiples idiomas
        const disneyKeywords = [
            'disney+', 'disney plus', 'código', 'codigo', 'verificación', 'verificacion',
            'code', 'verification', 'verify', 'vérification', 'vérifiez',
            'code', 'verifizierung', 'überprüfen', 'kod', 'verifiering',
            'access code', 'unique access code', 'engångskod', 'zugangscode',
            "code d'accès", 'toegangscode', 'código de acesso', 'codigo de acesso'
        ];
        
        // Verificar si es un correo de Disney+
        const esDisney = disneyKeywords.some(keyword => textoCompleto.includes(keyword));
        
        if (!esDisney) return [];
        
        // Buscar códigos de 6 dígitos
        const regex = /\b\d{6}\b/g;
        const codigos = textoCompleto.match(regex) || [];
        
        // Filtrar códigos válidos
        return codigos.filter(codigo => 
            codigo !== '000000' && 
            !codigo.startsWith('0000') &&
            !codigo.startsWith('1111') &&
            !codigo.startsWith('2222') &&
            !codigo.startsWith('3333') &&
            !codigo.startsWith('4444') &&
            !codigo.startsWith('5555') &&
            !codigo.startsWith('6666') &&
            !codigo.startsWith('7777') &&
            !codigo.startsWith('8888') &&
            !codigo.startsWith('9999')
        );
    }

    // Procesar email y extraer información
    async procesarEmail(parsed) {
        try {
            const from = parsed.from?.value?.[0]?.address || '';
            const to = parsed.to?.value?.[0]?.address || '';
            const subject = parsed.subject || '';
            const body = parsed.text || '';
            const fecha = parsed.date || new Date();
            
            const dominio = to.split('@')[1] || '';
            
            // Solo procesar si es para los dominios permitidos
            if (!dominio.includes('rokotv.xyz') && !dominio.includes('rokostream.com')) {
                return null;
            }

            // Extraer códigos de Disney+
            const codigos = this.extraerCodigosDisney(body, subject);
            
            if (codigos.length > 0) {
                const servicio = 'disney+';
                
                console.log(`📧 Correo para: ${to}`);
                console.log(`📧 De: ${from}`);
                console.log(`🔍 Códigos encontrados: ${codigos.join(', ')}`);
                console.log(`📺 Servicio detectado: ${servicio}`);
                console.log(`📅 Fecha: ${fecha}`);
                console.log('---');

                return { 
                    codigos: codigos, 
                    servicio: servicio, 
                    to: to 
                };
            }
        } catch (error) {
            console.error('Error procesando email:', error);
        }
        
        return null;
    }

    // Iniciar la conexión
    async iniciar() {
        if (this.isRunning) {
            console.log('⚠️  El lector de correos ya está en ejecución');
            return;
        }

        try {
            console.log('🔗 Conectando a Gmail...');
            
            this.imap = new Imap(this.getImapConfig());

            this.imap.once('ready', () => {
                console.log('✅ Conectado a Gmail exitosamente');
                this.isRunning = true;
                this.abrirBandejaEntrada();
            });

            this.imap.once('error', (err) => {
                console.error('❌ Error de conexión IMAP:', err.message);
                this.isRunning = false;
            });

            this.imap.once('end', () => {
                console.log('📪 Conexión con Gmail finalizada');
                this.isRunning = false;
            });

            this.imap.connect();

        } catch (error) {
            console.error('❌ Error al iniciar el lector de correos:', error.message);
            this.isRunning = false;
        }
    }

    // Abrir y monitorear la bandeja de entrada
    abrirBandejaEntrada() {
        this.imap.openBox('INBOX', false, (err, box) => {
            if (err) {
                console.error('❌ Error al abrir INBOX:', err);
                return;
            }

            console.log(`📬 Bandeja de entrada abierta. Mensajes totales: ${box.messages.total}`);
            console.log('🎯 Sistema listo para detectar correos NUEVOS en tiempo real');
            console.log('⚠️ NO procesando correos antiguos - solo correos nuevos');
            console.log('🔍 Solo códigos válidos (excluyendo 000000)');

            // Configurar listener para nuevos correos
            this.imap.on('mail', (numNewMsgs) => {
                console.log(`📨 ${numNewMsgs} nuevo(s) correo(s) recibido(s) - PROCESANDO EN VIVO`);
                setTimeout(() => {
                    this.buscarCorreosNoLeidos();
                }, 2000);
            });
        });
    }

    // Buscar el último correo para un email específico (búsqueda completa)
    async buscarUltimoCorreo(email) {
        if (!this.imap || !this.isRunning) {
            throw new Error('El lector de correos no está conectado');
        }

        console.log(`🔍 Buscando último correo para: ${email}`);
        
        return new Promise((resolve, reject) => {
            // Búsqueda: últimas 20 minutos (códigos válidos de Disney+)
            const fechaLimite = new Date(Date.now() - 20 * 60 * 1000);
            const searchCriteria = [
                ['SINCE', fechaLimite],
                ['TO', email]
            ];

            // Buscar en TODAS las carpetas disponibles
            this.imap.getBoxes((err, boxes) => {
                if (err) {
                    console.log('❌ Error obteniendo carpetas:', err);
                    resolve(null);
                    return;
                }

                console.log(`📁 Carpetas disponibles:`, Object.keys(boxes));
                
                // Buscar recursivamente en todas las carpetas
                this.buscarEnTodasLasCarpetas(boxes, searchCriteria, email, resolve);
            });
        });
    }

    // Buscar recursivamente en todas las carpetas
    buscarEnTodasLasCarpetas(boxes, searchCriteria, email, resolve, index = 0) {
        const carpetas = Object.keys(boxes);
        
        if (index >= carpetas.length) {
            console.log(`📭 No hay correos recientes (20 min) en ninguna carpeta para: ${email}`);
            resolve(null);
            return;
        }

        const carpeta = carpetas[index];
        
        // Omitir [Gmail] porque es una carpeta contenedora
        if (carpeta === '[Gmail]') {
            console.log(`⏭️ Omitiendo carpeta contenedora: ${carpeta}`);
            this.buscarEnTodasLasCarpetas(boxes, searchCriteria, email, resolve, index + 1);
            return;
        }
        
        console.log(`🔍 Buscando en carpeta ${index + 1}/${carpetas.length}: ${carpeta}`);

        this.buscarEnCarpeta(carpeta, searchCriteria, email, resolve, () => {
            // Si no encuentra en esta carpeta, continuar con la siguiente
            this.buscarEnTodasLasCarpetas(boxes, searchCriteria, email, resolve, index + 1);
        });
    }

    // Buscar en una carpeta específica
    buscarEnCarpeta(carpeta, searchCriteria, email, resolve, callback) {
        this.imap.openBox(carpeta, false, (err, box) => {
            if (err) {
                console.log(`⚠️ No se pudo abrir ${carpeta}: ${err.message}`);
                callback();
                return;
            }

            console.log(`🔍 Buscando en ${carpeta} (20 minutos) para: ${email}`);

            this.imap.search(searchCriteria, (err, results) => {
                if (err) {
                    console.log(`⚠️ Error buscando en ${carpeta}: ${err.message}`);
                    callback();
                    return;
                }

                if (!results || results.length === 0) {
                    console.log(`📭 No hay correos en ${carpeta} para: ${email}`);
                    callback();
                    return;
                }

                console.log(`📧 Encontrados ${results.length} correos en ${carpeta} para ${email}`);

                // Ordenar por UID descendente y tomar el MÁS RECIENTE
                const sortedResults = results.sort((a, b) => b - a);
                const latestResult = sortedResults[0];
                
                console.log(`🔍 Procesando correo más reciente de ${carpeta}`);
                
                // Descargar y procesar el correo más reciente
                const fetch = this.imap.fetch(latestResult, { bodies: '' });
                
                fetch.on('message', (msg, seqno) => {
                    msg.on('body', async (stream, info) => {
                        try {
                            const parsed = await simpleParser(stream);
                            
                            const cuerpo = parsed.text || '';
                            const asunto = parsed.subject || '';
                            const codigos = this.extraerCodigosDisney(cuerpo, asunto);
                            
                            if (codigos.length > 0) {
                                console.log(`✅ Código encontrado para ${email} en ${carpeta}: ${codigos[0]}`);
                                resolve({ 
                                    codigos: codigos, 
                                    servicio: 'disney+',
                                    to: email
                                });
                                return;
                            } else {
                                console.log(`📧 Correo más reciente en ${carpeta} no tiene código válido`);
                                callback();
                            }
                            
                        } catch (error) {
                            console.log(`⚠️ Error procesando correo en ${carpeta}: ${error.message}`);
                            callback();
                        }
                    });
                });

                fetch.once('error', (err) => {
                    console.log(`⚠️ Error fetching en ${carpeta}: ${err.message}`);
                    callback();
                });
            });
        });
    }

    // Buscar correos no leídos
    buscarCorreosNoLeidos() {
        const fechaLimite = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const searchCriteria = ['UNSEEN', ['SINCE', fechaLimite], ['OR', 
            ['TO', '@rokotv.xyz'], 
            ['TO', '@rokostream.com']
        ]];

        this.imap.search(searchCriteria, (err, results) => {
            if (err) {
                console.error('❌ Error en búsqueda:', err);
                return;
            }

            if (results.length === 0) {
                console.log('📭 No hay correos nuevos para los dominios especificados');
                return;
            }

            console.log(`📧 Encontrados ${results.length} correos nuevos para procesar`);

            const fetch = this.imap.fetch(results, { bodies: '' });
            
            fetch.on('message', (msg, seqno) => {
                msg.on('body', async (stream, info) => {
                    try {
                        const parsed = await simpleParser(stream);
                        await this.procesarEmail(parsed);
                        
                        // Marcar como leído
                        this.imap.setFlags(seqno, ['\\Seen'], (err) => {
                            if (err) console.error('Error marcando como leído:', err);
                        });
                        
                    } catch (error) {
                        console.error('Error procesando mensaje:', error);
                    }
                });
            });

            fetch.once('error', (err) => {
                console.error('❌ Error en fetch:', err);
            });
        });
    }

    // Detener el lector de correos
    detener() {
        if (this.imap) {
            this.imap.end();
            this.isRunning = false;
            console.log('🛑 Lector de correos detenido');
        }
    }
}

module.exports = EmailReader;
