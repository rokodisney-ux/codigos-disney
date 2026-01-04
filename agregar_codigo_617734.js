const Database = require('./database');

const db = new Database();

async function agregarCodigo617734() {
    try {
        await db.guardarCodigo(
            'do15@rokostream.com',
            '617734', // Código real que llegó
            'disney+',
            'Tu código de acceso único para Disney+',
            'Tu código de acceso único para Disney+',
            new Date().toISOString(),
            'rokostream.com',
            'nuevo'
        );
        
        console.log('✅ Código 617734 agregado para do15@rokostream.com');
        console.log('🎯 Ahora puedes consultar en http://localhost:3000');
        console.log('📧 Ingresa: do15@rokostream.com');
        console.log('🔢 Deberías ver: 617734');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error agregando código:', error);
        process.exit(1);
    }
}

agregarCodigo617734();
