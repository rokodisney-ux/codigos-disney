const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Usar la misma configuración que el sistema
const imapConfig = {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_PASSWORD,
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT) || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
};

async function buscarCorreoDo14() {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);
        
        imap.once('ready', () => {
            console.log('🔗 Conectado a Gmail - buscando do14@rokostream.com');
            
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Buscar correos para do14@rokostream.com de hoy
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                
                const searchCriteria = [
                    ['TO', 'do14@rokostream.com'],
                    ['SINCE', hoy]
                ];
                
                console.log('🔍 Buscando correos de hoy para do14@rokostream.com...');
                
                imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    console.log(`📧 Encontrados ${results.length} correos para do14@rokostream.com`);
                    
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
                                
                                console.log('📧 De:', parsed.from?.text);
                                console.log('📧 Asunto:', parsed.subject);
                                console.log('📧 Fecha:', parsed.date);
                                
                                // Extraer código de 6 dígitos
                                const texto = (parsed.text || parsed.html || '').toLowerCase();
                                const regex = /\b\d{6}\b/g;
                                const codigos = texto.match(regex) || [];
                                
                                // Filtrar códigos válidos
                                const codigosValidos = codigos.filter(codigo => {
                                    return codigo !== '000000' && !codigo.startsWith('0000');
                                });
                                
                                console.log('🔍 Códigos encontrados:', codigosValidos);
                                
                                if (codigosValidos.length > 0) {
                                    resolve({
                                        email: 'do14@rokostream.com',
                                        codigo: codigosValidos[0],
                                        servicio: 'disney+',
                                        asunto: parsed.subject || '',
                                        fecha_envio: parsed.date.toISOString(),
                                        dominio: 'rokostream.com',
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

buscarCorreoDo14()
    .then(resultado => {
        if (resultado) {
            console.log('✅ CÓDIGO ENCONTRADO:');
            console.log(`📧 Email: ${resultado.email}`);
            console.log(`🔢 Código: ${resultado.codigo}`);
            console.log(`📺 Servicio: ${resultado.servicio}`);
            console.log(`📅 Fecha: ${resultado.fecha_envio}`);
        } else {
            console.log('❌ No se encontró ningún código válido para do14@rokostream.com');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
