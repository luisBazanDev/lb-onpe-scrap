import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../db.json');

// Sample database for testing
const sampleDb = {
  "metadata": {
    "lastUpdated": new Date().toISOString(),
    "scriptVersion": "1.0.0",
    "status": "completed"
  },
  "summary": {
    "totalMesas": 10,
    "mesasContabilizadas": 10,
    "mesasInexistentes": 0,
    "mesasConError": 0,
    "totalElectoresHabiles": 2300,
    "totalAsistentes": 1800,
    "totalVotosEmitidos": 1800,
    "totalVotosValidos": 1340,
    "totalVotosEnBlanco": 290,
    "totalVotosNulos": 170,
    "regiones": {
      "10101": "LIMA"
    }
  },
  "partidos": {
    "00000008": {
      "adCodigo": "00000008",
      "adDescripcion": "FUERZA POPULAR",
      "totalVotos": 220,
      "totalMesas": 10,
      "porcentaje": 16.42
    },
    "00000035": {
      "adCodigo": "00000035",
      "adDescripcion": "RENOVACIÓN POPULAR",
      "totalVotos": 190,
      "totalMesas": 10,
      "porcentaje": 14.18
    },
    "00000002": {
      "adCodigo": "00000002",
      "adDescripcion": "AHORA NACIÓN - AN",
      "totalVotos": 180,
      "totalMesas": 10,
      "porcentaje": 13.43
    },
    "00000016": {
      "adCodigo": "00000016",
      "adDescripcion": "PARTIDO DEL BUEN GOBIERNO",
      "totalVotos": 130,
      "totalMesas": 10,
      "porcentaje": 9.70
    },
    "00000010": {
      "adCodigo": "00000010",
      "adDescripcion": "JUNTOS POR EL PERÚ",
      "totalVotos": 80,
      "totalMesas": 10,
      "porcentaje": 5.97
    },
    "00000033": {
      "adCodigo": "00000033",
      "adDescripcion": "PRIMERO LA GENTE",
      "totalVotos": 80,
      "totalMesas": 10,
      "porcentaje": 5.97
    },
    "00000014": {
      "adCodigo": "00000014",
      "adDescripcion": "PARTIDO CÍVICO OBRAS",
      "totalVotos": 180,
      "totalMesas": 10,
      "porcentaje": 13.43
    },
    "00000003": {
      "adCodigo": "00000003",
      "adDescripcion": "ALIANZA ELECTORAL VENCEREMOS",
      "totalVotos": 40,
      "totalMesas": 10,
      "porcentaje": 2.99
    },
    "00000023": {
      "adCodigo": "00000023",
      "adDescripcion": "PARTIDO PAÍS PARA TODOS",
      "totalVotos": 40,
      "totalMesas": 10,
      "porcentaje": 2.99
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
        "00000008": 22,
        "00000035": 19,
        "00000002": 18,
        "00000014": 18,
        "00000016": 13,
        "00000010": 8,
        "00000033": 8,
        "00000003": 4,
        "00000023": 4
      }
    }
  ],
  "regionesDetalle": {
    "10101": {
      "nombreRegion": "LIMA",
      "ubigeo": 10101,
      "totalElectoresHabiles": 2300,
      "totalAsistentes": 1800,
      "totalVotosEmitidos": 1800,
      "totalVotosValidos": 1340,
      "mesasContabilizadas": 10,
      "totalMesas": 10,
      "partidos": {
        "00000008": 220,
        "00000035": 190,
        "00000002": 180,
        "00000014": 180,
        "00000016": 130,
        "00000010": 80,
        "00000033": 80,
        "00000003": 40,
        "00000023": 40
      }
    }
  },
  "errores": {
    "mesasInvalidas": [],
    "mesasConErrorReintento": []
  }
};

// Write sample database
fs.writeFileSync(DB_PATH, JSON.stringify(sampleDb, null, 2));
console.log('✅ Datos de ejemplo creados en db.json');
console.log('\nPuedes ahora iniciar el servidor con: npm start');
