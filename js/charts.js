/* ==========================================
   MÓDULO DE GRÁFICOS - Chart.js
   ========================================== */

// Instancias de gráficos (para poder destruirlas al actualizar)
let chartInstances = {};

// Destruir gráfico existente antes de crear uno nuevo
function destruirGrafico(canvasId) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }
}

// Configuración global de Chart.js para tema oscuro
Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";

// ==========================================
// INDICADOR DE DÍAS DE OXÍGENO (Batería/Tanque)
// ==========================================

function renderBateriaDiasOxigeno(containerId, diasOxigeno) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const porcentaje = getPorcentajeBateria(diasOxigeno);
    const nivel = getNivelDiasOxigeno(diasOxigeno);
    const claseBateria = getClaseBateria(porcentaje);

    container.innerHTML = `
        <div class="indicador-bateria ${claseBateria}">
            <div class="bateria-header">
                <span class="bateria-titulo">Días de Oxígeno</span>
                <span class="bateria-dias">${diasOxigeno} días</span>
            </div>
            <div class="bateria-contenedor">
                <div class="bateria-cuerpo">
                    <div class="bateria-nivel" style="height: ${porcentaje}%; background-color: ${nivel.color};">
                        <span class="bateria-porcentaje">${porcentaje}%</span>
                    </div>
                </div>
                <div class="bateria-tapa"></div>
            </div>
            <div class="bateria-descripcion">${nivel.descripcion}</div>
        </div>
    `;
}

// ==========================================
// TABLA DE PAGOS SEMANALES (Calendario)
// ==========================================

function renderTablaPagosSemanales(containerId, liquidezData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { pagosAtrasados, pagosEstaSemana, pagosProximaSemana,
            totalAtrasados, totalEstaSemana, totalProximaSemana,
            cajaDisponible, alcanzaEstaSemana, alcanzaDosSemananas } = liquidezData;

    let html = `
        <div class="tabla-pagos-container">
            <div class="resumen-liquidez ${alcanzaEstaSemana ? 'liquidez-ok' : 'liquidez-critica'}">
                <div class="liquidez-caja">
                    <span class="label">Caja Disponible</span>
                    <span class="valor">${formatearMoneda(cajaDisponible)}</span>
                </div>
                <div class="liquidez-indicador">
                    ${alcanzaEstaSemana ? '✅ Alcanza esta semana' : '⚠️ Fondos insuficientes'}
                </div>
            </div>
    `;

    // Pagos atrasados
    if (pagosAtrasados.length > 0) {
        html += `
            <div class="seccion-pagos atrasados">
                <h4>🔴 Pagos Atrasados (${formatearMoneda(totalAtrasados)})</h4>
                <table class="tabla-pagos">
                    <thead><tr><th>Concepto</th><th>Vencimiento</th><th>Monto</th><th>Prioridad</th></tr></thead>
                    <tbody>
        `;
        for (const pago of pagosAtrasados) {
            const prioridad = PRIORIDADES_PAGO[pago.prioridad] || PRIORIDADES_PAGO[6];
            html += `
                <tr class="pago-atrasado">
                    <td>${pago.nombre}</td>
                    <td>${formatearFecha(pago.fechaVencimiento)}</td>
                    <td class="monto">${formatearMoneda(pago.monto)}</td>
                    <td><span class="badge-prioridad p${pago.prioridad}">${prioridad.icono} ${prioridad.nombre}</span></td>
                </tr>
            `;
        }
        html += '</tbody></table></div>';
    }

    // Esta semana
    html += `
        <div class="seccion-pagos esta-semana">
            <h4>📅 Esta Semana (${formatearMoneda(totalEstaSemana)})</h4>
    `;
    if (pagosEstaSemana.length > 0) {
        html += `
            <table class="tabla-pagos">
                <thead><tr><th>Concepto</th><th>Vencimiento</th><th>Monto</th><th>Estado</th></tr></thead>
                <tbody>
        `;
        for (const pago of pagosEstaSemana) {
            const estadoInfo = ESTADOS_PAGO[pago.estado] || ESTADOS_PAGO.ninguno;
            html += `
                <tr>
                    <td>${pago.nombre}</td>
                    <td>${formatearFecha(pago.fechaVencimiento)}</td>
                    <td class="monto">${formatearMoneda(pago.monto)}</td>
                    <td><span class="badge-estado ${estadoInfo.clase}">${estadoInfo.icono}</span></td>
                </tr>
            `;
        }
        html += '</tbody></table>';
    } else {
        html += '<p class="sin-pagos">No hay pagos esta semana</p>';
    }
    html += '</div>';

    // Próxima semana
    html += `
        <div class="seccion-pagos proxima-semana">
            <h4>📆 Próxima Semana (${formatearMoneda(totalProximaSemana)})</h4>
    `;
    if (pagosProximaSemana.length > 0) {
        html += `
            <table class="tabla-pagos">
                <thead><tr><th>Concepto</th><th>Vencimiento</th><th>Monto</th></tr></thead>
                <tbody>
        `;
        for (const pago of pagosProximaSemana) {
            html += `
                <tr>
                    <td>${pago.nombre}</td>
                    <td>${formatearFecha(pago.fechaVencimiento)}</td>
                    <td class="monto">${formatearMoneda(pago.monto)}</td>
                </tr>
            `;
        }
        html += '</tbody></table>';
    } else {
        html += '<p class="sin-pagos">No hay pagos la próxima semana</p>';
    }
    html += '</div>';

    // Proyección
    const saldoDespues = cajaDisponible - totalAtrasados - totalEstaSemana - totalProximaSemana;
    html += `
        <div class="proyeccion-saldo ${saldoDespues >= 0 ? 'saldo-positivo' : 'saldo-negativo'}">
            <span class="label">Saldo proyectado después de 2 semanas:</span>
            <span class="valor">${formatearMoneda(saldoDespues)}</span>
        </div>
    `;

    html += '</div>';
    container.innerHTML = html;
}

