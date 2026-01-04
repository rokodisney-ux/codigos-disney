const Database = require('./database');

const db = new Database();

// Simular que llega un nuevo correo de Disney+
async function simularNuevoCorreo() {
    const email = 'do16@rokostream.com';
    const codigo = '999999'; // Código de prueba
    
    try {
        await db.guardarCodigo(
            email,
            codigo,
            'disney+',
            'Código de prueba simulado',
            'Código de prueba simulado',
            new Date().toISOString(),
            'rokostream.com'
        );
        
        console.log('✅ Código de prueba simulado agregado:');
        console.log(`   📧 Email: ${email}`);
        console.log(`   🔢 Código: ${codigo}`);
        console.log(`   📺 Servicio: disney+`);
        console.log(`   🏢 Dominio: rokostream.com`);
        console.log(`   📅 Fecha: ${new Date().toISOString()}`);
        console.log(`\n🎯 Ahora puedes consultar en: http://localhost:3000`);
        console.log(`📧 Ingresa: ${email}`);
        console.log(`🔢 Deberías ver: ${codigo}`);
        
    } catch (error) {
        console.error('❌ Error simulando correo:', error);
    }
}

simularNuevoCorreo();
