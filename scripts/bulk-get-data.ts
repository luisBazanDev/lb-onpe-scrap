import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend/actas/buscar/mesa';
const RATE_LIMIT = 30; // queries per minute
const RATE_LIMIT_MS = (60 * 1000) / RATE_LIMIT;
const RETRY_ATTEMPTS = 2;
const CONSECUTIVE_INVALID_THRESHOLD = 20;
const BACKOFF_BASE = 1000; // ms

// Paths
const DB_PATH = path.join(__dirname, '../db.json');
const PROGRESS_DIR = path.join(__dirname, '../.cache');
const PROGRESS_FILE = path.join(PROGRESS_DIR, '.progress');
const LOGS_FILE = path.join(__dirname, '../logs.txt');

// Types
interface MesaApiResponse {
  success: boolean;
  data?: Array<{
    codigoMesa: string;
    idMesa: number;
    idUbigeo: number;
    nombreLocalVotacion: string;
    totalElectoresHabiles: number;
    totalAsistentes: number;
    totalVotosEmitidos: number;
    totalVotosValidos: number;
    detalle: Array<{
      adCodigo: string;
      adDescripcion: string;
      adVotos: number;
      adGrafico: number;
    }>;
  }>;
}

interface Progress {
  ultimaMesaProcesada: string;
  totalMesasProcessadas: number;
  mesasInvalidas: number;
  fechaInicio: string;
  ultimaActualizacion: string;
}

interface Database {
  metadata: {
    lastUpdated: string;
    scriptVersion: string;
    status: 'completed' | 'in_progress' | 'failed';
  };
  summary: {
    totalMesas: number;
    mesasContabilizadas: number;
    mesasInexistentes: number;
    mesasConError: number;
    totalElectoresHabiles: number;
    totalAsistentes: number;
    totalVotosEmitidos: number;
    totalVotosValidos: number;
    totalVotosEnBlanco: number;
    totalVotosNulos: number;
    regiones: Record<string, string>;
  };
  partidos: Record<string, any>;
  mesas: any[];
  regionesDetalle: Record<string, any>;
  errores: {
    mesasInvalidas: string[];
    mesasConErrorReintento: Array<{
      codigoMesa: string;
      error: string;
      intentos: number;
      ultimoIntento: string;
    }>;
  };
}

class BulkDataScript {
  private progress: Progress;
  private db: Database;
  private forceRestart: boolean;
  private lastRequestTime = 0;
  private consecutiveInvalid = 0;
  private regionNames: Record<number, string> = {
    10101: 'LIMA',
    10201: 'LIMA - BARRANCA',
    10202: 'LIMA - CAÑETE',
    10203: 'LIMA - HUACHO',
    10204: 'LIMA - HUARAL',
    10205: 'LIMA - HUAROCHIRÍ',
    10206: 'LIMA - LEONCIO PRADO',
    10207: 'LIMA - OYÓN',
    10208: 'LIMA - YAUYOS'
    // Add more ubigeo mappings as needed
  };

  constructor(forceRestart = false) {
    this.forceRestart = forceRestart;
    this.progress = this.loadProgress();
    this.db = this.loadDatabase();
  }

  private loadProgress(): Progress {
    if (this.forceRestart || !fs.existsSync(PROGRESS_FILE)) {
      return {
        ultimaMesaProcesada: '000000',
        totalMesasProcessadas: 0,
        mesasInvalidas: 0,
        fechaInicio: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString(),
      };
    }
    const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(content);
  }

  private loadDatabase(): Database {
    if (this.forceRestart || !fs.existsSync(DB_PATH)) {
      return {
        metadata: {
          lastUpdated: new Date().toISOString(),
          scriptVersion: '1.0.0',
          status: 'in_progress',
        },
        summary: {
          totalMesas: 0,
          mesasContabilizadas: 0,
          mesasInexistentes: 0,
          mesasConError: 0,
          totalElectoresHabiles: 0,
          totalAsistentes: 0,
          totalVotosEmitidos: 0,
          totalVotosValidos: 0,
          totalVotosEnBlanco: 0,
          totalVotosNulos: 0,
          regiones: {},
        },
        partidos: {},
        mesas: [],
        regionesDetalle: {},
        errores: {
          mesasInvalidas: [],
          mesasConErrorReintento: [],
        },
      };
    }
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    fs.appendFileSync(LOGS_FILE, logMessage + '\n');
  }

