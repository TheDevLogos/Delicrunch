#!/bin/bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
export NODE_ENV=production
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [ ! -d "$ANDROID_HOME/platforms" ]; then
  echo "No se encontró el SDK en $ANDROID_HOME. Abre Android Studio e instala el SDK."
  exit 1
fi
command -v java >/dev/null || { echo 'Instala o configura Java 17.'; exit 1; }
command -v python3 >/dev/null || { echo 'Se requiere python3.'; exit 1; }
SIGNING_ENV="${DELICRUNCH_SIGNING_ENV:-$HOME/Documents/Codex/Delicrunch-Signing/load-signing-env.sh}"
if [ -f "$SIGNING_ENV" ]; then source "$SIGNING_ENV"; fi
if [ -z "${DELICRUNCH_UPLOAD_KEYSTORE:-}" ]; then
  read -r -p 'Ruta del keystore de carga vigente: ' DELICRUNCH_UPLOAD_KEYSTORE
fi
if [ -z "${DELICRUNCH_UPLOAD_KEY_ALIAS:-}" ]; then
  read -r -p 'Alias de la clave de carga vigente: ' DELICRUNCH_UPLOAD_KEY_ALIAS
fi
if [ -z "${DELICRUNCH_UPLOAD_STORE_PASSWORD:-}" ]; then
  read -r -s -p 'Contraseña del almacén: ' DELICRUNCH_UPLOAD_STORE_PASSWORD; printf '\n'
fi
if [ -z "${DELICRUNCH_UPLOAD_KEY_PASSWORD:-}" ]; then
  read -r -s -p 'Contraseña de la clave: ' DELICRUNCH_UPLOAD_KEY_PASSWORD; printf '\n'
fi
export DELICRUNCH_UPLOAD_KEYSTORE DELICRUNCH_UPLOAD_KEY_ALIAS DELICRUNCH_UPLOAD_STORE_PASSWORD DELICRUNCH_UPLOAD_KEY_PASSWORD
[ -f "$DELICRUNCH_UPLOAD_KEYSTORE" ] || { echo 'No se encontró el keystore.'; exit 1; }
EXPECTED='5CD006037A1B7324AD81CAB90FC867E338AECDCF'
ACTUAL="$(keytool -exportcert -keystore "$DELICRUNCH_UPLOAD_KEYSTORE" -alias "$DELICRUNCH_UPLOAD_KEY_ALIAS" -storepass:env DELICRUNCH_UPLOAD_STORE_PASSWORD | openssl x509 -inform DER -noout -fingerprint -sha1 | sed 's/.*=//' | tr -d ':[:space:]')"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "El certificado no coincide con la última clave de carga confirmada (5C:D0:06…). Se detuvo la compilación."
  exit 1
fi
npm ci --no-audit --no-fund
npx expo prebuild --platform android --no-install
python3 - <<'PY'
from pathlib import Path
p=Path('android/app/build.gradle')
s=p.read_text()
marker='// DELICRUNCH_INTERNAL_SIGNING'
if marker in s: s=s.split(marker)[0]
s+='''\n// DELICRUNCH_INTERNAL_SIGNING
android {
    signingConfigs {
        delicrunchInternal {
            storeFile file(System.getenv("DELICRUNCH_UPLOAD_KEYSTORE"))
            storePassword System.getenv("DELICRUNCH_UPLOAD_STORE_PASSWORD")
            keyAlias System.getenv("DELICRUNCH_UPLOAD_KEY_ALIAS")
            keyPassword System.getenv("DELICRUNCH_UPLOAD_KEY_PASSWORD")
        }
    }
    buildTypes {
        release { signingConfig signingConfigs.delicrunchInternal }
    }
}
'''
p.write_text(s)
PY
(cd android && bash ./gradlew --no-daemon bundleRelease)
BUNDLE="$PWD/android/app/build/outputs/bundle/release/app-release.aab"
VERIFY_LOG="$(mktemp)"
trap 'rm -f "$VERIFY_LOG"' EXIT
LC_ALL=C jarsigner -verify "$BUNDLE" > "$VERIFY_LOG" 2>&1
if ! rg -q 'jar verified' "$VERIFY_LOG" 2>/dev/null; then
  if ! grep -q 'jar verified' "$VERIFY_LOG"; then cat "$VERIFY_LOG"; exit 1; fi
fi
BUNDLE_SHA="$(keytool -printcert -jarfile "$BUNDLE" | sed -n 's/.*SHA1: //p' | head -1 | tr -d ':[:space:]')"
[ "$BUNDLE_SHA" = "$EXPECTED" ] || { echo 'La firma final no coincide.'; exit 1; }
mkdir -p release
cp "$BUNDLE" release/Delicrunch-1.1.2-codigo-6.aab
printf '\nAAB firmado: %s\nSHA1: %s\n' "$PWD/release/Delicrunch-1.1.2-codigo-6.aab" "$BUNDLE_SHA"
open "$PWD/release"
