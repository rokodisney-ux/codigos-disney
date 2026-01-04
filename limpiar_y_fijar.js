const Database = require('./database');

const db = new Database();

async function limpiarYFijar() {
    try {
        console.log('🧹 Limpiando base de datos...');
        
        // Primero, eliminar todos los códigos existentes para do16@rokostream.com
        const sqlDelete = 'DELETE FROM codigos WHERE email = ?';
        
        return new Promise((resolve, reject) => {
            db.db.run(sqlDelete, ['do16@rokostream.com'], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Todos los códigos antiguos eliminados');
                    
                    // Ahora insertar solo el código más reciente (920221)
                    const sqlInsert = `
                        INSERT INTO codigos 
                        (email, codigo, servicio, mensaje, asunto, fecha_envio, dominio, estado)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.db.run(sqlInsert, [
                        'do16@rokostream.com',
                        '920221',
                        'disney+',
                        'Tu código de acceso único para Disney+',
                        'Tu código de acceso único para Disney+',
                        '2026-01-02T15:29:00.000Z',
                        'rokostream.com',
                        'activo'
                    ], function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log('✅ Código más reciente 920221 fijado correctamente');
                            resolve({ success: true });
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.error('❌ Error limpiando y fijando:', error);
        process.exit(1);
    }
}

limpiarYFijar();
