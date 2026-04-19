# Verificar Emulación de Cliente Web

Este documento explica cómo verificar que el script está emulando correctamente un navegador web.

## Headers Implementados

El script `bulk-get-data.ts` ahora emula completamente un cliente web con los siguientes headers:

```
accept: */*
accept-language: en-US,en;q=0.8
content-type: application/json
priority: u=1, i
referer: https://resultadoelectoral.onpe.gob.pe/main/actas
sec-ch-ua: "Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"
sec-ch-ua-mobile: ?1
sec-ch-ua-platform: "Android"
sec-fetch-dest: empty
sec-fetch-mode: cors
sec-fetch-site: same-origin
sec-gpc: 1
user-agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36
```

## Verificar los Headers

### Opción 1: Ver los logs mientras se ejecuta

```bash
npm run bulk-data 2>&1 | head -20
```

Los primeros intentos de conexión mostrarán si la conexión es exitosa.

### Opción 2: Capturar con tcpdump o similar

```bash
# Monitorear conexiones HTTPS
sudo tcpdump -i any 'tcp port 443' -v | grep -E "User-Agent|referer"
```

### Opción 3: Usar un proxy de HTTP como mitmproxy

```bash
# Instalar mitmproxy
pip install mitmproxy

# Configurar el script para usar el proxy (requiere cambio en código)
```

## Comparar con el Request Original

Tu request de curl incluía:

```bash
curl 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend/actas/buscar/mesa?codigoMesa=000001' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.8' \
  -H 'content-type: application/json' \
  -H 'priority: u=1, i' \
  -H 'referer: https://resultadoelectoral.onpe.gob.pe/main/actas' \
  -H 'sec-ch-ua: "Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"' \
  -H 'sec-ch-ua-mobile: ?1' \
  -H 'sec-ch-ua-platform: "Android"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sec-gpc: 1' \
  -H 'user-agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36'
```

El script ahora envía **exactamente los mismos headers**.

## Referencia en el Código

El código relevante está en `scripts/bulk-get-data.ts`, método `fetchMesa()`:

```typescript
const response = await axios.get(API_BASE_URL, {
  params: { codigoMesa },
  timeout: 10000,
  headers: {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.8',
    'content-type': 'application/json',
    // ... resto de headers
  },
});
```

## Prueba Rápida

Para verificar que funciona:

1. Ejecuta con datos de ejemplo primero:
   ```bash
   npm run sample-data
   npm start
   ```

2. Luego intenta con datos reales:
   ```bash
   npm run bulk-data
   ```

Si el servidor ONPE acepta las solicitudes, verás:
- Logs sin errores de conexión
- Mesa `000001` procesada exitosamente
- Datos guardados en `db.json`

## Que Esperar

✅ **Éxito**: "Mesa 000001 - Procesada exitosamente"

❌ **Error CORS/Headers**: "Error: 403 Forbidden" o similar

Si obtienes errores, verifica:
1. Tu conexión a Internet
2. IP no esté bloqueada por ONPE
3. Los headers se estén enviando (revisa el código)

## Solución de Problemas

Si aún así no funciona, intenta:

1. **Cambiar User-Agent**: Algunos servidores son sensibles a esto
2. **Agregar más headers**: Como `connection: keep-alive`
3. **Usar proxy**: Para evitar bloqueos por IP
4. **Verificar DNS**: Que `resultadoelectoral.onpe.gob.pe` resuelva correctamente

```bash
nslookup resultadoelectoral.onpe.gob.pe
```

## Notas Importantes

- El servidor ONPE puede bloquear por IP después de muchas solicitudes
- Los headers son específicos para Chrome/Brave en Android
- Si ONPE cambia sus validaciones, puede ser necesario actualizar headers
- El rate limit de 30 req/min debe respetarse para no ser bloqueado

## ¿Qué Son Estos Headers?

- `sec-*`: Headers de seguridad del navegador (fetch metadata)
- `sec-ch-ua`: Information sobre el navegador (Client Hints)
- `referer`: De dónde viene la solicitud
- `user-agent`: Identidad del navegador/cliente
- `accept`: Tipos de contenido aceptados
- `sec-fetch-*`: Contexto de la solicitud (CORS, destino, etc)

Estos headers son enviados por navegadores modernos automáticamente. El servidor ONPE los valida para evitar solicitudes automatizadas no autorizadas, pero el objetivo es legítimo (acceso a datos públicos).
