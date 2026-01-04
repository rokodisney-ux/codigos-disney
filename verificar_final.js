const Database = require('./database');

const db = new Database();

async function verificarFinal() {
    try {
        console.log('🔍 Verificación final de la base de datos...');
        
        // Obtener todos los códigos para este email
        const codigos = await db.obtenerCodigosPorEmail('do16@rokostream.com');
        
        console.log(`📊 Total de códigos en BD: ${codigos.length}`);
        
        if (codigos.length > 0) {
            console.log('\n📋 Todos los códigos en la base de datos:');
            codigos.forEach((codigo, index) => {
                console.log(`${index + 1}. ID: ${codigo.id}, Código: ${codigo.codigo}, Fecha: ${codigo.fecha_envio}`);
            });
            
            // Obtener el último código usando la función correcta
            const ultimoCodigo = await db.obtenerUltimoCodigoDisney('do16@rokostream.com');
            
            console.log('\n✅ Último código según la función obtenerUltimoCodigoDisney:');
            if (ultimoCodigo.length > 0) {
                console.log(`   ID: ${ultimoCodigo[0].id}`);
                console.log(`   Código: ${ultimoCodigo[0].codigo}`);
                console.log(`   Fecha: ${ultimoCodigo[0].fecha_envio}`);
            } else {
                console.log('   ❌ No se encontró');
            }
        } else {
            console.log('❌ No hay códigos en la base de datos');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en verificación final:', error);
        process.exit(1);
    }
}

verificarFinal();
