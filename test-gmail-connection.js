const EmailReader = require('./emailReader');

async function testConnection() {
    console.log('🧪 Probando conexión con Gmail...');
    
    // Crear copia del .env.test como .env temporal
    const fs = require('fs');
    if (fs.existsSync('.env.test')) {
        fs.copyFileSync('.env.test', '.env');
        console.log('✅ Archivo .env cargado desde .env.test');
    }
    
    // Cargar variables de entorno
    require('dotenv').config();
    
    console.log('📧 Usuario:', process.env.GMAIL_USER);
    console.log('🔑 Contraseña:', process.env.GMAIL_PASS ? '***CONFIGURADA***' : 'NO CONFIGURADA');
    
    const emailReader = new EmailReader();
    
    try {
        await emailReader.iniciar();
        
        // Esperar 3 segundos para verificar conexión
        setTimeout(async () => {
            console.log('🔍 Probando búsqueda con do16@rokostream.com...');
            const resultado = await emailReader.buscarUltimoCorreo('do16@rokostream.com');
            
            if (resultado) {
                console.log('✅ ÉXITO:', resultado);
            } else {
                console.log('❌ No se encontró código');
            }
            
            emailReader.detener();
            process.exit(0);
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testConnection();
