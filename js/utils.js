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

// Cache de categorías para evitar consultas excesivas a IndexedDB
let _cacheCategorias = {
    familia: null,
    neurotea: null,
    lastUpdate: null
};

// Tiempo de vida del cache (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

// Categorías predefinidas (fallback si no hay datos en IndexedDB)
const CATEGORIAS_DEFAULT = {
    familia: {
        ingresos: {
            marco: ['salario', 'vacaciones', 'aguinaldo', 'contrato', 'viatico'],
            clara: ['salario'],
            otro: ['otros_ingresos']
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
            otro: ['otros_ingresos']
        },
        egresos: {
            fijo: ['alquiler', 'servicios', 'salarios'],
            variable: ['materiales', 'marketing', 'capacitaciones'],
            mantenimiento: ['equipos', 'local']
        }
    }
};

// Mantener CATEGORIAS para compatibilidad, pero será reemplazado dinámicamente
let CATEGORIAS = JSON.parse(JSON.stringify(CATEGORIAS_DEFAULT));

// Invalidar cache de categorías
function invalidarCacheCategorias(modulo = null) {
    if (modulo) {
        _cacheCategorias[modulo] = null;
    } else {
        _cacheCategorias.familia = null;
        _cacheCategorias.neurotea = null;
    }
    _cacheCategorias.lastUpdate = null;
}

// Cargar categorías desde IndexedDB y actualizar el objeto CATEGORIAS
async function cargarCategoriasDB(modulo) {
    try {
        // Verificar cache
        const ahora = Date.now();
        if (_cacheCategorias[modulo] && _cacheCategorias.lastUpdate &&
            (ahora - _cacheCategorias.lastUpdate) < CACHE_TTL) {
            return _cacheCategorias[modulo];
        }

        const categorias = await obtenerTodasCategorias(modulo);

        if (categorias.length === 0) {
            // No hay categorías, usar default
            return CATEGORIAS_DEFAULT[modulo];
        }

        // Organizar categorías por tipo
        const organizadas = {
            ingresos: {},
            egresos: {}
        };

        for (const cat of categorias) {
            if (cat.activa === false) continue;

            if (cat.tipo === 'ingreso') {
                const persona = cat.persona || 'otro';
                if (!organizadas.ingresos[persona]) {
                    organizadas.ingresos[persona] = [];
                }
                organizadas.ingresos[persona].push(cat.identificador);
            } else if (cat.tipo === 'egreso') {
                const tipoGasto = cat.tipoGasto || 'variable';
                if (!organizadas.egresos[tipoGasto]) {
                    organizadas.egresos[tipoGasto] = [];
                }
                organizadas.egresos[tipoGasto].push(cat.identificador);
            }
        }

        // Actualizar cache
        _cacheCategorias[modulo] = organizadas;
        _cacheCategorias.lastUpdate = ahora;

        // Actualizar objeto global CATEGORIAS
        CATEGORIAS[modulo] = organizadas;

        return organizadas;
    } catch (error) {
        console.warn('Error cargando categorías desde DB, usando default:', error);
        return CATEGORIAS_DEFAULT[modulo];
    }
}

// Obtener nombre de categoría (busca primero en DB, luego en constantes)
async function getNombreCategoriaAsync(modulo, identificador) {
    try {
        const categorias = await obtenerTodasCategorias(modulo);
        const cat = categorias.find(c => c.identificador === identificador);
        if (cat) {
            return cat.nombre;
        }
    } catch (error) {
        console.warn('Error obteniendo nombre de categoría:', error);
    }
    // Fallback a nombres predefinidos
    return NOMBRES_CATEGORIAS[identificador] || formatearCategoria(identificador);
}

