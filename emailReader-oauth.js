const { google } = require('googleapis');
const { simpleParser } = require('mailparser');

class EmailReader {
    constructor() {
        this.gmail = null;
        this.auth = null;
        this.isRunning = false;
        this.oauth2Client = null;
    }

    // Inicializar autenticación con OAuth 2.0
    async iniciar() {
        try {
            console.log('🔗 Iniciando Gmail API con OAuth 2.0...');
            
            // Crear cliente OAuth 2.0
            this.oauth2Client = new google.auth.OAuth2(
                process.env.GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET,
                'http://localhost:3000/auth/callback'
            );

            // Para simplificar, usaremos el flujo de credenciales de usuario
            // En producción, necesitarías implementar el flujo OAuth completo
            
            // Para ahora, intentamos con credenciales de usuario si existen
            if (process.env.GMAIL_REFRESH_TOKEN) {
                this.oauth2Client.setCredentials({
                    refresh_token: process.env.GMAIL_REFRESH_TOKEN
                });
            }

            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

            // Probar la conexión
            try {
                await this.gmail.users.getProfile({ userId: 'me' });
                console.log('✅ Gmail API conectada exitosamente con OAuth 2.0');
                this.isRunning = true;
                return true;
            } catch (profileError) {
                console.log('⚠️ No se pudo obtener perfil, intentando método alternativo...');
                
                // Método alternativo: usar credenciales de usuario directamente
                if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
                    console.log('🔄 Usando método de app password como respaldo...');
                    return await this.iniciarConAppPassword();
                }
                
                throw profileError;
            }

        } catch (error) {
            console.error('❌ Error iniciando Gmail API:', error.message);
            
            // Si OAuth falla, intentar con app password
            if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
                console.log('🔄 Intentando con app password como respaldo...');
                return await this.iniciarConAppPassword();
            }
            
