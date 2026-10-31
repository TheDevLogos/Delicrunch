#!/usr/bin/env bash
set -Eeuo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$FRONTEND_DIR"

if [[ -z "${ANDROID_HOME:-}" && -d "$HOME/Library/Android/sdk" ]]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
if [[ -z "${ANDROID_SDK_ROOT:-}" && -n "${ANDROID_HOME:-}" ]]; then
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
fi

if [[ -n "${DELICRUNCH_UPLOAD_KEYSTORE:-}" && "$DELICRUNCH_UPLOAD_KEYSTORE" != /* ]]; then
  export DELICRUNCH_UPLOAD_KEYSTORE="$FRONTEND_DIR/$DELICRUNCH_UPLOAD_KEYSTORE"
fi

# Distribution uses Android device ABIs. Emulator ABIs can be requested via the
# environment for local development, but are omitted from the default Play build.
DELICRUNCH_ANDROID_ARCHITECTURES="${DELICRUNCH_ANDROID_ARCHITECTURES:-armeabi-v7a,arm64-v8a}"

./scripts/verify-build-requirements.sh

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Instalando dependencias fijadas por package-lock.json..."
  npm ci
fi

echo "Generando el proyecto nativo de Android desde la configuración Expo..."
npm run prebuild:android

echo "Creando el AAB firmado para Google Play con Gradle local ($DELICRUNCH_ANDROID_ARCHITECTURES)..."
(cd "$FRONTEND_DIR/android" && ./gradlew --no-daemon "-PreactNativeArchitectures=$DELICRUNCH_ANDROID_ARCHITECTURES" :app:bundleRelease)

ARTIFACT="$FRONTEND_DIR/android/app/build/outputs/bundle/release/app-release.aab"
if [[ ! -s "$ARTIFACT" ]]; then
  echo "No se encontró el AAB esperado: $ARTIFACT" >&2
  exit 1
fi

if ! jarsigner -verify "$ARTIFACT" >/dev/null 2>&1; then
  echo "El AAB no tiene una firma válida. No lo subas a Google Play." >&2
  exit 1
fi

echo "AAB firmado y verificado: $ARTIFACT"
