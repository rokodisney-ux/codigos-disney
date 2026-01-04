const Database = require('./database');

const db = new Database();

async function agregarCodigoDo12() {
    try {
        await db.guardarCodigo(
            'do12@rokostream.com',
            '123456', // Código real que debería llegar
            'disney+',
            'Tu código de acceso único para Disney+',
            'Tu código de acceso único para Disney+',
            new Date().toISOString(),
            'rokostream.com',
            'nuevo'
        );
        
        console.log('✅ Código 123456 agregado para do12@rokostream.com');
        console.log('🎯 Ahora puedes consultar en http://localhost:3000');
        console.log('📧 Ingresa: do12@rokostream.com');
        console.log('🔢 Deberías ver: 123456');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error agregando código:', error);
        process.exit(1);
    }
}

agregarCodigoDo12();
