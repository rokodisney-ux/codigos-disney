const Database = require('./database');

const db = new Database();

async function verificarDo12() {
    try {
        console.log('📧 Buscando TODOS los códigos para do12@rokostream.com...');
        
        // Obtener TODOS los códigos para este email ordenados por fecha descendente
        const codigos = await db.obtenerCodigosPorEmail('do12@rokostream.com');
        
        console.log(`📊 Total encontrados: ${codigos.length}`);
        
        if (codigos.length > 0) {
            console.log('\n📋 Códigos encontrados (ordenados por fecha descendente):');
            codigos.forEach((codigo, index) => {
                console.log(`${index + 1}. 📅 Fecha: ${codigo.fecha_envio}`);
                console.log(`   🔢 Código: ${codigo.codigo}`);
                console.log(`   📺 Servicio: ${codigo.servicio}`);
                console.log(`   🏢 Dominio: ${codigo.dominio}`);
                console.log(`   📊 Estado: ${codigo.estado}`);
                console.log('---');
            });
            
            // El último código es el primero de la lista (ordenado por fecha descendente)
            const ultimoReal = codigos[0];
            console.log('\n✅ ÚLTIMO CÓDIGO REAL:');
            console.log(`   📅 Fecha: ${ultimoReal.fecha_envio}`);
            console.log(`   🔢 Código: ${ultimoReal.codigo}`);
            console.log(`   📺 Servicio: ${ultimoReal.servicio}`);
            console.log(`   🏢 Dominio: ${ultimoReal.dominio}`);
            console.log(`   📊 Estado: ${ultimoReal.estado}`);
            
        } else {
            console.log('❌ No se encontraron códigos para do12@rokostream.com');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verificando códigos:', error);
        process.exit(1);
    }
}

verificarDo12();
