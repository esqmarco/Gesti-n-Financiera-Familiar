# Gestor Financiero Familiar - Documentación del Proyecto

## Descripción General
Sistema de gestión financiera personal y empresarial desarrollado en HTML/CSS/JavaScript vanilla con almacenamiento en IndexedDB. Soporta dos módulos independientes: FAMILIA (finanzas del hogar) y NEUROTEA (clínica de neurorehabilitación).

### Filosofía del Sistema
Basado en el modelo de control financiero que prioriza:
- **Liquidez sobre Rentabilidad**: Saber cuánta plata tenés disponible HOY
- **Días de Oxígeno**: Cuántos días podés operar sin ingresos nuevos
- **Modelo 93/7**: Máximo 93% a gastos operativos, mínimo 7% a ganancia (NeuroTEA)
- **Control de Fugas**: Detectar si la familia consume recursos de la clínica

## Estructura del Proyecto

```
├── index.html              # Interfaz principal (modales, navegación, layout)
├── css/
│   └── styles.css          # Estilos completos del sistema + tema oscuro análisis
├── js/
│   ├── utils.js            # Utilidades, constantes, formateo, categorías
│   ├── database.js         # Capa de datos IndexedDB, operaciones CRUD
│   ├── app.js              # Lógica de aplicación, renderizado, formularios
│   └── charts.js           # Módulo de gráficos (Chart.js)
├── lib/
│   └── chart.min.js        # Librería Chart.js
└── CLAUDE.md               # Esta documentación
```

## Base de Datos (IndexedDB)

### Nombre: `GestorFinancieroApp`

### Object Stores:

| Store | Descripción | Índices |
|-------|-------------|---------|
| `familia_ingresos` | Ingresos del hogar | fecha, persona, categoria, cuentaDestino |
| `familia_egresos` | Gastos del hogar | fecha, tipoGasto, categoria, cuentaOrigen, estado |
| `familia_cuentas` | Cuentas bancarias/efectivo | tipo, activa |
| `familia_transferencias` | Transferencias entre cuentas | fecha, cuentaOrigen, cuentaDestino |
| `familia_presupuesto` | Presupuesto mensual | año, mes |
| `familia_categorias` | Categorías personalizadas | tipo |
| `familia_gastos_fijos` | Gastos fijos mensuales con estado | mes, año, estado, fechaVencimiento |
| `familia_deudas` | Registro de deudas con prioridad | prioridad, estado |
| `familia_papelera` | Elementos eliminados (soft delete) | tipo, deletedAt |
| `neurotea_ingresos` | Ingresos de la clínica | fecha, categoria, cuentaDestino |
| `neurotea_egresos` | Gastos de la clínica | fecha, tipoGasto, categoria, cuentaOrigen, estado |
| `neurotea_cuentas` | Cuentas de NeuroTEA | tipo, activa |
| `neurotea_transferencias` | Transferencias entre cuentas NT | fecha, cuentaOrigen, cuentaDestino |
| `neurotea_presupuesto` | Presupuesto mensual NT | año, mes |
| `neurotea_categorias` | Categorías personalizadas NT | tipo |
| `neurotea_gastos_fijos` | Gastos fijos mensuales NT | mes, año, estado, fechaVencimiento |
| `neurotea_deudas` | Registro de deudas NT | prioridad, estado |
| `neurotea_papelera` | Elementos eliminados NT | tipo, deletedAt |
| `prestamos_inter_modulo` | Préstamos NT↔Familia | tipo, estado, fecha |
| `configuracion` | Configuración global y parámetros | - |

## Arquitectura de Datos

