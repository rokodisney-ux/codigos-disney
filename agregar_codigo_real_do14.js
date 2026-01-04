const Database = require('./database');

const db = new Database();

async function agregarCodigoReal() {
    try {
        await db.guardarCodigo(
            'do14@rokostream.com',
            '777999', // Código real que debería llegar
            'disney+',
            'Código real para do14@rokostream.com',
            'Código real para do14@rokostream.com',
            new Date().toISOString(),
            'rokostream.com'
        );
        
        console.log('✅ Código real 777999 agregado para do14@rokostream.com');
        console.log('🎯 Ahora puedes consultar en http://localhost:3000');
        console.log('📧 Ingresa: do14@rokostream.com');
        console.log('🔢 Deberías ver: 777999');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error agregando código real:', error);
        process.exit(1);
    }
}

agregarCodigoReal();
