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
    // ═══════════════════════════════════════════════════════
    // INGRESOS FAMILIA
    // ═══════════════════════════════════════════════════════
    salario_marco: 'Salario Marco',
    vacaciones_marco: 'Vacaciones Marco',
    aguinaldo_marco: 'Aguinaldo Marco',
    viatico_marco: 'Viático Marco',
    animador_biblico: 'Animador Bíblico',
    otros_marco: 'Otros Ingresos Marco',
    honorarios_clara: 'Honorarios Clara',

    // Desde NeuroTEA
    salario_admin: 'Salario Administrador',
    ganancia_nt: 'Ganancia NT → Familia',
    prestamo_nt: 'Préstamo NT (automático)',

    // ═══════════════════════════════════════════════════════
    // EGRESOS FAMILIA - GASTOS FIJOS
    // ═══════════════════════════════════════════════════════
    salario_lili: 'Salario Lili Doméstico',
    salario_laura: 'Salario Laura Doméstico',
    escuela: 'Escuela Fabián y Brenda',
    robotica: 'Robótica Niños',
    ande_casa: 'ANDE Casa',
    expensa_casa: 'Expensa Casa',
    cajubi_marco: 'Cajubi Marco',
    mutual_marco: 'Mutual Marco',
    na_luisa: 'Ña Luisa',
    seguro_medico_papas: 'Seguro Médico Papá y Mamá',

    // ═══════════════════════════════════════════════════════
    // EGRESOS FAMILIA - CUOTAS Y PRÉSTAMOS
    // ═══════════════════════════════════════════════════════
    auto_laura: 'Auto Laura Cuota',
    coop_universitaria: 'Coop. Universitaria Clara',
    coomecipar_clara: 'Coomecipar Clara',
    tarjeta_coomecipar: 'Tarjeta Cred. Coomecipar',
    solar_1: 'Solar Préstamo 1',
    solar_2: 'Solar Préstamo 2',
    prestamo_lizzi: 'Préstamo Lizzi Sueldos',
    show_congelador: 'Show Congelador',
    olier_heladera: 'Olier Heladera',

    // ═══════════════════════════════════════════════════════
    // EGRESOS FAMILIA - SUSCRIPCIONES E INTERNET
    // ═══════════════════════════════════════════════════════
    giganet: 'Giganet',
    tigo_internet: 'Tigo Internet/Celulares',
    tigo_familiar: 'Tigo Familiar',
    google_one: 'Google One',
    chatgpt: 'ChatGPT',
    claude_marco: 'Claude Marco',
    claude_clara: 'Claude Clara',
    ilovepdf: 'iLovePDF',

    // ═══════════════════════════════════════════════════════
    // EGRESOS FAMILIA - VARIABLES
    // ═══════════════════════════════════════════════════════
    alimentacion: 'Alimentación',
    combustible: 'Combustible',
    salud: 'Salud y Medicamentos',
    supermercado: 'Supermercado',
    farmacia: 'Farmacia',
    recreacion: 'Recreación',
    gastos_varios: 'Gastos Varios Familia',

    // ═══════════════════════════════════════════════════════
    // INGRESOS NEUROTEA
    // ═══════════════════════════════════════════════════════
    sesiones_individuales: 'Sesiones Individuales',
    paquetes_sesiones: 'Paquetes de Sesiones',
    evaluaciones: 'Evaluaciones',
    otros_nt: 'Otros Ingresos NT',

    // ═══════════════════════════════════════════════════════
    // EGRESOS NEUROTEA - GASTOS FIJOS
    // ═══════════════════════════════════════════════════════
    alquiler_1: 'Alquiler 1 (Principal)',
    alquiler_2: 'Alquiler 2 (Secundario)',
    limpieza_nt: 'Limpieza NeuroTEA',

    // ═══════════════════════════════════════════════════════
    // EGRESOS NEUROTEA - SUELDOS Y HONORARIOS
    // ═══════════════════════════════════════════════════════
    sueldo_aracely: 'Sueldo Aracely',
    sueldo_fatima: 'Sueldo Fátima',
    honorario_contador: 'Honorario Contador',
    salario_administrador: 'Salario Administrador',
    honorario_sistema: 'Honorario Mant. Sistema',

    // ═══════════════════════════════════════════════════════
    // EGRESOS NEUROTEA - TELEFONÍA E INTERNET
    // ═══════════════════════════════════════════════════════
    celular_nt: 'Celular Tigo NeuroTEA',
    celular_sistema: 'Celular Tigo Sistema',
    whatsflow: 'WhatsFlow',
    internet_nt: 'Internet NeuroTEA',

    // ═══════════════════════════════════════════════════════
    // EGRESOS NEUROTEA - IMPUESTOS
    // ═══════════════════════════════════════════════════════
    iva: 'IVA',
    ips: 'IPS',

    // ═══════════════════════════════════════════════════════
    // EGRESOS NEUROTEA - EVENTOS
    // ═══════════════════════════════════════════════════════
    dia_nino: 'Día del Niño NT',
    san_juan: 'San Juan NT',
    dia_autismo: 'Día del Autismo NT',
    clausura_padres: 'Clausura Padres NT',
    navidad: 'Navidad Papá Noel NT',
    cena_fin_ano: 'Cena Fin de Año NT',

    // ═══════════════════════════════════════════════════════
    // EGRESOS NEUROTEA - VARIABLES
    // ═══════════════════════════════════════════════════════
    insumos_nt: 'Insumos NT',
    papeleria_nt: 'Papelería NT',
    mantenimiento_nt: 'Mantenimiento NT',
    cursos_nt: 'Gastos Cursos NT',
    gastos_varios_nt: 'Gastos Varios NT',

    // ═══════════════════════════════════════════════════════
    // PRÉSTAMOS INTER-MÓDULO
    // ═══════════════════════════════════════════════════════
    prestamo_recibido: 'Préstamo Recibido',
    devolucion_prestamo: 'Devolución de Préstamo',
    prestamo_inter_modulo: 'Préstamo a Módulo',
    pago_prestamo_inter_modulo: 'Pago Préstamo Inter-Módulo'
};

