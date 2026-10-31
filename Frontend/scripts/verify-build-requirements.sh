#!/usr/bin/env bash
set -Eeuo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$FRONTEND_DIR"
ERRORS=0

fail() {
  printf '✗ %s\n' "$1" >&2
  ERRORS=$((ERRORS + 1))
}

pass() {
  printf '✓ %s\n' "$1"
}

for tool in node npm java keytool; do
  if command -v "$tool" >/dev/null 2>&1; then
    pass "$tool está instalado"
  else
    fail "Falta $tool en PATH"
  fi
done

if [[ -z "${ANDROID_HOME:-}" || ! -d "$ANDROID_HOME" ]]; then
  fail "Configura ANDROID_HOME con la ruta del Android SDK"
else
  pass "Android SDK disponible"
  for sdk_component in \
    "platforms/android-36/android.jar" \
    "build-tools/36.0.0/aapt2" \
    "ndk/27.1.12297006"; do
    if [[ -e "$ANDROID_HOME/$sdk_component" ]]; then
      pass "Componente Android instalado: $sdk_component"
    else
      fail "Falta $sdk_component. Instálalo desde Android Studio > SDK Manager antes de compilar."
    fi
  done
fi

if [[ -z "${DELICRUNCH_UPLOAD_KEYSTORE:-}" || ! -r "${DELICRUNCH_UPLOAD_KEYSTORE:-}" ]]; then
  fail "DELICRUNCH_UPLOAD_KEYSTORE debe apuntar al archivo de clave de subida registrado en Play Console"
fi
for name in DELICRUNCH_UPLOAD_STORE_PASSWORD DELICRUNCH_UPLOAD_KEY_ALIAS DELICRUNCH_UPLOAD_KEY_PASSWORD; do
  if [[ -z "${!name:-}" ]]; then
    fail "$name debe estar configurada en el entorno local"
  fi
done
if [[ -n "${DELICRUNCH_UPLOAD_KEYSTORE:-}" && -r "$DELICRUNCH_UPLOAD_KEYSTORE" \
  && -n "${DELICRUNCH_UPLOAD_STORE_PASSWORD:-}" \
  && -n "${DELICRUNCH_UPLOAD_KEY_ALIAS:-}" \
  && -n "${DELICRUNCH_UPLOAD_KEY_PASSWORD:-}" ]]; then
  if keytool -list -keystore "$DELICRUNCH_UPLOAD_KEYSTORE" \
    -alias "$DELICRUNCH_UPLOAD_KEY_ALIAS" \
    -storepass:env DELICRUNCH_UPLOAD_STORE_PASSWORD >/dev/null 2>&1; then
    pass "La clave local y el alias se pueden abrir"
  else
    fail "No se pudo abrir el alias de la clave de subida; revisa la ruta, alias y contraseña"
  fi
fi

if [[ ! -f "$FRONTEND_DIR/package-lock.json" ]]; then
  fail "Falta package-lock.json"
fi

if [[ "$ERRORS" -gt 0 ]]; then
  printf '\nFaltan %s requisitos. No se generó ningún AAB.\n' "$ERRORS" >&2
  exit 1
fi

printf '\nRequisitos locales listos para crear el AAB.\n'
