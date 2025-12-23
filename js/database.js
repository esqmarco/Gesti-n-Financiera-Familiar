/* ==========================================
   SISTEMA DE BASE DE DATOS - IndexedDB
   ========================================== */

const DB_NAME = 'GestorFinancieroApp';
const DB_VERSION = 3;  // Incrementado para nueva arquitectura: gastos_fijos, deudas, prestamos_inter_modulo

let db = null;

// Configuración de stores
const STORES_CONFIG = {
    // FAMILIA
    familia_ingresos: { keyPath: 'id', indexes: ['fecha', 'persona', 'categoria', 'cuentaDestino'] },
    familia_egresos: { keyPath: 'id', indexes: ['fecha', 'tipoGasto', 'categoria', 'cuentaOrigen', 'prestamoId'] },
    familia_prestamos: { keyPath: 'id', indexes: ['estado', 'fechaProximoPago'] },
    familia_cuentas: { keyPath: 'id', indexes: ['tipo', 'activa'] },
    familia_transferencias: { keyPath: 'id', indexes: ['fecha', 'cuentaOrigen', 'cuentaDestino'] },
    familia_metas: { keyPath: 'id', indexes: ['estado'] },
    familia_presupuesto: { keyPath: 'id', indexes: ['año', 'mes'] },
    familia_categorias: { keyPath: 'id', indexes: ['tipo', 'tipoGasto', 'activa', 'identificador'] },
    familia_recurrentes: { keyPath: 'id', indexes: ['tipo', 'activo'] },
    familia_papelera: { keyPath: 'id', indexes: ['tipo', 'storeName', 'deletedAt', 'expiresAt'] },
    familia_gastos_fijos: { keyPath: 'id', indexes: ['categoria', 'activo', 'diaVencimiento', 'prioridad'] },
    familia_deudas: { keyPath: 'id', indexes: ['tipo', 'estado', 'prioridad', 'fechaProximoPago'] },

    // NEUROTEA
    neurotea_ingresos: { keyPath: 'id', indexes: ['fecha', 'categoria', 'cuentaDestino'] },
    neurotea_egresos: { keyPath: 'id', indexes: ['fecha', 'tipoGasto', 'categoria', 'cuentaOrigen'] },
    neurotea_cuentas: { keyPath: 'id', indexes: ['tipo', 'activa'] },
    neurotea_presupuesto: { keyPath: 'id', indexes: ['año', 'mes'] },
    neurotea_categorias: { keyPath: 'id', indexes: ['tipo', 'tipoGasto', 'activa', 'identificador'] },
    neurotea_recurrentes: { keyPath: 'id', indexes: ['tipo', 'activo'] },
    neurotea_papelera: { keyPath: 'id', indexes: ['tipo', 'storeName', 'deletedAt', 'expiresAt'] },
    neurotea_gastos_fijos: { keyPath: 'id', indexes: ['categoria', 'activo', 'diaVencimiento', 'prioridad'] },
    neurotea_deudas: { keyPath: 'id', indexes: ['tipo', 'estado', 'prioridad', 'fechaProximoPago'] },

    // GLOBAL
    configuracion: { keyPath: 'id', indexes: [] },
    prestamos_inter_modulo: { keyPath: 'id', indexes: ['origen', 'destino', 'estado', 'fecha'] }
};

// Días de retención en papelera antes de eliminación permanente
const DIAS_RETENCION_PAPELERA = 30;

// Inicializar base de datos
async function inicializarDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Error al abrir IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Base de datos inicializada correctamente');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Crear todos los object stores
            for (const [storeName, config] of Object.entries(STORES_CONFIG)) {
                if (!database.objectStoreNames.contains(storeName)) {
                    const store = database.createObjectStore(storeName, { keyPath: config.keyPath });

                    // Crear índices
                    for (const indexName of config.indexes) {
                        store.createIndex(indexName, indexName, { unique: false });
                    }

                    console.log(`Store creado: ${storeName}`);
                }
            }
        };
    });
}

// Operación genérica de store
function getStore(storeName, mode = 'readonly') {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
}

// ==========================================
// OPERACIONES CRUD GENÉRICAS
// ==========================================

