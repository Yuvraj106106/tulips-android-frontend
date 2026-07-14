const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_PATH = 'com/yuviiix/tulip';
const SRC_FILES = [
  'FloatingBubbleService.kt',
  'FloatingBubbleModule.kt',
  'FloatingBubblePackage.kt',
];

// Copies the hand-written FloatingBubble Kotlin files into the generated
// android/ project on every prebuild, since they are not autolinked and
// would otherwise be wiped by `expo prebuild --clean`.
function withFloatingBubbleSource(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const srcDir = path.join(config.modRequest.projectRoot, 'plugins', 'floating-bubble-src');
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'java', PACKAGE_PATH
      );
      fs.mkdirSync(destDir, { recursive: true });
      for (const file of SRC_FILES) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      }
      return config;
    },
  ]);
}

function withFloatingBubbleManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    const ensurePermission = (name) => {
      manifest['uses-permission'] = manifest['uses-permission'] || [];
      const exists = manifest['uses-permission'].some(
        (p) => p.$['android:name'] === name
      );
      if (!exists) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    };

    ensurePermission('android.permission.SYSTEM_ALERT_WINDOW');
    ensurePermission('android.permission.FOREGROUND_SERVICE');
    ensurePermission('android.permission.FOREGROUND_SERVICE_SPECIAL_USE');

    const application = manifest.application[0];
    application.service = application.service || [];
    const already = application.service.some(
      (s) => s.$['android:name'] === '.FloatingBubbleService'
    );
    if (!already) {
      application.service.push({
        $: {
          'android:name': '.FloatingBubbleService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_TYPE',
              'android:value':
                'This service displays a floating chat bubble to allow the user to access the AI companion from anywhere on the device.',
            },
          },
        ],
      });
    }

    return config;
  });
}

function withFloatingBubbleMainApplication(config) {
  return withMainApplication(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('add(FloatingBubblePackage())')) {
      config.modResults.contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        (match) => `${match}\n              add(FloatingBubblePackage())`
      );
    }
    return config;
  });
}

module.exports = function withFloatingBubble(config) {
  config = withFloatingBubbleSource(config);
  config = withFloatingBubbleManifest(config);
  config = withFloatingBubbleMainApplication(config);
  return config;
};
