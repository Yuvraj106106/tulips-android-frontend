const {
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_PATH = 'com/yuviiix/tulip';
const KOTLIN_FILES = [
  'TulipVoiceInteractionService.kt',
  'TulipVoiceInteractionSessionService.kt',
  'TulipVoiceInteractionSession.kt',
];

// Copies the hand-written Assistant (VoiceInteractionService) Kotlin files + the
// interaction_service.xml resource into the generated android/ project on every prebuild,
// since they are not autolinked and would otherwise be wiped by `expo prebuild --clean`.
// Mirrors the pattern established in withFloatingBubble.js.
function withAssistantSource(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const srcDir = path.join(config.modRequest.projectRoot, 'plugins', 'assistant-src');

      const destJavaDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'java', PACKAGE_PATH
      );
      fs.mkdirSync(destJavaDir, { recursive: true });
      for (const file of KOTLIN_FILES) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destJavaDir, file));
      }

      const destXmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );
      fs.mkdirSync(destXmlDir, { recursive: true });
      fs.copyFileSync(
        path.join(srcDir, 'interaction_service.xml'),
        path.join(destXmlDir, 'interaction_service.xml')
      );

      return config;
    },
  ]);
}

function withAssistantManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application[0];
    application.service = application.service || [];

    const already = application.service.some(
      (s) => s.$['android:name'] === '.TulipVoiceInteractionService'
    );
    if (!already) {
      application.service.push({
        $: {
          'android:name': '.TulipVoiceInteractionService',
          'android:permission': 'android.permission.BIND_VOICE_INTERACTION',
          'android:exported': 'true',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.voice_interaction',
              'android:resource': '@xml/interaction_service',
            },
          },
        ],
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.service.voice.VoiceInteractionService' } },
            ],
          },
        ],
      });

      application.service.push({
        $: {
          'android:name': '.TulipVoiceInteractionSessionService',
          'android:permission': 'android.permission.BIND_VOICE_INTERACTION',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.service.voice.VoiceInteractionSessionService' } },
            ],
          },
        ],
      });
    }

    return config;
  });
}

module.exports = function withAssistant(config) {
  config = withAssistantSource(config);
  config = withAssistantManifest(config);
  return config;
};
