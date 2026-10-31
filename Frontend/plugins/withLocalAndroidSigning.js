const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = '// Delicrunch local Play upload signing';

const SIGNING_CONFIG = `
${MARKER}
def delicrunchUploadStoreFile = System.getenv("DELICRUNCH_UPLOAD_KEYSTORE")
def delicrunchUploadStorePassword = System.getenv("DELICRUNCH_UPLOAD_STORE_PASSWORD")
def delicrunchUploadKeyAlias = System.getenv("DELICRUNCH_UPLOAD_KEY_ALIAS")
def delicrunchUploadKeyPassword = System.getenv("DELICRUNCH_UPLOAD_KEY_PASSWORD")
def delicrunchUploadSigningConfigured = [
  delicrunchUploadStoreFile,
  delicrunchUploadStorePassword,
  delicrunchUploadKeyAlias,
  delicrunchUploadKeyPassword,
].every { value -> value != null && !value.trim().isEmpty() }

if (delicrunchUploadSigningConfigured) {
  android.signingConfigs.create("delicrunchUpload") {
    storeFile file(delicrunchUploadStoreFile)
    storePassword delicrunchUploadStorePassword
    keyAlias delicrunchUploadKeyAlias
    keyPassword delicrunchUploadKeyPassword
  }
}

android.buildTypes.release {
  // A release bundle must never silently use the Android debug key.
  signingConfig delicrunchUploadSigningConfigured ? android.signingConfigs.delicrunchUpload : null
}
`;

function withLocalAndroidSigning(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (!modConfig.modResults.contents.includes(MARKER)) {
      modConfig.modResults.contents = `${modConfig.modResults.contents.trimEnd()}\n${SIGNING_CONFIG}`;
    }
    return modConfig;
  });
}

module.exports = withLocalAndroidSigning;
