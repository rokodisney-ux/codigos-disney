const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Database = require('./database');

class EmailReader {
    constructor() {
        this.db = new Database();
        this.imap = null;
        this.isRunning = false;
    }

    // Configuración de conexión IMAP para Gmail con reintentos
    getImapConfig() {
        return {
            user: process.env.GMAIL_USER,
            password: process.env.GMAIL_PASSWORD,
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: parseInt(process.env.IMAP_PORT) || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 60000, // 60 segundos
            authTimeout: 30000,  // 30 segundos
            keepalive: {
                interval: 10000, // 10 segundos
                idleTimeout: 300000, // 5 minutos
                forceNoop: true
            }
        };
    }

    // Detectar Disney+ en múltiples idiomas y extraer códigos
    extraerCodigosDisney(texto, asunto) {
        if (!texto && !asunto) return [];
        
        const textoCompleto = (texto + ' ' + asunto).toLowerCase();
        
        // Palabras clave de Disney+ en múltiples idiomas
        const disneyKeywords = [
            // Español
            'disney+', 'disney plus', 'código', 'codigo', 'verificación', 'verificacion',
            'ingresa', 'ingresar', 'accede', 'acceder', 'tu código', 'tu codigo',
            // Inglés
            'disney+', 'disney plus', 'code', 'verification', 'verify', 'enter',
            'sign in', 'log in', 'your code', 'access', 'authenticate',
            // Francés
            'disney+', 'disney plus', 'code', 'vérification', 'vérifiez', 'votre code',
            'accédez', 'connectez', 'authentifiez', 'entrez',
            // Alemán
            'disney+', 'disney plus', 'code', 'verifizierung', 'überprüfen', 'ihr code',
            'zugang', 'anmelden', 'einloggen', 'authentifizieren',
            // Sueco
            'disney+', 'disney plus', 'kod', 'verifiering', 'verifiera', 'din kod',
            'logga in', 'access', 'autentisera', 'ange'
        ];
        
        // Verificar si es un correo de Disney+ en cualquier idioma
        const esDisneyCorreo = disneyKeywords.some(keyword => 
            textoCompleto.includes(keyword.toLowerCase())
        );
        
        if (!esDisneyCorreo) {
            return [];
        }
        
        // Extraer todos los códigos de 6 dígitos
        const regex = /\b\d{6}\b/g;
        const todosLosCodigos = (texto + ' ' + asunto).match(regex) || [];
        
        // Filtrar códigos válidos (excluir patrones conocidos inválidos)
        const codigosValidos = todosLosCodigos.filter(codigo => {
            return codigo !== '000000' && 
                   !codigo.startsWith('0000') && 
                   !codigo.startsWith('1111') &&
                   !codigo.startsWith('9999');
        });
        
        console.log(`🔍 Detección multi-idioma: ${esDisneyCorreo ? '✅ Disney+' : '❌ No Disney+'}`);
        console.log(`🔍 Códigos encontrados: ${codigosValidos.length > 0 ? codigosValidos.join(', ') : 'Ninguno'}`);
        
        return codigosValidos;
    }

