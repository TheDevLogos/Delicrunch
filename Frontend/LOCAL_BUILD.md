# Compilar Delicrunch sin EAS Build

## Web en Vercel

Desde `Frontend`, `npm run build:web` exporta la aplicación Expo para web en `dist`. `vercel.json` fija el comando de construcción y esa carpeta de salida; el proyecto Vercel debe conservar `Frontend` como directorio raíz.

El proyecto está enlazado con GitHub y el dominio estable es `https://delicrunch.vercel.app`. Las ramas de trabajo deben revisarse en una vista previa antes de llegar a `main`; no se requiere `eas deploy`.

## Android para Google Play

### Requisitos

- Android Studio y Android SDK configurados (`ANDROID_HOME`).
- Android SDK Platform 36, Build Tools 36.0.0 y NDK 27.1.12297006 instalados en paralelo desde SDK Manager.
- Java compatible con el Gradle de Expo SDK 54 (JDK 17).
- La clave de subida que Play Console ya reconoce para `com.delicrunch.app`.

No cambies ni regeneres la clave de firma de la app de Play. Google administra esa clave y la usa para firmar las instalaciones. La clave local de subida solo autoriza a enviar nuevas versiones.

### Proteger la clave de subida

Guarda el archivo fuera del repositorio y configura estas variables solo en la sesión de Terminal. No las escribas en `.env`, GitHub, archivos compartidos ni en el código:

```bash
export DELICRUNCH_UPLOAD_KEYSTORE="/ruta/segura/clave-de-subida.jks"
export DELICRUNCH_UPLOAD_STORE_PASSWORD="contraseña-del-almacen"
export DELICRUNCH_UPLOAD_KEY_ALIAS="alias-de-la-clave"
export DELICRUNCH_UPLOAD_KEY_PASSWORD="contraseña-de-la-clave"
```

Si Expo conserva la clave de subida actual, se puede exportar una sola vez y reutilizarla localmente; eso no requiere usar EAS Build. Si no existe una copia válida, primero solicita el restablecimiento de la clave de subida en Play Console y espera a que Google lo apruebe.

### Crear el AAB

```bash
cd Frontend
npm ci
npm run build:android
```

El flujo genera Android con Expo Prebuild, compila el módulo `app` con Gradle y verifica la firma. Para el AAB de Play incluye por defecto ARM de 32 y 64 bits (`armeabi-v7a,arm64-v8a`); omite x86, que solo se necesita para emuladores. Para una compilación local de emulador se puede definir `DELICRUNCH_ANDROID_ARCHITECTURES` antes de ejecutar el script. El archivo queda en:

```text
Frontend/android/app/build/outputs/bundle/release/app-release.aab
```

En esta versión el paquete es `com.delicrunch.app`, el nombre de versión es `1.1.1`, el código de versión es `5` y el objetivo es Android API 36. La compilación preparada es para la pista de prueba de Google Play; no se publica automáticamente.

### Revisar antes de cargar

- Confirma en Play Console que el AAB usa la clave de subida registrada.
- Instala desde la pista de Play para que Google Sign-In utilice la clave de firma de Play ya registrada en Google Cloud.
- Revisa los permisos incluidos en el manifiesto resultante. La app necesita ubicación para comercios cercanos y permiso de notificaciones para pedidos; no necesita cámara, micrófono, almacenamiento compartido ni alarmas exactas.
- En Play Console, completa ficha de tienda, clasificación de contenido, público objetivo, seguridad de datos, declaración de anuncios y otras declaraciones de contenido.
- Corrige las URL públicas de privacidad y eliminación de cuenta antes de solicitar revisión.
- Mantén la app en una prueba interna/cerrada hasta completar las condiciones de la cuenta personal; esta compilación no se envía a producción por sí sola.

## Expo Push

El proyecto conserva el identificador Expo usado para obtener y enrutar tokens del servicio de notificaciones push. Esa configuración no compila ni publica la app en EAS. Los paquetes web y Android se generan localmente/Vercel.
