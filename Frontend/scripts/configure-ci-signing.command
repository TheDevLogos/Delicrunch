#!/bin/bash
# Run on the Mac that holds the current upload key. Secrets travel to GitHub via stdin.
set -euo pipefail
umask 077
REPOSITORY='TheDevLogos/Delicrunch'
EXPECTED='5ADEA5490EB3C2C22547FB49D3CDA7DAA2BF5AD987B35016DC2D4E179DC338FD'
for tool in gh keytool openssl; do
  command -v "$tool" >/dev/null || { echo "Falta $tool. Para instalar GitHub CLI: brew install gh"; exit 1; }
done
if ! gh auth status >/dev/null 2>&1; then
  gh auth login --hostname github.com --git-protocol https --web
fi
gh api "repos/$REPOSITORY" --jq '.permissions.admin' | grep -qx true || { echo 'La cuenta de GitHub debe administrar TheDevLogos/Delicrunch.'; exit 1; }
DEFAULT_KEY="$HOME/Documents/Codex/Delicrunch-Signing/Delicrunch-upload-20261107-v2.jks"
printf 'Archivo de clave vigente [%s]: ' "$DEFAULT_KEY"
read -r CHOSEN_KEY
KEYSTORE="${CHOSEN_KEY:-$DEFAULT_KEY}"
[ -f "$KEYSTORE" ] || { echo 'No se encontró el archivo. Ejecuta de nuevo e indica la ruta correcta.'; exit 1; }
printf 'Alias [delicrunch-upload-v2]: '
read -r CHOSEN_ALIAS
KEY_ALIAS="${CHOSEN_ALIAS:-delicrunch-upload-v2}"
read -r -s -p 'Contraseña del almacén: ' DELICRUNCH_UPLOAD_STORE_PASSWORD
printf '\n'
read -r -s -p 'Contraseña de la clave: ' DELICRUNCH_UPLOAD_KEY_PASSWORD
printf '\n'
export DELICRUNCH_UPLOAD_STORE_PASSWORD DELICRUNCH_UPLOAD_KEY_PASSWORD
TEMP_SIGNING="$(mktemp -d)"
trap 'rm -rf "$TEMP_SIGNING"; unset DELICRUNCH_UPLOAD_STORE_PASSWORD DELICRUNCH_UPLOAD_KEY_PASSWORD' EXIT
keytool -exportcert -keystore "$KEYSTORE" -alias "$KEY_ALIAS" -storepass:env DELICRUNCH_UPLOAD_STORE_PASSWORD > "$TEMP_SIGNING/cert.der"
ACTUAL="$(openssl x509 -inform DER -in "$TEMP_SIGNING/cert.der" -noout -fingerprint -sha256 | cut -d= -f2 | tr -d ':[:space:]')"
[ "$ACTUAL" = "$EXPECTED" ] || { echo 'La clave seleccionada no coincide con la clave de carga vigente de Google Play (5C:D0:06…). No se modificó ningún secreto.'; exit 1; }
# Confirm the private key password works without modifying the source keystore.
STORE_TYPE="$(keytool -list -keystore "$KEYSTORE" -storepass:env DELICRUNCH_UPLOAD_STORE_PASSWORD -J-Duser.language=en | sed -n 's/^Keystore type: //p' | head -1)"
if [ "$STORE_TYPE" = PKCS12 ] && [ "$DELICRUNCH_UPLOAD_STORE_PASSWORD" != "$DELICRUNCH_UPLOAD_KEY_PASSWORD" ]; then
  echo 'Este almacén PKCS12 requiere la misma contraseña para almacén y clave. No se modificó ningún secreto.'
  exit 1
fi
# keytool import reads the private key using its supplied password; destination is disposable.
CHECK_PASSWORD="$(openssl rand -hex 24)"
export CHECK_PASSWORD
keytool -importkeystore -srckeystore "$KEYSTORE" -srcalias "$KEY_ALIAS" -srcstorepass:env DELICRUNCH_UPLOAD_STORE_PASSWORD -srckeypass:env DELICRUNCH_UPLOAD_KEY_PASSWORD -destkeystore "$TEMP_SIGNING/verify.p12" -deststoretype PKCS12 -deststorepass:env CHECK_PASSWORD -noprompt >/dev/null 2>&1 || { echo 'No se pudo abrir la clave privada. Revisa las contraseñas. No se modificó ningún secreto.'; exit 1; }
unset CHECK_PASSWORD
base64 < "$KEYSTORE" | tr -d '\r\n' | gh secret set DELICRUNCH_UPLOAD_KEYSTORE_BASE64 --repo "$REPOSITORY"
printf '%s' "$KEY_ALIAS" | gh secret set DELICRUNCH_UPLOAD_KEY_ALIAS --repo "$REPOSITORY"
printf '%s' "$DELICRUNCH_UPLOAD_STORE_PASSWORD" | gh secret set DELICRUNCH_UPLOAD_STORE_PASSWORD --repo "$REPOSITORY"
printf '%s' "$DELICRUNCH_UPLOAD_KEY_PASSWORD" | gh secret set DELICRUNCH_UPLOAD_KEY_PASSWORD --repo "$REPOSITORY"
gh workflow run android-aab.yml --repo "$REPOSITORY" --ref main
printf '\nFirma vigente verificada. Los cuatro secretos están guardados y la compilación automática se inició.\n'
open "https://github.com/$REPOSITORY/actions/workflows/android-aab.yml"
