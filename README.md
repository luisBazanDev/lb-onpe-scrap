# 🗳️ ONPE Voting Transparency App

Una aplicación web transparente para contabilizar y visualizar los resultados de votación del ONPE (Oficina Nacional de Procesos Electorales) del Perú.

## Características

### Características

- **Recopilación Automática de Datos**: Script que consulta todas las mesas del ONPE de forma sistemática
- **Emulación de Cliente Web**: Usa headers de navegador para evitar bloqueos de CORS
- **Manejo Inteligente de Errores**: Reintentos con backoff exponencial, registros detallados de errores
- **Rate Limiting**: Respeta el límite de 30 consultas por minuto a la API
- **Persistencia de Progreso**: Continúa desde donde se detuvo si el script falla
- **Visualización Interactiva**: Gráficos de barras interactivos con Chart.js
- **Datos Precisos**: Validación exhaustiva de consistencia de datos
- **API REST**: Endpoints para acceder a todos los datos recopilados

## Estructura del Proyecto

```
lb-onpe-scrap/
├── scripts/
│   └── bulk-get-data.ts       # Script de recopilación de datos
├── src/
│   └── server.js              # Servidor Express
├── public/
│   └── index.html             # Cliente web interactivo
├── docs.md                     # Documentación de la API de ONPE
├── data.md                     # Estructura de datos de la aplicación
├── db.json                     # Base de datos (generada)
├── logs.txt                    # Logs (generado)
├── .cache/
│   └── .progress              # Progreso del script (generado)
└── package.json               # Dependencias

```

## Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
```

## Uso

### 1. Recopilar Datos

Ejecuta el script para recopilar datos de todas las mesas:

```bash
npm run bulk-data
```

**Opciones:**

- `npm run bulk-data` - Continúa desde la última mesa procesada
- `npm run bulk-data:force` - Comienza desde cero (reinicia todo)

El script:
- Consulta todas las mesas de ONPE (6 dígitos: 000001 hasta encontrar 20 consecutivas inválidas)
- Reintenta automáticamente mesas con error (máximo 2 intentos)
- Respeta rate limit de 30 consultas por minuto
- Registra todo en `logs.txt`
- Guarda progreso en `.cache/.progress`
- Genera `db.json` con los datos

### 2. Iniciar el Servidor Web

En otra terminal, inicia el servidor:

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Datos Recopilados

Por cada mesa, se extrae:

- **Identificación**: Código de mesa, nombre del local de votación, ubigeo
- **Participación**: Electores hábiles, asistentes, votos emitidos
- **Votos**: Total de votos válidos, nulos, en blanco
- **Partidos Políticos**: Votos por cada partido político registrado

## API Endpoints

### GET `/api/summary`
Resumen general con totales y estadísticas.

```json
{
  "totalMesas": 5000,
  "mesasContabilizadas": 4950,
  "mesasInexistentes": 50,
  "totalElectoresHabiles": 1200000,
  "totalAsistentes": 950000,
  "totalVotosEmitidos": 950000,
  "totalVotosValidos": 900000,
  "totalVotosEnBlanco": 30000,
  "totalVotosNulos": 20000
}
```

### GET `/api/partidos`
Lista de partidos políticos con sus votos totales y porcentaje.

```json
[
  {
    "adCodigo": "00000008",
    "adDescripcion": "FUERZA POPULAR",
    "totalVotos": 250000,
    "totalMesas": 4900,
    "porcentaje": 27.78
  },
  ...
]
```

### GET `/api/mesas`
Detalles de todas las mesas contabilizadas.

```json
[
  {
    "codigoMesa": "000001",
    "nombreLocalVotacion": "IE 18288 ISABEL LYNCH DE RUBIO",
    "totalElectoresHabiles": 230,
    "totalAsistentes": 180,
    "totalVotosEmitidos": 180,
    "totalVotosValidos": 134,
    "votos": {
      "00000008": 22,
      "00000035": 19,
      ...
    }
  },
  ...
]
```

### GET `/api/regiones`
Datos agrupados por región (ubigeo).

### GET `/api/metadata`
Información sobre la ejecución del script (timestamp, estado, versión).

### GET `/api/errores`
Lista de mesas inválidas y con errores de procesamiento.

## Interfaz Web

La interfaz web muestra:

- **Tarjetas de Estadísticas**: Resumen rápido de principales métricas
- **Gráfico de Barras Interactivo**: Votos totales por partido político
- **Tabla Detallada**: Resultados con porcentajes exactos

El gráfico es totalmente interactivo:
- Hover para ver detalles
- Los datos se actualizan automáticamente cada 30 segundos
- Responsive y optimizado para dispositivos móviles

## Configuración

Edita estos valores en `scripts/bulk-get-data.ts`:

```typescript
const API_BASE_URL = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend/actas/buscar/mesa';
const RATE_LIMIT = 30;                    // Consultas por minuto
const CONSECUTIVE_INVALID_THRESHOLD = 20; // Mesas inválidas antes de detener
const RETRY_ATTEMPTS = 2;                 // Intentos por mesa
const BACKOFF_BASE = 1000;                // Millisegundos para backoff inicial
```

## Logs y Progreso

### logs.txt
Registro completo de todas las operaciones:

```
[2026-04-19T12:00:00Z] Script iniciado
[2026-04-19T12:00:01Z] Mesa 000001 - Procesada exitosamente
[2026-04-19T12:00:02Z] Mesa 000002 - Inválida (1/20)
[2026-04-19T12:00:05Z] Mesa 000003 - Error en intento 1/2: Timeout. Reintentando en 1000ms...
[2026-04-19T12:00:06Z] Mesa 000003 - Procesada exitosamente (reintento)
```

### .cache/.progress
Progreso persistente:

```json
{
  "ultimaMesaProcesada": "001523",
  "totalMesasProcessadas": 1500,
  "mesasInvalidas": 23,
  "fechaInicio": "2026-04-19T12:00:00Z",
  "ultimaActualizacion": "2026-04-19T12:15:30Z"
}
```

## Validaciones de Datos

El sistema valida automáticamente:

1. **Consistencia de Estructura**: `success === true` y datos válidos
2. **Lógica de Votos**: `totalVotosEmitidos >= totalVotosValidos`
3. **Sumatorio Correcto**: Votos partidos + blancos + nulos = totalVotosEmitidos
4. **Campos Requeridos**: Todos los campos obligatorios presentes

Si alguna validación falla, la mesa se marca como error pero se continúa procesando.

## Precisión y Transparencia

- **Datos Directos de API**: Todos los datos provienen directamente de ONPE
- **Sin Transformaciones**: Los datos se registran tal como vienen de la API
- **Auditables**: Todos los errores están registrados y disponibles
- **Reproducible**: El script puede re-ejecutarse en cualquier momento

## Solución de Problemas

### "Database not found"
Ejecuta primero el script de recopilación:
```bash
npm run bulk-data
```

### El script se detiene abruptamente
Verifica `logs.txt` para ver el error específico. Puedes continuar desde donde se detuvo con:
```bash
npm run bulk-data
```

### Quiero comenzar desde cero
Usa el flag `--force`:
```bash
npm run bulk-data:force
```

Esto eliminará `.cache/.progress` y recreará `db.json`.

### Port 3000 already in use
Cambia el puerto:
```bash
PORT=3001 npm start
```

## Estructura de datos.md

Consulta `data.md` para:
- Estructura exacta de `db.json`
- Campos extraídos de cada mesa
- Cálculos derivados
- Notas de validación

Esta documentación se actualiza cada vez que cambia la estructura de datos.

## Desarrollo

### Scripts disponibles:

```bash
npm start              # Inicia servidor (producción)
npm run bulk-data     # Recopila datos (continúa)
npm run bulk-data:force # Recopila datos (desde cero)
npm run dev           # Modo desarrollo con watch
```

## Licencia

ISC

## Notas Importantes

- Los datos se recopilan directamente de la API oficial de ONPE
- Esta aplicación es una herramienta de transparencia electoral
- La precisión de los datos depende de los datos que proporciona ONPE
- Los errores de la API se registran completamente para auditoría
