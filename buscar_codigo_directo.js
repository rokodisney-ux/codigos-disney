const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Configuración IMAP
const imapConfig = {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_PASSWORD,
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
};

async function buscarCodigoDirecto(email) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);
        
        imap.once('ready', () => {
            console.log('🔗 Conectado a Gmail');
            
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`📬 Buscando correos para: ${email}`);
                
                // Buscar correos enviados a este email en los últimos 7 días
                const searchCriteria = [['TO', email], ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]];
                
                imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    console.log(`📧 Encontrados ${results.length} correos para ${email}`);
                    
                    if (results.length === 0) {
                        resolve(null);
                        return;
                    }
                    
                    // Tomar el correo más reciente
                    const latestResult = results[results.length - 1];
                    
                    const fetch = imap.fetch(latestResult, { bodies: '' });
                    
                    fetch.on('message', (msg, seqno) => {
                        msg.on('body', async (stream, info) => {
                            try {
                                const parsed = await simpleParser(stream);
                                
                                // Extraer código de 6 dígitos
                                const texto = (parsed.text || parsed.html || '').toLowerCase();
                                const regex = /\b\d{6}\b/g;
                                const codigos = texto.match(regex) || [];
                                
                                if (codigos.length > 0) {
                                    console.log(`✅ Código encontrado: ${codigos[0]}`);
                                    resolve({
                                        email: email,
                                        codigo: codigos[0],
                                        servicio: 'disney+',
                                        asunto: parsed.subject || '',
                                        fecha_envio: parsed.date.toISOString(),
                                        dominio: email.split('@')[1],
                                        estado: 'nuevo'
                                    });
                                } else {
                                    resolve(null);
                                }
                            } catch (error) {
                                reject(error);
                            }
                        });
                    });
                    
                    fetch.once('error', (err) => {
                        reject(err);
                    });
                });
            });
        });
        
        imap.once('error', (err) => {
            reject(err);
        });
        
        imap.connect();
    });
}

// Probar con do15@rokostream.com
buscarCodigoDirecto('do15@rokostream.com')
    .then(resultado => {
        if (resultado) {
            console.log('🎯 CÓDIGO ENCONTRADO:');
            console.log(`📧 Email: ${resultado.email}`);
            console.log(`🔢 Código: ${resultado.codigo}`);
            console.log(`📺 Servicio: ${resultado.servicio}`);
            console.log(`📅 Fecha: ${resultado.fecha_envio}`);
            console.log(`🏢 Dominio: ${resultado.dominio}`);
        } else {
            console.log('❌ No se encontraron códigos');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
