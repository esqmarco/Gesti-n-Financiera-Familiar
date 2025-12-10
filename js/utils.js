/* ==========================================
   UTILIDADES GENERALES
   ========================================== */

// Formatear moneda (Guaraníes)
function formatearMoneda(monto) {
    if (monto === null || monto === undefined) return 'Gs. 0';
    return 'Gs. ' + Math.round(monto).toLocaleString('es-PY');
}

// Formatear fecha para mostrar
function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Formatear fecha para input
function formatearFechaInput(fecha) {
    if (!fecha) fecha = new Date();
    if (typeof fecha === 'string') fecha = new Date(fecha);
    return fecha.toISOString().split('T')[0];
}

// Formatear fecha para nombre de archivo
function formatearFechaArchivo(fecha) {
    if (!fecha) fecha = new Date();
    return fecha.toISOString().split('T')[0].replace(/-/g, '');
}

// Generar UUID
function generarId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Agrupar array por propiedad
function agruparPor(array, propiedad) {
    return array.reduce((grupos, item) => {
        const key = item[propiedad] || 'sin_categoria';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(item);
        return grupos;
    }, {});
}

// Agrupar y sumar
function agruparYSumar(array, propiedadAgrupar, propiedadSumar) {
    return array.reduce((grupos, item) => {
        const key = item[propiedadAgrupar] || 'sin_categoria';
        if (!grupos[key]) grupos[key] = 0;
        grupos[key] += item[propiedadSumar] || 0;
        return grupos;
    }, {});
}

// Sumar propiedad de array
function sumar(array, propiedad) {
    return array.reduce((sum, item) => sum + (item[propiedad] || 0), 0);
}

// Calcular variación porcentual
function calcularVariacion(actual, anterior) {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior * 100).toFixed(1);
}

// Obtener mes actual
function getMesActual() {
    const hoy = new Date();
    return {
        año: hoy.getFullYear(),
        mes: hoy.getMonth() + 1
    };
}

// Obtener rango de fechas del mes
function getRangoMes(año, mes) {
    const mesStr = String(mes).padStart(2, '0');
    const ultimoDia = new Date(año, mes, 0).getDate();
    return {
        desde: `${año}-${mesStr}-01`,
        hasta: `${año}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`
    };
}

// Obtener nombre del mes
function getNombreMes(mes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
}

// Obtener mes anterior
function getMesAnterior(año, mes) {
    if (mes === 1) {
        return { año: año - 1, mes: 12 };
    }
    return { año, mes: mes - 1 };
}

// Validar que es número positivo
function esNumeroPositivo(valor) {
    const num = parseFloat(valor);
    return !isNaN(num) && num > 0;
}

// Sanitizar texto
function sanitizarTexto(texto) {
    if (!texto) return '';
    return texto.toString().trim().replace(/[<>]/g, '');
}

