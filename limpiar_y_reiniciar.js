const Database = require('./database');

const db = new Database();

async function limpiarYReiniciar() {
    try {
        console.log('🧹 Limpiando base de datos...');
        
        // Eliminar todos los códigos existentes
        const sqlDelete = 'DELETE FROM codigos';
        
        return new Promise((resolve, reject) => {
            db.db.run(sqlDelete, [], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Base de datos limpiada completamente');
                    console.log('🎯 El sistema ahora funcionará en tiempo real');
                    console.log('📧 Cuando llegue un nuevo código, se detectará automáticamente');
                    console.log('🔍 Solo procesará correos NUEVOS');
                    resolve({ success: true });
                }
            });
        });
    } catch (error) {
        console.error('❌ Error limpiando base de datos:', error);
        process.exit(1);
    }
}

limpiarYReiniciar();
