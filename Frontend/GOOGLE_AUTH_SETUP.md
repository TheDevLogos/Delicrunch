# Configurar Google Sign-In en Delicrunch

El inicio web usa el botón oficial de Google Identity Services. Android e iOS usan el módulo nativo `@react-native-google-signin/google-signin`; Expo Go no incluye este módulo, así que se necesita una compilación de desarrollo o de distribución.

El backend verifica la firma, audiencia y vigencia del ID token de Google. Solo el correo configurado en `GOOGLE_ADMIN_EMAIL` obtiene el rol administrador, y Google debe marcar ese correo como verificado.

## Configuración común

En Google Auth Platform, conserva un solo origen web autorizado: `https://delicrunch.vercel.app`. No agregues dominios de vista previa de Vercel; los inicios de sesión de Google se prueban desde el dominio estable. La app está en modo de prueba; agrega como usuario de prueba el correo administrador confirmado antes de iniciar sesión.

En Render, configura estas variables en el servicio de la API:

```text
GOOGLE_CLIENT_IDS=<ID-de-cliente-web>[,<ID-de-cliente-iOS-si-se-necesita>]
GOOGLE_ADMIN_EMAIL=<correo-administrador-confirmado>
```

`GOOGLE_CLIENT_IDS` debe contener solo las audiencias que realmente entrega el flujo nativo o web. No agregues el secreto OAuth aquí. Después de cambiar las variables del backend, vuelve a desplegar el servicio.

## Android

El paquete es `com.delicrunch.app`. Google Cloud necesita un cliente OAuth Android por cada certificado con el que se instale la app:

- Para instalaciones desde una pista de Google Play, usa el SHA-1 de **Clave de firma de la app** en Play Console. Play vuelve a firmar los AAB con ese certificado antes de distribuirlos.
- La clave de subida local solo sirve para subir el AAB; no sustituye la clave de firma de Play. Si instalas un APK local directamente en un dispositivo, registra también el SHA-1 de esa clave local.

El cliente web se pasa como `webClientId` para que Google emita un token destinado al backend. `google-services.json` se usa para Firebase/FCM, no para Google Sign-In.

## iOS

El identificador de paquete es `com.delicrunch.app`. Si se prepara una compilación de iOS, define `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` en el entorno local antes de compilar. La configuración Expo agrega el esquema inverso que requiere el callback nativo.

## Acceso de administrador

El correo se debe confirmar antes de añadirlo a los usuarios de prueba y a `GOOGLE_ADMIN_EMAIL`. En el primer acceso Google correcto, el backend asignará el rol de administrador, reemplazará cualquier contraseña anterior por un valor aleatorio no recuperable y retirará el rol a otros administradores. Los tokens antiguos de administrador dejarán de autorizar opciones administrativas.

## Compilación sin EAS Build

La web se exporta con `npm run build:web` y Vercel publica `dist`. Android se genera con `npx expo prebuild` y se compila en Gradle local; consulta [LOCAL_BUILD.md](LOCAL_BUILD.md). El `projectId` de Expo que permanece en la configuración se usa para enrutar tokens de push y no ejecuta EAS Build.
