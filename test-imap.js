// Script para probar conexión IMAP
const Imap = require('imap');

const imapConfig = {
    user: process.env.GMAIL_USER || 'tu_correo@gmail.com',
    password: process.env.GMAIL_PASS || 'tu_contraseña',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
};

console.log('🔍 Probando conexión IMAP...');
console.log('📧 Usuario:', imapConfig.user);

const imap = new Imap(imapConfig);

imap.once('ready', () => {
    console.log('✅ Conexión IMAP exitosa');
    imap.end();
});

imap.once('error', (err) => {
    console.log('❌ Error de conexión IMAP:', err.message);
});

imap.connect();