// Nombres bonitos para categorías
const NOMBRES_CATEGORIAS = {
    // Ingresos FAMILIA
    salario: 'Salario',
    salario_clara: 'Salario Clara',
    vacaciones: 'Vacaciones',
    aguinaldo: 'Aguinaldo',
    contrato: 'Contrato',
    viatico: 'Viático',
    otros_ingresos: 'Otros Ingresos',

    // Ingresos NEUROTEA
    aportes_terapeutas: 'Aportes de Terapeutas',

    // Préstamos Inter-Módulo
    prestamo_recibido: 'Préstamo Recibido',
    devolucion_prestamo: 'Devolución de Préstamo',
    prestamo_inter_modulo: 'Préstamo a Módulo',
    pago_prestamo_inter_modulo: 'Pago Préstamo Inter-Módulo',

    // Egresos Fijos FAMILIA
    expensas: 'Expensas',
    ande: 'ANDE (Electricidad)',
    escuela: 'Escuela',
    agua: 'Agua (ESSAP)',
    internet: 'Internet',
    telefono: 'Teléfono',
    cuota_prestamo: 'Cuota Préstamo',

    // Egresos Variables FAMILIA
    alimentacion: 'Alimentación',
    transporte: 'Transporte/Combustible',
    salud: 'Salud/Farmacia',
    ropa: 'Ropa',
    supermercado: 'Supermercado',

    // Egresos Mantenimiento FAMILIA
    casa: 'Casa',
    vehiculo: 'Vehículo',

    // Egresos Ocio FAMILIA
    restaurantes: 'Restaurantes',
    viajes: 'Viajes',
    suscripciones: 'Suscripciones',

    // Egresos Fijos NEUROTEA
    alquiler: 'Alquiler del Local',
    servicios: 'Servicios (Luz, Agua, Internet)',
    salarios: 'Salarios del Personal',
    ips: 'IPS (Seguro Social)',
    impuestos: 'Impuestos',

    // Egresos Variables NEUROTEA
    materiales: 'Materiales/Insumos',
    marketing: 'Marketing/Publicidad',
    capacitaciones: 'Capacitaciones',
    proveedores: 'Proveedores',

    // Egresos Mantenimiento NEUROTEA
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

// ==========================================
// CONSTANTES DE FILOSOFÍA FINANCIERA
// ==========================================

// Prioridades de pago en crisis (1 = más importante)
const PRIORIDADES_PAGO = {
    1: { nombre: 'IPS/Impuestos', descripcion: 'Obligaciones legales ineludibles', icono: '⚖️' },
    2: { nombre: 'Salarios', descripcion: 'Compromisos con empleados', icono: '👥' },
    3: { nombre: 'Alquiler', descripcion: 'Techo del negocio', icono: '🏠' },
    4: { nombre: 'Proveedores', descripcion: 'Relaciones comerciales clave', icono: '🚚' },
    5: { nombre: 'Bancos', descripcion: 'Deudas financieras', icono: '🏦' },
    6: { nombre: 'Familiares/Otros', descripcion: 'Deudas flexibles', icono: '👨‍👩‍👧‍👦' }
};

// Estados de pago
const ESTADOS_PAGO = {
    ninguno: { nombre: 'Sin Estado', clase: 'estado-ninguno', icono: '⬜' },
    pendiente: { nombre: 'Pendiente', clase: 'estado-pendiente', icono: '🟡' },
    pagado: { nombre: 'Pagado', clase: 'estado-pagado', icono: '🟢' },
    cancelado: { nombre: 'Cancelado', clase: 'estado-cancelado', icono: '🔴' }
};

// Niveles de Días de Oxígeno
const NIVELES_DIAS_OXIGENO = {
    excelente: { min: 90, color: '#10B981', descripcion: 'Excelente - Más de 3 meses de reserva' },
    bueno: { min: 60, color: '#22C55E', descripcion: 'Bueno - 2 meses de reserva' },
    aceptable: { min: 30, color: '#F59E0B', descripcion: 'Aceptable - 1 mes de reserva' },
    alerta: { min: 15, color: '#F97316', descripcion: 'Alerta - Menos de 15 días' },
    critico: { min: 0, color: '#EF4444', descripcion: 'Crítico - Requiere acción inmediata' }
};

// Modelo 93/7 para NeuroTEA
const MODELO_93_7 = {
    gastos: 93, // Porcentaje máximo de gastos operativos
    ganancia: 7, // Porcentaje mínimo de ganancia
    subdivisiones: {
        reserva: 1.75,      // Reserva de emergencia
        reinversion: 1.75,  // Reinversión en el negocio
        desarrollo: 1.75,   // Desarrollo/capacitación
        distribucion: 1.75  // Distribución a socios
    }
};

// ==========================================
// FUNCIONES DE SEMÁFORO Y EVALUACIÓN
// ==========================================

// Obtener semáforo de gasto (presupuesto vs real)
function getSemaforoGasto(presupuestado, gastado) {
    if (presupuestado <= 0) return { semaforo: 'verde', icono: '🟢', porcentaje: 0 };

    const porcentaje = (gastado / presupuestado) * 100;

    if (porcentaje > 100) {
        return { semaforo: 'rojo', icono: '🔴', porcentaje: Math.round(porcentaje * 100) / 100 };
    } else if (porcentaje >= 95) {
        return { semaforo: 'amarillo', icono: '🟡', porcentaje: Math.round(porcentaje * 100) / 100 };
    }
    return { semaforo: 'verde', icono: '🟢', porcentaje: Math.round(porcentaje * 100) / 100 };
}

// Obtener nivel de días de oxígeno
function getNivelDiasOxigeno(dias) {
    if (dias >= 90) return NIVELES_DIAS_OXIGENO.excelente;
    if (dias >= 60) return NIVELES_DIAS_OXIGENO.bueno;
    if (dias >= 30) return NIVELES_DIAS_OXIGENO.aceptable;
    if (dias >= 15) return NIVELES_DIAS_OXIGENO.alerta;
    return NIVELES_DIAS_OXIGENO.critico;
}

// Evaluar cumplimiento del modelo 93/7
function evaluarModelo93_7(ingresos, gastos) {
    if (ingresos <= 0) return { cumple: false, mensaje: 'Sin ingresos' };

    const porcentajeGastos = (gastos / ingresos) * 100;
    const porcentajeGanancia = 100 - porcentajeGastos;

    return {
        cumple93: porcentajeGastos <= 93,
        cumple7: porcentajeGanancia >= 7,
        cumpleTotal: porcentajeGastos <= 93 && porcentajeGanancia >= 7,
        porcentajeGastos: Math.round(porcentajeGastos * 100) / 100,
        porcentajeGanancia: Math.round(porcentajeGanancia * 100) / 100,
        gananciaReal: ingresos - gastos
    };
}

// ==========================================
// FUNCIONES DE FECHAS SEMANALES
// ==========================================

// Obtener inicio y fin de la semana actual
function getSemanaActual() {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = Domingo

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    return {
        inicio: formatearFechaInput(inicioSemana),
        fin: formatearFechaInput(finSemana),
        inicioDate: inicioSemana,
        finDate: finSemana
    };
}

// Obtener próxima semana
function getProximaSemana() {
    const semanaActual = getSemanaActual();

    const inicio = new Date(semanaActual.finDate);
    inicio.setDate(inicio.getDate() + 1);

    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);

    return {
        inicio: formatearFechaInput(inicio),
        fin: formatearFechaInput(fin),
        inicioDate: inicio,
        finDate: fin
    };
}