// Debounce para búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mostrar toast
function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;

    // Mapear tipos españoles a clases CSS en inglés
    const tipoClase = {
        exito: 'success',
        error: 'error',
        info: 'info',
        advertencia: 'warning'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${tipoClase[tipo] || tipo}`;

    const iconos = {
        exito: '✓',
        success: '✓',
        error: '✗',
        info: 'ℹ',
        advertencia: '⚠',
        warning: '⚠'
    };

    toast.innerHTML = `<span>${iconos[tipo] || iconos.info}</span> ${mensaje}`;
    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}

// Confirmar acción
function confirmarAccion(titulo, mensaje) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirmacion');
        document.getElementById('titulo-confirmacion').textContent = titulo;
        document.getElementById('mensaje-confirmacion').textContent = mensaje;
        modal.classList.remove('hidden');

        const btnConfirmar = document.getElementById('btn-confirmar-accion');
        const btnCancelar = modal.querySelector('.btn-secondary');

        const limpiar = () => {
            modal.classList.add('hidden');
            btnConfirmar.onclick = null;
            if (btnCancelar) btnCancelar.onclick = null;
        };

        btnConfirmar.onclick = () => {
            limpiar();
            resolve(true);
        };

        if (btnCancelar) {
            btnCancelar.onclick = () => {
                limpiar();
                resolve(false);
            };
        }
    });
}

// Abrir modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

// Cerrar modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

// Cerrar modal al hacer click fuera (en el overlay)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});

// Descargar archivo
function descargarArchivo(contenido, nombreArchivo, tipo = 'application/json') {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Obtener color por índice
function getColorPorIndice(indice) {
    const colores = [
        '#F9A8D4', '#93C5FD', '#86EFAC', '#FDE047', '#A5B4FC',
        '#FBBF24', '#34D399', '#F472B6', '#60A5FA', '#A78BFA',
        '#FB923C', '#4ADE80', '#E879F9', '#38BDF8', '#C084FC'
    ];
    return colores[indice % colores.length];
}

// Capitalizar primera letra
function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Formatear nombre de categoría
function formatearCategoria(categoria) {
    if (!categoria) return '';
    return categoria.replace(/_/g, ' ').split(' ').map(capitalizar).join(' ');
}

// Validar fecha
function esFechaValida(fechaStr) {
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr);
    return fecha instanceof Date && !isNaN(fecha);
}

// Obtener días transcurridos
function diasTranscurridos(fechaStr) {
    if (!fechaStr) return 0;
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
}

// Estado vacío HTML
function estadoVacioHTML(icono, mensaje, botonTexto = null, botonOnclick = null) {
    let html = `
        <div class="estado-vacio">
            <div class="icono-vacio">${icono}</div>
            <p>${mensaje}</p>
    `;

    if (botonTexto && botonOnclick) {
        html += `<button class="btn-primario" onclick="${botonOnclick}">${botonTexto}</button>`;
    }

    html += '</div>';
    return html;
}

// Categorías predefinidas
const CATEGORIAS = {
    familia: {
        ingresos: {
            marco: ['salario', 'vacaciones', 'aguinaldo', 'contrato', 'viatico'],
            clara: ['salario'],
            otro: []
        },
        egresos: {
            fijo: ['expensas', 'ande', 'escuela', 'agua', 'internet', 'telefono', 'cuota_prestamo'],
            variable: ['alimentacion', 'transporte', 'salud', 'ropa', 'supermercado'],
            mantenimiento: ['casa', 'vehiculo'],
            ocio: ['restaurantes', 'viajes', 'suscripciones']
        }
    },
    neurotea: {
        ingresos: {
            principal: ['aportes_terapeutas'],
            otro: []
        },
        egresos: {
            fijo: ['alquiler', 'servicios', 'salarios'],
            variable: ['materiales', 'marketing', 'capacitaciones'],
            mantenimiento: ['equipos', 'local']
        }
    }
};

// Nombres bonitos para categorías
const NOMBRES_CATEGORIAS = {
    // Ingresos
    salario: 'Salario',
    vacaciones: 'Vacaciones',
    aguinaldo: 'Aguinaldo',
    contrato: 'Contrato',
    viatico: 'Viático',
    aportes_terapeutas: 'Aportes de Terapeutas',

    // Egresos
    expensas: 'Expensas',
    ande: 'ANDE (Electricidad)',
    escuela: 'Escuela',
    agua: 'Agua (ESSAP)',
    internet: 'Internet',
    telefono: 'Teléfono',
    cuota_prestamo: 'Cuota Préstamo',
    alimentacion: 'Alimentación',
    transporte: 'Transporte/Combustible',
    salud: 'Salud/Farmacia',
    ropa: 'Ropa',
    supermercado: 'Supermercado',
    casa: 'Casa',
    vehiculo: 'Vehículo',
    restaurantes: 'Restaurantes',
    viajes: 'Viajes',
    suscripciones: 'Suscripciones',
    alquiler: 'Alquiler del Local',
    servicios: 'Servicios (Luz, Agua, Internet)',
    salarios: 'Salarios del Personal',
    materiales: 'Materiales/Insumos',
    marketing: 'Marketing/Publicidad',
    capacitaciones: 'Capacitaciones',
    equipos: 'Equipos',
    local: 'Local'
};

// Obtener nombre bonito de categoría
function getNombreCategoria(categoria) {
    return NOMBRES_CATEGORIAS[categoria] || formatearCategoria(categoria);
}

// Tipos de gasto
const TIPOS_GASTO = {
    fijo: { nombre: 'Fijo', icono: '&#128204;', descripcion: 'Pagos que no cambian mes a mes' },
    variable: { nombre: 'Variable', icono: '&#128202;', descripcion: 'Cambian cada mes' },
    mantenimiento: { nombre: 'Mantenimiento', icono: '&#128295;', descripcion: 'Reparaciones y mejoras' },
    ocio: { nombre: 'Ocio/Entretenimiento', icono: '&#127918;', descripcion: 'Diversión y tiempo libre' }
};

// Tipos de cuenta
const TIPOS_CUENTA = {
    corriente: { nombre: 'Corriente', icono: '&#127974;' },
    ahorro: { nombre: 'Ahorro', icono: '&#128176;' },
    efectivo: { nombre: 'Efectivo', icono: '&#128181;' },
    otro: { nombre: 'Otro', icono: '&#128179;' }
};

// Tipos de préstamo
const TIPOS_PRESTAMO = {
    personal: { nombre: 'Personal', icono: '&#128100;' },
    hipotecario: { nombre: 'Hipotecario', icono: '&#127968;' },
    vehicular: { nombre: 'Vehicular', icono: '&#128663;' },
    tarjeta: { nombre: 'Tarjeta de Crédito', icono: '&#128179;' },
    otro: { nombre: 'Otro', icono: '&#128176;' }
};