    // Detectar el servicio basado en el contenido del correo (múltiples idiomas principales)
    detectarServicio(asunto, cuerpo, from) {
        const texto = (asunto + ' ' + cuerpo + ' ' + from).toLowerCase();
        
        // Palabras clave de Disney+ en idiomas principales
        const disneyKeywords = [
            // Español
            'disney', 'disney+', 'disneyplus', 'disney plus',
            'código de acceso', 'código único', 'codigo de acceso', 'codigo unico',
            'tu código de acceso único', 'tu codigo de acceso unico',
            'verificar', 'verificación', 'mydisney', 'my disney',
            
            // Inglés
            'disney', 'disney+', 'disneyplus', 'disney plus',
            'access code', 'unique code', 'verification code', 'verify code',
            'your unique access code', 'your access code', 'verification',
            'mydisney', 'my disney',
            
            // SUECO
            'disney', 'disney+', 'disneyplus', 'disney plus',
            'engångskod', 'din engångskod', 'verifiera', 'mydisney',
            
            // Alemán
            'disney', 'disney+', 'disneyplus', 'disney plus',
            'zugangscode', 'einzigartiger code', 'verifizierungscode',
            'ihr einzigartiger zugangscode', 'überprüfen', 'mydisney',
            
            // Francés
            'disney', 'disney+', 'disneyplus', 'disney plus',
            'code d\'accès', 'code unique', 'code de vérification',
            'votre code d\'accès unique', 'vérifier', 'mydisney',
            
            // Holandés
            'disney', 'disney+', 'disneyplus', 'disney plus',
            'toegangscode', 'unieke code', 'verificatiecode',
            'uw unieke toegangscode', 'verifiëren', 'mydisney'
        ];
        
        // Detectar si es Disney+ en cualquier idioma principal
        if (disneyKeywords.some(keyword => texto.includes(keyword)) || 
            texto.includes('@disney') && texto.includes('.com')) {
            return 'disney+';
        }
        
        return 'desconocido';
    }

    // Procesar un correo electrónico (simplificado)
    async procesarEmail(msg) {
        try {
            const asunto = msg.subject || '';
            const cuerpo = msg.text || msg.html || '';
            const to = msg.to?.value?.[0]?.address || '';
            const from = msg.from?.value?.[0]?.address || '';
            const fecha = msg.date || new Date();

            // Extraer el dominio del destinatario
            const dominio = to.split('@')[1] || '';
            
            // Solo procesar si es para los dominios permitidos
            if (!dominio.includes('rokotv.xyz') && !dominio.includes('rokostream.com')) {
                return null;
            }

            // Extraer códigos de 6 dígitos
            const codigos = this.extraerCodigos(cuerpo);

            if (codigos.length > 0) {
                // Detectar servicio (simplificado)
                const servicio = this.detectarServicio(asunto, cuerpo, from);
                
                console.log(`📧 Correo para: ${to}`);
                console.log(`📧 De: ${from}`);
                console.log(`🔍 Códigos encontrados: ${codigos.join(', ')}`);
                console.log(`📺 Servicio detectado: ${servicio}`);
                console.log(`📅 Fecha: ${fecha}`);
                console.log('---');

                // Guardar cada código encontrado
                for (const codigo of codigos) {
                    await this.db.guardarCodigo(
                        to,  // Usar el destinatario como email
                        codigo,  // El código es solo el string
                        servicio,  // El servicio detectado
                        asunto,  // El asunto del correo
                        asunto,  // El mensaje
                        fecha.toISOString(),  // La fecha del correo
                        dominio,  // El dominio
                        'nuevo'  // Estado inicial
                    );
                }

                return { codigos, servicio, to };
            }
        } catch (error) {
            console.error('Error procesando email:', error);
        }
        
        return null;
    }

