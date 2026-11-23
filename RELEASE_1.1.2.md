# Delicrunch 1.1.2 (proposed Android version code 6)

Based on 1.1.1, commit 12fb3c3. Confirm that versionCode 6 is unused in Google Play before uploading.

Changes: pre-login buyer/merchant selection, visit request form, persistent administrator inbox and pending badge, shared marketplace brand colors in administration and merchant screens.

Before releasing the Android app:
1. Apply the additive migration with `cd Backend && node db/migrate-business-visits.js` using the existing production DATABASE_URL environment. The table uses row level security and is accessed only through the backend with admin authorization.
2. Deploy Backend with the new /api/business-visits routes.
3. Verify a request can be sent, appears only in an administrator account, and can be marked contacted/scheduled/closed. Verify non-admin sessions cannot read requests.
4. Build an AAB with the currently accepted Google Play upload key. This checkout does not contain the upload keystore or production database credentials. Use the existing local signing setup, or the production EAS profile with verified credentials. Do not commit secrets.
5. Upload the signed AAB to the existing closed Alpha track and confirm release review status.

Validation performed: Android production JS/Hermes export (1118 modules) succeeded; changed JS/JSX files parse; backend files pass node --check. A signed native AAB and end-to-end production database test remain pending.

Release notes (es-MX):
Elige cómo participar con Deli antes de iniciar sesión. Solicita una visita a tu negocio y recibe seguimiento. Mejoramos la imagen de comercio y administración y agregamos un buzón para gestionar visitas.
