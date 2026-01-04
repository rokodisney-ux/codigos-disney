const Database = require('./database');

const db = new Database();

async function limpiarTodo() {
    try {
        console.log('🧹 Limpiando toda la base de datos...');
        
        // Eliminar todos los códigos existentes
        const sqlDelete = 'DELETE FROM codigos';
        
        return new Promise((resolve, reject) => {
            db.db.run(sqlDelete, [], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Base de datos completamente limpia');
                    console.log('🎯 El sistema ahora detectará CÓDIGOS NUEVOS automáticamente');
                    console.log('📧 Cuando llegue un nuevo correo, se detectará el código');
                    console.log('🔢 Cada código será diferente y se mostrará el más reciente');
                    resolve({ success: true });
                }
            });
        });
    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
        process.exit(1);
    }
}

limpiarTodo();
