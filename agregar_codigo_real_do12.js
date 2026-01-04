const Database = require('./database');

const db = new Database();

async function agregarCodigoReal() {
    try {
        // Reemplaza "CODIGO_REAL" con el código real que llegó
        const codigoReal = "CODIGO_REAL"; // CAMBIA ESTO por el código real
        
        await db.guardarCodigo(
            'do12@rokostream.com',
            codigoReal,
            'disney+',
            'Tu código de acceso único para Disney+',
            'Tu código de acceso único para Disney+',
            new Date().toISOString(),
            'rokostream.com',
            'nuevo'
        );
        
        console.log('✅ Código real agregado para do12@rokostream.com');
        console.log('🎯 Ahora puedes consultar en http://localhost:3000');
        console.log('📧 Ingresa: do12@rokostream.com');
        console.log('🔢 Deberías ver:', codigoReal);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error agregando código real:', error);
        process.exit(1);
    }
}

agregarCodigoReal();
