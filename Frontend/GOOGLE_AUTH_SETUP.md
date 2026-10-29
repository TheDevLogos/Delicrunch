# Configurar Google Sign-In en Delicrunch

El inicio web usa el botón oficial de Google Identity Services. Android e iOS usan el módulo nativo `@react-native-google-signin/google-signin`; Expo Go no incluye este módulo, así que se necesita una compilación de desarrollo o de distribución.

El backend verifica la firma, audiencia y vigencia del ID token de Google. Solo el correo configurado en `GOOGLE_ADMIN_EMAIL` obtiene el rol administrador, y Google debe marcar ese correo como verificado.

## Configuración común

En Google Auth Platform, el proyecto `Delicrunch` ya tiene un cliente web. Su origen autorizado de producción es `https://delicrunch.vercel.app`. La app está en modo de prueba; agrega como usuario de prueba el correo administrador confirmado antes de iniciar sesión.

En Render, configura estas variables en el servicio de la API:

```text
GOOGLE_CLIENT_IDS=<ID-de-cliente-web>[,<ID-de-cliente-iOS-si-se-necesita>]
GOOGLE_ADMIN_EMAIL=<correo-administrador-confirmado>
```

`GOOGLE_CLIENT_IDS` debe contener solo las audiencias que realmente entrega el flujo nativo o web. No agregues el secreto OAuth aquí. Después de cambiar las variables del backend, vuelve a desplegar el servicio.

## Android

El paquete es `com.delicrunch.app`. Google Cloud necesita un cliente OAuth Android por cada certificado con el que se instale la app:

- Para builds directos de EAS, usa el SHA-1 del certificado de EAS.
- Para builds descargados desde Google Play, usa el SHA-1 de **Clave de firma de la app** en Play Console. No uses el certificado de subida de EAS para ese cliente.

El cliente web se pasa como `webClientId` para que Google emita un token destinado al backend. No se necesita `google-services.json` para Google Sign-In.

## iOS

El identificador de paquete es `com.delicrunch.app`. Crea un cliente OAuth iOS para ese identificador, configura `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` en el entorno EAS correspondiente y vuelve a compilar la app. La configuración Expo agrega el esquema inverso que requiere el callback nativo.

## Acceso de administrador

El correo se debe confirmar antes de añadirlo a los usuarios de prueba y a `GOOGLE_ADMIN_EMAIL`. En el primer acceso Google correcto, el backend asignará el rol de administrador, reemplazará cualquier contraseña anterior por un valor aleatorio no recuperable y retirará el rol a otros administradores. Los tokens antiguos de administrador dejarán de autorizar opciones administrativas.
