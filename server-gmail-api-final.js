require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
        
        console.log(`🔍 Buscando código REAL con Gmail API para: ${email}`);
        
        // Intentar buscar con Gmail API
        try {
            const resultado = await buscarCodigoConGmailAPI(email);
            
            if (resultado) {
                console.log(`✅ Código REAL encontrado: ${resultado.codigo}`);
                res.json({
                    email: email,
                    codigo: resultado.codigo,
                    servicio: resultado.servicio || 'disney+',
                    mensaje: 'Código encontrado en tiempo real con Gmail API',
                    asunto: resultado.asunto || 'Código de Disney+',
                    fecha_envio: resultado.fecha || new Date().toISOString(),
                    dominio: email.split('@')[1],
                    estado: 'nuevo'
                });
                return;
            }
        } catch (error) {
            console.log('⚠️ Error con Gmail API:', error.message);
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

// Función para buscar código usando Gmail API
async function buscarCodigoConGmailAPI(email) {
    try {
        const { google } = require('googleapis');
        
        // Cargar credenciales del archivo JSON
        const credentialsPath = path.join(__dirname, 'credentials.json');
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        
        // Configuración de OAuth2
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/gmail.readonly']
        });
        
        const gmail = google.gmail({ version: 'v1', auth });
        
        // Buscar correos recientes con palabras clave de Disney+
        const searchQuery = `to:${email} (disney OR "access code" OR "código de acceso" OR "verification code" OR "unique code")`;
        
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: searchQuery,
            maxResults: 10
        });
        
        if (!response.data.messages || response.data.messages.length === 0) {
            console.log('❌ No se encontraron correos recientes');
            return null;
        }
        
        console.log(`📧 Encontrados ${response.data.messages.length} correos, procesando el más reciente...`);
        
        // Obtener el correo más reciente
        const messageId = response.data.messages[0].id;
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        });
        
        // Extraer contenido del correo
        const payload = message.data.payload;
        let contenido = '';
        
        if (payload.parts) {
            payload.parts.forEach(part => {
                if (part.mimeType === 'text/plain' && part.body.data) {
                    contenido += Buffer.from(part.body.data, 'base64').toString();
                } else if (part.mimeType === 'text/html' && part.body.data) {
                    contenido += Buffer.from(part.body.data, 'base64').toString();
                }
            });
        } else if (payload.body.data) {
            contenido = Buffer.from(payload.body.data, 'base64').toString();
        }
        
        // Obtener asunto
        const subjectHeader = message.data.payload.headers.find(h => h.name === 'Subject');
        const asunto = subjectHeader ? subjectHeader.value : 'Sin asunto';
        
        console.log(`📧 Procesando correo...`);
        console.log(`📧 Asunto: ${asunto}`);
        
        // Extraer códigos de 6 dígitos
        const texto = contenido.toLowerCase();
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
            
            return {
                codigo: codigo,
                servicio: 'disney+',
                de: 'Disney+',
                asunto: asunto,
                fecha: new Date(parseInt(message.data.internalDate)).toISOString()
            };
        }
        
        console.log('❌ No se encontraron códigos válidos de 6 dígitos');
        return null;
        
    } catch (error) {
        console.error('❌ Error con Gmail API:', error.message);
        return null;
    }
}

// Endpoint para verificar estado
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        mode: 'gmail-api-final'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor GMAIL API FINAL iniciado en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend disponible en http://localhost:${PORT}`);
    console.log(`📧 Modo GMAIL API: Lectura automática con Google API`);
    console.log(`🔍 Cada consulta busca el código más reciente que llegó`);
    console.log(`💡 100% automático y robusto`);
    console.log(`🔐 Requiere archivo credentials.json`);
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
