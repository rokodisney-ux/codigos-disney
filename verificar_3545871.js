const Database = require('./database');

const db = new Database();

async function verificarCorreo() {
    try {
        console.log('🔍 Verificando si hay códigos para 3545871@rokotv.xyz...');
        
        // Buscar todos los códigos para este email
        const sql = 'SELECT * FROM codigos WHERE email = ? ORDER BY fecha_envio DESC';
        
        return new Promise((resolve, reject) => {
            db.db.all(sql, ['3545871@rokotv.xyz'], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`📊 Encontrados ${rows.length} códigos para 3545871@rokotv.xyz`);
                
                if (rows.length > 0) {
                    console.log('📋 Lista de códigos:');
                    rows.forEach((row, index) => {
                        console.log(`${index + 1}. Código: ${row.codigo}, Servicio: ${row.servicio}, Fecha: ${row.fecha_envio}`);
                    });
                } else {
                    console.log('❌ No hay códigos guardados para este email');
                    
                    // Verificar si hay códigos para otros emails
                    const sqlTodos = 'SELECT DISTINCT email FROM codigos ORDER BY email';
                    db.db.all(sqlTodos, [], (err, emails) => {
                        if (err) {
                            console.error('Error:', err);
                            return;
                        }
                        
                        console.log('📧 Emails con códigos en la base de datos:');
                        emails.forEach((row, index) => {
                            console.log(`${index + 1}. ${row.email}`);
                        });
                    });
                }
                
                resolve(rows);
            });
        });
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

verificarCorreo();
