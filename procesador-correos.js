require('dotenv').config();
const EmailReader = require('./emailReader');

console.log('📧 Iniciando procesador de correos directo...');

const emailReader = new EmailReader();

// Iniciar el lector de correos
emailReader.iniciar();

console.log('✅ Procesador de correos iniciado');
console.log('📊 Este proceso solo mantiene la conexión con Gmail');
console.log('🌐 El servidor web busca directamente en Gmail (sin base de datos)');
console.log('🔄 Los códigos se muestran en tiempo real cuando se consultan');

// Mantener el proceso corriendo
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando procesador de correos...');
    emailReader.detener();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando procesador de correos...');
    emailReader.detener();
    process.exit(0);
});
