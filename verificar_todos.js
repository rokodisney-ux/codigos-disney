const Database = require('./database');

const db = new Database();

async function verificarTodosCodigos() {
    try {
        const codigos = await db.obtenerCodigosPorEmail('do16@rokostream.com');
        
        console.log('📧 Buscando TODOS los códigos para do16@rokostream.com...');
        console.log('📊 Total encontrados:', codigos.length);
        
        if (codigos.length > 0) {
            codigos.forEach((codigo, index) => {
                console.log(`\n📋 Código ${index + 1}:`);
                console.log('   📧 Email:', codigo.email);
                console.log('   🔢 Código:', codigo.codigo);
                console.log('   📺 Servicio:', codigo.servicio);
                console.log('   🏢 Dominio:', codigo.dominio);
                console.log('   📅 Fecha envío:', codigo.fecha_envio);
                console.log('   📄 Asunto:', codigo.mensaje);
                console.log('   📊 Estado:', codigo.estado);
            });
        } else {
            console.log('❌ No se encontraron códigos para do16@rokostream.com');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verificando códigos:', error);
        process.exit(1);
    }
}

verificarTodosCodigos();