### Esquema de Ingreso
```javascript
{
    id: "uuid",
    fecha: "YYYY-MM-DD",
    tipo: "ingreso_marco|ingreso_clara|ingreso_nt|desde_nt",
    categoria: "identificador_categoria",
    monto: 1500000,
    descripcion: "Texto opcional",
    cuentaDestino: "uuid_cuenta",
    notas: "",
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Egreso
```javascript
{
    id: "uuid",
    fecha: "YYYY-MM-DD",
    tipoGasto: "fijo|variable|cuota|suscripcion|evento|impuesto",
    categoria: "identificador_categoria",
    monto: 1500000,
    descripcion: "Texto opcional",
    cuentaOrigen: "uuid_cuenta|null",
    estado: "ninguno|pendiente|pagado|cancelado",
    fechaVencimiento: "YYYY-MM-DD|null",
    deudaId: "uuid_deuda|null",
    notas: "",
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Gasto Fijo Mensual
```javascript
{
    id: "uuid",
    año: 2026,
    mes: 12,
    categoria: "alquiler_nt",
    nombre: "Alquiler 1 (Principal)",
    montoPresupuestado: 3500000,
    montoReal: 3500000,
    estado: "ninguno|pendiente|pagado|cancelado",
    fechaVencimiento: "YYYY-MM-DD",
    cuenta: "uuid_cuenta|null",
    notas: "",
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Deuda
```javascript
{
    id: "uuid",
    prioridad: 1,  // 1=IPS/Impuestos, 2=Salarios, 3=Alquiler, 4=Proveedores, 5=Bancos, 6=Familiares
    acreedor: "Solar Préstamo 1",
    tipo: "impuesto|salario|alquiler|proveedor|prestamo|tarjeta|familiar",
    detalle: "Préstamo personal",
    montoTotal: 15000000,
    montoPagado: 10000000,
    cuotaMensual: 800000,
    cuotasPendientes: 6,
    estado: "activa|pausada|cancelada",
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Préstamo Inter-módulo
```javascript
{
    id: "uuid",
    fecha: "YYYY-MM-DD",
    tipo: "nt_a_familia|familia_a_nt",
    monto: 2500000,
    motivo: "Cubrir gastos escolares",
    estado: "pendiente|devuelto|parcial",
    montoDevuelto: 0,
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Categoría
```javascript
{
    id: "uuid",
    tipo: "egreso|ingreso",
    grupo: "gastos_fijos|cuotas_prestamos|suscripciones|variables|sueldos_honorarios|impuestos|eventos",
    nombre: "Alimentación",
    identificador: "alimentacion",
    icono: "🍎",
    color: "#FF5733",
    orden: 1,
    activa: true,
    sistema: true,  // Si es categoría del sistema (no eliminable)
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Configuración Global
```javascript
{
    id: "config_global",
    // Modelo 93/7 (NeuroTEA)
    pctGananciaObjetivo: 0.07,
    pctGastosMaximo: 0.93,
    pctCompensacion: 0.0175,
    pctFondoEmergencia: 0.0175,
    pctInversion: 0.0175,
    pctImprevistos: 0.0175,
    // Umbrales días de oxígeno
    diasOxigenoVerde: 90,
    diasOxigenoAmarillo: 30,
    // Reservas
    reservaFamiliar: 0,
    reservaNeuroTEA: 0,
    metaReservaMeses: 3,
    // Control IPS/IVA
    ipsAlDia: true,
    ivaAlDia: true,
    // Último respaldo
    ultimoRespaldo: null,
    updatedAt: "ISO8601"
}
```

### Esquema de Papelera (Soft Delete)
```javascript
{
    id: "uuid",
    tipo: "ingreso|egreso|cuenta|categoria|deuda|gasto_fijo",
    storeName: "familia_egresos",
    data: { /* datos completos del elemento */ },
    deletedAt: "ISO8601",
    expiresAt: "ISO8601"  // 30 días después
}
```

## Sistema de Categorías

### FAMILIA - Ingresos

**Marco:**
- salario_marco: Salario Mensual
- vacaciones_marco: Vacaciones
- aguinaldo_marco: Aguinaldo
- viatico_marco: Viático
- animador_biblico: Animador Bíblico
- otros_marco: Otros Ocasionales

**Clara:**
- honorarios_clara: Honorarios Diarios

**Desde NeuroTEA:**
- salario_admin: Salario Admin Marco
- ganancia_nt: Ganancia NT → Familia
- prestamo_nt: Préstamo NT (automático)

### FAMILIA - Egresos

**Gastos Fijos:**
- salario_lili: Salario Lili Doméstico
- salario_laura: Salario Laura Doméstico
- escuela: Escuela Fabián y Brenda
- robotica: Robótica Niños
- ande_casa: ANDE Casa
- expensa_casa: Expensa Casa
- cajubi_marco: Cajubi Marco
- mutual_marco: Mutual Marco
- na_luisa: Ña Luisa
- seguro_medico_papas: Seguro Médico Papá y Mamá

**Cuotas y Préstamos:**
- auto_laura: Auto Laura Cuota
- coop_universitaria: Coop. Universitaria Clara
- coomecipar_clara: Coomecipar Clara
- tarjeta_coomecipar: Tarjeta Cred. Coomecipar
- solar_1: Solar Préstamo 1
- solar_2: Solar Préstamo 2
- prestamo_lizzi: Préstamo Lizzi Sueldos
- show_congelador: Show Congelador
- olier_heladera: Olier Heladera

**Suscripciones e Internet:**
- giganet: Giganet
- tigo_internet: Tigo Internet/Celulares
- tigo_familiar: Tigo Familiar
- google_one: Google One
- chatgpt: ChatGPT
- claude_marco: Claude Marco
- claude_clara: Claude Clara
- ilovepdf: iLovePDF

**Variables:**
- alimentacion: Alimentación
- combustible: Combustible
- salud: Salud y Medicamentos
- gastos_varios: Gastos Varios Familia

### NEUROTEA - Ingresos
- sesiones_individuales: Sesiones Individuales
- paquetes_sesiones: Paquetes de Sesiones
- evaluaciones: Evaluaciones
- otros_nt: Otros Ingresos NT

### NEUROTEA - Egresos

**Gastos Fijos:**
- alquiler_1: Alquiler 1 (Principal)
- alquiler_2: Alquiler 2 (Secundario)
- limpieza_nt: Limpieza NeuroTEA

**Sueldos y Honorarios:**
- sueldo_aracely: Sueldo Aracely
- sueldo_fatima: Sueldo Fátima
- honorario_contador: Honorario Contador
- salario_admin: Salario Administrador
- honorario_sistema: Honorario Mant. Sistema

**Telefonía e Internet:**
- celular_nt: Celular Tigo NeuroTEA
- celular_sistema: Celular Tigo Sistema
- whatsflow: WhatsFlow
- internet_nt: Internet NeuroTEA

**Impuestos:**
- iva: IVA
- ips: IPS

**Eventos:**
- dia_nino: Día del Niño NT
- san_juan: San Juan NT
- dia_autismo: Día del Autismo NT
- clausura_padres: Clausura Padres NT
- navidad: Navidad Papá Noel NT
- cena_fin_ano: Cena Fin de Año NT

**Variables:**
- insumos_nt: Insumos NT
- papeleria_nt: Papelería NT
- mantenimiento_nt: Mantenimiento NT
- cursos_nt: Gastos Cursos NT
- gastos_varios_nt: Gastos Varios NT

### Cuentas Predefinidas

**FAMILIA:**
- ITAU Marco
- ITAU Clara
- UENO Clara
- Coop. Universitaria Marco
- Efectivo

**NEUROTEA:**
- Atlas (cuenta principal)
- Caja NT (efectivo clínica)

## Prioridad de Pagos (en crisis)

| Prioridad | Tipo | Descripción |
|-----------|------|-------------|
| 1 | IPS/Impuestos | Pueden clausurar el negocio |
| 2 | Salarios | Sin equipo no operás |
| 3 | Alquiler/Servicios | Sin local no hay clínica |
| 4 | Proveedores | Negociables |
| 5 | Bancos/Tarjetas | Proceso lento, refinanciable |
| 6 | Familiares | Más flexibles |

## Funciones Principales

### database.js

**CRUD Básico:**
- `inicializarDB()` - Inicializa IndexedDB con todos los stores
- `crear(store, datos)` - Crear registro
- `obtenerTodos(store)` - Obtener todos los registros
- `obtenerPorId(store, id)` - Obtener por ID
- `actualizar(store, id, datos)` - Actualizar registro
- `eliminar(store, id)` - Eliminar registro (hard delete)
- `softDelete(store, id)` - Mover a papelera (soft delete)
- `restaurar(papeleraId)` - Restaurar desde papelera
- `vaciarPapelera(modulo)` - Vaciar papelera

**Cálculos de Indicadores:**
- `calcularResumenMes(modulo, año, mes)` - Resumen de ingresos/egresos
- `calcularSaldoCuenta(modulo, cuentaId)` - Saldo de cuenta específica
- `calcularCajaTotal(modulo)` - Suma de todas las cuentas
- `calcularDiasOxigeno(modulo)` - Caja / (Gastos mensuales / 30)
- `calcularGastosMensuales(modulo)` - Total de gastos del mes
- `calcularLiquidezSemanal(modulo)` - Atrasados, esta semana, próxima semana
- `calcularCumplimientoPresupuesto(modulo, año, mes)` - % ejecutado vs presupuesto
- `calcularSaludNT(año, mes)` - Modelo 93/7 para NeuroTEA
- `calcularPrestamoInterModulo()` - Total NT → Familia pendiente

**Gestión de Gastos Fijos:**
- `obtenerGastosFijosMes(modulo, año, mes)` - Lista de gastos fijos del mes
- `actualizarEstadoGasto(id, estado)` - Cambiar estado de pago
- `generarGastosFijosMes(modulo, año, mes)` - Crear gastos desde presupuesto

**Gestión de Deudas:**
- `obtenerDeudas(modulo)` - Lista de deudas ordenadas por prioridad
- `calcularProgresoDeuda(deudaId)` - % pagado de una deuda
- `registrarPagoDeuda(deudaId, monto)` - Registrar pago a deuda

**Pagos por Vencer:**
- `obtenerPagosAtrasados(modulo)` - Pagos vencidos sin pagar
- `obtenerPagosSemana(modulo, semanaOffset)` - 0=esta semana, 1=próxima

### app.js

**Renderizado de Secciones:**
- `renderDashboard()` - Dashboard principal con indicadores
- `renderMovimientos()` - Lista de movimientos (ingresos/egresos)
- `renderGastosFijos()` - Gestión de gastos fijos mensuales
- `renderPresupuesto()` - Gestión de presupuesto anual
- `renderCuentas()` - Gestión de cuentas
- `renderDeudas()` - Gestión de deudas
- `renderAnalisis()` - Sección de gráficos (semanal/mensual/anual)
- `renderConfiguracion()` - Configuración del módulo

### charts.js

**Gráficos Vista Semanal:**
- `renderBateriaDiasOxigeno(containerId, dias, meta)` - Tanque de combustible
- `renderTablaPagos(containerId, pagos, titulo)` - Tabla de pagos
- `renderCalculoLiquidez(containerId, datos)` - Cálculo paso a paso

**Gráficos Vista Mensual:**
- `renderBarrasIngresoEgreso(containerId, datos)` - Barras agrupadas 12 meses
- `renderBarrasCategoria(containerId, categorias)` - Barras horizontales
- `renderLineaEvolucion(containerId, datos)` - Línea de tendencia
- `renderTablaPresupuesto(containerId, datos)` - Tabla con semáforos

**Gráficos Vista Anual:**
- `renderGaugeCircular(containerId, porcentaje, titulo)` - Gauge %
- `renderBarrasTrimestre(containerId, datos)` - Barras por trimestre
- `renderProgresoDeudas(containerId, deudas)` - Barras de progreso

### utils.js
- `formatearMoneda(monto)` - Formato Gs. X.XXX.XXX
- `formatearFecha(fecha)` - Formato DD/MM/YYYY
- `formatearFechaCorta(fecha)` - Formato DD/MM
- `getNombreCategoria(id)` - Obtener nombre de categoría
- `getCategorias(modulo, tipo)` - Obtener categorías dinámicas
- `getSemanaDelAño(fecha)` - Número de semana
- `getFechasSemana(semanaOffset)` - Rango de fechas de una semana
- `generarId()` - Genera UUID v4
- `calcularPorcentaje(parcial, total)` - Calcula % con protección división 0
- `getSemaforoGasto(porcentaje)` - Retorna 🟢🟡🔴 según %

## Flujo de Datos

### Al registrar un movimiento:
1. Validar datos requeridos
2. Guardar en el store correspondiente
3. Si tiene cuenta, actualizar saldo (calculado, no almacenado)
4. Si es cuota de deuda, actualizar progreso de deuda
5. Refrescar dashboard

### Al cambiar estado de gasto fijo:
1. Actualizar estado en `{modulo}_gastos_fijos`
2. Si pasa a "pagado", crear egreso correspondiente
3. Recalcular indicadores de liquidez
4. Refrescar vista de análisis semanal

### Al registrar préstamo inter-módulo:
1. Guardar en `prestamos_inter_modulo`
2. Crear ingreso en módulo destino
3. Crear egreso en módulo origen
4. Actualizar indicador de "fuga" en dashboard

### Al eliminar elemento:
1. Mover a papelera con expiración 30 días
2. Recalcular saldos y totales afectados
3. Mostrar opción de restaurar
4. Limpieza automática de expirados

## Semáforos del Sistema

### % Gasto vs Presupuesto
- 🟢 Verde: < 100% (ahorro)
- 🟡 Amarillo: = 100% (exacto)
- 🔴 Rojo: > 100% (exceso)

### Días de Oxígeno
- 🟢 Verde: ≥ 90 días
- 🟡 Amarillo: 30-89 días
- 🔴 Rojo: < 30 días

### Saldo después de pagos
- 🟢 Verde: Positivo (alcanza)
- 🟡 Amarillo: Justo (< 500k)
- 🔴 Rojo: Negativo (no alcanza)

### Estado de pagos
- 🟢 Verde: Pagado / Al día
- 🟡 Amarillo: Pendiente / Por vencer
- 🔴 Rojo: Atrasado / Vencido

### Salud NeuroTEA (Modelo 93/7)
- 🟢 Verde: Gastos ≤ 93% de ingresos
- 🟡 Amarillo: Gastos 93-100% de ingresos
- 🔴 Rojo: Gastos > 100% de ingresos (pérdida)

## Consideraciones de Seguridad

1. **Soft delete**: Todos los datos eliminados van a papelera por 30 días
2. **Integridad referencial**: Verificar referencias antes de eliminar
3. **Respaldos**: Sistema de exportación/importación JSON
4. **Sin datos huérfanos**: Limpieza automática de referencias inválidas
5. **Validación**: Todos los formularios validan datos antes de guardar

## Comandos de Desarrollo

```bash
# Servir localmente (cualquier servidor HTTP)
python -m http.server 8000
# o
npx serve .

# El proyecto no requiere build, es JavaScript vanilla
```

## Convenciones de Código

- IDs: UUID v4 generados con `generarId()`
- Fechas: ISO8601 para almacenamiento, DD/MM/YYYY para display
- Moneda: Guaraníes (Gs.), sin decimales
- Nombres de stores: `{modulo}_{entidad}` (ej: `familia_egresos`)
- Identificadores de categoría: snake_case (ej: `cuota_prestamo`)
- Funciones de render: `render{Seccion}()` (ej: `renderDashboard()`)
- Funciones de cálculo: `calcular{Indicador}()` (ej: `calcularDiasOxigeno()`)

## Rutinas de Control Sugeridas

### DIARIA (5 min)
- Cargar todos los ingresos y egresos del día
- Verificar tipo y cuenta correctos

### SEMANAL - Lunes (15 min)
- Revisar dashboard y días de oxígeno
- Verificar préstamos NT→Familia
- Revisar liquidez semanal (próximos pagos)
- Actualizar IPS e IVA al día

### MENSUAL - Fin de mes (30 min)
- Verificar que todos los movimientos estén cargados
- Actualizar estados de pago de gastos fijos
- Actualizar registro de deudas
- Analizar cumplimiento de presupuesto
- Generar gastos fijos del mes siguiente

## Notas para Claude

- Los cálculos (saldos, totales, balances) NUNCA se almacenan, siempre se calculan
- Al modificar categorías, actualizar todos los selects dinámicamente
- Mantener compatibilidad con datos existentes al migrar
- Preferir soft delete sobre hard delete
- Validar integridad de datos antes de operaciones destructivas
- El indicador más importante es "Días de Oxígeno"
- Siempre mostrar el préstamo NT→Familia si es > 0 (indica fuga)
