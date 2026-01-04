const Database = require('./database');

const db = new Database();

async function buscarYGuardarCodigoDo15() {
    try {
        console.log('🔍 Buscando código para do15@rokostream.com...');
        
        // Agregar el código 617734 que llegó
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
        
        console.log('✅ Código 617734 guardado para do15@rokostream.com');
        console.log('🎯 Ahora puedes consultar en http://localhost:3000');
        console.log('📧 Ingresa: do15@rokostream.com');
        console.log('🔢 Verás: 617734');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

buscarYGuardarCodigoDo15();
