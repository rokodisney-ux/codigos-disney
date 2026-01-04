require('dotenv').config();
const EmailReader = require('./emailReader');

console.log('🔍 Buscando código real para do14@rokostream.com...');

const emailReader = new EmailReader();

async function buscarCodigoReal() {
    try {
        // Iniciar conexión
        await new Promise((resolve, reject) => {
            emailReader.imap = new (require('imap'))(emailReader.getImapConfig());
            
            emailReader.imap.once('ready', () => {
                console.log('✅ Conectado a Gmail');
                resolve();
            });
            
            emailReader.imap.once('error', reject);
            emailReader.imap.connect();
        });
        
        // Buscar el último correo
        console.log('🔍 Buscando último correo...');
        const resultado = await emailReader.buscarUltimoCorreo('do14@rokostream.com');
        
        if (resultado && resultado.codigos && resultado.codigos.length > 0) {
            console.log(`✅ Código encontrado: ${resultado.codigos[0]}`);
            console.log(`📧 Servicio: ${resultado.servicio}`);
            
            // Guardar en base de datos
            const Database = require('./database');
            const db = new Database();
            
            await db.guardarCodigo(
                'do14@rokostream.com',
                resultado.codigos[0],
                resultado.servicio || 'disney+',
                'Código de Disney+',
                'Código encontrado manualmente',
                new Date().toISOString(),
                'rokostream.com',
                'nuevo'
            );
            
            console.log('💾 Código guardado en base de datos');
            console.log('🌐 Ahora puedes consultarlo en la web');
            
        } else {
            console.log('❌ No se encontró ningún código');
        }
        
        // Cerrar conexión
        emailReader.imap.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    process.exit(0);
}

buscarCodigoReal();
