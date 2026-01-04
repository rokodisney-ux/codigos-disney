const Database = require('./database');

const db = new Database();

async function agregarCodigoPrueba() {
    try {
        await db.guardarCodigo(
            'do16@rokostream.com',
            '920221',
            'disney+',
            'Tu código de acceso único para Disney+',
            'Tu código de acceso único para Disney+',
            '2026-01-02T15:29:00.000Z',
            'rokostream.com'
        );
        
        console.log('✅ Código 920221 agregado exitosamente para do16@rokostream.com');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error agregando código:', error);
        process.exit(1);
    }
}

agregarCodigoPrueba();