    // Iniciar la conexión y monitoreo (modo seguro)
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
                // No reiniciar automáticamente para no afectar al servidor
            });

            this.imap.once('end', () => {
                console.log('📪 Conexión con Gmail finalizada');
                this.isRunning = false;
                // No reiniciar automáticamente para no afectar al servidor
            });

            this.imap.connect();

        } catch (error) {
            console.error('❌ Error al iniciar el lector de correos:', error.message);
            this.isRunning = false;
            // No lanzar el error para no afectar al servidor
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
                }, 2000); // Esperar 2 segundos para que el correo esté completamente disponible
            });
        });
    }

    // Buscar el último correo para un email específico (conexión bajo demanda)
    async buscarUltimoCorreoDirecto(email) {
        // Buscar correos de las últimas 2 horas
        const fechaLimite = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const searchCriteria = [
            ['SINCE', fechaLimite],
            ['OR', 
                ['SUBJECT', 'código de acceso único para Disney+'],
                ['SUBJECT', 'codigo de acceso unico para Disney+'],
                ['SUBJECT', 'access code for Disney+'],
                ['SUBJECT', 'unique access code for Disney+'],
                ['SUBJECT', 'engångskod för Disney+'],
                ['SUBJECT', 'zugangscode für Disney+'],
                ['SUBJECT', "code d'accès unique pour Disney+"],
                ['SUBJECT', 'toegangscode voor Disney+'],
                ['SUBJECT', 'Disney+'],
                ['SUBJECT', 'Disney'],
                ['SUBJECT', 'disney+'],
                ['SUBJECT', 'disney']
            ]
        ];

        return new Promise((resolve, reject) => {
            // Crear conexión IMAP temporal
            const imap = new (require('imap'))(this.getImapConfig());
            
            imap.once('ready', () => {
                console.log('✅ Conectado a Gmail para búsqueda directa');
                
                // Buscar en INBOX primero
                this.buscarEnBandejaPorAsuntoDirecto(imap, 'INBOX', searchCriteria, email)
                    .then(resultado => {
                        if (resultado) {
                            console.log(`✅ Encontrado en INBOX para: ${email}`);
                            imap.end();
                            resolve(resultado);
                        } else {
                            // Si no hay en INBOX, buscar en Promociones
                            this.buscarEnBandejaPorAsuntoDirecto(imap, '[Gmail]/Promociones', searchCriteria, email)
                                .then(resultado => {
                                    if (resultado) {
                                        console.log(`✅ Encontrado en Promociones para: ${email}`);
                                        imap.end();
                                        resolve(resultado);
                                    } else {
                                        // Si no hay en Promociones, buscar en Social
                                        this.buscarEnBandejaPorAsuntoDirecto(imap, '[Gmail]/Social', searchCriteria, email)
                                            .then(resultado => {
                                                if (resultado) {
                                                    console.log(`✅ Encontrado en Social para: ${email}`);
                                                    imap.end();
                                                    resolve(resultado);
                                                } else {
                                                    // Si no hay en Social, buscar en Notificaciones
                                                    this.buscarEnBandejaPorAsuntoDirecto(imap, '[Gmail]/Notificaciones', searchCriteria, email)
                                                        .then(resultado => {
                                                            if (resultado) {
                                                                console.log(`✅ Encontrado en Notificaciones para: ${email}`);
                                                                imap.end();
                                                                resolve(resultado);
                                                            } else {
                                                                console.log(`❌ No se encontró código para: ${email}`);
                                                                imap.end();
                                                                resolve(null);
                                                            }
                                                        })
                                                        .catch(error => {
                                                            imap.end();
                                                            resolve(null);
                                                        });
                                                }
                                            })
                                            .catch(error => {
                                                imap.end();
                                                resolve(null);
                                            });
                                    }
                                })
                                .catch(error => {
                                    imap.end();
                                    resolve(null);
                                });
                        }
                    })
                    .catch(error => {
                        imap.end();
                        resolve(null);
                    });
            });

            imap.once('error', (err) => {
                console.error('❌ Error de conexión IMAP:', err.message);
                reject(err);
            });

            imap.connect();
        });
    }

    // Buscar en una bandeja específica por asunto (conexión directa)
    async buscarEnBandejaPorAsuntoDirecto(imap, bandeja, searchCriteria, email) {
        return new Promise((resolve, reject) => {
            // Timeout de 5 segundos
            const timeout = setTimeout(() => {
                console.log(`⏰ Timeout en ${bandeja}`);
                resolve(null);
            }, 5000);

            imap.openBox(bandeja, false, (err, box) => {
                if (err) {
                    clearTimeout(timeout);
                    console.log(`⚠️ No se pudo abrir ${bandeja}: ${err.message}`);
                    resolve(null);
                    return;
                }

                console.log(`🔍 Buscando en ${bandeja} por asunto Disney+`);

                imap.search(searchCriteria, (err, results) => {
                    clearTimeout(timeout);
                    
                    if (err) {
                        console.log(`⚠️ Error buscando en ${bandeja}: ${err.message}`);
                        resolve(null);
                        return;
                    }

                    if (results.length === 0) {
                        console.log(`📧 No hay correos con asunto Disney+ en ${bandeja}`);
                        resolve(null);
                        return;
                    }

                    console.log(`📧 Encontrados ${results.length} correos con asunto Disney+ en ${bandeja}`);

                    // Ordenar por UID descendente para obtener el MÁS RECIENTE
                    const sortedResults = results.sort((a, b) => b - a);
                    
                    // Buscar el primer correo que sea para el email correcto
                    let found = false;
                    let index = 0;
                    
                    const checkNextEmail = () => {
                        if (index >= sortedResults.length) {
                            console.log(`📧 Ningún correo es para ${email} en ${bandeja}`);
                            resolve(null);
                            return;
                        }
                        
                        const currentResult = sortedResults[index];
                        console.log(`🔍 Verificando correo ${index + 1}/${sortedResults.length} en ${bandeja}`);
                        
                        const fetch = imap.fetch(currentResult, { bodies: '' });
                        
                        fetch.on('message', (msg, seqno) => {
                            msg.on('body', async (stream, info) => {
                                try {
                                    const parsed = await (require('mailparser')).simpleParser(stream);
                                    const to = parsed.to?.value?.[0]?.address || '';
                                    
                                    // Verificar si este correo es para el email correcto
                                    if (to === email) {
                                        console.log(`✅ Correo encontrado para ${email} en ${bandeja}`);
                                        const resultado = await this.procesarEmail(parsed);
                                        found = true;
                                        resolve(resultado);
                                    } else {
                                        console.log(`📧 Correo es para ${to}, no para ${email}`);
                                        index++;
                                        checkNextEmail();
                                    }
                                } catch (error) {
                                    console.log(`⚠️ Error procesando correo en ${bandeja}: ${error.message}`);
                                    index++;
                                    checkNextEmail();
                                }
                            });
                        });

                        fetch.once('error', (err) => {
                            console.log(`⚠️ Error fetching en ${bandeja}: ${err.message}`);
                            index++;
                            checkNextEmail();
                        });
                    };
                    
                    checkNextEmail();
                });
            });
        });
    }

    // Búsqueda rápida en secciones principales
    async buscarRapidoEnSecciones(email, searchCriteria) {
        const secciones = ['[Gmail]/Promociones', '[Gmail]/Social']; // Solo las más importantes
        
        for (const seccion of secciones) {
            try {
                console.log(`🔍 Búsqueda rápida en: ${seccion}`);
                const resultado = await this.buscarEnBandejaPorAsunto(seccion, searchCriteria, email);
                if (resultado) {
                    console.log(`✅ Encontrado en ${seccion}`);
                    return resultado;
                }
            } catch (error) {
                console.log(`⚠️ Omitiendo ${seccion}`);
            }
        }
        
        console.log(`❌ No se encontró en las secciones principales para: ${email}`);
        return null;
    }

    // Buscar en una bandeja específica por asunto (rápido y filtrado)
    async buscarEnBandejaPorAsunto(bandeja, searchCriteria, email) {
        return new Promise((resolve, reject) => {
            // Timeout de 5 segundos para ser rápido
            const timeout = setTimeout(() => {
                console.log(`⏰ Timeout en ${bandeja}`);
                resolve(null);
            }, 5000);

            this.imap.openBox(bandeja, false, (err, box) => {
                if (err) {
                    clearTimeout(timeout);
                    console.log(`⚠️ No se pudo abrir ${bandeja}: ${err.message}`);
                    resolve(null);
                    return;
                }

                console.log(`🔍 Buscando en ${bandeja} por asunto Disney+`);

                this.imap.search(searchCriteria, (err, results) => {
                    clearTimeout(timeout);
                    
                    if (err) {
                        console.log(`⚠️ Error buscando en ${bandeja}: ${err.message}`);
                        resolve(null);
                        return;
                    }

                    if (results.length === 0) {
                        console.log(`📧 No hay correos con asunto Disney+ en ${bandeja}`);
                        resolve(null);
                        return;
                    }

                    console.log(`📧 Encontrados ${results.length} correos con asunto Disney+ en ${bandeja}`);

                    // Ordenar por UID descendente para obtener el MÁS RECIENTE
                    const sortedResults = results.sort((a, b) => b - a);
                    
                    // Buscar el primer correo que sea para el email correcto
                    let found = false;
                    let index = 0;
                    
                    const checkNextEmail = () => {
                        if (index >= sortedResults.length) {
                            console.log(`📧 Ningún correo es para ${email} en ${bandeja}`);
                            resolve(null);
                            return;
                        }
                        
                        const currentResult = sortedResults[index];
                        console.log(`🔍 Verificando correo ${index + 1}/${sortedResults.length} en ${bandeja}`);
                        
                        const fetch = this.imap.fetch(currentResult, { bodies: '' });
                        
                        fetch.on('message', (msg, seqno) => {
                            msg.on('body', async (stream, info) => {
                                try {
                                    const parsed = await simpleParser(stream);
                                    const to = parsed.to?.value?.[0]?.address || '';
                                    
                                    // Verificar si este correo es para el email correcto
                                    if (to === email) {
                                        console.log(`✅ Correo encontrado para ${email} en ${bandeja}`);
                                        const resultado = await this.procesarEmail(parsed);
                                        found = true;
                                        resolve(resultado);
                                    } else {
                                        console.log(`📧 Correo es para ${to}, no para ${email}`);
                                        index++;
                                        checkNextEmail();
                                    }
                                } catch (error) {
                                    console.log(`⚠️ Error procesando correo en ${bandeja}: ${error.message}`);
                                    index++;
                                    checkNextEmail();
                                }
                            });
                        });

                        fetch.once('error', (err) => {
                            console.log(`⚠️ Error fetching en ${bandeja}: ${err.message}`);
                            index++;
                            checkNextEmail();
                        });
                    };
                    
                    checkNextEmail();
                });
            });
        });
    }

    // Buscar el último correo para un email específico (versión con timeout)
    async buscarUltimoCorreo(email) {
        if (!this.imap || !this.isRunning) {
            throw new Error('El lector de correos no está conectado');
        }

        console.log(`🔍 Buscando último correo para: ${email}`);
        
        return new Promise((resolve, reject) => {
            // Timeout de 30 segundos para dar más tiempo a Gmail
            const timeout = setTimeout(() => {
                console.log(`⏰ Timeout en la búsqueda para ${email}`);
                // No resolver null, dejar que continúe la búsqueda
            }, 30000);

            // Buscar correos de las últimas 24 horas
            const fechaLimite = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const searchCriteria = [
                ['SINCE', fechaLimite],
                ['TO', email]
            ];

            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    clearTimeout(timeout);
                    console.error('❌ Error abriendo INBOX:', err);
                    resolve(null);
                    return;
                }

                console.log(`🔍 Buscando en INBOX correos para: ${email}`);

                this.imap.search(searchCriteria, (err, results) => {
                    clearTimeout(timeout);
                    
                    if (err) {
                        console.error('❌ Error en búsqueda:', err);
                        resolve(null);
                        return;
                    }

                    if (results.length === 0) {
                        console.log(`📭 No hay correos para: ${email}`);
                        resolve(null);
                        return;
                    }

                    console.log(`📧 Encontrados ${results.length} correos para ${email}`);

                    // Ordenar por UID descendente y tomar el más reciente
                    const sortedResults = results.sort((a, b) => b - a);
                    const latestResult = sortedResults[0];
                    
                    console.log(`🔍 Verificando correo más reciente`);
                    
                    // Timeout para el fetch - 20 segundos
                    const fetchTimeout = setTimeout(() => {
                        console.log(`⏰ Timeout en el fetch para ${email}`);
                        // No resolver null, dejar que continúe
                    }, 20000);
                    
                    const fetch = this.imap.fetch(latestResult, { bodies: '' });
                    
                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', async (stream, info) => {
                            try {
                                clearTimeout(fetchTimeout);
                                const parsed = await simpleParser(stream);
                                
                                // Buscar códigos en cuerpo y asunto usando detección multi-idioma
                                const cuerpo = parsed.text || '';
                                const asunto = parsed.subject || '';
                                const codigos = this.extraerCodigosDisney(cuerpo, asunto);
                                
                                if (codigos.length > 0) {
                                    console.log(`✅ Código encontrado para ${email}: ${codigos[0]}`);
                                    resolve({ 
                                        codigos: codigos, 
                                        servicio: 'disney+',
                                        to: email
                                    });
                                    return;
                                } else {
                                    console.log(`📧 Correo más reciente no tiene códigos válidos`);
                                    resolve(null);
                                }
                            } catch (error) {
                                clearTimeout(fetchTimeout);
                                console.log(`⚠️ Error procesando correo: ${error.message}`);
                                resolve(null);
                            }
                        });
                    });

                    fetch.once('error', (err) => {
                        clearTimeout(fetchTimeout);
                        console.log(`⚠️ Error fetching: ${err.message}`);
                        resolve(null);
                    });
                });
            });
        });
    }

    // Buscar en otras secciones de Gmail
    async buscarEnOtrasSecciones(email, searchCriteria) {
        const secciones = ['[Gmail]/Promociones', '[Gmail]/Social', '[Gmail]/Notificaciones', '[Gmail]/Spam'];
        
        for (const seccion of secciones) {
            try {
                console.log(`🔍 Buscando en sección: ${seccion}`);
                const resultado = await this.buscarEnBandeja(seccion, searchCriteria, email);
                if (resultado) {
                    console.log(`✅ Encontrado en ${seccion}`);
                    return resultado;
                }
            } catch (error) {
                console.log(`⚠️ Error en ${seccion}: ${error.message}`);
            }
        }
        
        return null;
    }

    // Buscar correos no leídos (solo últimos 2 días)
    buscarCorreosNoLeidos() {
        // Solo buscar correos de los últimos 2 días
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

    // Procesar correos existentes (eliminado - ahora solo procesa en tiempo real)
    // async procesarCorreosExistentes() {
    //     console.log('🔄 Procesando correos existentes...');
    //     
    //     // Buscar correos de los últimos 7 días enviados A los dominios específicos
    //     const fechaLimite = new Date();
    //     fechaLimite.setDate(fechaLimite.getDate() - 7);
        
    //     const searchCriteria = ['SINCE', fechaLimite, ['OR', 
    //         ['TO', '@rokotv.xyz'], 
    //         ['TO', '@rokostream.com']
    //     ]];

    //     this.imap.search(searchCriteria, (err, results) => {
    //         if (err) {
    //             console.error('❌ Error en búsqueda de correos existentes:', err);
    //             return;
    //         }

    //         if (results.length === 0) {
    //             console.log('📭 No hay correos existentes para los dominios especificados');
    //             return;
    //         }

    //         console.log(`📧 Procesando ${results.length} correos existentes`);

    //         const fetch = this.imap.fetch(results, { bodies: '' });
            
    //         fetch.on('message', (msg, seqno) => {
    //             msg.on('body', async (stream, info) => {
    //                 try {
    //                     const parsed = await simpleParser(stream);
    //                     await this.procesarEmail(parsed);
    //                 } catch (error) {
    //                     console.error('Error procesando mensaje existente:', error);
    //                 }
    //             });
    //         });
    //     });
    // }

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
