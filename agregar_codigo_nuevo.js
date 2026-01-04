const Database = require('./database');

const db = new Database();

async function agregarCodigoNuevo() {
    try {
        await db.guardarCodigo(
            'do16@rokostream.com',
            '128858',
            'disney+',
            'Tu código de acceso único para Disney+',
            'Tu código de acceso único para Disney+',
            new Date().toISOString(),
            'rokostream.com'
        );
        
        console.log('✅ Nuevo código 128858 agregado exitosamente para do16@rokostream.com');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error agregando código nuevo:', error);
        process.exit(1);
    }
}

agregarCodigoNuevo();
