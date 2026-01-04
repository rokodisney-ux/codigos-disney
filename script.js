// Base de datos simulada de correos y sus códigos de verificación (6 dígitos)
const baseDeDatos = {
    'cliente@rokotv.xyz': [
        { 
            codigo: '277035', 
            dominio: 'rokotv.xyz', 
            fecha: '2026-01-02', 
            estado: 'activo',
            servicio: 'Disney+',
            mensaje: 'Tu código de acceso único para Disney+'
        },
        { 
            codigo: '845921', 
            dominio: 'rokotv.xyz', 
            fecha: '2026-01-01', 
            estado: 'expirado',
            servicio: 'Netflix',
            mensaje: 'Your verification code for Netflix'
        }
    ],
    'usuario@rokotv.xyz': [
        { 
            codigo: '123456', 
            dominio: 'rokotv.xyz', 
            fecha: '2026-01-03', 
            estado: 'activo',
            servicio: 'HBO Max',
            mensaje: 'Código de verificación para HBO Max'
        }
    ],
    'cliente@rokostream.com': [
        { 
            codigo: '789012', 
            dominio: 'rokostream.com', 
            fecha: '2026-01-01', 
            estado: 'activo',
            servicio: 'Amazon Prime',
            mensaje: 'Your Amazon Prime verification code'
        },
        { 
            codigo: '345678', 
            dominio: 'rokostream.com', 
            fecha: '2026-01-02', 
            estado: 'expirado',
            servicio: 'Disney+',
            mensaje: 'Tu código único para Disney+'
        }
    ],
    'soporte@rokostream.com': [
        { 
            codigo: '901234', 
            dominio: 'rokostream.com', 
            fecha: '2026-01-03', 
            estado: 'activo',
            servicio: 'Apple TV+',
            mensaje: 'Verification code for Apple TV+'
        }
    ],
    'test@rokotv.xyz': [
        { 
            codigo: '567890', 
            dominio: 'rokotv.xyz', 
            fecha: '2026-01-02', 
            estado: 'activo',
            servicio: 'Disney+',
            mensaje: 'Tu código de acceso único para Disney+'
        }
    ]
};

// Función para extraer códigos de 6 dígitos de un texto (simula detección en correos)
function extraerCodigosDeTexto(texto) {
    const regex = /\b\d{6}\b/g;
    return texto.match(regex) || [];
}

// Función para simular la recepción de un correo y extraer su código
function procesarCorreo(email, asunto, cuerpo) {
    const codigos = extraerCodigosDeTexto(cuerpo);
    
    if (codigos.length > 0) {
        return {
            email: email,
            codigos: codigos,
            asunto: asunto,
            fecha: new Date().toISOString().split('T')[0],
            estado: 'activo'
        };
    }
    
    return null;
}

// Función para validar formato de código de 6 dígitos
function validarFormatoCodigo(codigo) {
    return /^\d{6}$/.test(codigo);
}

// Función para validar que el correo pertenezca a los dominios permitidos
function validarDominio(email) {
    const dominiosPermitidos = ['rokotv.xyz', 'rokostream.com'];
    const dominioEmail = email.split('@')[1].toLowerCase();
    return dominiosPermitidos.includes(dominioEmail);
}

// Función para consultar códigos por email
function consultarCodigos(email) {
    return new Promise((resolve, reject) => {
        // Simular tiempo de carga
        setTimeout(() => {
            // Validar que el correo pertenezca a los dominios permitidos
            if (!validarDominio(email)) {
                reject(new Error('El correo debe pertenecer a los dominios rokotv.xyz o rokostream.com'));
                return;
            }
            
            const codigos = baseDeDatos[email.toLowerCase()];
            if (codigos && codigos.length > 0) {
                resolve(codigos);
            } else {
                reject(new Error('No se encontraron códigos de verificación asociados a este correo electrónico'));
            }
        }, 1500);
    });
}