  private saveProgress(): void {
    this.progress.ultimaActualizacion = new Date().toISOString();
    if (!fs.existsSync(PROGRESS_DIR)) {
      fs.mkdirSync(PROGRESS_DIR, { recursive: true });
    }
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
  }

  private saveDatabase(): void {
    this.db.metadata.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_PATH, JSON.stringify(this.db, null, 2));
  }

  private padMesaCode(num: number): string {
    return String(num).padStart(6, '0');
  }

  private async waitForRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_MS - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchMesa(codigoMesa: string, attemptNumber = 1): Promise<MesaApiResponse | null> {
    try {
      await this.waitForRateLimit();
      const response = await axios.get(API_BASE_URL, {
        params: { codigoMesa },
        timeout: 10000,
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.8',
          'content-type': 'application/json',
          'priority': 'u=1, i',
          'referer': 'https://resultadoelectoral.onpe.gob.pe/main/actas',
          'sec-ch-ua': '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
        },
      });
      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (attemptNumber < RETRY_ATTEMPTS) {
        const backoff = BACKOFF_BASE * Math.pow(2, attemptNumber - 1);
        this.log(
          `Mesa ${codigoMesa} - Error en intento ${attemptNumber}/${RETRY_ATTEMPTS}: ${errorMsg}. ` +
          `Reintentando en ${backoff}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.fetchMesa(codigoMesa, attemptNumber + 1);
      }

      this.log(
        `Mesa ${codigoMesa} - Falló después de ${RETRY_ATTEMPTS} intentos: ${errorMsg}`
      );
      return null;
    }
  }

  private processMesaData(response: MesaApiResponse, codigoMesa: string): boolean {
    if (!response.success || !response.data || response.data.length === 0) {
      return false;
    }

    try {
      const mesaData = response.data[0];
      
      // Validate data consistency
      if (mesaData.totalVotosEmitidos < mesaData.totalVotosValidos) {
        this.log(
          `Mesa ${codigoMesa} - Datos inconsistentes: ` +
          `votosEmitidos(${mesaData.totalVotosEmitidos}) < votosValidos(${mesaData.totalVotosValidos})`
        );
        return false;
      }

      // Get region name
      const regionName = this.regionNames[mesaData.idUbigeo] || `REGIÓN_${mesaData.idUbigeo}`;

      // Process party votes
      let totalVotosEnBlanco = 0;
      let totalVotosNulos = 0;
      const votos: Record<string, number> = {};

      for (const party of mesaData.detalle) {
        if (party.adCodigo === '80') { // Votos en blanco
          totalVotosEnBlanco = party.adVotos || 0;
        } else if (party.adCodigo === '81') { // Votos nulos
          totalVotosNulos = party.adVotos || 0;
        } else if (party.adGrafico === 1 && party.adVotos > 0) {
          votos[party.adCodigo] = party.adVotos;

          // Update party totals
          if (!this.db.partidos[party.adCodigo]) {
            this.db.partidos[party.adCodigo] = {
              adCodigo: party.adCodigo,
              adDescripcion: party.adDescripcion,
              totalVotos: 0,
              totalMesas: 0,
            };
          }
          this.db.partidos[party.adCodigo].totalVotos += party.adVotos;
          this.db.partidos[party.adCodigo].totalMesas += 1;
        }

        // Register party if not exists (even if no votes)
        if (!this.db.partidos[party.adCodigo] && party.adGrafico === 1) {
          this.db.partidos[party.adCodigo] = {
            adCodigo: party.adCodigo,
            adDescripcion: party.adDescripcion,
            totalVotos: 0,
            totalMesas: 0,
          };
        }
      }

      // Store mesa data
      this.db.mesas.push({
        codigoMesa,
        idMesa: mesaData.idMesa,
        nombreLocalVotacion: mesaData.nombreLocalVotacion,
        idUbigeo: mesaData.idUbigeo,
        nombreRegion: regionName,
        totalElectoresHabiles: mesaData.totalElectoresHabiles,
        totalAsistentes: mesaData.totalAsistentes,
        totalVotosEmitidos: mesaData.totalVotosEmitidos,
        totalVotosValidos: mesaData.totalVotosValidos,
        totalVotosEnBlanco,
        totalVotosNulos,
        votos,
      });

      // Update summary
      this.db.summary.mesasContabilizadas += 1;
      this.db.summary.totalElectoresHabiles += mesaData.totalElectoresHabiles;
      this.db.summary.totalAsistentes += mesaData.totalAsistentes;
      this.db.summary.totalVotosEmitidos += mesaData.totalVotosEmitidos;
      this.db.summary.totalVotosValidos += mesaData.totalVotosValidos;
      this.db.summary.totalVotosEnBlanco += totalVotosEnBlanco;
      this.db.summary.totalVotosNulos += totalVotosNulos;

      // Update region details
      if (!this.db.regionesDetalle[mesaData.idUbigeo]) {
        this.db.regionesDetalle[mesaData.idUbigeo] = {
          nombreRegion: regionName,
          ubigeo: mesaData.idUbigeo,
          totalElectoresHabiles: 0,
          totalAsistentes: 0,
          totalVotosEmitidos: 0,
          totalVotosValidos: 0,
          mesasContabilizadas: 0,
          totalMesas: 0,
          partidos: {},
        };
      }

      const region = this.db.regionesDetalle[mesaData.idUbigeo];
      region.totalElectoresHabiles += mesaData.totalElectoresHabiles;
      region.totalAsistentes += mesaData.totalAsistentes;
      region.totalVotosEmitidos += mesaData.totalVotosEmitidos;
      region.totalVotosValidos += mesaData.totalVotosValidos;
      region.mesasContabilizadas += 1;
      region.totalMesas += 1;

      for (const [partyCode, votes] of Object.entries(votos)) {
        region.partidos[partyCode] = (region.partidos[partyCode] || 0) + votes;
      }

      this.log(`Mesa ${codigoMesa} - Procesada exitosamente`);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`Mesa ${codigoMesa} - Error al procesar datos: ${errorMsg}`);
      return false;
    }
  }

  async run(): Promise<void> {
    try {
      this.log('=== Iniciando script de recopilación de datos ===');
      this.log(`Fuerza reinicio: ${this.forceRestart}`);
      this.log(`Última mesa procesada: ${this.progress.ultimaMesaProcesada}`);

      const startNum = parseInt(this.progress.ultimaMesaProcesada) + 1;
      let currentNum = startNum;

      while (this.consecutiveInvalid < CONSECUTIVE_INVALID_THRESHOLD) {
        const codigoMesa = this.padMesaCode(currentNum);

        const response = await this.fetchMesa(codigoMesa);

        if (response && response.success && response.data) {
          // Valid mesa
          this.consecutiveInvalid = 0;
          
          if (this.processMesaData(response, codigoMesa)) {
            this.progress.totalMesasProcessadas += 1;
            this.progress.ultimaMesaProcesada = codigoMesa;
            this.saveProgress();
            this.saveDatabase();
          } else {
            // Data processing failed but mesa exists
            this.db.summary.mesasConError += 1;
            this.db.errores.mesasConErrorReintento.push({
              codigoMesa,
              error: 'Data validation failed',
              intentos: 1,
              ultimoIntento: new Date().toISOString(),
            });
          }
        } else {
          // Invalid mesa
          this.consecutiveInvalid += 1;
          this.progress.mesasInvalidas += 1;
          
          if (!this.db.errores.mesasInvalidas.includes(codigoMesa)) {
            this.db.errores.mesasInvalidas.push(codigoMesa);
          }
          
          this.log(
            `Mesa ${codigoMesa} - Inválida ` +
            `(${this.consecutiveInvalid}/${CONSECUTIVE_INVALID_THRESHOLD})`
          );
          this.saveDatabase();
        }

        // Update summary total (mesas procesadas + inválidas)
        this.db.summary.totalMesas = this.progress.totalMesasProcessadas + this.progress.mesasInvalidas;
        this.db.summary.mesasInexistentes = this.progress.mesasInvalidas;

        currentNum += 1;
      }

      // Calculate percentages
      if (this.db.summary.totalVotosValidos > 0) {
        for (const party of Object.values(this.db.partidos)) {
          party.porcentaje = (party.totalVotos / this.db.summary.totalVotosValidos) * 100;
        }
      }

      this.db.metadata.status = 'completed';
      this.saveDatabase();
      this.saveProgress();

      this.log('=== Script completado exitosamente ===');
      this.log(
        `Total mesas procesadas: ${this.progress.totalMesasProcessadas}, ` +
        `Mesas inválidas: ${this.progress.mesasInvalidas}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`=== ERROR FATAL: ${errorMsg} ===`);
      this.db.metadata.status = 'failed';
      this.saveDatabase();
      this.saveProgress();
      throw error;
    }
  }
}

// Main execution
const forceRestart = process.argv.includes('--force');
const script = new BulkDataScript(forceRestart);
script.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
