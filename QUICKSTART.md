# Guía Rápida de Inicio

## En 5 minutos

### 1. Verificar instalación ✅

Las dependencias ya están instaladas. Verifica con:

```bash
npm list express axios
```

### 2. Opción A: Usar Datos de Ejemplo (RECOMENDADO para probar)

Si solo quieres ver la interfaz funcionando sin esperar a que se recopilen datos:

```bash
npm run sample-data
npm start
```

Abre http://localhost:3000 en tu navegador.

### 2. Opción B: Recopilar Datos Reales de ONPE

Si quieres datos reales (esto puede tomar tiempo):

En una terminal:
```bash
npm run bulk-data
```

Mientras se recopilan datos, en otra terminal:
```bash
npm start
```

Abre http://localhost:3000 en tu navegador.

## Estado de Ejecución

### Monitorear el script de recopilación

Mientras se ejecuta `npm run bulk-data`, puedes ver el progreso en otra terminal:

```bash
# Ver logs en tiempo real
tail -f logs.txt

# Ver progreso guardado
cat .cache/.progress
```

### Detener y continuar

- `Ctrl+C` para detener el script
- `npm run bulk-data` para continuar desde donde se paró
- `npm run bulk-data:force` para empezar desde cero

## API Disponible

Una vez que tengas datos (ejemplo o real), la API está disponible en:

- http://localhost:3000/api/summary - Resumen general
- http://localhost:3000/api/partidos - Votos por partido
- http://localhost:3000/api/mesas - Datos de todas las mesas
- http://localhost:3000/api/regiones - Datos por región
- http://localhost:3000/api/metadata - Info de ejecución
- http://localhost:3000/api/errores - Errores encontrados

## Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| "Database not found" | Ejecuta `npm run sample-data` o `npm run bulk-data` |
| Port 3000 ocupado | `PORT=3001 npm start` |
| Script se ve lento | Es normal, respeta rate limit de 30 req/min |
| Quiero ver datos diferentes | `npm run bulk-data:force` para empezar de nuevo |

## Archivos Importantes

- `db.json` - Tu base de datos (se crea automáticamente)
- `logs.txt` - Registro de todo lo que hace el script
- `.cache/.progress` - Progreso del script (para continuar)
- `data.md` - Documentación de la estructura de datos

## Próximos Pasos

Después de probar:

1. **Entender la estructura de datos**: Lee `data.md`
2. **Configurar rate limit**: Edita `config.json` o `scripts/bulk-get-data.ts`
3. **Integrar con otro sistema**: Usa la API REST
4. **Personalizar interfaz**: Edita `public/index.html`

## Datos de Ejemplo Incluidos

El script `npm run sample-data` crea una BD con:
- 10 mesas de ejemplo
- 9 partidos políticos
- Datos de región LIMA
- 1,340 votos válidos

Perfecto para probar sin esperar a la recopilación real.
