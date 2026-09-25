# Variables de entorno de Delicrunch

Esta guía describe **nombres** de variables. Los valores reales se configuran directamente en Vercel, Render o Supabase; nunca se guardan aquí ni se envían por chat. Si alguna credencial real estuvo en GitHub, quitarla del archivo no basta: hay que revocarla/rotarla y actualizar el servicio que la usa.

## Vercel — Frontend

Configura en el proyecto Vercel, para Preview y Production según corresponda:

- `EXPO_PUBLIC_API_URL`: URL base de la API de Render, con `/api`.
- `EXPO_PUBLIC_SUPABASE_URL`: URL pública del proyecto Supabase.
- `EXPO_PUBLIC_SUPABASE_KEY`: clave publishable/anon de Supabase. Nunca usar la clave secreta o `service_role`.
- `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY`: clave pública de Mercado Pago, solo si la interfaz la necesita.
- `EXPO_PUBLIC_APP_SCHEME`: esquema de enlaces de la app, si se usa.

Build: `cd Frontend && npm ci`. Configura el comando de build indicado por el proyecto Expo/Vercel.

## Render — Backend

Define estas variables en **Render → Environment**. No las copies a Vercel ni al código del navegador:

- `DATABASE_URL`: conexión de Postgres de Supabase para el backend.
- `SUPABASE_URL`: URL del proyecto.
- `SUPABASE_SERVICE_KEY`: clave secreta de Supabase usada exclusivamente por servidor.
- `JWT_SECRET`: secreto de firma de los JWT propios de la API.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: configuración de correo si la función está habilitada.
- `MERCADOPAGO_ACCESS_TOKEN`: token privado, solo si pagos están habilitados.
- `GOOGLE_ADMIN_EMAIL`: correo exacto que recibirá el rol administrador al registrarse con Google OAuth.
- `FRONTEND_URL`, `BACKEND_URL`, `APP_SCHEME` y `PORT`: orígenes y puerto del servicio según el despliegue.

Build: `cd Backend && npm ci`. Start: `cd Backend && npm start`.

## Supabase Auth — Google

Configura Client ID y Client Secret en Supabase → Authentication → Sign In / Providers → Google. No los guardes en variables públicas ni en el repositorio. Autoriza el origen de producción en Google Cloud y registra como redirect URI el callback exacto que muestra el panel de Supabase. En Supabase URL Configuration permite la URL de la aplicación.

## Rotación de credenciales expuestas

El repositorio es público y una versión de este documento incluyó valores que parecen credenciales de base de datos, Supabase, JWT, correo y pagos. Considera esos valores comprometidos:

1. Cambia la contraseña de Postgres en Supabase y actualiza `DATABASE_URL` en Render.
2. Rota la clave secreta de Supabase siguiendo la estrategia de claves del proyecto; actualiza Render y confirma qué servicios siguen usando la clave anterior antes de revocarla.
3. Cambia `JWT_SECRET`; las sesiones firmadas con la clave anterior dejarán de ser válidas y los usuarios tendrán que iniciar sesión otra vez.
4. Revoca y vuelve a emitir la credencial SMTP/app password y el token privado de Mercado Pago; actualiza Render.
5. Retira los valores del historial Git según la política del repositorio. La rotación sigue siendo necesaria porque quitar un secreto de la rama actual no elimina las copias históricas.
6. Comprueba los logs de acceso/proveedor y verifica health check, login, pagos y correo tras actualizar.

Coordina los cambios de DB y claves con la actualización de Render para evitar dejar la API sin conexión. Nunca publiques los valores nuevos en issues, commits o chats.

## Verificación de despliegue

1. Comprueba la salud de Render en la ruta de health configurada por el backend.
2. Comprueba que el frontend desplegado conecta a la API.
3. Comprueba autenticación y, cuando estén activados, correo y pagos.
4. Mantén las claves privadas solo en Render/Supabase; en el navegador solo van URL y claves publishable con permisos mínimos.