            this.isRunning = false;
            return false;
        }
    }

    // Método de respaldo con app password (IMAP)
    async iniciarConAppPassword() {
        try {
            console.log('🔄 Iniciando con IMAP + app password como respaldo...');
            
            const Imap = require('imap');
            
            const config = {
                user: process.env.GMAIL_USER,
                password: process.env.GMAIL_PASS,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                connTimeout: 60000,
                authTimeout: 60000
            };

            this.imap = new Imap(config);

            return new Promise((resolve, reject) => {
                this.imap.once('ready', () => {
                    console.log('✅ IMAP conectado exitosamente como respaldo');
                    this.isRunning = true;
                    resolve(true);
                });

                this.imap.once('error', (err) => {
                    console.error('❌ Error en IMAP respaldo:', err.message);
                    reject(err);
                });

                this.imap.connect();
            });

        } catch (error) {
            console.error('❌ Error en método de respaldo:', error.message);
            return false;
        }
    }

    // Extraer códigos de Disney+ (multi-idioma)
    extraerCodigosDisney(cuerpo, asunto) {
        if (!cuerpo && !asunto) return [];
        
        const textoCompleto = `${cuerpo || ''} ${asunto || ''}`.toLowerCase();
        
        console.log(`🔍 Analizando texto para códigos...`);
        console.log(`📧 Texto (primeros 300 chars): ${textoCompleto.substring(0, 300)}...`);
        
        // Palabras clave en múltiples idiomas
        const disneyKeywords = [
            'disney+', 'disney plus', 'código', 'codigo', 'verificación', 'verificacion',
            'code', 'verification', 'verify', 'vérification', 'vérifiez',
            'code', 'verifizierung', 'überprüfen', 'kod', 'verifiering',
            'access code', 'unique access code', 'engångskod', 'zugangscode',
            "code d'accès", 'toegangscode', 'código de acesso', 'codigo de accesso',
            'mydisney', 'my disney', 'acceso único', 'código de acceso'
        ];
        
        // Verificar si es un correo de Disney+
        const esDisney = disneyKeywords.some(keyword => textoCompleto.includes(keyword));
        
        if (!esDisney) {
            console.log(`❌ No es un correo de Disney+`);
            return [];
        }
        
        console.log(`✅ Correo identificado como Disney+`);
        
        // Buscar códigos de 6 dígitos
        const regex = /\b\d{6}\b/g;
        const codigos = textoCompleto.match(regex) || [];
        
        console.log(`🔍 Códigos de 6 dígitos encontrados: ${codigos.length > 0 ? codigos.join(', ') : 'Ninguno'}`);
        
        // Filtrar códigos válidos
        const codigosValidos = codigos.filter(codigo => 
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
        
        console.log(`📧 Códigos válidos finales: ${codigosValidos.length > 0 ? codigosValidos.join(', ') : 'Ninguno'}`);
        
        return codigosValidos;
    }

    // Buscar el último correo para un email específico
    async buscarUltimoCorreo(email) {
        if (!this.isRunning) {
            const iniciado = await this.iniciar();
            if (!iniciado) {
                throw new Error('No se pudo inicializar el lector de correos');
            }
        }

        console.log(`🔍 Buscando último correo para: ${email}`);
        
        try {
            // Si tenemos Gmail API disponible, usarla
            if (this.gmail && this.oauth2Client) {
                return await this.buscarConGmailAPI(email);
            }
            
            // Si no, usar IMAP
            if (this.imap) {
                return await this.buscarConIMAP(email);
            }
            
            throw new Error('No hay método de búsqueda disponible');
            
        } catch (error) {
            console.error('❌ Error buscando correo:', error.message);
            throw error;
        }
    }

    // Buscar con Gmail API
    async buscarConGmailAPI(email) {
        try {
            const fechaLimite = new Date(Date.now() - 20 * 60 * 1000);
            const fechaISO = fechaLimite.toISOString();

            console.log(`📅 Buscando correos desde: ${fechaISO}`);

            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: `to:${email} after:${fechaISO}`
            });

            if (!response.data.messages || response.data.messages.length === 0) {
                console.log(`📭 No hay correos recientes para: ${email}`);
                return null;
            }

            console.log(`📧 Encontrados ${response.data.messages.length} correos para ${email}`);

            const latestMessage = response.data.messages[0];
            const messageDetail = await this.gmail.users.messages.get({
                userId: 'me',
                id: latestMessage.id,
                format: 'full'
            });

            const headers = messageDetail.data.payload.headers;
            const fromHeader = headers.find(h => h.name === 'From')?.value || '';
            const subjectHeader = headers.find(h => h.name === 'Subject')?.value || '';
            const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
            
            let cuerpo = messageDetail.data.snippet || '';
            
            console.log(`📧 Correo encontrado:`);
            console.log(`   - De: ${fromHeader}`);
            console.log(`   - Para: ${email}`);
            console.log(`   - Asunto: ${subjectHeader}`);
            console.log(`   - Fecha: ${dateHeader}`);
            console.log(`   - Cuerpo (primeros 200 chars): ${cuerpo.substring(0, 200)}...`);

            const codigos = this.extraerCodigosDisney(cuerpo, subjectHeader);

            if (codigos.length > 0) {
                console.log(`✅ Código encontrado para ${email}: ${codigos[0]}`);
                return {
                    codigos: codigos,
                    servicio: 'disney+',
                    to: email
                };
            } else {
                console.log(`📧 Correo más reciente no tiene código válido`);
                return null;
            }

        } catch (error) {
            console.error('❌ Error buscando con Gmail API:', error.message);
            throw error;
        }
    }

    // Buscar con IMAP (método de respaldo)
    async buscarConIMAP(email) {
        return new Promise((resolve, reject) => {
            const fechaLimite = new Date(Date.now() - 20 * 60 * 1000);
            const searchCriteria = [
                ['SINCE', fechaLimite],
                ['TO', email]
            ];

            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('❌ Error abriendo INBOX:', err);
                    resolve(null);
                    return;
                }

                this.imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        console.error('❌ Error en búsqueda IMAP:', err);
                        resolve(null);
                        return;
                    }

                    if (results.length === 0) {
                        console.log(`📭 No hay correos para: ${email}`);
                        resolve(null);
                        return;
                    }

                    const sortedResults = results.sort((a, b) => b - a);
                    const latestResult = sortedResults[0];
                    
                    const fetch = this.imap.fetch(latestResult, { bodies: '' });
                    
                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', async (stream, info) => {
                            try {
                                const parsed = await simpleParser(stream);
                                
                                const cuerpo = parsed.text || '';
                                const asunto = parsed.subject || '';
                                const de = parsed.from?.value?.[0]?.address || '';
                                const fecha = parsed.date || new Date();
                                
                                console.log(`📧 Correo encontrado (IMAP):`);
                                console.log(`   - De: ${de}`);
                                console.log(`   - Para: ${email}`);
                                console.log(`   - Asunto: ${asunto}`);
                                console.log(`   - Fecha: ${fecha}`);
                                console.log(`   - Cuerpo (primeros 200 chars): ${cuerpo.substring(0, 200)}...`);
                                
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
                                    console.log(`📧 Correo más reciente no tiene código válido`);
                                    resolve(null);
                                }
                                
                            } catch (error) {
                                console.log(`⚠️ Error procesando correo: ${error.message}`);
                                resolve(null);
                            }
                        });
                    });

                    fetch.once('error', (err) => {
                        console.log(`⚠️ Error fetching: ${err.message}`);
                        resolve(null);
                    });
                });
            });
        });
    }

    // Detener el lector de correos
    detener() {
        if (this.gmail) {
            this.gmail = null;
            this.oauth2Client = null;
        }
        
        if (this.imap) {
            this.imap.end();
            this.imap = null;
        }
        
        this.isRunning = false;
        console.log('🛑 Lector de correos detenido');
    }
}

module.exports = EmailReader;
