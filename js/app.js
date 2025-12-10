/* ==========================================
   GESTOR FINANCIERO - APLICACIÓN PRINCIPAL
   Sistema de Contabilidad Empresarial
   ========================================== */

// Estado global
let moduloActual = null;
let seccionActual = 'dashboard';
let mesVisualizacion = getMesActual();

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await inicializarDB();
        await cargarPantallaInicio();
        await verificarAlertaRespaldo();
    } catch (error) {
        console.error('Error al inicializar:', error);
        mostrarToast('Error al inicializar la aplicación', 'error');
    }
});

async function cargarPantallaInicio() {
    const { año, mes } = getMesActual();

    // Cargar datos FAMILIA
    try {
        const resumenFamilia = await calcularResumenMes('familia', año, mes);
        const cuentasFamilia = await calcularTodosSaldos('familia');
        const totalCuentasFamilia = cuentasFamilia.filter(c => c.activa !== false).reduce((s, c) => s + c.saldoActual, 0);

        document.getElementById('familia-ingresos-preview').textContent = formatearMonedaCorto(resumenFamilia.totalIngresos);
        document.getElementById('familia-egresos-preview').textContent = formatearMonedaCorto(resumenFamilia.totalEgresos);
        document.getElementById('familia-balance-preview').textContent = formatearMonedaCorto(resumenFamilia.balance);
        document.getElementById('familia-balance-preview').className = `stat-value ${resumenFamilia.balance >= 0 ? 'positivo' : 'negativo'}`;
        document.getElementById('familia-cuentas-preview').textContent = formatearMonedaCorto(totalCuentasFamilia);
    } catch (e) {
        console.log('Sin datos de familia:', e);
    }

    // Cargar datos NEUROTEA
    try {
        const resumenNeurotea = await calcularResumenMes('neurotea', año, mes);
        const cuentasNeurotea = await calcularTodosSaldos('neurotea');
        const totalCuentasNeurotea = cuentasNeurotea.filter(c => c.activa !== false).reduce((s, c) => s + c.saldoActual, 0);

        document.getElementById('neurotea-ingresos-preview').textContent = formatearMonedaCorto(resumenNeurotea.totalIngresos);
        document.getElementById('neurotea-egresos-preview').textContent = formatearMonedaCorto(resumenNeurotea.totalEgresos);
        document.getElementById('neurotea-balance-preview').textContent = formatearMonedaCorto(resumenNeurotea.balance);
        document.getElementById('neurotea-balance-preview').className = `stat-value ${resumenNeurotea.balance >= 0 ? 'positivo' : 'negativo'}`;
        document.getElementById('neurotea-cuentas-preview').textContent = formatearMonedaCorto(totalCuentasNeurotea);
    } catch (e) {
        console.log('Sin datos de neurotea:', e);
    }
}

async function verificarAlertaRespaldo() {
    const resultado = await verificarNecesidadRespaldo();
    if (resultado.necesitaRespaldo) {
        document.getElementById('alerta-respaldo').classList.remove('hidden');
        document.getElementById('mensaje-respaldo').textContent = resultado.razon;
    }
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function abrirModulo(modulo) {
    moduloActual = modulo;
    seccionActual = 'dashboard';
    mesVisualizacion = getMesActual();

    // Ocultar inicio, mostrar app
    document.getElementById('pantalla-inicio').classList.add('hidden');
    document.getElementById('app-modulo').classList.remove('hidden');

    // Configurar sidebar
    const sidebar = document.getElementById('sidebar');
    sidebar.className = `sidebar ${modulo}`;

    if (modulo === 'familia') {
        document.getElementById('sidebar-icon').innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`;
        document.getElementById('sidebar-titulo').textContent = 'FAMILIA';
        document.getElementById('sidebar-subtitulo').textContent = 'Finanzas del hogar';
        document.querySelectorAll('.familia-only').forEach(el => el.classList.remove('hidden'));
    } else {
        document.getElementById('sidebar-icon').innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`;
        document.getElementById('sidebar-titulo').textContent = 'NEUROTEA';
        document.getElementById('sidebar-subtitulo').textContent = 'Clínica de Neurorehabilitación';
        document.querySelectorAll('.familia-only').forEach(el => el.classList.add('hidden'));
    }

    actualizarPeriodo();
    cargarSeccion('dashboard');
}

function salirAlInicio() {
    document.getElementById('app-modulo').classList.add('hidden');
    document.getElementById('pantalla-inicio').classList.remove('hidden');
    cargarPantallaInicio();
    moduloActual = null;
}

function cambiarSeccion(seccion) {
    seccionActual = seccion;

    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.seccion === seccion) {
            item.classList.add('active');
        }
    });

    cargarSeccion(seccion);
}

function actualizarPeriodo() {
    document.getElementById('periodo-actual').textContent = `${getNombreMes(mesVisualizacion.mes)} ${mesVisualizacion.año}`;
}

function cambiarMes(direccion) {
    let { año, mes } = mesVisualizacion;
    mes += direccion;

    if (mes > 12) { mes = 1; año++; }
    else if (mes < 1) { mes = 12; año--; }

    mesVisualizacion = { año, mes };
    actualizarPeriodo();
    cargarSeccion(seccionActual);
}

// ==========================================
// CARGA DE SECCIONES
// ==========================================

async function cargarSeccion(seccion) {
    const contenedor = document.getElementById('content-area');
    document.getElementById('header-titulo').textContent = getTituloSeccion(seccion);

    switch (seccion) {
        case 'dashboard': await renderDashboard(contenedor); break;
        case 'movimientos': await renderMovimientos(contenedor); break;
        case 'presupuesto': await renderPresupuesto(contenedor); break;
        case 'cuentas': await renderCuentas(contenedor); break;
        case 'prestamos': await renderPrestamos(contenedor); break;
        case 'metas': await renderMetas(contenedor); break;
        case 'reportes': await renderReportes(contenedor); break;
        case 'configuracion': renderConfiguracion(contenedor); break;
    }
}

function getTituloSeccion(seccion) {
    const titulos = {
        dashboard: 'Dashboard',
        movimientos: 'Movimientos',
        presupuesto: 'Presupuesto',
        cuentas: 'Cuentas Bancarias',
        prestamos: 'Préstamos',
        metas: 'Metas de Ahorro',
        reportes: 'Reportes',
        configuracion: 'Configuración'
    };
    return titulos[seccion] || seccion;
}

// ==========================================
// DASHBOARD
// ==========================================

async function renderDashboard(contenedor) {
    const { año, mes } = mesVisualizacion;
    const resumen = await calcularResumenMes(moduloActual, año, mes);
    const anterior = getMesAnterior(año, mes);
    const resumenAnterior = await calcularResumenMes(moduloActual, anterior.año, anterior.mes);
    const ejecucion = await calcularEjecucionPresupuesto(moduloActual, año, mes);
    const cuentas = await calcularTodosSaldos(moduloActual);
    const totalCuentas = cuentas.filter(c => c.activa !== false).reduce((s, c) => s + c.saldoActual, 0);

    const varIngresos = calcularVariacion(resumen.totalIngresos, resumenAnterior.totalIngresos);
    const varEgresos = calcularVariacion(resumen.totalEgresos, resumenAnterior.totalEgresos);

    let html = `
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <span class="stat-card-title">Ingresos del Mes</span>
                    <div class="stat-card-icon ingresos">↑</div>
                </div>
                <div class="stat-card-value positivo">${formatearMoneda(resumen.totalIngresos)}</div>
                <span class="stat-card-change ${varIngresos >= 0 ? 'up' : 'down'}">
                    ${varIngresos >= 0 ? '↑' : '↓'} ${Math.abs(varIngresos)}% vs mes anterior
                </span>
            </div>

            <div class="stat-card">
                <div class="stat-card-header">
                    <span class="stat-card-title">Egresos del Mes</span>
                    <div class="stat-card-icon egresos">↓</div>
                </div>
                <div class="stat-card-value negativo">${formatearMoneda(resumen.totalEgresos)}</div>
                <span class="stat-card-change ${varEgresos <= 0 ? 'up' : 'down'}">
                    ${varEgresos >= 0 ? '↑' : '↓'} ${Math.abs(varEgresos)}% vs mes anterior
                </span>
            </div>

            <div class="stat-card">
                <div class="stat-card-header">
                    <span class="stat-card-title">Balance</span>
                    <div class="stat-card-icon balance">=</div>
                </div>
                <div class="stat-card-value ${resumen.balance >= 0 ? 'positivo' : 'negativo'}">
                    ${resumen.balance >= 0 ? '+' : ''}${formatearMoneda(resumen.balance)}
                </div>
                <span class="stat-card-change ${resumen.balance >= 0 ? 'up' : 'down'}">
                    ${resumen.balance >= 0 ? 'Superávit' : 'Déficit'}
                </span>
            </div>

            <div class="stat-card">
                <div class="stat-card-header">
                    <span class="stat-card-title">Total en Cuentas</span>
                    <div class="stat-card-icon cuentas">$</div>
                </div>
                <div class="stat-card-value">${formatearMoneda(totalCuentas)}</div>
                <span class="text-muted text-small">${cuentas.filter(c => c.activa !== false).length} cuenta(s) activa(s)</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <div>
                <!-- Últimos Movimientos -->
                <div class="card mb-3">
                    <div class="card-header">
                        <span class="card-title">Últimos Movimientos</span>
                        <button class="btn btn-sm btn-outline" onclick="cambiarSeccion('movimientos')">Ver todos</button>
                    </div>
                    <div class="card-body no-padding">
                        ${await renderTablaMovimientosRecientes()}
                    </div>
                </div>

                <!-- Presupuesto -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Ejecución Presupuestaria</span>
                        <button class="btn btn-sm btn-outline" onclick="cambiarSeccion('presupuesto')">Gestionar</button>
                    </div>
                    <div class="card-body">
                        ${renderResumenPresupuesto(ejecucion)}
                    </div>
                </div>
            </div>

            <div>
                <!-- Distribución de Gastos -->
                <div class="card mb-3">
                    <div class="card-header">
                        <span class="card-title">Distribución de Gastos</span>
                    </div>
                    <div class="card-body">
                        ${renderDistribucionGastos(resumen.egresosPorTipo, resumen.totalEgresos)}
                    </div>
                </div>

                <!-- Cuentas -->
                <div class="card mb-3">
                    <div class="card-header">
                        <span class="card-title">Cuentas</span>
                    </div>
                    <div class="card-body">
                        ${renderListaCuentas(cuentas.filter(c => c.activa !== false))}
                    </div>
                </div>
    `;

    // Solo para familia: préstamos y metas
    if (moduloActual === 'familia') {
        const prestamos = await obtenerTodos('familia_prestamos');
        const prestamosActivos = prestamos.filter(p => p.estado === 'activo');
        const metas = await obtenerTodos('familia_metas');
        const metasActivas = metas.filter(m => m.estado === 'activa');

        if (prestamosActivos.length > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header">
                        <span class="card-title">Préstamos Activos</span>
                    </div>
                    <div class="card-body">
                        ${renderListaPrestamos(prestamosActivos.slice(0, 3))}
                    </div>
                </div>
            `;
        }

        if (metasActivas.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Metas de Ahorro</span>
                    </div>
                    <div class="card-body">
                        ${renderListaMetas(metasActivas)}
                    </div>
                </div>
            `;
        }
    }

    html += '</div></div>';
    contenedor.innerHTML = html;
}