// ==========================================
// BARRAS HORIZONTALES POR CATEGORÍA
// ==========================================

function renderBarrasCategoria(canvasId, datos, titulo = 'Gastos por Categoría') {
    destruirGrafico(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Ordenar por monto descendente
    const datosOrdenados = Object.entries(datos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10

    const labels = datosOrdenados.map(([cat]) => getNombreCategoria(cat));
    const values = datosOrdenados.map(([, val]) => val);
    const colors = datosOrdenados.map((_, i) => getColorGrafico(i));

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderRadius: 4,
                barThickness: 24
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: titulo,
                    font: { size: 14, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => formatearMoneda(context.raw)
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatearNumeroCorto(value)
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                y: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ==========================================
// TABLA DE PRESUPUESTO CON SEMÁFOROS
// ==========================================

function renderTablaPresupuesto(containerId, cumplimientoData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!cumplimientoData.hayPresupuesto) {
        container.innerHTML = `
            <div class="estado-vacio">
                <p>No hay presupuesto definido para este mes</p>
                <button class="btn-primario" onclick="abrirModal('modal-presupuesto')">Crear Presupuesto</button>
            </div>
        `;
        return;
    }

    const { tabla, totalPresupuestado, totalGastado, porcentajeGeneral, semaforoGeneral } = cumplimientoData;

    let html = `
        <div class="presupuesto-container">
            <div class="presupuesto-header">
                <h3>${semaforoGeneral} Cumplimiento General: ${porcentajeGeneral}%</h3>
                <div class="presupuesto-totales">
                    <span>Presupuestado: ${formatearMoneda(totalPresupuestado)}</span>
                    <span>Gastado: ${formatearMoneda(totalGastado)}</span>
                </div>
            </div>
            <table class="tabla-presupuesto">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Presupuesto</th>
                        <th>Gastado</th>
                        <th>Disponible</th>
                        <th>%</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (const fila of tabla) {
        const claseFila = fila.semaforo === 'rojo' ? 'fila-excedida' :
                          fila.semaforo === 'amarillo' ? 'fila-alerta' : '';

        html += `
            <tr class="${claseFila}">
                <td>${getNombreCategoria(fila.categoria)}</td>
                <td class="monto">${formatearMoneda(fila.presupuestado)}</td>
                <td class="monto">${formatearMoneda(fila.gastado)}</td>
                <td class="monto ${fila.disponible < 0 ? 'negativo' : ''}">${formatearMoneda(fila.disponible)}</td>
                <td class="porcentaje">${fila.porcentaje}%</td>
                <td class="semaforo">${fila.icono}</td>
            </tr>
        `;
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ==========================================
// GRÁFICO INGRESOS VS EGRESOS (Mensual)
// ==========================================

function renderIngresosVsEgresos(canvasId, ingresos, egresos) {
    destruirGrafico(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const balance = ingresos - egresos;
    const colorBalance = balance >= 0 ? '#10B981' : '#EF4444';

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Egresos', 'Balance'],
            datasets: [{
                data: [ingresos, egresos, Math.abs(balance)],
                backgroundColor: ['#10B981', '#EF4444', colorBalance],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            if (context.dataIndex === 2) {
                                return (balance >= 0 ? '+' : '-') + formatearMoneda(Math.abs(balance));
                            }
                            return formatearMoneda(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatearNumeroCorto(value)
                    }
                }
            }
        }
    });
}

// ==========================================
// GRÁFICO COMPOSICIÓN DE GASTOS (Donut)
// ==========================================

function renderComposicionGastos(canvasId, gastosPorTipo) {
    destruirGrafico(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const labels = Object.keys(gastosPorTipo).map(tipo => TIPOS_GASTO[tipo]?.nombre || capitalizar(tipo));
    const values = Object.values(gastosPorTipo);
    const total = values.reduce((a, b) => a + b, 0);

    const coloresTipo = {
        fijo: '#3B82F6',
        variable: '#F59E0B',
        mantenimiento: '#8B5CF6',
        ocio: '#EC4899'
    };

    const colors = Object.keys(gastosPorTipo).map(tipo => coloresTipo[tipo] || '#94A3B8');

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const porcentaje = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${formatearMoneda(context.raw)} (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// GRÁFICO EVOLUCIÓN MENSUAL (Línea)
// ==========================================

function renderEvolucionMensual(canvasId, datosAnuales) {
    destruirGrafico(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const meses = datosAnuales.map(d => getNombreMes(d.mes).substring(0, 3));
    const ingresos = datosAnuales.map(d => d.ingresos);
    const egresos = datosAnuales.map(d => d.egresos);
    const balances = datosAnuales.map(d => d.ingresos - d.egresos);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresos,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Egresos',
                    data: egresos,
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Balance',
                    data: balances,
                    borderColor: '#3B82F6',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatearMoneda(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (value) => formatearNumeroCorto(value)
                    }
                }
            }
        }
    });
}

// ==========================================
// BARRAS DE PROGRESO DE DEUDAS
// ==========================================

function renderProgresoDeudas(containerId, resumenDeudas) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (resumenDeudas.cantidadActivas === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <div class="icono-vacio">🎉</div>
                <p>¡No tienes deudas activas!</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="deudas-container">
            <div class="deudas-resumen">
                <div class="resumen-item">
                    <span class="label">Deuda Total</span>
                    <span class="valor negativo">${formatearMoneda(resumenDeudas.totalDeuda)}</span>
                </div>
                <div class="resumen-item">
                    <span class="label">Cuota Mensual</span>
                    <span class="valor">${formatearMoneda(resumenDeudas.cuotaMensualTotal)}</span>
                </div>
                <div class="resumen-item">
                    <span class="label">Progreso Global</span>
                    <span class="valor">${resumenDeudas.progresoPago}%</span>
                </div>
            </div>
            <div class="deudas-lista">
    `;

    for (const deuda of resumenDeudas.deudas) {
        const progreso = deuda.montoOriginal > 0 ?
            ((deuda.montoOriginal - deuda.saldoPendiente) / deuda.montoOriginal * 100) : 0;
        const progresoRedondeado = Math.round(progreso * 100) / 100;

        html += `
            <div class="deuda-item">
                <div class="deuda-header">
                    <span class="deuda-nombre">${deuda.nombre}</span>
                    <span class="deuda-saldo">${formatearMoneda(deuda.saldoPendiente)}</span>
                </div>
                <div class="progreso-barra">
                    <div class="progreso-fill" style="width: ${progresoRedondeado}%;"></div>
                </div>
                <div class="deuda-footer">
                    <span class="deuda-cuota">Cuota: ${formatearMoneda(deuda.cuotaMensual)}</span>
                    <span class="deuda-progreso">${progresoRedondeado}% pagado</span>
                </div>
            </div>
        `;
    }

    html += '</div></div>';
    container.innerHTML = html;
}

// ==========================================
// INDICADOR MODELO 93/7 (Solo NeuroTEA)
// ==========================================

function renderModelo93_7(containerId, saludNT) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { porcentajeGastos, porcentajeGanancia, estadoSalud, cumple93, cumple7, fuga } = saludNT;

    const colorEstado = {
        excelente: '#10B981',
        bueno: '#22C55E',
        aceptable: '#F59E0B',
        alerta: '#F97316',
        critico: '#EF4444'
    };

    html = `
        <div class="modelo-93-7-container">
            <div class="modelo-header">
                <h3>Modelo 93/7</h3>
                <span class="estado-badge" style="background-color: ${colorEstado[estadoSalud]}">
                    ${capitalizar(estadoSalud)}
                </span>
            </div>

            <div class="modelo-barras">
                <div class="modelo-barra">
                    <div class="barra-label">
                        <span>Gastos Operativos</span>
                        <span class="${cumple93 ? 'texto-verde' : 'texto-rojo'}">${porcentajeGastos}%</span>
                    </div>
                    <div class="barra-contenedor">
                        <div class="barra-limite" style="left: 93%;"></div>
                        <div class="barra-fill ${cumple93 ? 'fill-verde' : 'fill-rojo'}"
                             style="width: ${Math.min(porcentajeGastos, 100)}%;"></div>
                    </div>
                    <div class="barra-meta">Meta: ≤ 93%</div>
                </div>

                <div class="modelo-barra">
                    <div class="barra-label">
                        <span>Ganancia</span>
                        <span class="${cumple7 ? 'texto-verde' : 'texto-rojo'}">${porcentajeGanancia}%</span>
                    </div>
                    <div class="barra-contenedor barra-inversa">
                        <div class="barra-limite" style="left: 7%;"></div>
                        <div class="barra-fill ${cumple7 ? 'fill-verde' : 'fill-rojo'}"
                             style="width: ${Math.min(porcentajeGanancia * (100/20), 100)}%;"></div>
                    </div>
                    <div class="barra-meta">Meta: ≥ 7%</div>
                </div>
            </div>
    `;

    // Indicador de FUGA
    if (fuga.cantidad > 0) {
        html += `
            <div class="fuga-indicador">
                <span class="fuga-icono">⚠️</span>
                <span class="fuga-texto">
                    FUGA: ${fuga.cantidad} préstamo(s) a Familia por ${formatearMoneda(fuga.total)}
                </span>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// ==========================================
// MINI RESUMEN PARA DASHBOARD
// ==========================================

function renderMiniResumen(containerId, resumen) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { totalIngresos, totalEgresos, balance, diasOxigeno } = resumen;
    const nivel = getNivelDiasOxigeno(diasOxigeno);

    container.innerHTML = `
        <div class="mini-resumen">
            <div class="mini-card ingresos">
                <span class="mini-label">Ingresos</span>
                <span class="mini-valor">${formatearMoneda(totalIngresos)}</span>
            </div>
            <div class="mini-card egresos">
                <span class="mini-label">Egresos</span>
                <span class="mini-valor">${formatearMoneda(totalEgresos)}</span>
            </div>
            <div class="mini-card balance ${balance >= 0 ? 'positivo' : 'negativo'}">
                <span class="mini-label">Balance</span>
                <span class="mini-valor">${formatearMoneda(balance)}</span>
            </div>
            <div class="mini-card oxigeno" style="border-color: ${nivel.color}">
                <span class="mini-label">Días Oxígeno</span>
                <span class="mini-valor" style="color: ${nivel.color}">${diasOxigeno}</span>
            </div>
        </div>
    `;
}
