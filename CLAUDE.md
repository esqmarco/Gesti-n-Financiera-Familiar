# Gestor Financiero Familiar - Documentación del Proyecto

## Descripción General
Sistema de gestión financiera personal y empresarial desarrollado en HTML/CSS/JavaScript vanilla con almacenamiento en IndexedDB. Soporta dos módulos independientes: FAMILIA (finanzas del hogar) y NEUROTEA (clínica de neurorehabilitación).

## Estructura del Proyecto

```
├── index.html          # Interfaz principal (modales, navegación, layout)
├── css/
│   └── styles.css      # Estilos completos del sistema
├── js/
│   ├── utils.js        # Utilidades, constantes, formateo, categorías
│   ├── database.js     # Capa de datos IndexedDB, operaciones CRUD
│   └── app.js          # Lógica de aplicación, renderizado, formularios
└── CLAUDE.md           # Esta documentación
```

## Base de Datos (IndexedDB)

### Nombre: `GestorFinancieroApp`

### Object Stores:

| Store | Descripción | Índices |
|-------|-------------|---------|
| `familia_ingresos` | Ingresos del hogar | fecha, persona, categoria, cuentaDestino |
| `familia_egresos` | Gastos del hogar | fecha, tipoGasto, categoria, cuentaOrigen, prestamoId |
| `familia_prestamos` | Préstamos personales | estado, fechaProximoPago |
| `familia_cuentas` | Cuentas bancarias/efectivo | tipo, activa |
| `familia_transferencias` | Transferencias entre cuentas | fecha, cuentaOrigen, cuentaDestino |
| `familia_metas` | Metas de ahorro | estado |
| `familia_presupuesto` | Presupuesto mensual | año, mes |
| `familia_categorias` | Categorías personalizadas | tipo |
| `familia_recurrentes` | Pagos recurrentes | tipo, activo |
| `familia_papelera` | Elementos eliminados (soft delete) | tipo, deletedAt |
| `neurotea_*` | Equivalentes para módulo NEUROTEA | - |
| `configuracion` | Configuración global | - |

## Arquitectura de Datos

### Esquema de Egreso
```javascript
{
    id: "uuid",
    fecha: "YYYY-MM-DD",
    tipoGasto: "fijo|variable|mantenimiento|ocio",  // Tipo de gasto
    categoria: "identificador_categoria",            // Referencia a categoría
    monto: 1500000,
    descripcion: "Texto opcional",
    cuentaOrigen: "uuid_cuenta|null",
    prestamoId: "uuid_prestamo|null",                // Solo si es cuota
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Categoría (Dinámico)
```javascript
{
    id: "uuid",
    tipo: "egreso|ingreso",                          // Tipo de movimiento
    tipoGasto: "fijo|variable|mantenimiento|ocio",   // Solo para egresos
    nombre: "Alimentación",                          // Nombre visible
    identificador: "alimentacion",                   // Identificador único
    icono: "🍎",                                     // Emoji opcional
    color: "#FF5733",                                // Color opcional
    orden: 1,                                        // Orden de visualización
    activa: true,                                    // Si está activa
    sistema: false,                                  // Si es categoría del sistema
    createdAt: "ISO8601",
    updatedAt: "ISO8601"
}
```

### Esquema de Papelera (Soft Delete)
```javascript
{
    id: "uuid",
    tipo: "ingreso|egreso|cuenta|categoria|...",    // Tipo de elemento
    storeName: "familia_egresos",                    // Store original
    data: { /* datos completos del elemento */ },   // Datos originales
    deletedAt: "ISO8601",                           // Fecha de eliminación
    expiresAt: "ISO8601"                            // Fecha de expiración (30 días)
}
```

## Sistema de Categorías

### Tipos de Gasto (para egresos)
- `fijo`: Pagos mensuales fijos (expensas, servicios)
- `variable`: Gastos que varían (alimentación, transporte)
- `mantenimiento`: Reparaciones y mejoras
- `ocio`: Entretenimiento y tiempo libre

### Categorías Predeterminadas del Sistema

**FAMILIA - Egresos:**
- Fijo: expensas, ande, escuela, agua, internet, telefono, cuota_prestamo
- Variable: alimentacion, transporte, salud, ropa, supermercado
- Mantenimiento: casa, vehiculo
- Ocio: restaurantes, viajes, suscripciones

**FAMILIA - Ingresos:**
- Marco: salario, vacaciones, aguinaldo, contrato, viatico
- Clara: salario
- Otro: (personalizable)

## Funciones Principales

### database.js
- `inicializarDB()` - Inicializa IndexedDB
- `crear(store, datos)` - Crear registro
- `obtenerTodos(store)` - Obtener todos los registros
- `obtenerPorId(store, id)` - Obtener por ID
- `actualizar(store, id, datos)` - Actualizar registro
- `eliminar(store, id)` - Eliminar registro (hard delete)
- `softDelete(store, id)` - Mover a papelera (soft delete)
- `restaurar(papeleraId)` - Restaurar desde papelera
- `vaciarPapelera(modulo)` - Vaciar papelera
- `calcularResumenMes(modulo, año, mes)` - Calcular resumen mensual
- `calcularSaldoCuenta(modulo, cuentaId)` - Calcular saldo de cuenta

### app.js
- `renderDashboard()` - Dashboard principal
- `renderMovimientos()` - Lista de movimientos
- `renderPresupuesto()` - Gestión de presupuesto
- `renderCuentas()` - Gestión de cuentas
- `renderConfiguracion()` - Configuración del módulo
- `renderCategoriasConfig()` - Gestión de categorías
- `renderPapelera()` - Gestión de papelera

### utils.js
- `formatearMoneda(monto)` - Formato Gs. X.XXX.XXX
- `formatearFecha(fecha)` - Formato DD/MM/YYYY
- `getNombreCategoria(id)` - Obtener nombre de categoría
- `getCategorias(modulo, tipo)` - Obtener categorías dinámicas

## Flujo de Datos

### Al agregar/modificar categoría:
1. Se guarda en `{modulo}_categorias`
2. Se actualiza el cache local
3. Afecta: Formularios de movimientos, Presupuesto, Reportes, Dashboard

### Al eliminar categoría:
1. Verificar si hay movimientos asociados
2. Si hay movimientos: Advertir y ofrecer reasignar
3. Si no hay: Mover a papelera (soft delete)
4. Categorías del sistema no se pueden eliminar

### Al eliminar movimiento/cuenta/etc:
1. Mover a papelera con fecha de expiración (30 días)
2. Recalcular saldos y totales afectados
3. Mostrar opción de restaurar
4. Después de 30 días: Eliminación automática permanente

## Consideraciones de Seguridad

1. **Código de borrado**: `280208` (para borrado masivo)
2. **Soft delete**: Todos los datos eliminados van a papelera por 30 días
3. **Integridad referencial**: Verificar referencias antes de eliminar
4. **Respaldos**: Sistema de exportación/importación JSON
5. **Sin datos huérfanos**: Limpieza automática de referencias inválidas

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

## Notas para Claude

- Los cálculos (saldos, totales, balances) NUNCA se almacenan, siempre se calculan
- Al modificar categorías, actualizar todos los selects dinámicamente
- Mantener compatibilidad con datos existentes al migrar
- Preferir soft delete sobre hard delete
- Validar integridad de datos antes de operaciones destructivas