// Obtener número de semana del año
function getNumeroSemana(fecha) {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Obtener días restantes del mes
function getDiasRestantesMes() {
    const hoy = new Date();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    return ultimoDia - hoy.getDate();
}

// ==========================================
// FUNCIONES DE FORMATO PARA GRÁFICOS
// ==========================================

// Formatear número corto (1.5M, 500K)
function formatearNumeroCorto(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

// Obtener color de semáforo
function getColorSemaforo(semaforo) {
    const colores = {
        verde: '#10B981',
        amarillo: '#F59E0B',
        rojo: '#EF4444'
    };
    return colores[semaforo] || colores.verde;
}

// Obtener colores para gráfico de categorías
const COLORES_GRAFICO = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarillo
    '#EF4444', // Rojo
    '#8B5CF6', // Púrpura
    '#EC4899', // Rosa
    '#06B6D4', // Cyan
    '#F97316', // Naranja
    '#84CC16', // Lima
    '#6366F1', // Índigo
    '#14B8A6', // Teal
    '#F43F5E', // Rose
];

function getColorGrafico(indice) {
    return COLORES_GRAFICO[indice % COLORES_GRAFICO.length];
}

// ==========================================
// FUNCIONES PARA ANÁLISIS DE TENDENCIAS
// ==========================================

// Calcular tendencia (subiendo, bajando, estable)
function calcularTendencia(valores) {
    if (valores.length < 2) return { tendencia: 'estable', cambio: 0 };

    const ultimo = valores[valores.length - 1];
    const anterior = valores[valores.length - 2];
    const cambio = anterior !== 0 ? ((ultimo - anterior) / anterior) * 100 : 0;

    if (cambio > 5) return { tendencia: 'subiendo', cambio: Math.round(cambio * 100) / 100, icono: '📈' };
    if (cambio < -5) return { tendencia: 'bajando', cambio: Math.round(cambio * 100) / 100, icono: '📉' };
    return { tendencia: 'estable', cambio: Math.round(cambio * 100) / 100, icono: '➡️' };
}

// Calcular promedio móvil
function promedioMovil(valores, periodo = 3) {
    if (valores.length < periodo) return valores;

    const resultado = [];
    for (let i = 0; i < valores.length; i++) {
        if (i < periodo - 1) {
            resultado.push(null);
        } else {
            let suma = 0;
            for (let j = 0; j < periodo; j++) {
                suma += valores[i - j];
            }
            resultado.push(suma / periodo);
        }
    }
    return resultado;
}

// ==========================================
// HELPER PARA INDICADOR DE BATERÍA
// ==========================================

// Obtener porcentaje de batería para días de oxígeno (máx 90 días = 100%)
function getPorcentajeBateria(diasOxigeno, maximo = 90) {
    return Math.min(100, Math.round((diasOxigeno / maximo) * 100));
}

// Obtener clase CSS de batería según nivel
function getClaseBateria(porcentaje) {
    if (porcentaje >= 75) return 'bateria-excelente';
    if (porcentaje >= 50) return 'bateria-buena';
    if (porcentaje >= 25) return 'bateria-alerta';
    return 'bateria-critica';
}