// Crear registro
async function crear(storeName, datos) {
    return new Promise((resolve, reject) => {
        const registro = {
            ...datos,
            id: datos.id || generarId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const store = getStore(storeName, 'readwrite');
        const request = store.add(registro);

        request.onsuccess = () => resolve(registro);
        request.onerror = () => reject(request.error);
    });
}

// Obtener todos los registros
async function obtenerTodos(storeName) {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Obtener un registro por ID
async function obtenerPorId(storeName, id) {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Actualizar registro
async function actualizar(storeName, id, nuevosDatos) {
    return new Promise(async (resolve, reject) => {
        try {
            const registro = await obtenerPorId(storeName, id);
            if (!registro) {
                reject(new Error('Registro no encontrado'));
                return;
            }

            const actualizado = {
                ...registro,
                ...nuevosDatos,
                id: registro.id, // Mantener ID original
                createdAt: registro.createdAt, // Mantener fecha creación
                updatedAt: new Date().toISOString()
            };

            const store = getStore(storeName, 'readwrite');
            const request = store.put(actualizado);

            request.onsuccess = () => resolve(actualizado);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

// Eliminar registro
async function eliminar(storeName, id) {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.delete(id);

        request.onsuccess = () => resolve({ eliminado: true, id });
        request.onerror = () => reject(request.error);
    });
}

// Limpiar un store completo
async function limpiarStore(storeName) {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.clear();

        request.onsuccess = () => resolve({ limpiado: true, store: storeName });
        request.onerror = () => reject(request.error);
    });
}

// ==========================================
// CONSULTAS ESPECÍFICAS
// ==========================================

// Obtener registros por índice
async function obtenerPorIndice(storeName, indexName, valor) {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(valor);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Obtener registros en rango de fechas
async function obtenerPorRangoFecha(storeName, fechaDesde, fechaHasta) {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName);
        const index = store.index('fecha');
        const rango = IDBKeyRange.bound(fechaDesde, fechaHasta);
        const request = index.getAll(rango);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Obtener ingresos del mes
async function obtenerIngresosMes(modulo, año, mes) {
    const rango = getRangoMes(año, mes);
    return await obtenerPorRangoFecha(`${modulo}_ingresos`, rango.desde, rango.hasta);
}

// Obtener egresos del mes
async function obtenerEgresosMes(modulo, año, mes) {
    const rango = getRangoMes(año, mes);
    return await obtenerPorRangoFecha(`${modulo}_egresos`, rango.desde, rango.hasta);
}

// Obtener transferencias del mes (solo familia)
async function obtenerTransferenciasMes(año, mes) {
    const rango = getRangoMes(año, mes);
    return await obtenerPorRangoFecha('familia_transferencias', rango.desde, rango.hasta);
}

// ==========================================
// CÁLCULOS (Nunca almacenados)
// ==========================================

// Calcular resumen del mes
async function calcularResumenMes(modulo, año, mes) {
    const ingresos = await obtenerIngresosMes(modulo, año, mes);
    const egresos = await obtenerEgresosMes(modulo, año, mes);

    const totalIngresos = sumar(ingresos, 'monto');
    const totalEgresos = sumar(egresos, 'monto');
    const balance = totalIngresos - totalEgresos;

    // Agrupar por categorías
    const ingresosPorCategoria = agruparYSumar(ingresos, 'categoria', 'monto');
    const egresosPorTipo = agruparYSumar(egresos, 'tipoGasto', 'monto');
    const egresosPorCategoria = agruparYSumar(egresos, 'categoria', 'monto');

    // Si es familia, agrupar por persona
    let ingresosPorPersona = {};
    if (modulo === 'familia') {
        ingresosPorPersona = agruparYSumar(ingresos, 'persona', 'monto');
    }

    return {
        año,
        mes,
        totalIngresos,
        totalEgresos,
        balance,
        esPositivo: balance >= 0,
        ingresosPorCategoria,
        ingresosPorPersona,
        egresosPorTipo,
        egresosPorCategoria,
        cantidadIngresos: ingresos.length,
        cantidadEgresos: egresos.length
    };
}

// Calcular saldo de cuenta
async function calcularSaldoCuenta(modulo, cuentaId) {
    const cuenta = await obtenerPorId(`${modulo}_cuentas`, cuentaId);
    if (!cuenta) return 0;

    let saldo = cuenta.saldoInicial || 0;

    // Sumar ingresos
    const ingresos = await obtenerPorIndice(`${modulo}_ingresos`, 'cuentaDestino', cuentaId);
    saldo += sumar(ingresos, 'monto');

    // Restar egresos
    const egresos = await obtenerPorIndice(`${modulo}_egresos`, 'cuentaOrigen', cuentaId);
    saldo -= sumar(egresos, 'monto');

    // Si es familia, considerar transferencias
    if (modulo === 'familia') {
        const transEntrantes = await obtenerPorIndice('familia_transferencias', 'cuentaDestino', cuentaId);
        saldo += sumar(transEntrantes, 'monto');

        const transSalientes = await obtenerPorIndice('familia_transferencias', 'cuentaOrigen', cuentaId);
        saldo -= sumar(transSalientes, 'monto');
    }

    return saldo;
}

// Calcular todos los saldos de cuentas
async function calcularTodosSaldos(modulo) {
    const cuentas = await obtenerTodos(`${modulo}_cuentas`);
    const resultado = [];

    for (const cuenta of cuentas) {
        const saldoActual = await calcularSaldoCuenta(modulo, cuenta.id);
        resultado.push({
            ...cuenta,
            saldoActual
        });
    }

    return resultado;
}

// ==========================================
// PRÉSTAMOS (Solo Familia)
// ==========================================

// Registrar pago de préstamo
async function registrarPagoPrestamo(prestamoId, monto, fecha) {
    const prestamo = await obtenerPorId('familia_prestamos', prestamoId);
    if (!prestamo) throw new Error('Préstamo no encontrado');
    if (prestamo.estado === 'pagado') throw new Error('Este préstamo ya está pagado');

    // Crear egreso asociado
    const egreso = await crear('familia_egresos', {
        fecha,
        tipoGasto: 'fijo',
        categoria: 'cuota_prestamo',
        monto,
        descripcion: `Cuota #${prestamo.cuotasPagadas + 1} - ${prestamo.nombre}`,
        prestamoId
    });

    // Actualizar préstamo
    const nuevoPago = {
        id: generarId(),
        fecha,
        monto,
        cuotaNumero: prestamo.cuotasPagadas + 1,
        egresoGeneradoId: egreso.id
    };

    const historialPagos = [...(prestamo.historialPagos || []), nuevoPago];
    const cuotasPagadas = prestamo.cuotasPagadas + 1;
    const saldoPendiente = prestamo.saldoPendiente - monto;

    // Calcular próxima fecha
    const proximaFecha = new Date(fecha);
    proximaFecha.setMonth(proximaFecha.getMonth() + 1);

    let estado = 'activo';
    if (cuotasPagadas >= prestamo.totalCuotas || saldoPendiente <= 0) {
        estado = 'pagado';
    }

    await actualizar('familia_prestamos', prestamoId, {
        historialPagos,
        cuotasPagadas,
        saldoPendiente: Math.max(0, saldoPendiente),
        fechaProximoPago: proximaFecha.toISOString().split('T')[0],
        estado
    });

    return { prestamo: await obtenerPorId('familia_prestamos', prestamoId), egreso };
}

// Eliminar pago de préstamo (reversibilidad)
async function eliminarPagoPrestamo(prestamoId, pagoId) {
    const prestamo = await obtenerPorId('familia_prestamos', prestamoId);
    if (!prestamo) throw new Error('Préstamo no encontrado');

    const indicePago = (prestamo.historialPagos || []).findIndex(p => p.id === pagoId);
    if (indicePago === -1) throw new Error('Pago no encontrado');

    const pago = prestamo.historialPagos[indicePago];

    // Eliminar egreso asociado
    if (pago.egresoGeneradoId) {
        await eliminar('familia_egresos', pago.egresoGeneradoId);
    }

    // Revertir préstamo
    const historialPagos = prestamo.historialPagos.filter(p => p.id !== pagoId);
    const cuotasPagadas = prestamo.cuotasPagadas - 1;
    const saldoPendiente = prestamo.saldoPendiente + pago.monto;

    await actualizar('familia_prestamos', prestamoId, {
        historialPagos,
        cuotasPagadas: Math.max(0, cuotasPagadas),
        saldoPendiente,
        estado: 'activo'
    });

    return { exito: true, montoRevertido: pago.monto };
}

// ==========================================
// METAS (Solo Familia)
// ==========================================

// Agregar aporte a meta
async function agregarAporteMeta(metaId, monto, fecha, nota = '') {
    const meta = await obtenerPorId('familia_metas', metaId);
    if (!meta) throw new Error('Meta no encontrada');

    const nuevoAporte = {
        id: generarId(),
        fecha,
        monto,
        nota
    };

    const aportes = [...(meta.aportes || []), nuevoAporte];
    const montoAcumulado = sumar(aportes, 'monto');
    const progreso = (montoAcumulado / meta.montoObjetivo) * 100;

    let estado = meta.estado;
    if (progreso >= 100) {
        estado = 'completada';
    }

    await actualizar('familia_metas', metaId, {
        aportes,
        montoAcumulado,
        progreso: Math.min(100, progreso),
        estado
    });

    return await obtenerPorId('familia_metas', metaId);
}

// Eliminar aporte de meta
async function eliminarAporteMeta(metaId, aporteId) {
    const meta = await obtenerPorId('familia_metas', metaId);
    if (!meta) throw new Error('Meta no encontrada');

    const aportes = (meta.aportes || []).filter(a => a.id !== aporteId);
    const montoAcumulado = sumar(aportes, 'monto');
    const progreso = meta.montoObjetivo > 0 ? (montoAcumulado / meta.montoObjetivo) * 100 : 0;

    await actualizar('familia_metas', metaId, {
        aportes,
        montoAcumulado,
        progreso: Math.min(100, progreso),
        estado: progreso >= 100 ? 'completada' : 'activa'
    });

    return await obtenerPorId('familia_metas', metaId);
}

// ==========================================
// PRESUPUESTO
// ==========================================

// Obtener presupuesto del mes
async function obtenerPresupuestoMes(modulo, año, mes) {
    const todos = await obtenerTodos(`${modulo}_presupuesto`);
    return todos.find(p => p.año === año && p.mes === mes) || null;
}

// Calcular ejecución presupuestaria
async function calcularEjecucionPresupuesto(modulo, año, mes) {
    const presupuesto = await obtenerPresupuestoMes(modulo, año, mes);

    if (!presupuesto) {
        return { hayPresupuesto: false };
    }

    const egresos = await obtenerEgresosMes(modulo, año, mes);

    // Agrupar egresos reales
    const gastosReales = {};
    for (const egreso of egresos) {
        const tipo = egreso.tipoGasto;
        const cat = egreso.categoria;

        if (!gastosReales[tipo]) gastosReales[tipo] = {};
        if (!gastosReales[tipo][cat]) gastosReales[tipo][cat] = 0;
        gastosReales[tipo][cat] += egreso.monto;
    }

    // Comparar
    const comparativa = [];
    let totalPresupuestado = 0;
    let totalGastado = 0;

    for (const [tipo, categorias] of Object.entries(presupuesto.limites || {})) {
        for (const [categoria, limite] of Object.entries(categorias)) {
            const gastado = gastosReales[tipo]?.[categoria] || 0;
            const disponible = limite - gastado;
            const porcentaje = limite > 0 ? (gastado / limite) * 100 : 0;

            let estado = 'ok';
            if (porcentaje >= 100) estado = 'excedido';
            else if (porcentaje >= 90) estado = 'critico';
            else if (porcentaje >= 80) estado = 'alerta';

            comparativa.push({
                tipo,
                categoria,
                presupuestado: limite,
                gastado,
                disponible,
                porcentaje: Math.round(porcentaje * 100) / 100,
                estado
            });

            totalPresupuestado += limite;
            totalGastado += gastado;
        }
    }

    return {
        hayPresupuesto: true,
        año,
        mes,
        totalPresupuestado,
        totalGastado,
        totalDisponible: totalPresupuestado - totalGastado,
        porcentajeGeneral: totalPresupuestado > 0 ? Math.round((totalGastado / totalPresupuestado) * 10000) / 100 : 0,
        detalle: comparativa,
        alertas: comparativa.filter(c => c.estado !== 'ok'),
        excedidos: comparativa.filter(c => c.estado === 'excedido')
    };
}

// Copiar presupuesto del mes anterior
async function copiarPresupuestoMesAnterior(modulo, añoDestino, mesDestino) {
    const anterior = getMesAnterior(añoDestino, mesDestino);
    const origen = await obtenerPresupuestoMes(modulo, anterior.año, anterior.mes);

    if (!origen) {
        throw new Error('No hay presupuesto del mes anterior para copiar');
    }

    const nuevo = await crear(`${modulo}_presupuesto`, {
        año: añoDestino,
        mes: mesDestino,
        limites: JSON.parse(JSON.stringify(origen.limites)),
        notas: `Copiado de ${anterior.mes}/${anterior.año}`
    });

    return nuevo;
}

// ==========================================
// RESPALDO Y RESTAURACIÓN
// ==========================================

// Exportar todos los datos
async function exportarTodosLosDatos() {
    const datos = {
        version: '3.0',
        fechaExportacion: new Date().toISOString(),
        familia: {
            ingresos: await obtenerTodos('familia_ingresos'),
            egresos: await obtenerTodos('familia_egresos'),
            prestamos: await obtenerTodos('familia_prestamos'),
            cuentas: await obtenerTodos('familia_cuentas'),
            transferencias: await obtenerTodos('familia_transferencias'),
            metas: await obtenerTodos('familia_metas'),
            presupuesto: await obtenerTodos('familia_presupuesto'),
            categorias: await obtenerTodos('familia_categorias'),
            recurrentes: await obtenerTodos('familia_recurrentes'),
            gastos_fijos: await obtenerTodos('familia_gastos_fijos'),
            deudas: await obtenerTodos('familia_deudas')
        },
        neurotea: {
            ingresos: await obtenerTodos('neurotea_ingresos'),
            egresos: await obtenerTodos('neurotea_egresos'),
            cuentas: await obtenerTodos('neurotea_cuentas'),
            presupuesto: await obtenerTodos('neurotea_presupuesto'),
            categorias: await obtenerTodos('neurotea_categorias'),
            recurrentes: await obtenerTodos('neurotea_recurrentes'),
            gastos_fijos: await obtenerTodos('neurotea_gastos_fijos'),
            deudas: await obtenerTodos('neurotea_deudas')
        },
        prestamos_inter_modulo: await obtenerTodos('prestamos_inter_modulo'),
        configuracion: await obtenerTodos('configuracion')
    };

    return datos;
}

// Importar datos desde respaldo
async function importarDatos(datos) {
    if (!datos.version || !datos.familia || !datos.neurotea) {
        throw new Error('Archivo de respaldo inválido');
    }

    // Limpiar datos actuales
    const storesFamilia = [
        'familia_ingresos', 'familia_egresos', 'familia_prestamos',
        'familia_cuentas', 'familia_transferencias', 'familia_metas',
        'familia_presupuesto', 'familia_categorias', 'familia_recurrentes',
        'familia_gastos_fijos', 'familia_deudas'
    ];

    const storesNeurotea = [
        'neurotea_ingresos', 'neurotea_egresos', 'neurotea_cuentas',
        'neurotea_presupuesto', 'neurotea_categorias', 'neurotea_recurrentes',
        'neurotea_gastos_fijos', 'neurotea_deudas'
    ];

    for (const store of [...storesFamilia, ...storesNeurotea, 'prestamos_inter_modulo', 'configuracion']) {
        await limpiarStore(store);
    }

    // Importar familia
    for (const [key, registros] of Object.entries(datos.familia)) {
        const storeName = `familia_${key}`;
        if (STORES_CONFIG[storeName]) {
            for (const registro of registros) {
                await crear(storeName, registro);
            }
        }
    }

    // Importar neurotea
    for (const [key, registros] of Object.entries(datos.neurotea)) {
        const storeName = `neurotea_${key}`;
        if (STORES_CONFIG[storeName]) {
            for (const registro of registros) {
                await crear(storeName, registro);
            }
        }
    }

    // Importar préstamos inter-módulo
    for (const prestamo of datos.prestamos_inter_modulo || []) {
        await crear('prestamos_inter_modulo', prestamo);
    }

    // Importar configuración
    for (const config of datos.configuracion || []) {
        await crear('configuracion', config);
    }

    return { exito: true };
}

// ==========================================
// BORRADO SEGURO
// ==========================================

const CODIGO_BORRADO = '280208';

async function borradoSeguro(codigo, opcion) {
    if (codigo !== CODIGO_BORRADO) {
        throw new Error('Código de seguridad incorrecto');
    }

    const storesFamilia = [
        'familia_ingresos', 'familia_egresos', 'familia_prestamos',
        'familia_cuentas', 'familia_transferencias', 'familia_metas',
        'familia_presupuesto', 'familia_categorias', 'familia_recurrentes',
        'familia_gastos_fijos', 'familia_deudas', 'familia_papelera'
    ];

    const storesNeurotea = [
        'neurotea_ingresos', 'neurotea_egresos', 'neurotea_cuentas',
        'neurotea_presupuesto', 'neurotea_categorias', 'neurotea_recurrentes',
        'neurotea_gastos_fijos', 'neurotea_deudas', 'neurotea_papelera'
    ];

    let storesABorrar = [];

    if (opcion === 'familia' || opcion === 'todo') {
        storesABorrar.push(...storesFamilia);
    }
    if (opcion === 'neurotea' || opcion === 'todo') {
        storesABorrar.push(...storesNeurotea);
    }
    if (opcion === 'todo') {
        storesABorrar.push('configuracion');
        storesABorrar.push('prestamos_inter_modulo');
    }

    for (const store of storesABorrar) {
        await limpiarStore(store);
    }

    return {
        exito: true,
        storesBorrados: storesABorrar.length
    };
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

async function obtenerConfiguracion(clave) {
    const config = await obtenerPorId('configuracion', clave);
    return config ? config.valor : null;
}

async function guardarConfiguracion(clave, valor) {
    const existe = await obtenerPorId('configuracion', clave);

    if (existe) {
        await actualizar('configuracion', clave, { valor });
    } else {
        await crear('configuracion', { id: clave, valor });
    }
}

// Verificar necesidad de respaldo
async function verificarNecesidadRespaldo() {
    const ultimoRespaldo = await obtenerConfiguracion('ultimoRespaldo');

    if (!ultimoRespaldo) {
        return { necesitaRespaldo: true, razon: 'Nunca se ha hecho respaldo', diasSinRespaldo: null };
    }

    const dias = diasTranscurridos(ultimoRespaldo);

    if (dias >= 7) {
        return { necesitaRespaldo: true, razon: `Han pasado ${dias} días desde el último respaldo`, diasSinRespaldo: dias };
    }

    return { necesitaRespaldo: false, diasSinRespaldo: dias };
}

// Contar registros totales
async function contarRegistrosTotales() {
    let total = 0;
    const stores = Object.keys(STORES_CONFIG).filter(s => s !== 'configuracion' && !s.includes('papelera'));

    for (const store of stores) {
        const registros = await obtenerTodos(store);
        total += registros.length;
    }

    return total;
}

// ==========================================
// SOFT DELETE - PAPELERA
// ==========================================

// Mover elemento a la papelera (soft delete)
async function softDelete(storeName, id) {
    return new Promise(async (resolve, reject) => {
        try {
            // Obtener el registro original
            const registro = await obtenerPorId(storeName, id);
            if (!registro) {
                reject(new Error('Registro no encontrado'));
                return;
            }

            // Determinar el módulo (familia o neurotea)
            const modulo = storeName.startsWith('familia') ? 'familia' : 'neurotea';
            const papeleraStore = `${modulo}_papelera`;

            // Crear entrada en papelera
            const ahora = new Date();
            const expiracion = new Date(ahora);
            expiracion.setDate(expiracion.getDate() + DIAS_RETENCION_PAPELERA);

            const elementoPapelera = {
                id: generarId(),
                tipo: storeName.split('_').pop(), // ingresos, egresos, cuentas, etc.
                storeName: storeName,
                originalId: id,
                data: JSON.parse(JSON.stringify(registro)), // Copia profunda
                deletedAt: ahora.toISOString(),
                expiresAt: expiracion.toISOString()
            };

            // Guardar en papelera
            await crear(papeleraStore, elementoPapelera);

            // Eliminar del store original
            await eliminar(storeName, id);

            resolve({
                exito: true,
                papeleraId: elementoPapelera.id,
                mensaje: `Elemento movido a papelera. Se eliminará permanentemente en ${DIAS_RETENCION_PAPELERA} días.`
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Restaurar elemento desde la papelera
async function restaurarDesdePapelera(modulo, papeleraId) {
    return new Promise(async (resolve, reject) => {
        try {
            const papeleraStore = `${modulo}_papelera`;
            const elemento = await obtenerPorId(papeleraStore, papeleraId);

            if (!elemento) {
                reject(new Error('Elemento no encontrado en papelera'));
                return;
            }

            // Restaurar al store original
            const datosRestaurados = {
                ...elemento.data,
                restoredAt: new Date().toISOString()
            };

            // Verificar si el ID original ya existe
            const existente = await obtenerPorId(elemento.storeName, elemento.originalId);
            if (existente) {
                // Generar nuevo ID si el original ya está ocupado
                datosRestaurados.id = generarId();
            }

            await crear(elemento.storeName, datosRestaurados);

            // Eliminar de papelera
            await eliminar(papeleraStore, papeleraId);

            resolve({
                exito: true,
                restauradoId: datosRestaurados.id,
                storeName: elemento.storeName
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Obtener elementos de la papelera
async function obtenerPapelera(modulo) {
    const papeleraStore = `${modulo}_papelera`;
    const elementos = await obtenerTodos(papeleraStore);

    // Ordenar por fecha de eliminación (más recientes primero)
    return elementos.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
}

// Eliminar permanentemente de la papelera
async function eliminarPermanente(modulo, papeleraId) {
    const papeleraStore = `${modulo}_papelera`;
    return await eliminar(papeleraStore, papeleraId);
}

// Vaciar papelera completamente
async function vaciarPapelera(modulo) {
    const papeleraStore = `${modulo}_papelera`;
    return await limpiarStore(papeleraStore);
}

// Limpiar elementos expirados de la papelera
async function limpiarPapeleraExpirada(modulo) {
    const papeleraStore = `${modulo}_papelera`;
    const elementos = await obtenerTodos(papeleraStore);
    const ahora = new Date();
    let eliminados = 0;

    for (const elemento of elementos) {
        if (new Date(elemento.expiresAt) <= ahora) {
            await eliminar(papeleraStore, elemento.id);
            eliminados++;
        }
    }

    return { eliminados };
}

// ==========================================
// GESTIÓN DE CATEGORÍAS DINÁMICAS
// ==========================================

// Obtener categorías activas por tipo y tipoGasto
async function obtenerCategorias(modulo, tipo, tipoGasto = null) {
    const storeName = `${modulo}_categorias`;
    const todas = await obtenerTodos(storeName);

    return todas.filter(cat => {
        if (cat.activa === false) return false;
        if (cat.tipo !== tipo) return false;
        if (tipoGasto && cat.tipoGasto !== tipoGasto) return false;
        return true;
    }).sort((a, b) => (a.orden || 999) - (b.orden || 999));
}

// Obtener todas las categorías (incluyendo inactivas)
async function obtenerTodasCategorias(modulo, tipo = null) {
    const storeName = `${modulo}_categorias`;
    const todas = await obtenerTodos(storeName);

    if (tipo) {
        return todas.filter(cat => cat.tipo === tipo)
            .sort((a, b) => (a.orden || 999) - (b.orden || 999));
    }

    return todas.sort((a, b) => (a.orden || 999) - (b.orden || 999));
}

// Crear nueva categoría
async function crearCategoria(modulo, datos) {
    const storeName = `${modulo}_categorias`;

    // Generar identificador único basado en el nombre
    const identificador = datos.identificador ||
        datos.nombre.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');

    // Verificar que no exista ya
    const existentes = await obtenerTodos(storeName);
    const yaExiste = existentes.find(c =>
        c.identificador === identificador &&
        c.tipo === datos.tipo &&
        (datos.tipo === 'ingreso' || c.tipoGasto === datos.tipoGasto)
    );

    if (yaExiste) {
        throw new Error('Ya existe una categoría con ese nombre');
    }

    // Obtener siguiente orden
    const mismoTipo = existentes.filter(c =>
        c.tipo === datos.tipo &&
        (datos.tipo === 'ingreso' || c.tipoGasto === datos.tipoGasto)
    );
    const maxOrden = mismoTipo.reduce((max, c) => Math.max(max, c.orden || 0), 0);

    const categoria = {
        tipo: datos.tipo,
        tipoGasto: datos.tipoGasto || null,
        nombre: datos.nombre.trim(),
        identificador,
        icono: datos.icono || null,
        color: datos.color || null,
        orden: datos.orden || (maxOrden + 1),
        activa: true,
        sistema: false,
        persona: datos.persona || null // Solo para ingresos de familia
    };

    return await crear(storeName, categoria);
}

// Actualizar categoría
async function actualizarCategoria(modulo, id, datos) {
    const storeName = `${modulo}_categorias`;
    const categoria = await obtenerPorId(storeName, id);

    if (!categoria) {
        throw new Error('Categoría no encontrada');
    }

    // No permitir cambiar identificador de categorías del sistema
    if (categoria.sistema && datos.identificador && datos.identificador !== categoria.identificador) {
        throw new Error('No se puede cambiar el identificador de categorías del sistema');
    }

    return await actualizar(storeName, id, {
        nombre: datos.nombre !== undefined ? datos.nombre.trim() : categoria.nombre,
        icono: datos.icono !== undefined ? datos.icono : categoria.icono,
        color: datos.color !== undefined ? datos.color : categoria.color,
        orden: datos.orden !== undefined ? datos.orden : categoria.orden,
        activa: datos.activa !== undefined ? datos.activa : categoria.activa
    });
}

// Eliminar categoría (soft delete)
async function eliminarCategoria(modulo, id) {
    const storeName = `${modulo}_categorias`;
    const categoria = await obtenerPorId(storeName, id);

    if (!categoria) {
        throw new Error('Categoría no encontrada');
    }

    if (categoria.sistema) {
        throw new Error('No se pueden eliminar categorías del sistema');
    }

    // Verificar si hay movimientos usando esta categoría
    const storeMovimientos = categoria.tipo === 'ingreso'
        ? `${modulo}_ingresos`
        : `${modulo}_egresos`;

    const movimientos = await obtenerPorIndice(storeMovimientos, 'categoria', categoria.identificador);

    if (movimientos.length > 0) {
        return {
            exito: false,
            tieneReferencias: true,
            cantidadReferencias: movimientos.length,
            mensaje: `Esta categoría tiene ${movimientos.length} movimiento(s) asociado(s). Reasigne los movimientos antes de eliminar.`
        };
    }

    // Si no hay referencias, mover a papelera
    return await softDelete(storeName, id);
}

// Reasignar movimientos de una categoría a otra
async function reasignarCategoria(modulo, categoriaOrigenId, categoriaDestinoId) {
    const storeCategorias = `${modulo}_categorias`;
    const origen = await obtenerPorId(storeCategorias, categoriaOrigenId);
    const destino = await obtenerPorId(storeCategorias, categoriaDestinoId);

    if (!origen || !destino) {
        throw new Error('Categoría no encontrada');
    }

    if (origen.tipo !== destino.tipo) {
        throw new Error('Las categorías deben ser del mismo tipo');
    }

    const storeMovimientos = origen.tipo === 'ingreso'
        ? `${modulo}_ingresos`
        : `${modulo}_egresos`;

    const movimientos = await obtenerPorIndice(storeMovimientos, 'categoria', origen.identificador);
    let actualizados = 0;

    for (const mov of movimientos) {
        await actualizar(storeMovimientos, mov.id, {
            categoria: destino.identificador
        });
        actualizados++;
    }

    return { actualizados };
}

// Inicializar categorías predeterminadas si no existen
async function inicializarCategoriasPredeterminadas(modulo) {
    const storeName = `${modulo}_categorias`;
    const existentes = await obtenerTodos(storeName);

    // Si ya hay categorías, no hacer nada
    if (existentes.length > 0) {
        return { mensaje: 'Categorías ya inicializadas', nuevas: 0 };
    }

    // ═══════════════════════════════════════════════════════
    // CATEGORÍAS EXACTAS DEL EXCEL Control_Financiero_2026_V6
    // ═══════════════════════════════════════════════════════

    const categoriasFamilia = {
        egresos: {
            gastos_fijos: [
                { nombre: 'Salario Lili Doméstico', identificador: 'salario_lili' },
                { nombre: 'Salario Laura Doméstico', identificador: 'salario_laura' },
                { nombre: 'Escuela Fabián y Brenda', identificador: 'escuela' },
                { nombre: 'Robótica Niños', identificador: 'robotica' },
                { nombre: 'ANDE Casa', identificador: 'ande_casa' },
                { nombre: 'Expensa Casa', identificador: 'expensa_casa' },
                { nombre: 'Cajubi Marco', identificador: 'cajubi_marco' },
                { nombre: 'Mutual Marco', identificador: 'mutual_marco' },
                { nombre: 'Ña Luisa', identificador: 'na_luisa' },
                { nombre: 'Seguro Médico Papá y Mamá', identificador: 'seguro_medico_papas' }
            ],
            cuotas_prestamos: [
                { nombre: 'Auto Laura Cuota', identificador: 'auto_laura' },
                { nombre: 'Coop. Universitaria Clara', identificador: 'coop_universitaria' },
                { nombre: 'Coomecipar Clara', identificador: 'coomecipar_clara' },
                { nombre: 'Tarjeta Cred. Coomecipar', identificador: 'tarjeta_coomecipar' },
                { nombre: 'Solar Préstamo 1', identificador: 'solar_1' },
                { nombre: 'Solar Préstamo 2', identificador: 'solar_2' },
                { nombre: 'Préstamo Lizzi Sueldos', identificador: 'prestamo_lizzi' },
                { nombre: 'Show Congelador', identificador: 'show_congelador' },
                { nombre: 'Olier Heladera', identificador: 'olier_heladera' }
            ],
            suscripciones: [
                { nombre: 'Giganet', identificador: 'giganet' },
                { nombre: 'Tigo Internet/Celulares', identificador: 'tigo_internet' },
                { nombre: 'Tigo Familiar', identificador: 'tigo_familiar' },
                { nombre: 'Google One', identificador: 'google_one' },
                { nombre: 'ChatGPT', identificador: 'chatgpt' },
                { nombre: 'Claude Marco', identificador: 'claude_marco' },
                { nombre: 'Claude Clara', identificador: 'claude_clara' },
                { nombre: 'iLovePDF', identificador: 'ilovepdf' }
            ],
            variables: [
                { nombre: 'Alimentación', identificador: 'alimentacion' },
                { nombre: 'Combustible', identificador: 'combustible' },
                { nombre: 'Salud y Medicamentos', identificador: 'salud' },
                { nombre: 'Supermercado', identificador: 'supermercado' },
                { nombre: 'Farmacia', identificador: 'farmacia' },
                { nombre: 'Recreación', identificador: 'recreacion' },
                { nombre: 'Gastos Varios Familia', identificador: 'gastos_varios' }
            ]
        },
        ingresos: {
            marco: [
                { nombre: 'Salario Marco', identificador: 'salario_marco' },
                { nombre: 'Vacaciones Marco', identificador: 'vacaciones_marco' },
                { nombre: 'Aguinaldo Marco', identificador: 'aguinaldo_marco' },
                { nombre: 'Viático Marco', identificador: 'viatico_marco' },
                { nombre: 'Animador Bíblico', identificador: 'animador_biblico' },
                { nombre: 'Otros Ingresos Marco', identificador: 'otros_marco' }
            ],
            clara: [
                { nombre: 'Honorarios Clara', identificador: 'honorarios_clara' }
            ],
            desde_nt: [
                { nombre: 'Salario Administrador', identificador: 'salario_admin' },
                { nombre: 'Ganancia NT → Familia', identificador: 'ganancia_nt' },
                { nombre: 'Préstamo NT (automático)', identificador: 'prestamo_nt' }
            ]
        }
    };

    const categoriasNeurotea = {
        egresos: {
            gastos_fijos: [
                { nombre: 'Alquiler 1 (Principal)', identificador: 'alquiler_1' },
                { nombre: 'Alquiler 2 (Secundario)', identificador: 'alquiler_2' },
                { nombre: 'Limpieza NeuroTEA', identificador: 'limpieza_nt' }
            ],
            sueldos_honorarios: [
                { nombre: 'Sueldo Aracely', identificador: 'sueldo_aracely' },
                { nombre: 'Sueldo Fátima', identificador: 'sueldo_fatima' },
                { nombre: 'Honorario Contador', identificador: 'honorario_contador' },
                { nombre: 'Salario Administrador', identificador: 'salario_administrador' },
                { nombre: 'Honorario Mant. Sistema', identificador: 'honorario_sistema' }
            ],
            telefonia_internet: [
                { nombre: 'Celular Tigo NeuroTEA', identificador: 'celular_nt' },
                { nombre: 'Celular Tigo Sistema', identificador: 'celular_sistema' },
                { nombre: 'WhatsFlow', identificador: 'whatsflow' },
                { nombre: 'Internet NeuroTEA', identificador: 'internet_nt' }
            ],
            impuestos: [
                { nombre: 'IVA', identificador: 'iva' },
                { nombre: 'IPS', identificador: 'ips' }
            ],
            eventos: [
                { nombre: 'Día del Niño NT', identificador: 'dia_nino' },
                { nombre: 'San Juan NT', identificador: 'san_juan' },
                { nombre: 'Día del Autismo NT', identificador: 'dia_autismo' },
                { nombre: 'Clausura Padres NT', identificador: 'clausura_padres' },
                { nombre: 'Navidad Papá Noel NT', identificador: 'navidad' },
                { nombre: 'Cena Fin de Año NT', identificador: 'cena_fin_ano' }
            ],
            variables: [
                { nombre: 'Insumos NT', identificador: 'insumos_nt' },
                { nombre: 'Papelería NT', identificador: 'papeleria_nt' },
                { nombre: 'Mantenimiento NT', identificador: 'mantenimiento_nt' },
                { nombre: 'Gastos Cursos NT', identificador: 'cursos_nt' },
                { nombre: 'Gastos Varios NT', identificador: 'gastos_varios_nt' }
            ]
        },
        ingresos: {
            principal: [
                { nombre: 'Sesiones Individuales', identificador: 'sesiones_individuales' },
                { nombre: 'Paquetes de Sesiones', identificador: 'paquetes_sesiones' },
                { nombre: 'Evaluaciones', identificador: 'evaluaciones' },
                { nombre: 'Otros Ingresos NT', identificador: 'otros_nt' }
            ]
        }
    };

    const categoriasBase = modulo === 'familia' ? categoriasFamilia : categoriasNeurotea;
    let orden = 1;
    let nuevas = 0;

    // Crear categorías de egresos
    for (const [tipoGasto, cats] of Object.entries(categoriasBase.egresos)) {
        for (const cat of cats) {
            await crear(storeName, {
                tipo: 'egreso',
                tipoGasto,
                nombre: cat.nombre,
                identificador: cat.identificador,
                orden: orden++,
                activa: true,
                sistema: true
            });
            nuevas++;
        }
    }

    // Crear categorías de ingresos
    for (const [persona, cats] of Object.entries(categoriasBase.ingresos)) {
        for (const cat of cats) {
            await crear(storeName, {
                tipo: 'ingreso',
                tipoGasto: null,
                persona: modulo === 'familia' ? persona : null,
                nombre: cat.nombre,
                identificador: cat.identificador,
                orden: orden++,
                activa: true,
                sistema: true
            });
            nuevas++;
        }
    }

    return { mensaje: 'Categorías inicializadas', nuevas };
}

// ==========================================
// VERIFICACIÓN DE INTEGRIDAD
// ==========================================

// Verificar integridad de datos y limpiar huérfanos
async function verificarIntegridad(modulo) {
    const resultados = {
        movimientosConCategoriaInvalida: [],
        movimientosConCuentaInvalida: [],
        corregidos: 0,
        errores: []
    };

    try {
        // Obtener todas las categorías válidas
        const categorias = await obtenerTodos(`${modulo}_categorias`);
        const identificadoresCategorias = new Set(categorias.map(c => c.identificador));

        // Obtener todas las cuentas
        const cuentas = await obtenerTodos(`${modulo}_cuentas`);
        const idsCuentas = new Set(cuentas.map(c => c.id));

        // Verificar ingresos
        const ingresos = await obtenerTodos(`${modulo}_ingresos`);
        for (const ing of ingresos) {
            if (ing.categoria && !identificadoresCategorias.has(ing.categoria)) {
                resultados.movimientosConCategoriaInvalida.push({
                    tipo: 'ingreso',
                    id: ing.id,
                    categoria: ing.categoria
                });
            }
            if (ing.cuentaDestino && !idsCuentas.has(ing.cuentaDestino)) {
                resultados.movimientosConCuentaInvalida.push({
                    tipo: 'ingreso',
                    id: ing.id,
                    cuenta: ing.cuentaDestino
                });
            }
        }

        // Verificar egresos
        const egresos = await obtenerTodos(`${modulo}_egresos`);
        for (const egr of egresos) {
            if (egr.categoria && !identificadoresCategorias.has(egr.categoria)) {
                resultados.movimientosConCategoriaInvalida.push({
                    tipo: 'egreso',
                    id: egr.id,
                    categoria: egr.categoria
                });
            }
            if (egr.cuentaOrigen && !idsCuentas.has(egr.cuentaOrigen)) {
                resultados.movimientosConCuentaInvalida.push({
                    tipo: 'egreso',
                    id: egr.id,
                    cuenta: egr.cuentaOrigen
                });
            }
        }

    } catch (error) {
        resultados.errores.push(error.message);
    }

    return resultados;
}

// Limpiar referencias inválidas de cuentas eliminadas
async function limpiarReferenciasHuerfanas(modulo) {
    const cuentas = await obtenerTodos(`${modulo}_cuentas`);
    const idsCuentas = new Set(cuentas.map(c => c.id));
    let limpiados = 0;

    // Limpiar en ingresos
    const ingresos = await obtenerTodos(`${modulo}_ingresos`);
    for (const ing of ingresos) {
        if (ing.cuentaDestino && !idsCuentas.has(ing.cuentaDestino)) {
            await actualizar(`${modulo}_ingresos`, ing.id, { cuentaDestino: null });
            limpiados++;
        }
    }

    // Limpiar en egresos
    const egresos = await obtenerTodos(`${modulo}_egresos`);
    for (const egr of egresos) {
        if (egr.cuentaOrigen && !idsCuentas.has(egr.cuentaOrigen)) {
            await actualizar(`${modulo}_egresos`, egr.id, { cuentaOrigen: null });
            limpiados++;
        }
    }

    return { limpiados };
}

// ==========================================
// INDICADORES DE LIQUIDEZ
// ==========================================

// Calcular Días de Oxígeno = Caja / (Gastos Mensuales / 30)
async function calcularDiasOxigeno(modulo) {
    // Obtener caja actual (suma de saldos de todas las cuentas)
    const cuentas = await calcularTodosSaldos(modulo);
    const cajaTotal = cuentas
        .filter(c => c.activa !== false)
        .reduce((sum, c) => sum + (c.saldoActual || 0), 0);

    // Calcular promedio de gastos mensuales (últimos 3 meses)
    const hoy = new Date();
    let totalGastos = 0;
    let mesesConDatos = 0;

    for (let i = 0; i < 3; i++) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const año = fecha.getFullYear();
        const mes = fecha.getMonth() + 1;

        const egresos = await obtenerEgresosMes(modulo, año, mes);
        if (egresos.length > 0) {
            totalGastos += sumar(egresos, 'monto');
            mesesConDatos++;
        }
    }

    const gastoMensualPromedio = mesesConDatos > 0 ? totalGastos / mesesConDatos : 0;
    const gastoDiario = gastoMensualPromedio / 30;
    const diasOxigeno = gastoDiario > 0 ? Math.floor(cajaTotal / gastoDiario) : 999;

    return {
        cajaTotal,
        gastoMensualPromedio,
        gastoDiario,
        diasOxigeno,
        nivel: diasOxigeno >= 90 ? 'excelente' :
               diasOxigeno >= 60 ? 'bueno' :
               diasOxigeno >= 30 ? 'aceptable' :
               diasOxigeno >= 15 ? 'alerta' : 'critico'
    };
}

// Calcular liquidez semanal (pagos pendientes vs disponible)
async function calcularLiquidezSemanal(modulo) {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6); // Sábado

    const inicioProximaSemana = new Date(finSemana);
    inicioProximaSemana.setDate(finSemana.getDate() + 1);
    const finProximaSemana = new Date(inicioProximaSemana);
    finProximaSemana.setDate(inicioProximaSemana.getDate() + 6);

    // Obtener gastos fijos activos
    const gastosFijos = await obtenerTodos(`${modulo}_gastos_fijos`);
    const gastosActivos = gastosFijos.filter(g => g.activo !== false);

    // Obtener deudas con pagos pendientes
    const deudas = await obtenerTodos(`${modulo}_deudas`);
    const deudasActivas = deudas.filter(d => d.estado === 'activo' || d.estado === 'pendiente');

    // Clasificar pagos por semana
    const pagosEstaSemana = [];
    const pagosProximaSemana = [];
    const pagosAtrasados = [];

    const formatFecha = (d) => d.toISOString().split('T')[0];
    const hoyStr = formatFecha(hoy);
    const finSemanaStr = formatFecha(finSemana);
    const finProximaSemanaStr = formatFecha(finProximaSemana);

    // Calcular fecha de vencimiento para el mes actual
    const calcularFechaVencimiento = (diaVencimiento) => {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), diaVencimiento);
        // Si ya pasó, es el próximo mes
        if (fecha < hoy) {
            fecha.setMonth(fecha.getMonth() + 1);
        }
        return fecha;
    };

    // Clasificar gastos fijos
    for (const gasto of gastosActivos) {
        const fechaVenc = calcularFechaVencimiento(gasto.diaVencimiento || 1);
        const fechaVencStr = formatFecha(fechaVenc);

        const item = {
            tipo: 'gasto_fijo',
            id: gasto.id,
            nombre: gasto.nombre || gasto.categoria,
            monto: gasto.monto,
            fechaVencimiento: fechaVencStr,
            prioridad: gasto.prioridad || 6,
            estado: gasto.estadoPago || 'ninguno'
        };

        if (fechaVencStr < hoyStr && item.estado !== 'pagado') {
            pagosAtrasados.push(item);
        } else if (fechaVencStr <= finSemanaStr) {
            pagosEstaSemana.push(item);
        } else if (fechaVencStr <= finProximaSemanaStr) {
            pagosProximaSemana.push(item);
        }
    }

    // Clasificar deudas
    for (const deuda of deudasActivas) {
        if (!deuda.fechaProximoPago) continue;

        const item = {
            tipo: 'deuda',
            id: deuda.id,
            nombre: deuda.nombre || deuda.acreedor,
            monto: deuda.cuotaMensual || deuda.montoMinimo,
            fechaVencimiento: deuda.fechaProximoPago,
            prioridad: deuda.prioridad || 5,
            estado: 'pendiente'
        };

        if (deuda.fechaProximoPago < hoyStr) {
            pagosAtrasados.push(item);
        } else if (deuda.fechaProximoPago <= finSemanaStr) {
            pagosEstaSemana.push(item);
        } else if (deuda.fechaProximoPago <= finProximaSemanaStr) {
            pagosProximaSemana.push(item);
        }
    }

    // Ordenar por prioridad y fecha
    const ordenar = (a, b) => a.prioridad - b.prioridad || a.fechaVencimiento.localeCompare(b.fechaVencimiento);
    pagosAtrasados.sort(ordenar);
    pagosEstaSemana.sort(ordenar);
    pagosProximaSemana.sort(ordenar);

    // Calcular totales
    const totalAtrasados = pagosAtrasados.reduce((s, p) => s + (p.monto || 0), 0);
    const totalEstaSemana = pagosEstaSemana.reduce((s, p) => s + (p.monto || 0), 0);
    const totalProximaSemana = pagosProximaSemana.reduce((s, p) => s + (p.monto || 0), 0);

    // Obtener caja disponible
    const cuentas = await calcularTodosSaldos(modulo);
    const cajaDisponible = cuentas
        .filter(c => c.activa !== false)
        .reduce((sum, c) => sum + (c.saldoActual || 0), 0);

    // Calcular si alcanza
    const necesarioInmediato = totalAtrasados + totalEstaSemana;
    const necesarioTotal = necesarioInmediato + totalProximaSemana;
    const alcanzaEstaSemana = cajaDisponible >= necesarioInmediato;
    const alcanzaDosSemananas = cajaDisponible >= necesarioTotal;

    return {
        cajaDisponible,
        pagosAtrasados,
        pagosEstaSemana,
        pagosProximaSemana,
        totalAtrasados,
        totalEstaSemana,
        totalProximaSemana,
        necesarioInmediato,
        necesarioTotal,
        alcanzaEstaSemana,
        alcanzaDosSemananas,
        saldoDespuesEstaSemana: cajaDisponible - necesarioInmediato,
        saldoDespuesProximaSemana: cajaDisponible - necesarioTotal
    };
}

// ==========================================
// MODELO 93/7 - SALUD NEUROTEA
// ==========================================

// Calcular salud de NeuroTEA según modelo 93/7
async function calcularSaludNT(año, mes) {
    const rango = getRangoMes(año, mes);

    const ingresos = await obtenerIngresosMes('neurotea', año, mes);
    const egresos = await obtenerEgresosMes('neurotea', año, mes);

    const totalIngresos = sumar(ingresos, 'monto');
    const totalEgresos = sumar(egresos, 'monto');

    // Modelo 93/7: Ingresos = 100%, Gastos operativos = 93%, Ganancia = 7%
    const limiteGastos = totalIngresos * 0.93;
    const gananciaEsperada = totalIngresos * 0.07;
    const gananciaReal = totalIngresos - totalEgresos;

    // Subdivisión del 7% (4 partes de 1.75%)
    const porcionGanancia = totalIngresos * 0.0175;
    const subdivisiones = {
        reserva: porcionGanancia,      // Reserva de emergencia
        reinversion: porcionGanancia,  // Reinversión en el negocio
        desarrollo: porcionGanancia,   // Desarrollo/capacitación
        distribucion: porcionGanancia  // Distribución a socios
    };

    // Calcular cumplimiento
    const porcentajeGastos = totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : 0;
    const porcentajeGanancia = totalIngresos > 0 ? (gananciaReal / totalIngresos) * 100 : 0;

    // Determinar estado de salud
    let estadoSalud = 'critico';
    if (porcentajeGastos <= 93 && gananciaReal > 0) {
        estadoSalud = porcentajeGanancia >= 7 ? 'excelente' :
                      porcentajeGanancia >= 5 ? 'bueno' :
                      porcentajeGanancia >= 3 ? 'aceptable' : 'alerta';
    } else if (porcentajeGastos <= 100) {
        estadoSalud = 'alerta';
    }

    // Verificar préstamos a familia (FUGA)
    const prestamosAFamilia = await obtenerTodos('prestamos_inter_modulo');
    const fugaActiva = prestamosAFamilia.filter(p =>
        p.origen === 'neurotea' &&
        p.destino === 'familia' &&
        p.estado !== 'pagado'
    );
    const totalFuga = fugaActiva.reduce((s, p) => s + (p.saldoPendiente || p.monto || 0), 0);

    return {
        año,
        mes,
        totalIngresos,
        totalEgresos,
        limiteGastos,
        gananciaEsperada,
        gananciaReal,
        porcentajeGastos: Math.round(porcentajeGastos * 100) / 100,
        porcentajeGanancia: Math.round(porcentajeGanancia * 100) / 100,
        estadoSalud,
        subdivisiones,
        cumple93: porcentajeGastos <= 93,
        cumple7: porcentajeGanancia >= 7,
        fuga: {
            cantidad: fugaActiva.length,
            total: totalFuga,
            prestamos: fugaActiva
        }
    };
}

// ==========================================
// GASTOS FIJOS
// ==========================================

// Obtener gastos fijos activos
async function obtenerGastosFijosActivos(modulo) {
    const todos = await obtenerTodos(`${modulo}_gastos_fijos`);
    return todos.filter(g => g.activo !== false)
        .sort((a, b) => (a.prioridad || 6) - (b.prioridad || 6));
}

// Crear gasto fijo
async function crearGastoFijo(modulo, datos) {
    const gasto = {
        nombre: datos.nombre,
        categoria: datos.categoria,
        monto: datos.monto,
        diaVencimiento: datos.diaVencimiento || 1,
        prioridad: datos.prioridad || 6, // 1=IPS/Impuestos, 2=Salarios, 3=Alquiler, 4=Proveedores, 5=Bancos, 6=Otros
        activo: true,
        estadoPago: 'ninguno', // ninguno, pendiente, pagado, cancelado
        notas: datos.notas || ''
    };

    return await crear(`${modulo}_gastos_fijos`, gasto);
}

// Marcar gasto fijo como pagado (genera egreso automático)
async function marcarGastoFijoPagado(modulo, gastoFijoId, datosPago = {}) {
    const gasto = await obtenerPorId(`${modulo}_gastos_fijos`, gastoFijoId);
    if (!gasto) throw new Error('Gasto fijo no encontrado');

    const hoy = new Date();
    const fecha = datosPago.fecha || hoy.toISOString().split('T')[0];

    // Crear egreso asociado
    const egreso = await crear(`${modulo}_egresos`, {
        fecha,
        tipoGasto: 'fijo',
        categoria: gasto.categoria,
        monto: datosPago.monto || gasto.monto,
        descripcion: `${gasto.nombre} - Pago mensual`,
        cuentaOrigen: datosPago.cuentaOrigen || null,
        gastoFijoId: gastoFijoId
    });

    // Actualizar estado del gasto fijo
    await actualizar(`${modulo}_gastos_fijos`, gastoFijoId, {
        estadoPago: 'pagado',
        ultimoPago: fecha,
        egresoGeneradoId: egreso.id
    });

    return { gasto, egreso };
}

// Resetear estados de pago para nuevo mes
async function resetearEstadosPagoMes(modulo) {
    const gastosFijos = await obtenerTodos(`${modulo}_gastos_fijos`);
    let reseteados = 0;

    for (const gasto of gastosFijos) {
        if (gasto.activo !== false) {
            await actualizar(`${modulo}_gastos_fijos`, gasto.id, {
                estadoPago: 'ninguno',
                egresoGeneradoId: null
            });
            reseteados++;
        }
    }

    return { reseteados };
}

// ==========================================
// DEUDAS
// ==========================================

// Crear deuda
async function crearDeuda(modulo, datos) {
    const deuda = {
        nombre: datos.nombre,
        acreedor: datos.acreedor,
        tipo: datos.tipo || 'otro', // personal, hipotecario, vehicular, tarjeta, otro
        montoOriginal: datos.montoOriginal,
        saldoPendiente: datos.saldoPendiente || datos.montoOriginal,
        cuotaMensual: datos.cuotaMensual,
        tasaInteres: datos.tasaInteres || 0,
        totalCuotas: datos.totalCuotas || null,
        cuotasPagadas: datos.cuotasPagadas || 0,
        fechaInicio: datos.fechaInicio,
        fechaProximoPago: datos.fechaProximoPago,
        prioridad: datos.prioridad || 5, // 5=Bancos por defecto
        estado: 'activo', // activo, pendiente, pagado, cancelado
        historialPagos: [],
        notas: datos.notas || ''
    };

    return await crear(`${modulo}_deudas`, deuda);
}

// Registrar pago de deuda
async function registrarPagoDeuda(modulo, deudaId, datosPago = {}) {
    const deuda = await obtenerPorId(`${modulo}_deudas`, deudaId);
    if (!deuda) throw new Error('Deuda no encontrada');
    if (deuda.estado === 'pagado') throw new Error('Esta deuda ya está pagada');

    const hoy = new Date();
    const fecha = datosPago.fecha || hoy.toISOString().split('T')[0];
    const monto = datosPago.monto || deuda.cuotaMensual;

    // Crear egreso asociado
    const egreso = await crear(`${modulo}_egresos`, {
        fecha,
        tipoGasto: 'fijo',
        categoria: 'cuota_prestamo',
        monto,
        descripcion: `${deuda.nombre} - Cuota #${deuda.cuotasPagadas + 1}`,
        cuentaOrigen: datosPago.cuentaOrigen || null,
        deudaId: deudaId
    });

    // Actualizar deuda
    const nuevoPago = {
        id: generarId(),
        fecha,
        monto,
        cuotaNumero: deuda.cuotasPagadas + 1,
        egresoGeneradoId: egreso.id
    };

    const historialPagos = [...(deuda.historialPagos || []), nuevoPago];
    const cuotasPagadas = deuda.cuotasPagadas + 1;
    const saldoPendiente = Math.max(0, deuda.saldoPendiente - monto);

    // Calcular próxima fecha de pago
    const proximaFecha = new Date(fecha);
    proximaFecha.setMonth(proximaFecha.getMonth() + 1);

    let estado = 'activo';
    if (saldoPendiente <= 0 || (deuda.totalCuotas && cuotasPagadas >= deuda.totalCuotas)) {
        estado = 'pagado';
    }

    await actualizar(`${modulo}_deudas`, deudaId, {
        historialPagos,
        cuotasPagadas,
        saldoPendiente,
        fechaProximoPago: estado === 'pagado' ? null : proximaFecha.toISOString().split('T')[0],
        estado
    });

    return { deuda: await obtenerPorId(`${modulo}_deudas`, deudaId), egreso };
}

// Obtener resumen de deudas
async function obtenerResumenDeudas(modulo) {
    const deudas = await obtenerTodos(`${modulo}_deudas`);
    const activas = deudas.filter(d => d.estado === 'activo' || d.estado === 'pendiente');
    const pagadas = deudas.filter(d => d.estado === 'pagado');

    const totalDeuda = activas.reduce((s, d) => s + (d.saldoPendiente || 0), 0);
    const cuotaMensualTotal = activas.reduce((s, d) => s + (d.cuotaMensual || 0), 0);
    const montoOriginalTotal = deudas.reduce((s, d) => s + (d.montoOriginal || 0), 0);
    const totalPagado = montoOriginalTotal - totalDeuda;
    const progresoPago = montoOriginalTotal > 0 ? (totalPagado / montoOriginalTotal) * 100 : 100;

    return {
        cantidadActivas: activas.length,
        cantidadPagadas: pagadas.length,
        totalDeuda,
        cuotaMensualTotal,
        montoOriginalTotal,
        totalPagado,
        progresoPago: Math.round(progresoPago * 100) / 100,
        deudas: activas.sort((a, b) => (a.prioridad || 5) - (b.prioridad || 5))
    };
}

// ==========================================
// PRÉSTAMOS INTER-MÓDULO (NT ↔ Familia)
// ==========================================

// Crear préstamo entre módulos (FUGA)
async function crearPrestamoInterModulo(datos) {
    const prestamo = {
        origen: datos.origen, // 'neurotea' o 'familia'
        destino: datos.destino, // 'familia' o 'neurotea'
        fecha: datos.fecha || new Date().toISOString().split('T')[0],
        monto: datos.monto,
        saldoPendiente: datos.monto,
        motivo: datos.motivo || '',
        estado: 'pendiente', // pendiente, parcial, pagado
        historialPagos: []
    };

    // Crear egreso en el origen
    await crear(`${datos.origen}_egresos`, {
        fecha: prestamo.fecha,
        tipoGasto: 'variable',
        categoria: 'prestamo_inter_modulo',
        monto: prestamo.monto,
        descripcion: `Préstamo a ${datos.destino === 'familia' ? 'Familia' : 'NeuroTEA'}: ${datos.motivo}`
    });

    // Crear ingreso en el destino
    await crear(`${datos.destino}_ingresos`, {
        fecha: prestamo.fecha,
        categoria: 'prestamo_recibido',
        monto: prestamo.monto,
        descripcion: `Préstamo de ${datos.origen === 'neurotea' ? 'NeuroTEA' : 'Familia'}: ${datos.motivo}`
    });

    return await crear('prestamos_inter_modulo', prestamo);
}

// Registrar pago de préstamo inter-módulo
async function pagarPrestamoInterModulo(prestamoId, monto, fecha = null) {
    const prestamo = await obtenerPorId('prestamos_inter_modulo', prestamoId);
    if (!prestamo) throw new Error('Préstamo no encontrado');

    fecha = fecha || new Date().toISOString().split('T')[0];

    const nuevoPago = {
        id: generarId(),
        fecha,
        monto
    };

    const historialPagos = [...(prestamo.historialPagos || []), nuevoPago];
    const saldoPendiente = Math.max(0, prestamo.saldoPendiente - monto);
    const estado = saldoPendiente <= 0 ? 'pagado' : 'parcial';

    // Crear egreso en destino (quien paga)
    await crear(`${prestamo.destino}_egresos`, {
        fecha,
        tipoGasto: 'variable',
        categoria: 'pago_prestamo_inter_modulo',
        monto,
        descripcion: `Devolución préstamo a ${prestamo.origen === 'neurotea' ? 'NeuroTEA' : 'Familia'}`
    });

    // Crear ingreso en origen (quien recibe)
    await crear(`${prestamo.origen}_ingresos`, {
        fecha,
        categoria: 'devolucion_prestamo',
        monto,
        descripcion: `Devolución préstamo de ${prestamo.destino === 'familia' ? 'Familia' : 'NeuroTEA'}`
    });

    await actualizar('prestamos_inter_modulo', prestamoId, {
        historialPagos,
        saldoPendiente,
        estado
    });

    return await obtenerPorId('prestamos_inter_modulo', prestamoId);
}

// Obtener préstamos inter-módulo pendientes
async function obtenerPrestamosInterModuloPendientes(modulo = null) {
    const todos = await obtenerTodos('prestamos_inter_modulo');
    const pendientes = todos.filter(p => p.estado !== 'pagado');

    if (modulo) {
        return pendientes.filter(p => p.origen === modulo || p.destino === modulo);
    }

    return pendientes;
}

// ==========================================
// CUMPLIMIENTO DE PRESUPUESTO CON SEMÁFORO
// ==========================================

// Calcular cumplimiento de presupuesto con semáforo
async function calcularCumplimientoPresupuestoConSemaforo(modulo, año, mes) {
    const presupuesto = await obtenerPresupuestoMes(modulo, año, mes);

    if (!presupuesto) {
        return { hayPresupuesto: false };
    }

    const egresos = await obtenerEgresosMes(modulo, año, mes);

    // Agrupar egresos por categoría
    const gastosPorCategoria = {};
    for (const egreso of egresos) {
        const cat = egreso.categoria;
        if (!gastosPorCategoria[cat]) gastosPorCategoria[cat] = 0;
        gastosPorCategoria[cat] += egreso.monto;
    }

    // Generar tabla de cumplimiento con semáforos
    const tabla = [];
    let totalPresupuestado = 0;
    let totalGastado = 0;

    for (const [tipo, categorias] of Object.entries(presupuesto.limites || {})) {
        for (const [categoria, limite] of Object.entries(categorias)) {
            const gastado = gastosPorCategoria[categoria] || 0;
            const porcentaje = limite > 0 ? (gastado / limite) * 100 : 0;

            // Semáforo: 🟢 < 100%, 🟡 = 100%, 🔴 > 100%
            let semaforo = 'verde';
            let icono = '🟢';
            if (porcentaje > 100) {
                semaforo = 'rojo';
                icono = '🔴';
            } else if (porcentaje >= 95) {
                semaforo = 'amarillo';
                icono = '🟡';
            }

            tabla.push({
                tipo,
                categoria,
                presupuestado: limite,
                gastado,
                disponible: limite - gastado,
                porcentaje: Math.round(porcentaje * 100) / 100,
                semaforo,
                icono
            });

            totalPresupuestado += limite;
            totalGastado += gastado;
        }
    }

    // Ordenar por porcentaje descendente (los más críticos primero)
    tabla.sort((a, b) => b.porcentaje - a.porcentaje);

    const porcentajeGeneral = totalPresupuestado > 0 ? (totalGastado / totalPresupuestado) * 100 : 0;

    return {
        hayPresupuesto: true,
        año,
        mes,
        tabla,
        totalPresupuestado,
        totalGastado,
        totalDisponible: totalPresupuestado - totalGastado,
        porcentajeGeneral: Math.round(porcentajeGeneral * 100) / 100,
        semaforoGeneral: porcentajeGeneral > 100 ? '🔴' : porcentajeGeneral >= 95 ? '🟡' : '🟢',
        alertas: tabla.filter(t => t.semaforo !== 'verde')
    };
}
