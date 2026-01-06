const { google } = require('googleapis');
const { simpleParser } = require('mailparser');

class EmailReader {
    constructor() {
        this.gmail = null;
        this.auth = null;
        this.isRunning = false;
    }

    // Inicializar autenticación con Gmail API
    async iniciar() {
        try {
            console.log('🔗 Iniciando Gmail API...');
            
            // Cargar credenciales desde variables de entorno
            const credentials = {
                client_email: process.env.GMAIL_CLIENT_EMAIL,
                private_key: process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                project_id: process.env.GMAIL_PROJECT_ID
            };

            // Verificar que tenemos las credenciales necesarias
            if (!credentials.client_email || !credentials.private_key) {
                console.error('❌ Faltan credenciales de Gmail API');
                return false;
            }

            // Crear autenticación JWT
            this.auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key,
                ['https://www.googleapis.com/auth/gmail.readonly']
            );

            this.gmail = google.gmail({ version: 'v1', auth: this.auth });

            // Probar la conexión
            await this.gmail.users.getProfile({ userId: 'me' });
            
            console.log('✅ Gmail API conectada exitosamente');
            this.isRunning = true;
            return true;

        } catch (error) {
            console.error('❌ Error iniciando Gmail API:', error.message);
            this.isRunning = false;
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
        
        // Si no hay códigos de 6 dígitos, buscar otros patrones
        if (codigos.length === 0) {
            console.log(`🔍 Buscando otros patrones de código...`);
            
            // Buscar patrones como "código es: XXXXXX"
            const regexCodigo = /código[^0-9]*([0-9]{6})/gi;
            const matchCodigo = textoCompleto.match(regexCodigo);
            if (matchCodigo) {
                const codigoExtraido = matchCodigo[0].match(/([0-9]{6})/);
                if (codigoExtraido) {
                    console.log(`✅ Código encontrado con patrón 'código': ${codigoExtraido[1]}`);
                    return [codigoExtraido[1]];
                }
            }
            
            // Buscar patrones como "code is: XXXXXX"
            const regexCode = /code[^0-9]*([0-9]{6})/gi;
            const matchCode = textoCompleto.match(regexCode);
            if (matchCode) {
                const codigoExtraido = matchCode[0].match(/([0-9]{6})/);
                if (codigoExtraido) {
                    console.log(`✅ Código encontrado con patrón 'code': ${codigoExtraido[1]}`);
                    return [codigoExtraido[1]];
                }
            }
            
            // Buscar cualquier secuencia de 6 dígitos
            const regexAny = /([0-9]{6})/g;
            const matchAny = textoCompleto.match(regexAny);
            if (matchAny) {
                console.log(`✅ Código encontrado con patrón genérico: ${matchAny[0]}`);
                return [matchAny[0]];
            }
        }
        
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

    // Buscar el último correo para un email específico usando Gmail API
    async buscarUltimoCorreo(email) {
        if (!this.gmail || !this.isRunning) {
            const iniciado = await this.iniciar();
            if (!iniciado) {
                throw new Error('No se pudo inicializar Gmail API');
            }
        }

        console.log(`🔍 Buscando último correo con Gmail API para: ${email}`);
        
        try {
            // Buscar correos de las últimas 20 minutos
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

            // Obtener el correo más reciente
            const latestMessage = response.data.messages[0];
            const messageDetail = await this.gmail.users.messages.get({
                userId: 'me',
                id: latestMessage.id,
                format: 'full'
            });

            // Extraer contenido del correo
            const headers = messageDetail.data.payload.headers;
            const fromHeader = headers.find(h => h.name === 'From')?.value || '';
            const subjectHeader = headers.find(h => h.name === 'Subject')?.value || '';
            const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
            
            // Extraer cuerpo del correo
            let cuerpo = '';
            if (messageDetail.data.snippet) {
                cuerpo = messageDetail.data.snippet;
            } else if (messageDetail.data.payload.body.data) {
                cuerpo = Buffer.from(messageDetail.data.payload.body.data, 'base64').toString();
            } else if (messageDetail.data.payload.parts) {
                // Buscar en partes del correo
                for (const part of messageDetail.data.payload.parts) {
                    if (part.mimeType === 'text/plain' && part.body.data) {
                        cuerpo = Buffer.from(part.body.data, 'base64').toString();
                        break;
                    }
                }
            }
            
            console.log(`📧 Correo encontrado:`);
            console.log(`   - De: ${fromHeader}`);
            console.log(`   - Para: ${email}`);
            console.log(`   - Asunto: ${subjectHeader}`);
            console.log(`   - Fecha: ${dateHeader}`);
            console.log(`   - Cuerpo (primeros 200 chars): ${cuerpo.substring(0, 200)}...`);

            // Extraer códigos
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

    // Detener el lector de correos
    detener() {
        if (this.gmail) {
            this.gmail = null;
            this.auth = null;
            this.isRunning = false;
            console.log('🛑 Lector de correos Gmail API detenido');
        }
    }
}

module.exports = EmailReader;
