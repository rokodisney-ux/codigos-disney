const Database = require('./database');

const db = new Database();

async function buscarCodigoRapido(email) {
    try {
        console.log(`🔍 Buscando código para: ${email}`);
        
        // Buscar directamente en la base de datos
        const codigos = await db.obtenerUltimoCodigoDisney(email);
        
        if (codigos.length > 0) {
            console.log(`✅ Código encontrado: ${codigos[0].codigo}`);
            return codigos[0];
        } else {
            console.log(`❌ No hay código guardado para: ${email}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Probar con do15@rokostream.com
buscarCodigoRapido('do15@rokostream.com')
    .then(resultado => {
        if (resultado) {
            console.log('🎯 RESULTADO:');
            console.log(`📧 Email: ${resultado.email}`);
            console.log(`🔢 Código: ${resultado.codigo}`);
            console.log(`📺 Servicio: ${resultado.servicio}`);
            console.log(`📅 Fecha: ${resultado.fecha_envio}`);
        } else {
            console.log('❌ No se encontró ningún código');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