// Función para mostrar códigos en la interfaz
function mostrarCodigos(codigos) {
    const resultadoDiv = document.getElementById('resultado');
    const codigosList = document.getElementById('codigosList');
    
    codigosList.innerHTML = '';
    
    codigos.forEach((item, index) => {
        const codigoDiv = document.createElement('div');
        codigoDiv.className = 'codigo-item';
        codigoDiv.innerHTML = `
            <div class="codigo-header">
                <div>
                    <strong>Código de Verificación:</strong>
                    <span class="codigo-valor" id="codigo-${index}">${item.codigo}</span>
                    <button class="copy-btn ms-2" onclick="copiarCodigo('${item.codigo}', this)">
                        Copiar
                    </button>
                </div>
                <span class="badge bg-${getEstadoColor(item.estado)}">${item.estado}</span>
            </div>
            <div class="codigo-info">
                <div><strong>Servicio:</strong> ${item.servicio || 'No especificado'}</div>
                <div><strong>Dominio:</strong> ${item.dominio}</div>
                <div><strong>Fecha:</strong> ${formatearFecha(item.fecha)}</div>
                ${item.mensaje ? `<div class="mensaje-original"><strong>Mensaje original:</strong> "${item.mensaje}"</div>` : ''}
            </div>
        `;
        codigosList.appendChild(codigoDiv);
    });
    
    resultadoDiv.classList.remove('d-none');
}

// Función para obtener color según estado
function getEstadoColor(estado) {
    switch(estado.toLowerCase()) {
        case 'activo': return 'success';
        case 'pendiente': return 'warning';
        case 'expirado': return 'danger';
        default: return 'secondary';
    }
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Función para copiar código al portapapeles
function copiarCodigo(codigo, button) {
    navigator.clipboard.writeText(codigo).then(() => {
        const originalText = button.textContent;
        button.textContent = '¡Copiado!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = codigo;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        button.textContent = '¡Copiado!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = 'Copiar';
            button.classList.remove('copied');
        }, 2000);
    });
}

// Función para mostrar error
function mostrarError(message) {
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorDiv.classList.remove('d-none');
}

// Función para limpiar resultados anteriores
function limpiarResultados() {
    document.getElementById('resultado').classList.add('d-none');
    document.getElementById('error').classList.add('d-none');
}

// Event listener para el formulario
document.getElementById('consultaForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const submitButton = e.target.querySelector('button[type="submit"]');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!email) {
        mostrarError('Por favor, ingresa un correo electrónico válido');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarError('El formato del correo electrónico no es válido');
        return;
    }
    
    // Limpiar resultados anteriores
    limpiarResultados();
    
    // Mostrar estado de carga
    submitButton.disabled = true;
    loadingSpinner.classList.remove('d-none');
    
    try {
        const codigos = await consultarCodigos(email);
        mostrarCodigos(codigos);
    } catch (error) {
        mostrarError(error.message);
    } finally {
        // Restaurar estado del botón
        submitButton.disabled = false;
        loadingSpinner.classList.add('d-none');
    }
});

// Limpiar error cuando el usuario empieza a escribir
document.getElementById('email').addEventListener('input', function() {
    if (!this.value.trim()) {
        limpiarResultados();
    }
});

// Agregar algunos datos de ejemplo para pruebas
function agregarDatosEjemplo() {
    const emailEjemplo = prompt('Ingresa un correo de ejemplo (solo rokotv.xyz o rokostream.com):');
    if (emailEjemplo) {
        // Validar dominio
        if (!validarDominio(emailEjemplo)) {
            alert('El correo debe pertenecer a rokotv.xyz o rokostream.com');
            return;
        }
        
        const codigo = prompt('Ingresa el código de verificación (6 dígitos):');
        const servicio = prompt('Ingresa el servicio (ej: Disney+, Netflix, etc.):');
        const mensaje = prompt('Ingresa el mensaje original del correo:');
        const dominio = emailEjemplo.split('@')[1].toLowerCase();
        
        if (codigo && servicio) {
            // Validar formato del código
            if (!validarFormatoCodigo(codigo)) {
                alert('El código debe ser numérico de 6 dígitos');
                return;
            }
            
            if (!baseDeDatos[emailEjemplo.toLowerCase()]) {
                baseDeDatos[emailEjemplo.toLowerCase()] = [];
            }
            
            baseDeDatos[emailEjemplo.toLowerCase()].push({
                codigo: codigo,
                dominio: dominio,
                fecha: new Date().toISOString().split('T')[0],
                estado: 'activo',
                servicio: servicio,
                mensaje: mensaje || `Código de verificación para ${servicio}`
            });
            
            alert('Código agregado exitosamente para ' + emailEjemplo);
        }
    }
}

// Atajo de teclado para agregar datos (Ctrl+Shift+A)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        agregarDatosEjemplo();
    }
});
