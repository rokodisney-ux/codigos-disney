const Database = require('./database');

const db = new Database();

async function verificarUltimoCodigo() {
    try {
        const codigos = await db.obtenerUltimoCodigoDisney('do16@rokostream.com');
        
        console.log('📧 Buscando último código para do16@rokostream.com...');
        console.log('📊 Resultados encontrados:', codigos.length);
        
        if (codigos.length > 0) {
            const ultimoCodigo = codigos[0];
            console.log('✅ Último código encontrado:');
            console.log('   📧 Email:', ultimoCodigo.email);
            console.log('   🔢 Código:', ultimoCodigo.codigo);
            console.log('   📺 Servicio:', ultimoCodigo.servicio);
            console.log('   🏢 Dominio:', ultimoCodigo.dominio);
            console.log('   📅 Fecha envío:', ultimoCodigo.fecha_envio);
            console.log('   📄 Asunto:', ultimoCodigo.mensaje);
            console.log('   📊 Estado:', ultimoCodigo.estado);
        } else {
            console.log('❌ No se encontraron códigos para do16@rokostream.com');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verificando código:', error);
        process.exit(1);
    }
}

verificarUltimoCodigo();