// ═══════════════════════════════════════════════════════
// ESTRUCTURA DE CATEGORÍAS POR MÓDULO Y GRUPO
// ═══════════════════════════════════════════════════════

const CATEGORIAS_FAMILIA = {
    ingresos: {
        marco: ['salario_marco', 'vacaciones_marco', 'aguinaldo_marco', 'viatico_marco', 'animador_biblico', 'otros_marco'],
        clara: ['honorarios_clara'],
        desde_nt: ['salario_admin', 'ganancia_nt', 'prestamo_nt']
    },
    egresos: {
        gastos_fijos: ['salario_lili', 'salario_laura', 'escuela', 'robotica', 'ande_casa', 'expensa_casa', 'cajubi_marco', 'mutual_marco', 'na_luisa', 'seguro_medico_papas'],
        cuotas_prestamos: ['auto_laura', 'coop_universitaria', 'coomecipar_clara', 'tarjeta_coomecipar', 'solar_1', 'solar_2', 'prestamo_lizzi', 'show_congelador', 'olier_heladera'],
        suscripciones: ['giganet', 'tigo_internet', 'tigo_familiar', 'google_one', 'chatgpt', 'claude_marco', 'claude_clara', 'ilovepdf'],
        variables: ['alimentacion', 'combustible', 'salud', 'supermercado', 'farmacia', 'recreacion', 'gastos_varios']
    }
};

const CATEGORIAS_NEUROTEA = {
    ingresos: {
        principal: ['sesiones_individuales', 'paquetes_sesiones', 'evaluaciones', 'otros_nt']
    },
    egresos: {
        gastos_fijos: ['alquiler_1', 'alquiler_2', 'limpieza_nt'],
        sueldos_honorarios: ['sueldo_aracely', 'sueldo_fatima', 'honorario_contador', 'salario_administrador', 'honorario_sistema'],
        telefonia_internet: ['celular_nt', 'celular_sistema', 'whatsflow', 'internet_nt'],
        impuestos: ['iva', 'ips'],
        eventos: ['dia_nino', 'san_juan', 'dia_autismo', 'clausura_padres', 'navidad', 'cena_fin_ano'],
        variables: ['insumos_nt', 'papeleria_nt', 'mantenimiento_nt', 'cursos_nt', 'gastos_varios_nt']
    }
};

// Cuentas predefinidas por módulo
const CUENTAS_PREDEFINIDAS = {
    familia: [
        { nombre: 'ITAU Marco', tipo: 'corriente' },
        { nombre: 'ITAU Clara', tipo: 'corriente' },
        { nombre: 'UENO Clara', tipo: 'corriente' },
        { nombre: 'Coop. Universitaria Marco', tipo: 'ahorro' },
        { nombre: 'Efectivo', tipo: 'efectivo' }
    ],
    neurotea: [
        { nombre: 'Atlas', tipo: 'corriente' },
        { nombre: 'Caja NT', tipo: 'efectivo' }
    ]
};

