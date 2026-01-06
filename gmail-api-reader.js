const { google } = require('googleapis');
const { simpleParser } = require('mailparser');

class GmailApiReader {
    constructor() {
        this.gmail = null;
        this.auth = null;
    }

    // Inicializar autenticación con Gmail API
    async inicializar() {
        try {
            // Cargar credenciales desde variables de entorno
            const credentials = {
                client_email: process.env.GMAIL_USER,
                private_key: process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_id: process.env.GMAIL_CLIENT_ID,
                client_secret: process.env.GMAIL_CLIENT_SECRET
            };

            this.auth = new google.auth.JWT(
                credentials.client_id,
                credentials.client_secret,
                credentials.private_key,
                credentials.client_email,
                ['https://www.googleapis.com/auth/gmail.readonly']
            );

            this.gmail = google.gmail({ version: 'v1', auth: this.auth });

            console.log('✅ Gmail API inicializada exitosamente');
            return true;

        } catch (error) {
            console.error('❌ Error inicializando Gmail API:', error.message);
            return false;
        }
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
            "code d'accès", 'toegangscode', 'código de acesso', 'codigo de accesso',
            'mydisney', 'my disney'
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

    // Buscar el último correo para un email específico usando Gmail API
    async buscarUltimoCorreo(email) {
        if (!this.gmail) {
            const inicializado = await this.inicializar();
            if (!inicializado) {
                throw new Error('No se pudo inicializar Gmail API');
            }
        }

        console.log(`🔍 Buscando último correo con Gmail API para: ${email}`);
        
        try {
            // Buscar correos de las últimas 20 minutos
            const fechaLimite = new Date(Date.now() - 20 * 60 * 1000);
            const fechaISO = fechaLimite.toISOString();

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
            const cuerpo = messageDetail.data.snippet || '';
            const asunto = messageDetail.data.subject || '';
            
            console.log(`📧 Correo encontrado:`);
            console.log(`   - De: ${messageDetail.data.from}`);
            console.log(`   - Para: ${email}`);
            console.log(`   - Asunto: ${asunto}`);
            console.log(`   - Fecha: ${new Date(messageDetail.data.internalDate)}`);
            console.log(`   - Cuerpo (primeros 200 chars): ${cuerpo.substring(0, 200)}...`);

            // Extraer códigos
            const codigos = this.extraerCodigosDisney(cuerpo, asunto);

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
}

module.exports = GmailApiReader;
