# Estructura de Datos - ONPE Voting Transparency App

## db.json

Base de datos principal que almacena todos los datos recopilados de las mesas.

### Estructura Principal

```json
{
  "metadata": {
    "lastUpdated": "2026-04-19T12:00:00Z",
    "scriptVersion": "1.0.0",
    "status": "completed|in_progress|failed"
  },
  "summary": {
    "totalMesas": 0,
    "mesasContabilizadas": 0,
    "mesasInexistentes": 0,
    "mesasConError": 0,
    "totalElectoresHabiles": 0,
    "totalAsistentes": 0,
    "totalVotosEmitidos": 0,
    "totalVotosValidos": 0,
    "totalVotosEnBlanco": 0,
    "totalVotosNulos": 0,
    "regiones": {}
  },
  "partidos": {
    "[adCodigo]": {
      "adCodigo": "00000001",
      "adDescripcion": "ALIANZA PARA EL PROGRESO",
      "totalVotos": 0,
      "totalVotosPorMesa": 0,
      "porcentaje": 0.0
    }
  },
  "mesas": [
    {
      "codigoMesa": "000001",
      "idMesa": 1,
      "nombreLocalVotacion": "IE 18288 ISABEL LYNCH DE RUBIO",
      "idUbigeo": 10101,
      "nombreRegion": "LIMA",
      "totalElectoresHabiles": 230,
      "totalAsistentes": 180,
      "totalVotosEmitidos": 180,
      "totalVotosValidos": 134,
      "totalVotosEnBlanco": 29,
      "totalVotosNulos": 17,
      "votos": {
        "[adCodigo]": 1
      }
    }
  ],
  "regionesDetalle": {
    "[ubigeo]": {
      "nombreRegion": "LIMA",
      "ubigeo": 10101,
      "totalElectoresHabiles": 0,
      "totalAsistentes": 0,
      "totalVotosEmitidos": 0,
      "totalVotosValidos": 0,
      "mesasContabilizadas": 0,
      "totalMesas": 0,
      "partidos": {
        "[adCodigo]": 0
      }
    }
  },
  "errores": {
    "mesasInvalidas": ["000002", "000003"],
    "mesasConErrorReintento": [
      {
        "codigoMesa": "000004",
        "error": "Network timeout",
        "intentos": 2,
        "ultimoIntento": "2026-04-19T12:00:00Z"
      }
    ]
  }
}
```

## .cache/.progress

Archivo que registra el progreso de la ejecución del script bulk-get-data.

```json
{
  "ultimaMesaProcesada": "000123",
  "totalMesasProcessadas": 123,
  "mesasInvalidas": 5,
  "fechaInicio": "2026-04-19T12:00:00Z",
  "ultimaActualizacion": "2026-04-19T12:05:00Z"
}
```

## logs.txt

Archivo de log con todos los errores y eventos importantes del script.

```
[2026-04-19T12:00:00Z] Script iniciado
[2026-04-19T12:00:01Z] Consultando mesa: 000001 - Status: 200
[2026-04-19T12:00:02Z] Consultando mesa: 000002 - Status: 404 (Intento 1/2)
[2026-04-19T12:00:05Z] Consultando mesa: 000002 - Status: 404 (Intento 2/2) - Marcada como inválida
[2026-04-19T12:00:06Z] Consultando mesa: 000003 - Status: 500 (Intento 1/2)
[2026-04-19T12:00:10Z] Consultando mesa: 000003 - Status: 500 (Intento 2/2) - Marcada como inválida
...
```

## API Response - Mesa Individual

Estructura esperada de la API de ONPE para una mesa individual.

```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 101010110,
      "idMesa": 1,
      "codigoMesa": "000001",
      "numeroCopia": null,
      "idUbigeoEleccion": null,
      "idEleccion": 10,
      "idAmbitoGeografico": 1,
      "idUbigeo": 10101,
      "centroPoblado": "",
      "nombreLocalVotacion": "IE 18288 ISABEL LYNCH DE RUBIO",
      "codigoLocalVotacion": "0001",
      "totalElectoresHabiles": 230,
      "totalVotosEmitidos": 180,
      "totalVotosValidos": 134,
      "totalAsistentes": 180,
      "porcentajeParticipacionCiudadana": 78.261,
      "estadoActa": "D",
      "estadoComputo": "N",
      "codigoEstadoActa": "C",
      "descripcionEstadoActa": "Contabilizada",
      "detalle": [
        {
          "adAgrupacionPolitica": 1,
          "adPosicion": 22,
          "adCodigo": "00000001",
          "adDescripcion": "ALIANZA PARA EL PROGRESO",
          "adEstado": 1,
          "adVotos": 1,
          "adTotalVotosValidos": 0,
          "adCargo": null,
          "adPorcentajeVotosValidos": 0.746,
          "adPorcentajeVotosEmitidos": 0.556,
          "adGrafico": 1,
          "candidato": []
        }
      ],
      "lineaTiempo": [
        {
          "codigoEstadoActa": "C",
          "descripcionEstadoActa": "Contabilizada",
          "descripcionEstadoActaResolucion": null,
          "fechaRegistro": 1776065346000
        }
      ]
    }
  ]
}
```

## Campos de Interés Extraídos

De cada mesa, se extraen los siguientes datos:

1. **Datos Generales de la Mesa:**
   - `codigoMesa`: Identificador único de 6 dígitos
   - `idMesa`: ID numérico
   - `nombreLocalVotacion`: Nombre del lugar de votación
   - `idUbigeo`: Código de región/ubigeo

2. **Datos de Participación:**
   - `totalElectoresHabiles`: Total de electores habilitados
   - `totalAsistentes`: Total de asistentes
   - `totalVotosEmitidos`: Total de votos emitidos
   - `totalVotosValidos`: Total de votos válidos

3. **Votos por Partido:**
   - `adCodigo`: Código único del partido
   - `adDescripcion`: Nombre del partido
   - `adVotos`: Votos recibidos en esa mesa
   - Votos en blanco (código 80)
   - Votos nulos (código 81)

## Cálculos Derivados

Estos se calculan a partir de los datos base:

- **Porcentaje de votos por partido**: (votos_partido / totalVotosValidos) * 100
- **Total de votos por partido**: Suma de votos de todas las mesas
- **Porcentaje de participación**: (totalAsistentes / totalElectoresHabiles) * 100
- **Votos por región**: Agrupación por ubigeo

## Validaciones Críticas

1. **Mesa válida**: `success === true` y `data` es un array no vacío
2. **Datos consistentes**: `totalVotosEmitidos >= totalVotosValidos`
3. **Summas correctas**: Suma de votos por partido = totalVotosValidos + blancos + nulos

## Notas Importantes

- Los datos se actualizan desde cero con cada ejecución del script (a menos que se use --force)
- El script reintenta mesas con error con backoff exponencial
- Se detiene después de 20 mesas consecutivas inválidas
- Rate limit: 30 consultas por minuto (configurable)
- Todos los errores se registran en logs.txt y en db.json

