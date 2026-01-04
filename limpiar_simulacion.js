const Database = require('./database');

const db = new Database();

async function limpiarCodigoSimulado() {
    try {
        // Eliminar el código simulado
        const sql = 'DELETE FROM codigos WHERE email = ? AND codigo = ?';
        
        return new Promise((resolve, reject) => {
            db.db.run(sql, ['do16@rokostream.com', '999999'], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Código simulado 999999 eliminado de la base de datos');
                    console.log('📧 Email: do16@rokostream.com');
                    console.log('🎯 Ahora el sistema mostrará solo códigos reales');
                    resolve({ deleted: this.changes });
                }
            });
        });
    } catch (error) {
        console.error('❌ Error limpiando código simulado:', error);
        process.exit(1);
    }
}

limpiarCodigoSimulado();
