# Desarrollo y compilación de Delicrunch

## Desarrollo visual con Expo Go

Expo Go sirve para iterar pantallas y navegación. Google Sign-In nativo y las notificaciones push requieren una app nativa instalada.

```bash
cd Frontend
npm ci
npx expo start
```

## Web para Vercel

Desde `Frontend`, ejecuta `npm run build:web`. Expo crea `Frontend/dist`; la configuración del proyecto Vercel usa esa carpeta como salida. Los despliegues conectados a GitHub se generan desde el repositorio y no requieren EAS.

## Android para Google Play

Android se genera con Expo Prebuild y se compila en la máquina local con Gradle. No requiere EAS Build ni una compilación en la nube.

Antes de compilar, configura localmente estas variables con la misma clave de subida que ya acepta Play Console:

- `DELICRUNCH_UPLOAD_KEYSTORE`: ruta absoluta al archivo de clave.
- `DELICRUNCH_UPLOAD_STORE_PASSWORD`: contraseña del almacén.
- `DELICRUNCH_UPLOAD_KEY_ALIAS`: alias de la clave.
- `DELICRUNCH_UPLOAD_KEY_PASSWORD`: contraseña de la clave.

Mantén el archivo de clave y sus contraseñas fuera del repositorio. Luego ejecuta:

```bash
cd Frontend
npm ci
npm run build:android
```

El AAB firmado aparece en `Frontend/android/app/build/outputs/bundle/release/app-release.aab`. El script comprueba que la firma sea válida. Google Play debe aceptar la clave de subida registrada; Play firma de nuevo el paquete con la clave de firma de la app.

Si la clave de subida sigue guardada en un servicio anterior, expórtala una sola vez y consérvala de forma segura para las compilaciones locales futuras. Si se perdió, solicita a Google Play Console restablecer la clave de subida antes de intentar una carga nueva.

## Identificadores y permisos

- Paquete Android: `com.delicrunch.app`.
- Ubicación aproximada y precisa: para encontrar comercios cercanos.
- Notificaciones: se solicitan al usuario para pedidos y novedades.
- Cámara, audio, almacenamiento compartido y alarmas exactas: bloqueados porque la app no los necesita.
- El ID de proyecto Expo se mantiene únicamente para enrutar tokens del servicio de push; no invoca EAS Build.
