// Script actualizado para conectar con la API real
const API_BASE_URL = window.location.origin + '/api';

// Función para consultar códigos por email
async function consultarCodigos(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/codigos/${encodeURIComponent(email)}`);
        
        if (response.status === 404) {
            throw new Error('No se encontraron códigos de verificación asociados a este correo electrónico');
        }
        
        if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.error);
        }
        
        if (!response.ok) {
            throw new Error('Error al consultar los códigos');
        }
        
        const codigos = await response.json();
        return codigos;
        
    } catch (error) {
        throw error;
    }
}

// Función para mostrar el último código de Disney+
function mostrarCodigo(codigo) {
    const resultadoDiv = document.getElementById('resultado');
    const codigosList = document.getElementById('codigosList');
    
    codigosList.innerHTML = '';
    
    const codigoDiv = document.createElement('div');
    codigoDiv.className = 'codigo-item';
    codigoDiv.innerHTML = `
        <div class="codigo-header">
            <div>
                <strong>Código de Disney+:</strong>
                <span class="codigo-valor">${codigo.codigo}</span>
                <button class="copy-btn ms-2" onclick="copiarCodigo('${codigo.codigo}', this)">
                    Copiar Código
                </button>
            </div>
            <span class="badge bg-${getEstadoColor(codigo.estado)}">${codigo.estado}</span>
        </div>
        <div class="codigo-info">
            <div><strong>📧 Correo:</strong> ${codigo.email}</div>
            <div><strong>🏢 Dominio:</strong> ${codigo.dominio}</div>
            <div><strong>📅 Fecha y Hora del Correo:</strong> ${formatearFechaCompleta(codigo.fecha_envio)}</div>
            ${codigo.mensaje ? `<div class="mensaje-original"><strong>📄 Asunto:</strong> "${codigo.mensaje}"</div>` : ''}
            <div class="disney-info">
                <strong>⚠️ Importante:</strong> Este código vence en 15 minutos
            </div>
        </div>
    `;
    codigosList.appendChild(codigoDiv);
    
    resultadoDiv.classList.remove('d-none');
}

// Función para obtener color según estado
function getEstadoColor(estado) {
    switch(estado.toLowerCase()) {
        case 'activo': return 'success';
        case 'usado': return 'warning';
        case 'expirado': return 'danger';
        default: return 'secondary';
    }
}

// Función para formatear fecha completa
function formatearFechaCompleta(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Función para formatear fecha (mantener por si se necesita)
function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

// Función para validar que el correo pertenezca a los dominios permitidos
function validarDominio(email) {
    const dominiosPermitidos = ['rokotv.xyz', 'rokostream.com'];
    const dominioEmail = email.split('@')[1].toLowerCase();
    return dominiosPermitidos.includes(dominioEmail);
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
    
    // Validar dominio
    if (!validarDominio(email)) {
        mostrarError('El correo debe pertenecer a los dominios rokotv.xyz o rokostream.com');
        return;
    }
    
    // Limpiar resultados anteriores
    limpiarResultados();
    
    // Mostrar estado de carga
    submitButton.disabled = true;
    loadingSpinner.classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_BASE_URL}/codigos/${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se encontraron códigos de verificación asociados a este correo electrónico`);
        }
        
        const codigos = await response.json();
        
        // La API devuelve un array, pero necesitamos solo el primer código
        const codigo = Array.isArray(codigos) ? codigos[0] : codigos;
        
        if (codigo) {
            mostrarCodigo(codigo);
        } else {
            mostrarError('No se encontraron códigos de verificación asociados a este correo electrónico');
        }
    } catch (error) {
        mostrarError('Error al consultar los códigos: ' + error.message);
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

// Evitar que el formulario se recargue
document.getElementById('consultaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    return false;
});

// Verificar estado del servidor al cargar la página
async function verificarEstadoServidor() {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        const status = await response.json();
        
        if (status.status === 'online') {
            console.log('✅ Servidor en línea');
            if (status.emailReader) {
                console.log('📧 Lector de correos activo');
            } else {
                console.log('⚠️ Lector de correos inactivo');
            }
        }
    } catch (error) {
        console.error('❌ No se puede conectar con el servidor:', error);
        mostrarError('No se puede conectar con el servidor. Por favor, verifica que el backend esté en ejecución.');
    }
}

// Verificar estado al cargar la página
document.addEventListener('DOMContentLoaded', verificarEstadoServidor);
