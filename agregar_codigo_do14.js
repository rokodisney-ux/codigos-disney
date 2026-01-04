const Database = require('./database');

const db = new Database();

async function agregarCodigoDo14() {
    try {
        await db.guardarCodigo(
            'do14@rokostream.com',
            '555888', // Código de prueba para do14
            'disney+',
            'Código de prueba para do14',
            'Código de prueba para do14',
            new Date().toISOString(),
            'rokostream.com'
        );
        
        console.log('✅ Código 555888 agregado para do14@rokostream.com');
        console.log('🎯 Ahora puedes consultar en http://localhost:3000');
        console.log('📧 Ingresa: do14@rokostream.com');
        console.log('🔢 Deberías ver: 555888');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error agregando código:', error);
        process.exit(1);
    }
}

agregarCodigoDo14();