async function renderTablaMovimientosRecientes() {
    const { año, mes } = mesVisualizacion;
    const ingresos = await obtenerIngresosMes(moduloActual, año, mes);
    const egresos = await obtenerEgresosMes(moduloActual, año, mes);

    const movimientos = [
        ...ingresos.map(i => ({ ...i, _tipo: 'ingreso' })),
        ...egresos.map(e => ({ ...e, _tipo: 'egreso' }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8);

    if (movimientos.length === 0) {
        return '<div class="empty-state"><p>No hay movimientos este mes</p></div>';
    }

    let html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Categoría</th>
                        <th class="text-right">Monto</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (const mov of movimientos) {
        const esIngreso = mov._tipo === 'ingreso';
        html += `
            <tr>
                <td>${formatearFecha(mov.fecha)}</td>
                <td><span class="badge ${esIngreso ? 'badge-ingreso' : 'badge-egreso'}">${esIngreso ? 'Ingreso' : 'Egreso'}</span></td>
                <td>${getNombreCategoria(mov.categoria)}</td>
                <td class="text-right monto ${esIngreso ? 'positivo' : 'negativo'}">
                    ${esIngreso ? '+' : '-'}${formatearMoneda(mov.monto)}
                </td>
            </tr>
        `;
    }

    html += '</tbody></table></div>';
    return html;
}

function renderResumenPresupuesto(ejecucion) {
    if (!ejecucion.hayPresupuesto) {
        return `
            <div class="empty-state">
                <p>No hay presupuesto definido para este mes</p>
                <button class="btn btn-primary btn-sm" onclick="cambiarSeccion('presupuesto')">Crear Presupuesto</button>
            </div>
        `;
    }

    const colorBarra = ejecucion.porcentajeGeneral >= 100 ? 'danger' :
                       ejecucion.porcentajeGeneral >= 80 ? 'warning' : 'success';

    let html = `
        <div class="mb-2">
            <div class="progress-label">
                <span>Usado: ${formatearMoneda(ejecucion.totalGastado)}</span>
                <span>${ejecucion.porcentajeGeneral}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar ${colorBarra}" style="width: ${Math.min(100, ejecucion.porcentajeGeneral)}%"></div>
            </div>
            <div class="progress-label mt-1">
                <span class="text-muted">Presupuesto: ${formatearMoneda(ejecucion.totalPresupuestado)}</span>
                <span class="${ejecucion.totalDisponible >= 0 ? 'text-success' : 'text-error'}">
                    Disponible: ${formatearMoneda(ejecucion.totalDisponible)}
                </span>
            </div>
        </div>
    `;

    if (ejecucion.alertas.length > 0) {
        html += '<div class="divider"></div><h4 class="text-small font-bold mb-1">Alertas</h4>';
        for (const alerta of ejecucion.alertas.slice(0, 3)) {
            const color = alerta.estado === 'excedido' ? 'error' : 'warning';
            html += `
                <div class="alert alert-${color} mb-1" style="padding: 8px 12px;">
                    <span>${getNombreCategoria(alerta.categoria)}: ${alerta.porcentaje}% usado</span>
                </div>
            `;
        }
    }

    return html;
}

function renderDistribucionGastos(egresosPorTipo, total) {
    if (Object.keys(egresosPorTipo).length === 0) {
        return '<div class="empty-state"><p>Sin gastos este mes</p></div>';
    }

    const colores = { fijo: '#1e3a5f', variable: '#0d7377', mantenimiento: '#d97706', ocio: '#7c3aed' };
    let html = '<ul class="list">';

    for (const [tipo, monto] of Object.entries(egresosPorTipo)) {
        const porcentaje = total > 0 ? ((monto / total) * 100).toFixed(0) : 0;
        html += `
            <li class="list-item">
                <div class="list-item-left">
                    <div class="list-item-icon" style="background: ${colores[tipo] || '#6b7280'}20; color: ${colores[tipo] || '#6b7280'};">
                        ${TIPOS_GASTO[tipo]?.icono || '•'}
                    </div>
                    <div class="list-item-content">
                        <h4>${TIPOS_GASTO[tipo]?.nombre || capitalizar(tipo)}</h4>
                        <p>${porcentaje}% del total</p>
                    </div>
                </div>
                <div class="list-item-right">
                    <span class="monto negativo">${formatearMoneda(monto)}</span>
                </div>
            </li>
        `;
    }

    return html + '</ul>';
}

function renderListaCuentas(cuentas) {
    if (cuentas.length === 0) {
        return '<div class="empty-state"><p>No hay cuentas registradas</p></div>';
    }

    let html = '<ul class="list">';
    for (const cuenta of cuentas) {
        html += `
            <li class="list-item">
                <div class="list-item-left">
                    <div class="list-item-icon" style="background: ${cuenta.color || '#6b7280'}20; color: ${cuenta.color || '#6b7280'};">$</div>
                    <div class="list-item-content">
                        <h4>${cuenta.nombre}</h4>
                        <p>${cuenta.banco || TIPOS_CUENTA[cuenta.tipo]?.nombre || ''}</p>
                    </div>
                </div>
                <div class="list-item-right">
                    <span class="monto ${cuenta.saldoActual >= 0 ? 'positivo' : 'negativo'}">${formatearMoneda(cuenta.saldoActual)}</span>
                </div>
            </li>
        `;
    }
    return html + '</ul>';
}

function renderListaPrestamos(prestamos) {
    let html = '<ul class="list">';
    for (const p of prestamos) {
        html += `
            <li class="list-item">
                <div class="list-item-content">
                    <h4>${p.nombre}</h4>
                    <p>Próximo pago: ${formatearFecha(p.fechaProximoPago)} - Cuota ${p.cuotasPagadas + 1}/${p.totalCuotas}</p>
                </div>
                <div class="list-item-right">
                    <span class="monto">${formatearMoneda(p.cuotaMensual)}</span>
                </div>
            </li>
        `;
    }
    return html + '</ul>';
}

function renderListaMetas(metas) {
    let html = '';
    for (const meta of metas) {
        const colorBarra = meta.progreso >= 100 ? 'success' : meta.progreso >= 50 ? 'info' : 'warning';
        html += `
            <div class="mb-2">
                <div class="progress-label">
                    <span class="font-bold">${meta.nombre}</span>
                    <span>${(meta.progreso || 0).toFixed(0)}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar ${colorBarra}" style="width: ${Math.min(100, meta.progreso || 0)}%"></div>
                </div>
                <div class="text-small text-muted mt-1">
                    ${formatearMoneda(meta.montoAcumulado || 0)} de ${formatearMoneda(meta.montoObjetivo)}
                </div>
            </div>
        `;
    }
    return html;
}

// ==========================================
// MOVIMIENTOS
// ==========================================

async function renderMovimientos(contenedor) {
    const { año, mes } = mesVisualizacion;
    const ingresos = await obtenerIngresosMes(moduloActual, año, mes);
    const egresos = await obtenerEgresosMes(moduloActual, año, mes);

    const movimientos = [
        ...ingresos.map(i => ({ ...i, _tipo: 'ingreso' })),
        ...egresos.map(e => ({ ...e, _tipo: 'egreso' }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = `
        <div class="mb-3" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span class="text-muted">${movimientos.length} movimiento(s) en ${getNombreMes(mes)} ${año}</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-success" onclick="abrirFormularioMovimiento('ingreso')">+ Nuevo Ingreso</button>
                <button class="btn btn-danger" onclick="abrirFormularioMovimiento('egreso')">+ Nuevo Egreso</button>
            </div>
        </div>

        <div class="card">
            <div class="card-body no-padding">
    `;

    if (movimientos.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">$</div><h3>Sin movimientos</h3><p>No hay movimientos registrados para este período</p></div>';
    } else {
        html += `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th class="text-right">Monto</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const mov of movimientos) {
            const esIngreso = mov._tipo === 'ingreso';
            html += `
                <tr>
                    <td>${formatearFecha(mov.fecha)}</td>
                    <td><span class="badge ${esIngreso ? 'badge-ingreso' : 'badge-egreso'}">${esIngreso ? 'Ingreso' : 'Egreso'}</span></td>
                    <td>${getNombreCategoria(mov.categoria)}</td>
                    <td>${mov.descripcion || '-'}</td>
                    <td class="text-right monto ${esIngreso ? 'positivo' : 'negativo'}">
                        ${esIngreso ? '+' : '-'}${formatearMoneda(mov.monto)}
                    </td>
                    <td class="text-right acciones">
                        <button class="btn btn-icon btn-sm btn-outline" onclick="editarMovimiento('${mov._tipo}', '${mov.id}')" title="Editar">✎</button>
                        <button class="btn btn-icon btn-sm btn-outline" onclick="eliminarMovimiento('${mov._tipo}', '${mov.id}')" title="Eliminar">✕</button>
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
    }

    html += '</div></div>';
    contenedor.innerHTML = html;
}

function abrirFormularioMovimiento(tipo) {
    const titulo = tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Egreso';
    document.getElementById('modal-form-titulo').textContent = titulo;

    let categoriasHTML = '';
    if (tipo === 'ingreso') {
        if (moduloActual === 'familia') {
            categoriasHTML = `
                <div class="form-group">
                    <label>Persona <span class="required">*</span></label>
                    <select class="form-control" id="mov-persona" onchange="actualizarCategoriasIngreso()">
                        <option value="marco">Marco</option>
                        <option value="clara">Clara</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
            `;
        }
        categoriasHTML += `
            <div class="form-group">
                <label>Categoría <span class="required">*</span></label>
                <select class="form-control" id="mov-categoria"></select>
            </div>
        `;
    } else {
        categoriasHTML = `
            <div class="form-group">
                <label>Tipo de Gasto <span class="required">*</span></label>
                <select class="form-control" id="mov-tipo-gasto" onchange="actualizarCategoriasEgreso()">
                    <option value="fijo">Fijo</option>
                    <option value="variable">Variable</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="ocio">Ocio/Entretenimiento</option>
                </select>
            </div>
            <div class="form-group">
                <label>Categoría <span class="required">*</span></label>
                <select class="form-control" id="mov-categoria"></select>
            </div>
        `;
    }

    const html = `
        <form id="form-movimiento">
            <input type="hidden" id="mov-tipo" value="${tipo}">
            <input type="hidden" id="mov-id" value="">

            <div class="form-row">
                <div class="form-group">
                    <label>Fecha <span class="required">*</span></label>
                    <input type="date" class="form-control" id="mov-fecha" value="${formatearFechaInput(new Date())}" required>
                </div>
                <div class="form-group">
                    <label>Monto (Gs.) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="mov-monto" min="1" required placeholder="0">
                </div>
            </div>

            <div class="form-row">
                ${categoriasHTML}
            </div>

            <div class="form-group">
                <label>Cuenta</label>
                <select class="form-control" id="mov-cuenta">
                    <option value="">Sin especificar</option>
                </select>
            </div>

            <div class="form-group">
                <label>Descripción</label>
                <input type="text" class="form-control" id="mov-descripcion" placeholder="Nota o detalle (opcional)">
            </div>
        </form>
    `;

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = guardarMovimiento;

    // Cargar categorías y cuentas
    if (tipo === 'ingreso') {
        actualizarCategoriasIngreso();
    } else {
        actualizarCategoriasEgreso();
    }
    cargarCuentasSelect();

    abrirModal('modal-formulario');
}

async function actualizarCategoriasIngreso() {
    const select = document.getElementById('mov-categoria');

    try {
        // Cargar categorías desde la base de datos
        let categorias = await obtenerCategorias(moduloActual, 'ingreso');

        if (moduloActual === 'familia') {
            const persona = document.getElementById('mov-persona')?.value || 'otro';
            // Filtrar por persona
            categorias = categorias.filter(c => c.persona === persona || c.persona === 'otro' || !c.persona);
        }

        if (categorias.length === 0) {
            // Fallback a categorías default si no hay en DB
            await inicializarCategoriasPredeterminadas(moduloActual);
            categorias = await obtenerCategorias(moduloActual, 'ingreso');
            if (moduloActual === 'familia') {
                const persona = document.getElementById('mov-persona')?.value || 'otro';
                categorias = categorias.filter(c => c.persona === persona || c.persona === 'otro' || !c.persona);
            }
        }

        select.innerHTML = categorias.map(c =>
            `<option value="${c.identificador}">${c.nombre}</option>`
        ).join('');
    } catch (error) {
        console.error('Error cargando categorías de ingreso:', error);
        // Fallback a constantes
        const cats = moduloActual === 'familia'
            ? (CATEGORIAS_DEFAULT.familia.ingresos[document.getElementById('mov-persona')?.value || 'otro'] || [])
            : (CATEGORIAS_DEFAULT.neurotea.ingresos.principal || []);
        select.innerHTML = cats.map(c => `<option value="${c}">${getNombreCategoria(c)}</option>`).join('');
    }
}

async function actualizarCategoriasEgreso() {
    const select = document.getElementById('mov-categoria');
    const tipoGasto = document.getElementById('mov-tipo-gasto')?.value || 'variable';

    try {
        // Cargar categorías desde la base de datos
        let categorias = await obtenerCategorias(moduloActual, 'egreso', tipoGasto);

        if (categorias.length === 0) {
            // Fallback a categorías default si no hay en DB
            await inicializarCategoriasPredeterminadas(moduloActual);
            categorias = await obtenerCategorias(moduloActual, 'egreso', tipoGasto);
        }

        select.innerHTML = categorias.map(c =>
            `<option value="${c.identificador}">${c.nombre}</option>`
        ).join('');
    } catch (error) {
        console.error('Error cargando categorías de egreso:', error);
        // Fallback a constantes
        const cats = moduloActual === 'familia'
            ? (CATEGORIAS_DEFAULT.familia.egresos[tipoGasto] || [])
            : (CATEGORIAS_DEFAULT.neurotea.egresos[tipoGasto] || []);
        select.innerHTML = cats.map(c => `<option value="${c}">${getNombreCategoria(c)}</option>`).join('');
    }
}

async function cargarCuentasSelect() {
    const select = document.getElementById('mov-cuenta');
    const cuentas = await obtenerTodos(`${moduloActual}_cuentas`);

    select.innerHTML = '<option value="">Sin especificar</option>' +
        cuentas.filter(c => c.activa !== false).map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

async function guardarMovimiento() {
    const tipo = document.getElementById('mov-tipo').value;
    const id = document.getElementById('mov-id').value;
    const fecha = document.getElementById('mov-fecha').value;
    const monto = parseInt(document.getElementById('mov-monto').value);
    const categoria = document.getElementById('mov-categoria').value;
    const cuenta = document.getElementById('mov-cuenta').value;
    const descripcion = document.getElementById('mov-descripcion').value;

    if (!fecha || !monto || monto <= 0 || !categoria) {
        mostrarToast('Complete todos los campos requeridos', 'error');
        return;
    }

    try {
        const datos = {
            fecha,
            monto,
            categoria,
            descripcion: sanitizarTexto(descripcion)
        };

        if (tipo === 'ingreso') {
            datos.cuentaDestino = cuenta || null;
            if (moduloActual === 'familia') {
                datos.persona = document.getElementById('mov-persona').value;
            }

            if (id) {
                await actualizar(`${moduloActual}_ingresos`, id, datos);
            } else {
                await crear(`${moduloActual}_ingresos`, datos);
            }
        } else {
            datos.cuentaOrigen = cuenta || null;
            datos.tipoGasto = document.getElementById('mov-tipo-gasto').value;

            if (id) {
                await actualizar(`${moduloActual}_egresos`, id, datos);
            } else {
                await crear(`${moduloActual}_egresos`, datos);
            }
        }

        mostrarToast(`${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} guardado correctamente`, 'success');
        cerrarModal('modal-formulario');
        cargarSeccion('movimientos');
    } catch (error) {
        mostrarToast('Error al guardar', 'error');
    }
}

async function editarMovimiento(tipo, id) {
    const store = tipo === 'ingreso' ? `${moduloActual}_ingresos` : `${moduloActual}_egresos`;
    const mov = await obtenerPorId(store, id);
    if (!mov) return;

    abrirFormularioMovimiento(tipo);

    setTimeout(() => {
        document.getElementById('mov-id').value = id;
        document.getElementById('mov-fecha').value = mov.fecha;
        document.getElementById('mov-monto').value = mov.monto;
        document.getElementById('mov-descripcion').value = mov.descripcion || '';

        if (tipo === 'ingreso' && moduloActual === 'familia') {
            document.getElementById('mov-persona').value = mov.persona;
            actualizarCategoriasIngreso().then(() => {
                document.getElementById('mov-categoria').value = mov.categoria;
            });
        } else if (tipo === 'egreso') {
            document.getElementById('mov-tipo-gasto').value = mov.tipoGasto;
            actualizarCategoriasEgreso().then(() => {
                document.getElementById('mov-categoria').value = mov.categoria;
            });
        } else {
            document.getElementById('mov-categoria').value = mov.categoria;
        }

        cargarCuentasSelect().then(() => {
            document.getElementById('mov-cuenta').value = mov.cuentaDestino || mov.cuentaOrigen || '';
        });
    }, 100);
}

async function eliminarMovimiento(tipo, id) {
    const confirmado = await confirmarAccion('Eliminar movimiento', '¿Está seguro de eliminar este movimiento?\n\nPodrá restaurarlo desde la papelera en Configuración.');
    if (!confirmado) return;

    try {
        const store = tipo === 'ingreso' ? `${moduloActual}_ingresos` : `${moduloActual}_egresos`;
        await softDelete(store, id);
        mostrarToast('Movimiento movido a papelera', 'success');
        cargarSeccion('movimientos');
    } catch (error) {
        mostrarToast('Error al eliminar', 'error');
    }
}

// ==========================================
// CUENTAS
// ==========================================

async function renderCuentas(contenedor) {
    const cuentas = await calcularTodosSaldos(moduloActual);
    const totalActivas = cuentas.filter(c => c.activa !== false).reduce((s, c) => s + c.saldoActual, 0);

    let html = `
        <div class="mb-3" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span class="text-muted">${cuentas.length} cuenta(s) registrada(s)</span>
            </div>
            <button class="btn btn-primary" onclick="abrirFormularioCuenta()">+ Nueva Cuenta</button>
        </div>

        <div class="stats-grid mb-3">
            <div class="stat-card">
                <div class="stat-card-header">
                    <span class="stat-card-title">Total en Cuentas Activas</span>
                </div>
                <div class="stat-card-value ${totalActivas >= 0 ? 'positivo' : 'negativo'}">${formatearMoneda(totalActivas)}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-body no-padding">
    `;

    if (cuentas.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">$</div><h3>Sin cuentas</h3><p>Agregue su primera cuenta bancaria o de efectivo</p></div>';
    } else {
        html += `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Cuenta</th>
                            <th>Tipo</th>
                            <th>Banco</th>
                            <th class="text-right">Saldo Inicial</th>
                            <th class="text-right">Saldo Actual</th>
                            <th>Estado</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const cuenta of cuentas) {
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; background: ${cuenta.color || '#6b7280'}; border-radius: 50%;"></div>
                            <strong>${cuenta.nombre}</strong>
                        </div>
                    </td>
                    <td>${TIPOS_CUENTA[cuenta.tipo]?.nombre || cuenta.tipo}</td>
                    <td>${cuenta.banco || '-'}</td>
                    <td class="text-right monto">${formatearMoneda(cuenta.saldoInicial || 0)}</td>
                    <td class="text-right monto ${cuenta.saldoActual >= 0 ? 'positivo' : 'negativo'}">${formatearMoneda(cuenta.saldoActual)}</td>
                    <td><span class="badge ${cuenta.activa !== false ? 'badge-activo' : 'badge-pagado'}">${cuenta.activa !== false ? 'Activa' : 'Inactiva'}</span></td>
                    <td class="text-right acciones">
                        <button class="btn btn-icon btn-sm btn-outline" onclick="editarCuenta('${cuenta.id}')" title="Editar">✎</button>
                        <button class="btn btn-icon btn-sm btn-outline" onclick="eliminarCuentaConf('${cuenta.id}')" title="Eliminar">✕</button>
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
    }

    html += '</div></div>';
    contenedor.innerHTML = html;
}

function abrirFormularioCuenta(cuentaId = null) {
    document.getElementById('modal-form-titulo').textContent = cuentaId ? 'Editar Cuenta' : 'Nueva Cuenta';

    const html = `
        <form id="form-cuenta">
            <input type="hidden" id="cuenta-id" value="${cuentaId || ''}">

            <div class="form-row">
                <div class="form-group">
                    <label>Nombre de la cuenta <span class="required">*</span></label>
                    <input type="text" class="form-control" id="cuenta-nombre" required placeholder="Ej: Cuenta Corriente">
                </div>
                <div class="form-group">
                    <label>Banco o Institución</label>
                    <input type="text" class="form-control" id="cuenta-banco" placeholder="Ej: Banco Continental">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Tipo de cuenta</label>
                    <select class="form-control" id="cuenta-tipo">
                        <option value="corriente">Corriente</option>
                        <option value="ahorro">Ahorro</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Saldo inicial (Gs.)</label>
                    <input type="number" class="form-control" id="cuenta-saldo" value="0" min="0">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Color identificador</label>
                    <input type="color" class="form-control" id="cuenta-color" value="#1e3a5f" style="height: 42px;">
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="cuenta-activa" checked>
                        Cuenta activa
                    </label>
                </div>
            </div>
        </form>
    `;

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = guardarCuenta;

    if (cuentaId) {
        cargarDatosCuenta(cuentaId);
    }

    abrirModal('modal-formulario');
}

async function cargarDatosCuenta(cuentaId) {
    const cuenta = await obtenerPorId(`${moduloActual}_cuentas`, cuentaId);
    if (!cuenta) return;

    document.getElementById('cuenta-nombre').value = cuenta.nombre;
    document.getElementById('cuenta-banco').value = cuenta.banco || '';
    document.getElementById('cuenta-tipo').value = cuenta.tipo;
    document.getElementById('cuenta-saldo').value = cuenta.saldoInicial || 0;
    document.getElementById('cuenta-color').value = cuenta.color || '#1e3a5f';
    document.getElementById('cuenta-activa').checked = cuenta.activa !== false;
}

async function guardarCuenta() {
    const id = document.getElementById('cuenta-id').value;
    const datos = {
        nombre: sanitizarTexto(document.getElementById('cuenta-nombre').value),
        banco: sanitizarTexto(document.getElementById('cuenta-banco').value),
        tipo: document.getElementById('cuenta-tipo').value,
        saldoInicial: parseInt(document.getElementById('cuenta-saldo').value) || 0,
        color: document.getElementById('cuenta-color').value,
        activa: document.getElementById('cuenta-activa').checked
    };

    if (!datos.nombre) {
        mostrarToast('El nombre es requerido', 'error');
        return;
    }

    try {
        if (id) {
            await actualizar(`${moduloActual}_cuentas`, id, datos);
        } else {
            await crear(`${moduloActual}_cuentas`, datos);
        }
        mostrarToast('Cuenta guardada', 'success');
        cerrarModal('modal-formulario');
        cargarSeccion('cuentas');
    } catch (error) {
        mostrarToast('Error al guardar', 'error');
    }
}

function editarCuenta(id) {
    abrirFormularioCuenta(id);
}

async function eliminarCuentaConf(id) {
    const ingresos = await obtenerPorIndice(`${moduloActual}_ingresos`, 'cuentaDestino', id);
    const egresos = await obtenerPorIndice(`${moduloActual}_egresos`, 'cuentaOrigen', id);

    if (ingresos.length > 0 || egresos.length > 0) {
        mostrarToast(`No se puede eliminar: hay ${ingresos.length + egresos.length} movimientos asociados`, 'error');
        return;
    }

    const confirmado = await confirmarAccion('Eliminar cuenta', '¿Está seguro de eliminar esta cuenta?\n\nPodrá restaurarla desde la papelera en Configuración.');
    if (!confirmado) return;

    try {
        await softDelete(`${moduloActual}_cuentas`, id);
        mostrarToast('Cuenta movida a papelera', 'success');
        cargarSeccion('cuentas');
    } catch (error) {
        mostrarToast('Error al eliminar', 'error');
    }
}

// ==========================================
// PRESUPUESTO
// ==========================================

async function renderPresupuesto(contenedor) {
    const { año, mes } = mesVisualizacion;
    const presupuesto = await obtenerPresupuestoMes(moduloActual, año, mes);
    const ejecucion = await calcularEjecucionPresupuesto(moduloActual, año, mes);

    let html = `
        <div class="mb-3" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
                <span class="text-muted">Presupuesto para ${getNombreMes(mes)} ${año}</span>
            </div>
            <div style="display: flex; gap: 8px;">
                ${!presupuesto ? `<button class="btn btn-secondary" onclick="copiarPresupuestoAnterior()">Copiar mes anterior</button>` : ''}
                <button class="btn btn-primary" onclick="editarPresupuesto()">${presupuesto ? 'Editar' : 'Crear'} Presupuesto</button>
            </div>
        </div>
    `;

    if (!presupuesto) {
        html += `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <h3>Sin presupuesto</h3>
                        <p>No hay presupuesto definido para este mes</p>
                        <button class="btn btn-primary" onclick="editarPresupuesto()">Crear Presupuesto</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        const colorBarra = ejecucion.porcentajeGeneral >= 100 ? 'danger' :
                           ejecucion.porcentajeGeneral >= 80 ? 'warning' : 'success';

        html += `
            <div class="stats-grid mb-3">
                <div class="stat-card">
                    <div class="stat-card-title">Presupuestado</div>
                    <div class="stat-card-value">${formatearMoneda(ejecucion.totalPresupuestado)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Gastado</div>
                    <div class="stat-card-value negativo">${formatearMoneda(ejecucion.totalGastado)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Disponible</div>
                    <div class="stat-card-value ${ejecucion.totalDisponible >= 0 ? 'positivo' : 'negativo'}">
                        ${formatearMoneda(ejecucion.totalDisponible)}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Ejecución</div>
                    <div class="stat-card-value">${ejecucion.porcentajeGeneral}%</div>
                    <div class="progress mt-1">
                        <div class="progress-bar ${colorBarra}" style="width: ${Math.min(100, ejecucion.porcentajeGeneral)}%"></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">Detalle por Categoría</span>
                </div>
                <div class="card-body no-padding">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Categoría</th>
                                    <th class="text-right">Presupuesto</th>
                                    <th class="text-right">Gastado</th>
                                    <th class="text-right">Disponible</th>
                                    <th>Progreso</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        for (const item of ejecucion.detalle) {
            const colorBarra = item.estado === 'excedido' ? 'danger' :
                               item.estado === 'critico' ? 'danger' :
                               item.estado === 'alerta' ? 'warning' : 'success';
            const badgeClass = item.estado === 'ok' ? 'badge-activo' :
                               item.estado === 'alerta' ? 'badge-pendiente' : 'badge-atrasado';

            html += `
                <tr>
                    <td>${TIPOS_GASTO[item.tipo]?.nombre || capitalizar(item.tipo)}</td>
                    <td>${getNombreCategoria(item.categoria)}</td>
                    <td class="text-right monto">${formatearMoneda(item.presupuestado)}</td>
                    <td class="text-right monto negativo">${formatearMoneda(item.gastado)}</td>
                    <td class="text-right monto ${item.disponible >= 0 ? 'positivo' : 'negativo'}">${formatearMoneda(item.disponible)}</td>
                    <td style="min-width: 120px;">
                        <div class="progress">
                            <div class="progress-bar ${colorBarra}" style="width: ${Math.min(100, item.porcentaje)}%"></div>
                        </div>
                        <span class="text-small text-muted">${item.porcentaje}%</span>
                    </td>
                    <td><span class="badge ${badgeClass}">${capitalizar(item.estado)}</span></td>
                </tr>
            `;
        }

        html += '</tbody></table></div></div></div>';
    }

    contenedor.innerHTML = html;
}

async function copiarPresupuestoAnterior() {
    try {
        await copiarPresupuestoMesAnterior(moduloActual, mesVisualizacion.año, mesVisualizacion.mes);
        mostrarToast('Presupuesto copiado del mes anterior', 'success');
        cargarSeccion('presupuesto');
    } catch (error) {
        mostrarToast(error.message || 'Error al copiar', 'error');
    }
}

async function editarPresupuesto() {
    const { año, mes } = mesVisualizacion;
    const presupuesto = await obtenerPresupuestoMes(moduloActual, año, mes);

    // Cargar categorías dinámicamente desde la DB
    let categoriasDB = await obtenerTodasCategorias(moduloActual, 'egreso');

    if (categoriasDB.length === 0) {
        await inicializarCategoriasPredeterminadas(moduloActual);
        categoriasDB = await obtenerTodasCategorias(moduloActual, 'egreso');
    }

    // Agrupar por tipo de gasto
    const categoriasPorTipo = {};
    for (const cat of categoriasDB) {
        if (cat.activa === false) continue;
        const tipo = cat.tipoGasto || 'variable';
        if (!categoriasPorTipo[tipo]) {
            categoriasPorTipo[tipo] = [];
        }
        categoriasPorTipo[tipo].push(cat);
    }

    document.getElementById('modal-form-titulo').textContent = `Presupuesto - ${getNombreMes(mes)} ${año}`;

    let html = '<form id="form-presupuesto">';

    const tiposOrden = ['fijo', 'variable', 'mantenimiento', 'ocio'];
    for (const tipoGasto of tiposOrden) {
        const cats = categoriasPorTipo[tipoGasto] || [];
        if (cats.length === 0) continue;

        html += `<h4 class="form-section-title">${TIPOS_GASTO[tipoGasto]?.nombre || capitalizar(tipoGasto)}</h4><div class="form-row">`;

        for (const cat of cats) {
            const valorActual = presupuesto?.limites?.[tipoGasto]?.[cat.identificador] || '';
            html += `
                <div class="form-group">
                    <label>${cat.nombre}</label>
                    <input type="number" class="form-control" name="pres_${tipoGasto}_${cat.identificador}" value="${valorActual}" min="0" placeholder="0">
                </div>
            `;
        }

        html += '</div>';
    }

    html += '</form>';

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = guardarPresupuesto;

    abrirModal('modal-formulario');
}

async function guardarPresupuesto() {
    const { año, mes } = mesVisualizacion;
    const form = document.getElementById('form-presupuesto');
    const limites = {};

    // Cargar categorías dinámicamente desde la DB
    let categoriasDB = await obtenerTodasCategorias(moduloActual, 'egreso');

    // Agrupar por tipo de gasto
    const categoriasPorTipo = {};
    for (const cat of categoriasDB) {
        if (cat.activa === false) continue;
        const tipo = cat.tipoGasto || 'variable';
        if (!categoriasPorTipo[tipo]) {
            categoriasPorTipo[tipo] = [];
        }
        categoriasPorTipo[tipo].push(cat);
    }

    for (const [tipoGasto, cats] of Object.entries(categoriasPorTipo)) {
        limites[tipoGasto] = {};
        for (const cat of cats) {
            const input = form.querySelector(`[name="pres_${tipoGasto}_${cat.identificador}"]`);
            if (input && parseInt(input.value) > 0) {
                limites[tipoGasto][cat.identificador] = parseInt(input.value);
            }
        }
    }

    try {
        const existente = await obtenerPresupuestoMes(moduloActual, año, mes);

        if (existente) {
            await actualizar(`${moduloActual}_presupuesto`, existente.id, { limites });
        } else {
            await crear(`${moduloActual}_presupuesto`, { año, mes, limites });
        }

        mostrarToast('Presupuesto guardado', 'success');
        cerrarModal('modal-formulario');
        cargarSeccion('presupuesto');
    } catch (error) {
        mostrarToast('Error al guardar', 'error');
    }
}

// ==========================================
// PRÉSTAMOS (Solo Familia)
// ==========================================

async function renderPrestamos(contenedor) {
    const prestamos = await obtenerTodos('familia_prestamos');

    let html = `
        <div class="mb-3" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="text-muted">${prestamos.length} préstamo(s) registrado(s)</span>
            <button class="btn btn-primary" onclick="abrirFormularioPrestamo()">+ Nuevo Préstamo</button>
        </div>

        <div class="card">
            <div class="card-body no-padding">
    `;

    if (prestamos.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">💳</div><h3>Sin préstamos</h3><p>No hay préstamos registrados</p></div>';
    } else {
        html += `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Préstamo</th>
                            <th>Entidad</th>
                            <th class="text-right">Cuota</th>
                            <th class="text-right">Saldo</th>
                            <th>Progreso</th>
                            <th>Próximo Pago</th>
                            <th>Estado</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const p of prestamos) {
            const progreso = p.totalCuotas > 0 ? ((p.cuotasPagadas / p.totalCuotas) * 100).toFixed(0) : 0;
            const badgeClass = p.estado === 'activo' ? 'badge-activo' :
                               p.estado === 'pagado' ? 'badge-pagado' : 'badge-atrasado';

            html += `
                <tr>
                    <td><strong>${p.nombre}</strong></td>
                    <td>${p.entidad || '-'}</td>
                    <td class="text-right monto">${formatearMoneda(p.cuotaMensual)}</td>
                    <td class="text-right monto">${formatearMoneda(p.saldoPendiente)}</td>
                    <td style="min-width: 100px;">
                        <div class="progress">
                            <div class="progress-bar success" style="width: ${progreso}%"></div>
                        </div>
                        <span class="text-small text-muted">${p.cuotasPagadas}/${p.totalCuotas}</span>
                    </td>
                    <td>${p.estado === 'pagado' ? '-' : formatearFecha(p.fechaProximoPago)}</td>
                    <td><span class="badge ${badgeClass}">${capitalizar(p.estado)}</span></td>
                    <td class="text-right acciones">
                        ${p.estado === 'activo' ? `<button class="btn btn-sm btn-success" onclick="registrarPagoPrestamoUI('${p.id}')">Pagar</button>` : ''}
                        <button class="btn btn-icon btn-sm btn-outline" onclick="eliminarPrestamoConf('${p.id}')" title="Eliminar">✕</button>
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table></div>';
    }

    html += '</div></div>';
    contenedor.innerHTML = html;
}

function abrirFormularioPrestamo() {
    document.getElementById('modal-form-titulo').textContent = 'Nuevo Préstamo';

    const html = `
        <form id="form-prestamo">
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre del préstamo <span class="required">*</span></label>
                    <input type="text" class="form-control" id="prestamo-nombre" required placeholder="Ej: Préstamo Personal">
                </div>
                <div class="form-group">
                    <label>Entidad financiera</label>
                    <input type="text" class="form-control" id="prestamo-entidad" placeholder="Ej: Banco Continental">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Tipo</label>
                    <select class="form-control" id="prestamo-tipo">
                        <option value="personal">Personal</option>
                        <option value="hipotecario">Hipotecario</option>
                        <option value="vehicular">Vehicular</option>
                        <option value="tarjeta">Tarjeta de Crédito</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Monto original (Gs.) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="prestamo-monto" required min="1">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Cuota mensual (Gs.) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="prestamo-cuota" required min="1">
                </div>
                <div class="form-group">
                    <label>Total de cuotas <span class="required">*</span></label>
                    <input type="number" class="form-control" id="prestamo-total-cuotas" required min="1" max="360">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Cuotas ya pagadas</label>
                    <input type="number" class="form-control" id="prestamo-cuotas-pagadas" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Día de pago mensual <span class="required">*</span></label>
                    <input type="number" class="form-control" id="prestamo-dia" required min="1" max="31" value="15">
                </div>
            </div>
        </form>
    `;

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = guardarPrestamo;
    abrirModal('modal-formulario');
}

async function guardarPrestamo() {
    const montoOriginal = parseInt(document.getElementById('prestamo-monto').value);
    const cuotasPagadas = parseInt(document.getElementById('prestamo-cuotas-pagadas').value) || 0;
    const cuotaMensual = parseInt(document.getElementById('prestamo-cuota').value);

    const datos = {
        nombre: sanitizarTexto(document.getElementById('prestamo-nombre').value),
        entidad: sanitizarTexto(document.getElementById('prestamo-entidad').value),
        tipo: document.getElementById('prestamo-tipo').value,
        montoOriginal,
        cuotaMensual,
        totalCuotas: parseInt(document.getElementById('prestamo-total-cuotas').value),
        cuotasPagadas,
        saldoPendiente: montoOriginal - (cuotasPagadas * cuotaMensual),
        diaPago: parseInt(document.getElementById('prestamo-dia').value),
        fechaInicio: formatearFechaInput(new Date()),
        estado: 'activo',
        historialPagos: []
    };

    // Calcular próxima fecha
    const hoy = new Date();
    let proximoPago = new Date(hoy.getFullYear(), hoy.getMonth(), datos.diaPago);
    if (proximoPago < hoy) proximoPago.setMonth(proximoPago.getMonth() + 1);
    datos.fechaProximoPago = formatearFechaInput(proximoPago);

    if (!datos.nombre || !datos.cuotaMensual || !datos.totalCuotas) {
        mostrarToast('Complete los campos requeridos', 'error');
        return;
    }

    try {
        await crear('familia_prestamos', datos);
        mostrarToast('Préstamo creado', 'success');
        cerrarModal('modal-formulario');
        cargarSeccion('prestamos');
    } catch (error) {
        mostrarToast('Error al crear', 'error');
    }
}

function registrarPagoPrestamoUI(id) {
    document.getElementById('modal-form-titulo').textContent = 'Registrar Pago';

    obtenerPorId('familia_prestamos', id).then(prestamo => {
        const html = `
            <form id="form-pago-prestamo">
                <input type="hidden" id="pago-prestamo-id" value="${id}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de pago</label>
                        <input type="date" class="form-control" id="pago-fecha" value="${formatearFechaInput(new Date())}" required>
                    </div>
                    <div class="form-group">
                        <label>Monto (Gs.)</label>
                        <input type="number" class="form-control" id="pago-monto" value="${prestamo.cuotaMensual}" required min="1">
                    </div>
                </div>
            </form>
        `;

        document.getElementById('modal-form-contenido').innerHTML = html;
        document.getElementById('modal-form-guardar').onclick = ejecutarPagoPrestamo;
        abrirModal('modal-formulario');
    });
}

async function ejecutarPagoPrestamo() {
    const prestamoId = document.getElementById('pago-prestamo-id').value;
    const fecha = document.getElementById('pago-fecha').value;
    const monto = parseInt(document.getElementById('pago-monto').value);

    try {
        await registrarPagoPrestamo(prestamoId, monto, fecha);
        mostrarToast('Pago registrado', 'success');
        cerrarModal('modal-formulario');
        cargarSeccion('prestamos');
    } catch (error) {
        mostrarToast(error.message || 'Error al registrar', 'error');
    }
}

async function eliminarPrestamoConf(id) {
    const confirmado = await confirmarAccion('Eliminar préstamo', 'Se moverán a la papelera el préstamo y los pagos asociados. ¿Continuar?\n\nPodrá restaurarlos desde Configuración > Papelera.');
    if (!confirmado) return;

    try {
        const egresos = await obtenerPorIndice('familia_egresos', 'prestamoId', id);
        for (const e of egresos) await softDelete('familia_egresos', e.id);
        await softDelete('familia_prestamos', id);
        mostrarToast('Préstamo movido a papelera', 'success');
        cargarSeccion('prestamos');
    } catch (error) {
        mostrarToast('Error al eliminar', 'error');
    }
}

// ==========================================
// METAS (Solo Familia)
// ==========================================

async function renderMetas(contenedor) {
    const metas = await obtenerTodos('familia_metas');

    let html = `
        <div class="mb-3" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="text-muted">${metas.length} meta(s) registrada(s)</span>
            <button class="btn btn-primary" onclick="abrirFormularioMeta()">+ Nueva Meta</button>
        </div>
    `;

    if (metas.length === 0) {
        html += `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <div class="empty-state-icon">🎯</div>
                        <h3>Sin metas</h3>
                        <p>Cree su primera meta de ahorro</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        html += '<div class="stats-grid">';
        for (const meta of metas) {
            const progreso = meta.progreso || 0;
            const colorBarra = progreso >= 100 ? 'success' : progreso >= 50 ? 'info' : 'warning';
            const badgeClass = meta.estado === 'activa' ? 'badge-activo' :
                               meta.estado === 'completada' ? 'badge-pagado' : 'badge-pendiente';

            html += `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">${meta.nombre}</span>
                        <span class="badge ${badgeClass}">${capitalizar(meta.estado)}</span>
                    </div>
                    <div class="card-body">
                        ${meta.descripcion ? `<p class="text-muted mb-2">${meta.descripcion}</p>` : ''}

                        <div class="progress-label">
                            <span>Progreso</span>
                            <span>${progreso.toFixed(1)}%</span>
                        </div>
                        <div class="progress mb-2">
                            <div class="progress-bar ${colorBarra}" style="width: ${Math.min(100, progreso)}%"></div>
                        </div>

                        <div class="text-small">
                            <div style="display: flex; justify-content: space-between;">
                                <span class="text-muted">Acumulado:</span>
                                <span class="font-bold">${formatearMoneda(meta.montoAcumulado || 0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span class="text-muted">Objetivo:</span>
                                <span>${formatearMoneda(meta.montoObjetivo)}</span>
                            </div>
                        </div>

                        <div class="divider"></div>

                        <div style="display: flex; justify-content: space-between;">
                            ${meta.estado !== 'completada' ?
                                `<button class="btn btn-sm btn-success" onclick="agregarAporteUI('${meta.id}')">+ Aporte</button>` :
                                '<span></span>'}
                            <button class="btn btn-sm btn-outline" onclick="eliminarMetaConf('${meta.id}')">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
    }

    contenedor.innerHTML = html;
}

function abrirFormularioMeta() {
    document.getElementById('modal-form-titulo').textContent = 'Nueva Meta de Ahorro';

    const html = `
        <form id="form-meta">
            <div class="form-group">
                <label>Nombre de la meta <span class="required">*</span></label>
                <input type="text" class="form-control" id="meta-nombre" required placeholder="Ej: Fondo de Emergencia">
            </div>

            <div class="form-group">
                <label>Descripción</label>
                <input type="text" class="form-control" id="meta-descripcion" placeholder="Ej: 3 meses de gastos">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Monto objetivo (Gs.) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="meta-objetivo" required min="1">
                </div>
                <div class="form-group">
                    <label>Fecha límite (opcional)</label>
                    <input type="date" class="form-control" id="meta-fecha-limite">
                </div>
            </div>
        </form>
    `;

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = guardarMeta;
    abrirModal('modal-formulario');
}

async function guardarMeta() {
    const datos = {
        nombre: sanitizarTexto(document.getElementById('meta-nombre').value),
        descripcion: sanitizarTexto(document.getElementById('meta-descripcion').value),
        montoObjetivo: parseInt(document.getElementById('meta-objetivo').value),
        fechaLimite: document.getElementById('meta-fecha-limite').value || null,
        fechaInicio: formatearFechaInput(new Date()),
        montoAcumulado: 0,
        progreso: 0,
        estado: 'activa',
        aportes: []
    };

    if (!datos.nombre || !datos.montoObjetivo) {
        mostrarToast('Complete los campos requeridos', 'error');
        return;
    }

    try {
        await crear('familia_metas', datos);
        mostrarToast('Meta creada', 'success');
        cerrarModal('modal-formulario');
        cargarSeccion('metas');
    } catch (error) {
        mostrarToast('Error al crear', 'error');
    }
}

function agregarAporteUI(metaId) {
    document.getElementById('modal-form-titulo').textContent = 'Agregar Aporte';

    const html = `
        <form id="form-aporte">
            <input type="hidden" id="aporte-meta-id" value="${metaId}">
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" class="form-control" id="aporte-fecha" value="${formatearFechaInput(new Date())}" required>
                </div>
                <div class="form-group">
                    <label>Monto (Gs.) <span class="required">*</span></label>
                    <input type="number" class="form-control" id="aporte-monto" required min="1">
                </div>
            </div>
            <div class="form-group">
                <label>Nota (opcional)</label>
                <input type="text" class="form-control" id="aporte-nota" placeholder="Ej: Aporte mensual">
            </div>
        </form>
    `;

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = ejecutarAporte;
    abrirModal('modal-formulario');
}

async function ejecutarAporte() {
    const metaId = document.getElementById('aporte-meta-id').value;
    const fecha = document.getElementById('aporte-fecha').value;
    const monto = parseInt(document.getElementById('aporte-monto').value);
    const nota = document.getElementById('aporte-nota').value;

    if (!monto || monto <= 0) {
        mostrarToast('Ingrese un monto válido', 'error');
        return;
    }

    try {
        await agregarAporteMeta(metaId, monto, fecha, nota);
        mostrarToast('Aporte agregado', 'success');
        cerrarModal('modal-formulario');
        cargarSeccion('metas');
    } catch (error) {
        mostrarToast(error.message || 'Error al agregar', 'error');
    }
}

async function eliminarMetaConf(id) {
    const confirmado = await confirmarAccion('Eliminar meta', '¿Está seguro de eliminar esta meta?\n\nPodrá restaurarla desde Configuración > Papelera.');
    if (!confirmado) return;

    try {
        await softDelete('familia_metas', id);
        mostrarToast('Meta movida a papelera', 'success');
        cargarSeccion('metas');
    } catch (error) {
        mostrarToast('Error al eliminar', 'error');
    }
}

// ==========================================
// REPORTES
// ==========================================

async function renderReportes(contenedor) {
    const { año, mes } = mesVisualizacion;

    let html = `
        <div class="card mb-3">
            <div class="card-header">
                <span class="card-title">Filtros</span>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Año</label>
                        <select class="form-control" id="reporte-año" onchange="actualizarReporte()">
    `;

    const añoActual = new Date().getFullYear();
    for (let a = añoActual; a >= añoActual - 5; a--) {
        html += `<option value="${a}" ${a === año ? 'selected' : ''}>${a}</option>`;
    }

    html += `
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Período</label>
                        <select class="form-control" id="reporte-mes" onchange="actualizarReporte()">
                            <option value="0">Todo el año</option>
    `;

    for (let m = 1; m <= 12; m++) {
        html += `<option value="${m}" ${m === mes ? 'selected' : ''}>${getNombreMes(m)}</option>`;
    }

    html += `
                        </select>
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button class="btn btn-secondary" onclick="exportarReporteCSV()">Exportar CSV</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="contenido-reporte"></div>
    `;

    contenedor.innerHTML = html;
    actualizarReporte();
}

async function actualizarReporte() {
    const año = parseInt(document.getElementById('reporte-año').value);
    const mes = parseInt(document.getElementById('reporte-mes').value);
    const contenedor = document.getElementById('contenido-reporte');

    let html = '';

    if (mes === 0) {
        // Reporte anual
        const datos = [];
        let totalIngresosAnual = 0;
        let totalEgresosAnual = 0;

        for (let m = 1; m <= 12; m++) {
            const resumen = await calcularResumenMes(moduloActual, año, m);
            datos.push({ mes: m, ingresos: resumen.totalIngresos, egresos: resumen.totalEgresos, balance: resumen.balance });
            totalIngresosAnual += resumen.totalIngresos;
            totalEgresosAnual += resumen.totalEgresos;
        }

        html = `
            <div class="stats-grid mb-3">
                <div class="stat-card">
                    <div class="stat-card-title">Total Ingresos ${año}</div>
                    <div class="stat-card-value positivo">${formatearMoneda(totalIngresosAnual)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Total Egresos ${año}</div>
                    <div class="stat-card-value negativo">${formatearMoneda(totalEgresosAnual)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Balance Anual</div>
                    <div class="stat-card-value ${totalIngresosAnual - totalEgresosAnual >= 0 ? 'positivo' : 'negativo'}">
                        ${formatearMoneda(totalIngresosAnual - totalEgresosAnual)}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <span class="card-title">Evolución Mensual</span>
                </div>
                <div class="card-body no-padding">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Mes</th>
                                    <th class="text-right">Ingresos</th>
                                    <th class="text-right">Egresos</th>
                                    <th class="text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        for (const d of datos) {
            html += `
                <tr>
                    <td>${getNombreMes(d.mes)}</td>
                    <td class="text-right monto positivo">${formatearMoneda(d.ingresos)}</td>
                    <td class="text-right monto negativo">${formatearMoneda(d.egresos)}</td>
                    <td class="text-right monto ${d.balance >= 0 ? 'positivo' : 'negativo'}">${formatearMoneda(d.balance)}</td>
                </tr>
            `;
        }

        html += `
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td><strong>TOTAL</strong></td>
                                    <td class="text-right monto positivo">${formatearMoneda(totalIngresosAnual)}</td>
                                    <td class="text-right monto negativo">${formatearMoneda(totalEgresosAnual)}</td>
                                    <td class="text-right monto ${totalIngresosAnual - totalEgresosAnual >= 0 ? 'positivo' : 'negativo'}">
                                        ${formatearMoneda(totalIngresosAnual - totalEgresosAnual)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Reporte mensual
        const resumen = await calcularResumenMes(moduloActual, año, mes);
        const ingresos = await obtenerIngresosMes(moduloActual, año, mes);
        const egresos = await obtenerEgresosMes(moduloActual, año, mes);

        html = `
            <div class="stats-grid mb-3">
                <div class="stat-card">
                    <div class="stat-card-title">Total Ingresos</div>
                    <div class="stat-card-value positivo">${formatearMoneda(resumen.totalIngresos)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Total Egresos</div>
                    <div class="stat-card-value negativo">${formatearMoneda(resumen.totalEgresos)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Balance</div>
                    <div class="stat-card-value ${resumen.balance >= 0 ? 'positivo' : 'negativo'}">
                        ${formatearMoneda(resumen.balance)}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-title">Transacciones</div>
                    <div class="stat-card-value">${ingresos.length + egresos.length}</div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Ingresos por Categoría</span>
                    </div>
                    <div class="card-body no-padding">
                        <div class="table-container">
                            <table class="table">
                                <thead><tr><th>Categoría</th><th class="text-right">Monto</th></tr></thead>
                                <tbody>
        `;

        for (const [cat, monto] of Object.entries(resumen.ingresosPorCategoria)) {
            html += `<tr><td>${getNombreCategoria(cat)}</td><td class="text-right monto positivo">${formatearMoneda(monto)}</td></tr>`;
        }

        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Egresos por Categoría</span>
                    </div>
                    <div class="card-body no-padding">
                        <div class="table-container">
                            <table class="table">
                                <thead><tr><th>Categoría</th><th class="text-right">Monto</th></tr></thead>
                                <tbody>
        `;

        for (const [cat, monto] of Object.entries(resumen.egresosPorCategoria)) {
            html += `<tr><td>${getNombreCategoria(cat)}</td><td class="text-right monto negativo">${formatearMoneda(monto)}</td></tr>`;
        }

        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    contenedor.innerHTML = html;
}

async function exportarReporteCSV() {
    const año = parseInt(document.getElementById('reporte-año').value);
    const mes = parseInt(document.getElementById('reporte-mes').value);

    let ingresos = [], egresos = [];

    if (mes === 0) {
        for (let m = 1; m <= 12; m++) {
            const i = await obtenerIngresosMes(moduloActual, año, m);
            const e = await obtenerEgresosMes(moduloActual, año, m);
            ingresos = ingresos.concat(i);
            egresos = egresos.concat(e);
        }
    } else {
        ingresos = await obtenerIngresosMes(moduloActual, año, mes);
        egresos = await obtenerEgresosMes(moduloActual, año, mes);
    }

    let csv = 'Fecha,Tipo,Categoria,Descripcion,Monto\n';

    for (const i of ingresos) {
        csv += `${i.fecha},Ingreso,${getNombreCategoria(i.categoria)},"${(i.descripcion || '').replace(/"/g, '""')}",${i.monto}\n`;
    }

    for (const e of egresos) {
        csv += `${e.fecha},Egreso,${getNombreCategoria(e.categoria)},"${(e.descripcion || '').replace(/"/g, '""')}",-${e.monto}\n`;
    }

    descargarArchivo(csv, `reporte_${moduloActual}_${año}${mes > 0 ? '-' + String(mes).padStart(2, '0') : ''}.csv`, 'text/csv;charset=utf-8;');
    mostrarToast('Reporte exportado', 'success');
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

async function renderConfiguracion(contenedor) {
    // Cargar papelera para mostrar contador
    const papelera = await obtenerPapelera(moduloActual);

    contenedor.innerHTML = `
        <!-- Tabs de configuración -->
        <div class="tabs mb-3">
            <button class="tab active" onclick="mostrarTabConfig('general')">General</button>
            <button class="tab" onclick="mostrarTabConfig('categorias')">Categorías</button>
            <button class="tab" onclick="mostrarTabConfig('papelera')">Papelera ${papelera.length > 0 ? `<span class="badge badge-pendiente">${papelera.length}</span>` : ''}</button>
        </div>

        <div id="tab-content-general">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Exportar Datos</span>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-2">Exporte los datos de este módulo a un archivo JSON.</p>
                    <button class="btn btn-primary" onclick="exportarModuloJSON()">Exportar ${moduloActual === 'familia' ? 'Familia' : 'NeuroTEA'}</button>
                </div>
            </div>

            <div class="card mt-3">
                <div class="card-header">
                    <span class="card-title">Verificar Integridad</span>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-2">Verifica que todos los datos estén correctamente relacionados.</p>
                    <button class="btn btn-secondary" onclick="verificarIntegridadModulo()">Ejecutar Verificación</button>
                    <div id="resultado-integridad" class="mt-2"></div>
                </div>
            </div>
        </div>

        <div id="tab-content-categorias" class="hidden">
            <!-- Se carga dinámicamente -->
        </div>

        <div id="tab-content-papelera" class="hidden">
            <!-- Se carga dinámicamente -->
        </div>
    `;

    // Cargar contenido de categorías
    await renderCategoriasConfig();
    renderPapeleraConfig(papelera);
}

function mostrarTabConfig(tab) {
    // Actualizar tabs activos
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    // Mostrar contenido correspondiente
    document.getElementById('tab-content-general').classList.add('hidden');
    document.getElementById('tab-content-categorias').classList.add('hidden');
    document.getElementById('tab-content-papelera').classList.add('hidden');
    document.getElementById(`tab-content-${tab}`).classList.remove('hidden');
}

// ==========================================
// GESTIÓN DE CATEGORÍAS
// ==========================================

async function renderCategoriasConfig() {
    const contenedor = document.getElementById('tab-content-categorias');

    // Obtener categorías de la DB
    let categorias = await obtenerTodasCategorias(moduloActual);

    // Si no hay categorías, inicializar las predeterminadas
    if (categorias.length === 0) {
        await inicializarCategoriasPredeterminadas(moduloActual);
        categorias = await obtenerTodasCategorias(moduloActual);
        invalidarCacheCategorias(moduloActual);
    }

    const categoriasEgreso = categorias.filter(c => c.tipo === 'egreso');
    const categoriasIngreso = categorias.filter(c => c.tipo === 'ingreso');

    let html = `
        <div class="alert alert-info mb-3">
            <div class="alert-icon">ℹ</div>
            <div class="alert-content">
                Las categorías que agregue aquí estarán disponibles en formularios, presupuesto, reportes y gráficas.
                Las categorías del sistema no se pueden eliminar, pero puede desactivarlas.
            </div>
        </div>

        <!-- Categorías de Egresos -->
        <div class="card mb-3">
            <div class="card-header">
                <span class="card-title">Categorías de Egresos</span>
                <button class="btn btn-sm btn-primary" onclick="abrirFormularioCategoria('egreso')">+ Nueva Categoría</button>
            </div>
            <div class="card-body no-padding">
    `;

    // Agrupar por tipo de gasto
    const tiposGasto = ['fijo', 'variable', 'mantenimiento', 'ocio'];
    for (const tipoGasto of tiposGasto) {
        const catsDelTipo = categoriasEgreso.filter(c => c.tipoGasto === tipoGasto);
        if (catsDelTipo.length === 0) continue;

        html += `
            <div class="panel">
                <div class="panel-header" onclick="togglePanel(this.parentElement)">
                    <div class="panel-title">
                        <span>${TIPOS_GASTO[tipoGasto]?.icono || ''}</span>
                        ${TIPOS_GASTO[tipoGasto]?.nombre || capitalizar(tipoGasto)}
                        <span class="badge badge-ingreso">${catsDelTipo.length}</span>
                    </div>
                    <div class="panel-toggle">▼</div>
                </div>
                <div class="panel-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Identificador</th>
                                <th>Estado</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        for (const cat of catsDelTipo) {
            html += `
                <tr>
                    <td>
                        ${cat.icono ? cat.icono + ' ' : ''}
                        <strong>${cat.nombre}</strong>
                        ${cat.sistema ? '<span class="badge badge-pagado">Sistema</span>' : ''}
                    </td>
                    <td class="text-muted">${cat.identificador}</td>
                    <td>
                        <span class="badge ${cat.activa !== false ? 'badge-activo' : 'badge-pagado'}">
                            ${cat.activa !== false ? 'Activa' : 'Inactiva'}
                        </span>
                    </td>
                    <td class="text-right acciones">
                        <button class="btn btn-icon btn-sm btn-outline" onclick="editarCategoriaUI('${cat.id}')" title="Editar">✎</button>
                        ${!cat.sistema ? `<button class="btn btn-icon btn-sm btn-outline" onclick="eliminarCategoriaUI('${cat.id}')" title="Eliminar">✕</button>` : ''}
                    </td>
                </tr>
            `;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>

        <!-- Categorías de Ingresos -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">Categorías de Ingresos</span>
                <button class="btn btn-sm btn-primary" onclick="abrirFormularioCategoria('ingreso')">+ Nueva Categoría</button>
            </div>
            <div class="card-body no-padding">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Identificador</th>
                            ${moduloActual === 'familia' ? '<th>Persona</th>' : ''}
                            <th>Estado</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    for (const cat of categoriasIngreso) {
        html += `
            <tr>
                <td>
                    ${cat.icono ? cat.icono + ' ' : ''}
                    <strong>${cat.nombre}</strong>
                    ${cat.sistema ? '<span class="badge badge-pagado">Sistema</span>' : ''}
                </td>
                <td class="text-muted">${cat.identificador}</td>
                ${moduloActual === 'familia' ? `<td>${capitalizar(cat.persona || 'otro')}</td>` : ''}
                <td>
                    <span class="badge ${cat.activa !== false ? 'badge-activo' : 'badge-pagado'}">
                        ${cat.activa !== false ? 'Activa' : 'Inactiva'}
                    </span>
                </td>
                <td class="text-right acciones">
                    <button class="btn btn-icon btn-sm btn-outline" onclick="editarCategoriaUI('${cat.id}')" title="Editar">✎</button>
                    ${!cat.sistema ? `<button class="btn btn-icon btn-sm btn-outline" onclick="eliminarCategoriaUI('${cat.id}')" title="Eliminar">✕</button>` : ''}
                </td>
            </tr>
        `;
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    contenedor.innerHTML = html;
}

function togglePanel(panel) {
    panel.classList.toggle('collapsed');
}

function abrirFormularioCategoria(tipo, categoriaId = null) {
    document.getElementById('modal-form-titulo').textContent = categoriaId ? 'Editar Categoría' : 'Nueva Categoría';

    let tipoGastoSelect = '';
    let personaSelect = '';

    if (tipo === 'egreso') {
        tipoGastoSelect = `
            <div class="form-group">
                <label>Tipo de Gasto <span class="required">*</span></label>
                <select class="form-control" id="cat-tipo-gasto">
                    <option value="fijo">Fijo</option>
                    <option value="variable">Variable</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="ocio">Ocio/Entretenimiento</option>
                </select>
            </div>
        `;
    } else if (moduloActual === 'familia') {
        personaSelect = `
            <div class="form-group">
                <label>Persona</label>
                <select class="form-control" id="cat-persona">
                    <option value="marco">Marco</option>
                    <option value="clara">Clara</option>
                    <option value="otro">Otro</option>
                </select>
            </div>
        `;
    }

    const html = `
        <form id="form-categoria">
            <input type="hidden" id="cat-id" value="${categoriaId || ''}">
            <input type="hidden" id="cat-tipo" value="${tipo}">

            <div class="form-row">
                <div class="form-group">
                    <label>Nombre <span class="required">*</span></label>
                    <input type="text" class="form-control" id="cat-nombre" required placeholder="Ej: Servicios Streaming">
                </div>
                ${tipoGastoSelect}
                ${personaSelect}
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Icono (emoji)</label>
                    <input type="text" class="form-control" id="cat-icono" placeholder="Ej: 🎬" maxlength="4">
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <input type="color" class="form-control" id="cat-color" value="#6b7280" style="height: 42px;">
                </div>
            </div>

            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="cat-activa" checked>
                    Categoría activa
                </label>
            </div>
        </form>
    `;

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = guardarCategoriaUI;

    abrirModal('modal-formulario');
}

async function editarCategoriaUI(id) {
    const cat = await obtenerPorId(`${moduloActual}_categorias`, id);
    if (!cat) return;

    abrirFormularioCategoria(cat.tipo, id);

    setTimeout(() => {
        document.getElementById('cat-nombre').value = cat.nombre;
        document.getElementById('cat-icono').value = cat.icono || '';
        document.getElementById('cat-color').value = cat.color || '#6b7280';
        document.getElementById('cat-activa').checked = cat.activa !== false;

        if (cat.tipo === 'egreso' && document.getElementById('cat-tipo-gasto')) {
            document.getElementById('cat-tipo-gasto').value = cat.tipoGasto || 'variable';
        }
        if (cat.tipo === 'ingreso' && document.getElementById('cat-persona')) {
            document.getElementById('cat-persona').value = cat.persona || 'otro';
        }
    }, 50);
}

async function guardarCategoriaUI() {
    const id = document.getElementById('cat-id').value;
    const tipo = document.getElementById('cat-tipo').value;
    const nombre = document.getElementById('cat-nombre').value.trim();
    const icono = document.getElementById('cat-icono').value.trim();
    const color = document.getElementById('cat-color').value;
    const activa = document.getElementById('cat-activa').checked;

    if (!nombre) {
        mostrarToast('El nombre es requerido', 'error');
        return;
    }

    try {
        if (id) {
            // Actualizar
            await actualizarCategoria(moduloActual, id, { nombre, icono, color, activa });
            mostrarToast('Categoría actualizada', 'exito');
        } else {
            // Crear nueva
            const datos = {
                tipo,
                nombre,
                icono: icono || null,
                color: color || null
            };

            if (tipo === 'egreso') {
                datos.tipoGasto = document.getElementById('cat-tipo-gasto').value;
            } else if (moduloActual === 'familia') {
                datos.persona = document.getElementById('cat-persona')?.value || 'otro';
            }

            await crearCategoria(moduloActual, datos);
            mostrarToast('Categoría creada', 'exito');
        }

        // Invalidar cache y recargar
        invalidarCacheCategorias(moduloActual);
        cerrarModal('modal-formulario');
        await renderCategoriasConfig();
    } catch (error) {
        mostrarToast(error.message || 'Error al guardar', 'error');
    }
}

async function eliminarCategoriaUI(id) {
    const resultado = await eliminarCategoria(moduloActual, id);

    if (resultado.tieneReferencias) {
        const reasignar = await confirmarAccion(
            'Categoría en uso',
            `${resultado.mensaje}\n\n¿Desea reasignar los movimientos a otra categoría?`
        );

        if (reasignar) {
            mostrarDialogoReasignar(id);
        }
        return;
    }

    if (resultado.exito) {
        mostrarToast('Categoría movida a papelera', 'exito');
        invalidarCacheCategorias(moduloActual);
        await renderCategoriasConfig();
        // Actualizar papelera
        const papelera = await obtenerPapelera(moduloActual);
        renderPapeleraConfig(papelera);
    }
}

async function mostrarDialogoReasignar(categoriaOrigenId) {
    const origen = await obtenerPorId(`${moduloActual}_categorias`, categoriaOrigenId);
    if (!origen) return;

    // Obtener otras categorías del mismo tipo
    const todas = await obtenerTodasCategorias(moduloActual, origen.tipo);
    const otras = todas.filter(c => c.id !== categoriaOrigenId && c.activa !== false);

    if (otras.length === 0) {
        mostrarToast('No hay otras categorías disponibles para reasignar', 'error');
        return;
    }

    document.getElementById('modal-form-titulo').textContent = 'Reasignar Movimientos';

    let html = `
        <form id="form-reasignar">
            <input type="hidden" id="reasignar-origen" value="${categoriaOrigenId}">

            <div class="alert alert-warning mb-2">
                <div class="alert-icon">⚠</div>
                <div class="alert-content">
                    Los movimientos de <strong>${origen.nombre}</strong> serán reasignados a la categoría seleccionada.
                </div>
            </div>

            <div class="form-group">
                <label>Reasignar a <span class="required">*</span></label>
                <select class="form-control" id="reasignar-destino">
    `;

    for (const cat of otras) {
        html += `<option value="${cat.id}">${cat.nombre}</option>`;
    }

    html += `
                </select>
            </div>

            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="reasignar-eliminar" checked>
                    Eliminar categoría original después de reasignar
                </label>
            </div>
        </form>
    `;

    document.getElementById('modal-form-contenido').innerHTML = html;
    document.getElementById('modal-form-guardar').onclick = ejecutarReasignacion;
    abrirModal('modal-formulario');
}

async function ejecutarReasignacion() {
    const origenId = document.getElementById('reasignar-origen').value;
    const destinoId = document.getElementById('reasignar-destino').value;
    const eliminarDespues = document.getElementById('reasignar-eliminar').checked;

    try {
        const resultado = await reasignarCategoria(moduloActual, origenId, destinoId);
        mostrarToast(`${resultado.actualizados} movimiento(s) reasignado(s)`, 'exito');

        if (eliminarDespues) {
            await softDelete(`${moduloActual}_categorias`, origenId);
            mostrarToast('Categoría eliminada', 'exito');
        }

        invalidarCacheCategorias(moduloActual);
        cerrarModal('modal-formulario');
        await renderCategoriasConfig();
    } catch (error) {
        mostrarToast(error.message || 'Error al reasignar', 'error');
    }
}

// ==========================================
// PAPELERA
// ==========================================

function renderPapeleraConfig(papelera) {
    const contenedor = document.getElementById('tab-content-papelera');

    if (papelera.length === 0) {
        contenedor.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <div class="empty-state-icon">🗑️</div>
                        <h3>Papelera vacía</h3>
                        <p>Los elementos eliminados aparecerán aquí por 30 días antes de ser eliminados permanentemente.</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    let html = `
        <div class="alert alert-info mb-3">
            <div class="alert-icon">ℹ</div>
            <div class="alert-content">
                Los elementos en la papelera se eliminan automáticamente después de 30 días.
                Puede restaurarlos o eliminarlos permanentemente.
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <span class="card-title">Elementos Eliminados (${papelera.length})</span>
                <button class="btn btn-sm btn-danger" onclick="vaciarPapeleraUI()">Vaciar Papelera</button>
            </div>
            <div class="card-body no-padding">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Eliminado</th>
                            <th>Expira</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    const tiposNombres = {
        ingresos: 'Ingreso',
        egresos: 'Egreso',
        cuentas: 'Cuenta',
        categorias: 'Categoría',
        prestamos: 'Préstamo',
        metas: 'Meta'
    };

    for (const item of papelera) {
        const descripcion = item.data.nombre || item.data.descripcion ||
            item.data.categoria || `${item.tipo} #${item.originalId.substring(0,8)}`;

        const diasRestantes = Math.ceil((new Date(item.expiresAt) - new Date()) / (1000*60*60*24));

        html += `
            <tr>
                <td><span class="badge badge-egreso">${tiposNombres[item.tipo] || item.tipo}</span></td>
                <td>
                    <strong>${descripcion}</strong>
                    ${item.data.monto ? `<br><span class="text-muted">${formatearMoneda(item.data.monto)}</span>` : ''}
                </td>
                <td class="text-muted">${formatearFecha(item.deletedAt.split('T')[0])}</td>
                <td>
                    <span class="badge ${diasRestantes <= 7 ? 'badge-atrasado' : 'badge-pendiente'}">
                        ${diasRestantes} día(s)
                    </span>
                </td>
                <td class="text-right acciones">
                    <button class="btn btn-sm btn-success" onclick="restaurarElementoUI('${item.id}')" title="Restaurar">↩ Restaurar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarPermanenteUI('${item.id}')" title="Eliminar permanente">✕</button>
                </td>
            </tr>
        `;
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    contenedor.innerHTML = html;
}

async function restaurarElementoUI(papeleraId) {
    try {
        const resultado = await restaurarDesdePapelera(moduloActual, papeleraId);
        mostrarToast('Elemento restaurado correctamente', 'exito');

        // Si era una categoría, invalidar cache
        if (resultado.storeName.includes('categorias')) {
            invalidarCacheCategorias(moduloActual);
        }

        // Recargar papelera
        const papelera = await obtenerPapelera(moduloActual);
        renderPapeleraConfig(papelera);

        // Actualizar badge
        actualizarBadgePapelera(papelera.length);
    } catch (error) {
        mostrarToast(error.message || 'Error al restaurar', 'error');
    }
}

async function eliminarPermanenteUI(papeleraId) {
    const confirmado = await confirmarAccion(
        'Eliminar permanentemente',
        'Esta acción no se puede deshacer. ¿Está seguro?'
    );

    if (!confirmado) return;

    try {
        await eliminarPermanente(moduloActual, papeleraId);
        mostrarToast('Elemento eliminado permanentemente', 'exito');

        const papelera = await obtenerPapelera(moduloActual);
        renderPapeleraConfig(papelera);
        actualizarBadgePapelera(papelera.length);
    } catch (error) {
        mostrarToast(error.message || 'Error al eliminar', 'error');
    }
}

async function vaciarPapeleraUI() {
    const confirmado = await confirmarAccion(
        'Vaciar papelera',
        'Se eliminarán permanentemente TODOS los elementos. Esta acción no se puede deshacer.'
    );

    if (!confirmado) return;

    try {
        await vaciarPapelera(moduloActual);
        mostrarToast('Papelera vaciada', 'exito');
        renderPapeleraConfig([]);
        actualizarBadgePapelera(0);
    } catch (error) {
        mostrarToast(error.message || 'Error al vaciar', 'error');
    }
}

function actualizarBadgePapelera(cantidad) {
    const tabs = document.querySelectorAll('.tabs .tab');
    tabs.forEach(tab => {
        if (tab.textContent.includes('Papelera')) {
            if (cantidad > 0) {
                tab.innerHTML = `Papelera <span class="badge badge-pendiente">${cantidad}</span>`;
            } else {
                tab.textContent = 'Papelera';
            }
        }
    });
}

async function exportarModuloJSON() {
    const datos = {
        version: '2.1',
        modulo: moduloActual,
        fechaExportacion: new Date().toISOString(),
        ingresos: await obtenerTodos(`${moduloActual}_ingresos`),
        egresos: await obtenerTodos(`${moduloActual}_egresos`),
        cuentas: await obtenerTodos(`${moduloActual}_cuentas`),
        presupuesto: await obtenerTodos(`${moduloActual}_presupuesto`),
        categorias: await obtenerTodos(`${moduloActual}_categorias`),
        papelera: await obtenerTodos(`${moduloActual}_papelera`)
    };

    if (moduloActual === 'familia') {
        datos.prestamos = await obtenerTodos('familia_prestamos');
        datos.metas = await obtenerTodos('familia_metas');
        datos.transferencias = await obtenerTodos('familia_transferencias');
    }

    descargarArchivo(JSON.stringify(datos, null, 2), `${moduloActual}_backup_${formatearFechaArchivo(new Date())}.json`);
    mostrarToast('Datos exportados', 'success');
}

async function verificarIntegridadModulo() {
    const contenedor = document.getElementById('resultado-integridad');
    contenedor.innerHTML = '<div class="spinner"></div> Verificando...';

    await new Promise(r => setTimeout(r, 500));

    const errores = [];
    const cuentas = await obtenerTodos(`${moduloActual}_cuentas`);
    const cuentasIds = new Set(cuentas.map(c => c.id));

    const ingresos = await obtenerTodos(`${moduloActual}_ingresos`);
    for (const i of ingresos) {
        if (i.cuentaDestino && !cuentasIds.has(i.cuentaDestino)) {
            errores.push(`Ingreso ${i.id}: cuenta destino no existe`);
        }
    }

    const egresos = await obtenerTodos(`${moduloActual}_egresos`);
    for (const e of egresos) {
        if (e.cuentaOrigen && !cuentasIds.has(e.cuentaOrigen)) {
            errores.push(`Egreso ${e.id}: cuenta origen no existe`);
        }
    }

    if (errores.length === 0) {
        contenedor.innerHTML = '<div class="alert alert-success">✓ Integridad correcta. No se encontraron errores.</div>';
    } else {
        contenedor.innerHTML = `<div class="alert alert-error">✕ Se encontraron ${errores.length} error(es)</div>`;
    }
}

// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================

async function abrirConfigGlobal() {
    const ultimoRespaldo = await obtenerConfiguracion('ultimoRespaldo');
    document.getElementById('info-ultimo-respaldo').value = ultimoRespaldo ? formatearFecha(ultimoRespaldo.split('T')[0]) : 'Nunca';

    const total = await contarRegistrosTotales();
    document.getElementById('info-total-registros').value = total;

    abrirModal('modal-config');
}

async function exportarTodoJSON() {
    try {
        const datos = await exportarTodosLosDatos();
        descargarArchivo(JSON.stringify(datos, null, 2), `finanzas_backup_${formatearFechaArchivo(new Date())}.json`);
        await guardarConfiguracion('ultimoRespaldo', new Date().toISOString());
        mostrarToast('Respaldo creado correctamente', 'success');
        document.getElementById('alerta-respaldo').classList.add('hidden');
        cerrarModal('modal-config');
    } catch (error) {
        mostrarToast('Error al crear respaldo', 'error');
    }
}

async function importarDesdeJSON(archivo) {
    if (!archivo) return;

    const confirmado = await confirmarAccion('Importar datos', 'Esta acción reemplazará TODOS los datos actuales. ¿Continuar?');
    if (!confirmado) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const datos = JSON.parse(e.target.result);
            await importarDatos(datos);
            mostrarToast('Datos importados correctamente', 'success');
            cerrarModal('modal-config');
            cargarPantallaInicio();
        } catch (error) {
            mostrarToast(error.message || 'Error al importar', 'error');
        }
    };
    reader.readAsText(archivo);
}

let opcionBorrado = null;

function mostrarBorradoSeguro(opcion) {
    opcionBorrado = opcion;

    const mensajes = {
        familia: 'Se eliminarán TODOS los datos del módulo FAMILIA',
        neurotea: 'Se eliminarán TODOS los datos del módulo NEUROTEA',
        todo: 'Se eliminarán TODOS los datos de AMBOS módulos'
    };

    document.getElementById('mensaje-borrado').textContent = mensajes[opcion];
    document.getElementById('codigo-borrado').value = '';

    document.getElementById('btn-confirmar-borrado').onclick = async () => {
        const codigo = document.getElementById('codigo-borrado').value;
        try {
            await borradoSeguro(codigo, opcionBorrado);
            mostrarToast('Datos eliminados', 'success');
            cerrarModal('modal-borrado');
            cerrarModal('modal-config');
            cargarPantallaInicio();
        } catch (error) {
            mostrarToast(error.message, 'error');
        }
    };

    abrirModal('modal-borrado');
}

// ==========================================
// UTILIDADES UI
// ==========================================

function abrirModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function cerrarModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function mostrarToast(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = mensaje;
    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function confirmarAccion(titulo, mensaje) {
    return new Promise(resolve => {
        document.getElementById('titulo-confirmacion').textContent = titulo;
        document.getElementById('mensaje-confirmacion').textContent = mensaje;
        abrirModal('modal-confirmacion');

        document.getElementById('btn-confirmar-accion').onclick = () => {
            cerrarModal('modal-confirmacion');
            resolve(true);
        };

        document.querySelector('#modal-confirmacion .btn-secondary').onclick = () => {
            cerrarModal('modal-confirmacion');
            resolve(false);
        };
    });
}

function formatearMonedaCorto(monto) {
    if (monto >= 1000000) {
        return (monto / 1000000).toFixed(1) + 'M';
    } else if (monto >= 1000) {
        return (monto / 1000).toFixed(0) + 'K';
    }
    return monto.toString();
}

// Cerrar modales al hacer click fuera
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
    }
});
