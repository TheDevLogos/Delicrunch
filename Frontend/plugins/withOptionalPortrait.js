const { withAndroidManifest } = require('@expo/config-plugins');

// Portrait is a preferred activity orientation, not required device hardware.
module.exports = function withOptionalPortrait(config) {
  return withAndroidManifest(config, (result) => {
    const manifest = result.modResults.manifest;
    const features = manifest['uses-feature'] || [];
    const name = 'android.hardware.screen.portrait';
    const feature = features.find((item) => item.$?.['android:name'] === name);
    if (feature) {
      feature.$['android:required'] = 'false';
    } else {
      features.push({ $: { 'android:name': name, 'android:required': 'false' } });
    }
    manifest['uses-feature'] = features;
    return result;
  });
};