// Tipos de movimiento
const TIPOS_MOVIMIENTO = {
    ingreso_nt: { nombre: 'Ingreso NeuroTEA', modulo: 'neurotea', tipo: 'ingreso' },
    ingreso_marco: { nombre: 'Ingreso Marco', modulo: 'familia', tipo: 'ingreso', persona: 'marco' },
    ingreso_clara: { nombre: 'Ingreso Clara', modulo: 'familia', tipo: 'ingreso', persona: 'clara' },
    egreso_nt: { nombre: 'Egreso NeuroTEA', modulo: 'neurotea', tipo: 'egreso' },
    egreso_familiar: { nombre: 'Egreso Familiar', modulo: 'familia', tipo: 'egreso' },
    prestamo_nt_familia: { nombre: 'Préstamo NT → Familia', origen: 'neurotea', destino: 'familia' },
    devolucion_familia_nt: { nombre: 'Devolución Familia → NT', origen: 'familia', destino: 'neurotea' }
};

// Función para obtener categorías por módulo y tipo
function getCategoriasModulo(modulo, tipo) {
    const estructura = modulo === 'familia' ? CATEGORIAS_FAMILIA : CATEGORIAS_NEUROTEA;
    const categorias = estructura[tipo];

    if (!categorias) return [];

    // Aplanar todas las categorías
    const resultado = [];
    for (const [grupo, cats] of Object.entries(categorias)) {
        for (const cat of cats) {
            resultado.push({
                identificador: cat,
                nombre: NOMBRES_CATEGORIAS[cat] || cat,
                grupo: grupo
            });
        }
    }
    return resultado;
}

// Función para obtener grupos de categorías
function getGruposCategoria(modulo, tipo) {
    const estructura = modulo === 'familia' ? CATEGORIAS_FAMILIA : CATEGORIAS_NEUROTEA;
    return estructura[tipo] || {};
}

// Obtener nombre bonito de categoría
function getNombreCategoria(categoria) {
    return NOMBRES_CATEGORIAS[categoria] || formatearCategoria(categoria);
}

// Tipos de gasto - Grupos del Excel por módulo
const TIPOS_GASTO_FAMILIA = {
    gastos_fijos: { nombre: 'Gastos Fijos', icono: '📌', descripcion: 'Pagos fijos mensuales del hogar' },
    cuotas_prestamos: { nombre: 'Cuotas y Préstamos', icono: '💳', descripcion: 'Cuotas de préstamos y tarjetas' },
    suscripciones: { nombre: 'Suscripciones e Internet', icono: '📱', descripcion: 'Servicios digitales y telefonía' },
    variables: { nombre: 'Variables', icono: '📊', descripcion: 'Gastos que varían mes a mes' }
};

const TIPOS_GASTO_NEUROTEA = {
    gastos_fijos: { nombre: 'Gastos Fijos', icono: '📌', descripcion: 'Alquileres y servicios fijos' },
    sueldos_honorarios: { nombre: 'Sueldos y Honorarios', icono: '👥', descripcion: 'Pagos al personal y profesionales' },
    telefonia_internet: { nombre: 'Telefonía e Internet', icono: '📱', descripcion: 'Comunicaciones de la clínica' },
    impuestos: { nombre: 'Impuestos', icono: '⚖️', descripcion: 'Obligaciones tributarias (IVA, IPS)' },
    eventos: { nombre: 'Eventos', icono: '🎉', descripcion: 'Celebraciones y actividades especiales' },
    variables: { nombre: 'Variables', icono: '📊', descripcion: 'Insumos y gastos operativos' }
};

// Función para obtener tipos de gasto según módulo
function getTiposGasto(modulo) {
    return modulo === 'familia' ? TIPOS_GASTO_FAMILIA : TIPOS_GASTO_NEUROTEA;
}

// TIPOS_GASTO genérico para compatibilidad (fallback)
const TIPOS_GASTO = {
    gastos_fijos: { nombre: 'Gastos Fijos', icono: '📌', descripcion: 'Pagos fijos mensuales' },
    cuotas_prestamos: { nombre: 'Cuotas y Préstamos', icono: '💳', descripcion: 'Cuotas de préstamos' },
    sueldos_honorarios: { nombre: 'Sueldos y Honorarios', icono: '👥', descripcion: 'Pagos al personal' },
    suscripciones: { nombre: 'Suscripciones', icono: '📱', descripcion: 'Servicios digitales' },
    telefonia_internet: { nombre: 'Telefonía e Internet', icono: '📱', descripcion: 'Comunicaciones' },
    impuestos: { nombre: 'Impuestos', icono: '⚖️', descripcion: 'Obligaciones tributarias' },
    eventos: { nombre: 'Eventos', icono: '🎉', descripcion: 'Celebraciones' },
    variables: { nombre: 'Variables', icono: '📊', descripcion: 'Gastos que varían' }
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
